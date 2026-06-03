/** * 文件名：BackupPage.vue * 作者：开发者 * 日期：2026-05-06 * 版本：v2.0.0 *
功能描述：备份与恢复管理页面 * 更新记录： * 2026-05-06 - v1.0.0 - 初始版本创建 *
2026-05-06 - v2.0.0 - 添加调度和恢复监控功能 */

<template>
  <div class="backup-page">
    <div class="page-header">
      <h1>💾 备份与恢复</h1>
      <div class="header-actions">
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="createBackup"
        >
          {{ loading ? '备份中...' : '➕ 创建备份' }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="loading"
          @click="refreshBackups"
        >
          🔄 刷新
        </button>
      </div>
    </div>

    <div class="backup-status">
      <div class="status-card">
        <div class="status-icon">📊</div>
        <div class="status-content">
          <div class="status-title">备份统计</div>
          <div class="status-value">{{ backups.length }} 个备份文件</div>
          <div class="status-time">最近备份：{{ lastBackupTime }}</div>
        </div>
      </div>

      <div class="status-card">
        <div class="status-icon">💾</div>
        <div class="status-content">
          <div class="status-title">总占用空间</div>
          <div class="status-value">{{ totalStorageSize }}</div>
        </div>
      </div>

      <div class="status-card">
        <div class="status-icon">⏰</div>
        <div class="status-content">
          <div class="status-title">定时备份</div>
          <div
            class="status-value"
            :style="{ color: scheduledJobRunning ? '#52c41a' : '#718096' }"
          >
            {{ scheduledJobRunning ? '运行中' : '未启动' }}
          </div>
        </div>
      </div>
    </div>

    <div class="schedule-section">
      <div class="section-header">
        <h3>⏰ 定时备份设置</h3>
      </div>
      <div class="schedule-content">
        <div class="schedule-input">
          <label>Cron 表达式：</label>
          <input
            v-model="cronExpression"
            type="text"
            placeholder="0 2 * * *"
            class="cron-input"
          />
          <span class="cron-help">每天凌晨2点执行</span>
        </div>
        <div class="schedule-actions">
          <button
            v-if="!scheduledJobRunning"
            class="btn btn-success"
            :disabled="loading"
            @click="startScheduledBackup"
          >
            ▶️ 启动定时备份
          </button>
          <button
            v-else
            class="btn btn-danger"
            :disabled="loading"
            @click="stopScheduledBackup"
          >
            ⏹️ 停止定时备份
          </button>
        </div>
      </div>
    </div>

    <div v-if="restoreProgress" class="restore-progress-section">
      <div class="section-header">
        <h3>🔄 恢复进度</h3>
        <button
          class="btn btn-small btn-secondary"
          @click="clearRestoreProgress"
        >
          ✕ 清除
        </button>
      </div>
      <div class="restore-content">
        <div class="progress-info">
          <div class="progress-status">
            <span class="status-label">状态：</span>
            <span
              class="status-value"
              :class="getStatusClass(restoreProgress.status)"
            >
              {{ getStatusText(restoreProgress.status) }}
            </span>
          </div>
          <div class="progress-file">文件：{{ restoreProgress.filename }}</div>
          <div class="progress-time">
            开始：{{ formatDate(restoreProgress.startTime) }}
          </div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${restoreProgress.progress}%` }"
              :class="getProgressClass(restoreProgress.status)"
            ></div>
          </div>
          <div class="progress-percent">{{ restoreProgress.progress }}%</div>
        </div>
        <div
          v-if="
            restoreProgress.canRollback &&
            restoreProgress.status === 'completed'
          "
          class="progress-actions"
        >
          <button class="btn btn-warning" @click="confirmRollback">
            ↩️ 回滚恢复操作
          </button>
        </div>
        <div v-if="restoreProgress.error" class="progress-error">
          ❌ 错误：{{ restoreProgress.error }}
        </div>
      </div>
    </div>

    <div class="backup-list">
      <div class="list-header">
        <h3>📁 备份文件列表</h3>
      </div>
      <div class="list-content">
        <div v-if="backups.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">暂无备份文件，点击上方按钮创建第一个备份</div>
        </div>
        <div v-else class="backup-table">
          <table>
            <thead>
              <tr>
                <th>文件名</th>
                <th>大小</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="backup in backups" :key="backup.filename">
                <td class="filename-cell">{{ backup.filename }}</td>
                <td class="size-cell">{{ backup.sizeFormatted }}</td>
                <td class="time-cell">{{ formatDate(backup.createdAt) }}</td>
                <td class="actions-cell">
                  <button
                    class="action-btn btn-small btn-primary"
                    title="下载备份"
                    @click="downloadBackup(backup.filename)"
                  >
                    📥 下载
                  </button>
                  <button
                    class="action-btn btn-small btn-warning"
                    title="恢复备份"
                    @click="confirmRestore(backup.filename)"
                  >
                    🔄 恢复
                  </button>
                  <button
                    class="action-btn btn-small btn-danger"
                    title="删除备份"
                    @click="confirmDelete(backup.filename)"
                  >
                    🗑️ 删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="showRestoreModal"
      class="modal-overlay"
      @click.self="showRestoreModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>⚠️ 确认恢复</h3>
          <button class="close-btn" @click="showRestoreModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="warning-text">此操作将覆盖当前数据库！</p>
          <p>
            确定要恢复备份文件
            <strong>{{ selectedBackupFilename }}</strong> 吗？
          </p>
          <div class="warning-notes">
            <p>📝 注意事项：</p>
            <ul>
              <li>系统会自动在恢复前创建当前数据库的备份</li>
              <li>恢复过程中可以查看进度</li>
              <li>恢复完成后可以选择回滚</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRestoreModal = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="loading"
            @click="restoreBackup"
          >
            {{ loading ? '恢复中...' : '确认恢复' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showRollbackModal"
      class="modal-overlay"
      @click.self="showRollbackModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>⚠️ 确认回滚</h3>
          <button class="close-btn" @click="showRollbackModal = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <p class="warning-text">此操作将回滚到恢复前的状态！</p>
          <p>确定要回滚恢复操作吗？</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRollbackModal = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="loading"
            @click="rollbackRestore"
          >
            {{ loading ? '回滚中...' : '确认回滚' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="showDeleteModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>⚠️ 确认删除</h3>
          <button class="close-btn" @click="showDeleteModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>
            确定要删除备份文件
            <strong>{{ selectedBackupFilename }}</strong> 吗？
          </p>
          <p class="warning-text">此操作无法撤销！</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteModal = false">
            取消
          </button>
          <button
            class="btn btn-danger"
            :disabled="loading"
            @click="deleteBackup"
          >
            {{ loading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import adminService from '../../services/adminService';
import { useToastStore } from '../../stores/toast';

const toastStore = useToastStore();

const loading = ref(false);
const backups = ref([]);
const restoreProgress = ref(null);
const cronExpression = ref('0 2 * * *');
const scheduledJobRunning = ref(false);
const showRestoreModal = ref(false);
const showRollbackModal = ref(false);
const showDeleteModal = ref(false);
const selectedBackupFilename = ref('');
let pollInterval = null;

const lastBackupTime = computed(() => {
  if (backups.value.length === 0) return '暂无';
  return formatDate(backups.value[0].createdAt);
});

const totalStorageSize = computed(() => {
  if (backups.value.length === 0) return '0 KB';
  const totalBytes = backups.value.reduce((sum, b) => sum + b.size, 0);
  if (totalBytes < 1024) return `${totalBytes} B`;
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(2)} KB`;
  return `${(totalBytes / 1024 / 1024).toFixed(2)} MB`;
});

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getStatusText = (status) => {
  const statusMap = {
    preparing: '准备中',
    'backing-up-current': '备份当前数据',
    restoring: '恢复中',
    completed: '完成',
    failed: '失败',
    'rolled-back': '已回滚',
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  if (status === 'completed' || status === 'rolled-back')
    return 'status-success';
  if (status === 'failed') return 'status-error';
  if (
    status === 'preparing' ||
    status === 'backing-up-current' ||
    status === 'restoring'
  )
    return 'status-warning';
  return '';
};

const getProgressClass = (status) => {
  if (status === 'completed' || status === 'rolled-back')
    return 'progress-success';
  if (status === 'failed') return 'progress-error';
  if (
    status === 'preparing' ||
    status === 'backing-up-current' ||
    status === 'restoring'
  )
    return 'progress-warning';
  return '';
};

const refreshBackups = async () => {
  try {
    loading.value = true;
    const response = await adminService.getBackupListV2();
    if (response.success) {
      backups.value = response.data || [];
    }
  } catch (error) {
    console.error('获取备份列表失败:', error);
    toastStore.error('获取备份列表失败');
  } finally {
    loading.value = false;
  }
};

const refreshScheduledJobs = async () => {
  try {
    const response = await adminService.getScheduledJobs();
    if (response.success && response.data) {
      const jobs = response.data;
      scheduledJobRunning.value = jobs.some((job) => job.running);
    }
  } catch (error) {
    console.error('获取定时任务失败:', error);
  }
};

const refreshRestoreProgress = async () => {
  try {
    const response = await adminService.getRestoreProgress();
    if (response.success) {
      restoreProgress.value = response.data;
    }
  } catch (error) {
    console.error('获取恢复进度失败:', error);
  }
};

const createBackup = async () => {
  try {
    loading.value = true;
    const response = await adminService.createBackupV2();
    if (response.success) {
      toastStore.success('备份创建成功！');
      await refreshBackups();
    }
  } catch (error) {
    console.error('创建备份失败:', error);
    toastStore.error('创建备份失败');
  } finally {
    loading.value = false;
  }
};

const downloadBackup = (filename) => {
  try {
    window.open(`/api/admin/backup/download/${filename}`, '_blank');
    toastStore.success('开始下载备份文件');
  } catch (error) {
    console.error('下载备份失败:', error);
    toastStore.error('下载备份失败');
  }
};

const confirmRestore = (filename) => {
  selectedBackupFilename.value = filename;
  showRestoreModal.value = true;
};

const restoreBackup = async () => {
  try {
    loading.value = true;
    const response = await adminService.restoreBackupV2(
      selectedBackupFilename.value
    );
    if (response.success) {
      toastStore.success('恢复任务已启动！');
      showRestoreModal.value = false;
      await refreshRestoreProgress();
      startPolling();
    }
  } catch (error) {
    console.error('恢复备份失败:', error);
    toastStore.error('恢复备份失败');
  } finally {
    loading.value = false;
  }
};

const confirmRollback = () => {
  showRollbackModal.value = true;
};

const rollbackRestore = async () => {
  try {
    loading.value = true;
    const response = await adminService.rollbackRestore();
    if (response.success) {
      toastStore.success('回滚成功！');
      showRollbackModal.value = false;
      await refreshRestoreProgress();
    }
  } catch (error) {
    console.error('回滚失败:', error);
    toastStore.error('回滚失败');
  } finally {
    loading.value = false;
  }
};

const clearRestoreProgress = async () => {
  try {
    await adminService.clearRestoreProgress();
    restoreProgress.value = null;
    stopPolling();
  } catch (error) {
    console.error('清除恢复进度失败:', error);
  }
};

const confirmDelete = (filename) => {
  selectedBackupFilename.value = filename;
  showDeleteModal.value = true;
};

const deleteBackup = async () => {
  try {
    loading.value = true;
    const response = await adminService.deleteBackupV2(
      selectedBackupFilename.value
    );
    if (response.success) {
      toastStore.success('备份删除成功！');
      showDeleteModal.value = false;
      await refreshBackups();
    }
  } catch (error) {
    console.error('删除备份失败:', error);
    toastStore.error('删除备份失败');
  } finally {
    loading.value = false;
  }
};

const startScheduledBackup = async () => {
  try {
    loading.value = true;
    const response = await adminService.startScheduledBackup(
      cronExpression.value
    );
    if (response.success) {
      toastStore.success('定时备份已启动！');
      await refreshScheduledJobs();
    }
  } catch (error) {
    console.error('启动定时备份失败:', error);
    toastStore.error('启动定时备份失败');
  } finally {
    loading.value = false;
  }
};

const stopScheduledBackup = async () => {
  try {
    loading.value = true;
    const response = await adminService.stopScheduledBackup();
    if (response.success) {
      toastStore.success('定时备份已停止！');
      await refreshScheduledJobs();
    }
  } catch (error) {
    console.error('停止定时备份失败:', error);
    toastStore.error('停止定时备份失败');
  } finally {
    loading.value = false;
  }
};

const startPolling = () => {
  stopPolling();
  pollInterval = setInterval(refreshRestoreProgress, 1000);
};

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

onMounted(() => {
  refreshBackups();
  refreshScheduledJobs();
  refreshRestoreProgress();

  if (
    restoreProgress.value &&
    restoreProgress.value.status !== 'completed' &&
    restoreProgress.value.status !== 'failed' &&
    restoreProgress.value.status !== 'rolled-back'
  ) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.backup-page {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: #2d3748;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #096dd9;
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #389e0d;
}

.btn-warning {
  background: #faad14;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d48806;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #cf1322;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.backup-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.status-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
  align-items: center;
}

.status-icon {
  font-size: 2.5rem;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.25rem;
}

.status-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d3748;
}

.status-time {
  font-size: 0.75rem;
  color: #a0aec0;
  margin-top: 0.25rem;
}

.schedule-section,
.restore-progress-section {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h3 {
  margin: 0;
  color: #2d3748;
}

.schedule-content {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.schedule-input {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
  min-width: 300px;
}

.schedule-input label {
  color: #4a5568;
  white-space: nowrap;
}

.cron-input {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 1rem;
}

.cron-help {
  color: #718096;
  font-size: 0.875rem;
  white-space: nowrap;
}

.schedule-actions {
  display: flex;
  gap: 1rem;
}

.restore-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-status,
.progress-file,
.progress-time {
  color: #4a5568;
}

.status-label {
  font-weight: 600;
}

.status-value {
  font-weight: 600;
}

.status-success {
  color: #52c41a;
}

.status-warning {
  color: #faad14;
}

.status-error {
  color: #ff4d4f;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 2rem;
  background: #edf2f7;
  border-radius: 1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-success {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.progress-warning {
  background: linear-gradient(90deg, #faad14, #ffc53d);
}

.progress-error {
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
}

.progress-percent {
  font-weight: 600;
  color: #2d3748;
  min-width: 3rem;
  text-align: right;
}

.progress-actions {
  margin-top: 0.5rem;
}

.progress-error {
  color: #ff4d4f;
  padding: 1rem;
  background: #fff1f0;
  border-radius: 0.5rem;
}

.backup-list {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.list-header h3 {
  margin: 0;
  color: #2d3748;
}

.list-content {
  padding: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-text {
  color: #718096;
  font-size: 1rem;
}

.backup-table {
  overflow-x: auto;
}

.backup-table table {
  width: 100%;
  border-collapse: collapse;
}

.backup-table th,
.backup-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.backup-table th {
  background: #f7fafc;
  font-weight: 600;
  color: #4a5568;
}

.filename-cell {
  font-family: monospace;
  color: #2d3748;
}

.size-cell {
  color: #718096;
}

.time-cell {
  color: #718096;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
}

.modal-body {
  padding: 1.5rem;
}

.warning-text {
  color: #ff4d4f;
  font-weight: 600;
}

.warning-notes {
  background: #fff7e6;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
}

.warning-notes p {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #faad14;
}

.warning-notes ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #8c6d00;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}
</style>
