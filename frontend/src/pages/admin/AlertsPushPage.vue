/** * 文件名：AlertsPushPage.vue * 作者：Trae AI * 日期：2026-05-01 *
版本：v1.0.0 * 功能描述：实时预警推送系统管理页面 * 更新记录： * 2026-05-01 -
v1.0.0 - 初始版本创建 */

<template>
  <div class="alerts-page">
    <div class="page-header">
      <h1 class="page-title">🔔 实时预警推送</h1>
      <p class="page-description">系统监控与预警管理</p>
    </div>

    <div class="quick-actions">
      <button class="btn btn-primary" @click="triggerDemo">
        ⚡ 触发测试预警
      </button>
      <button class="btn btn-success" @click="showCreateRuleModal = true">
        ➕ 新增预警规则
      </button>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.total || 0 }}</div>
          <div class="stat-label">总预警数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔴</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.unread || 0 }}</div>
          <div class="stat-label">未读预警</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🟡</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.levels?.WARNING || 0 }}</div>
          <div class="stat-label">警告级别</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🟠</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats?.levels?.ERROR || 0 }}</div>
          <div class="stat-label">错误级别</div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <select
          v-model="filters.level"
          class="filter-select"
          @change="handleFilter"
        >
          <option value="">所有级别</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <select
          v-model="filters.status"
          class="filter-select"
          @change="handleFilter"
        >
          <option value="">所有状态</option>
          <option value="UNREAD">未读</option>
          <option value="READ">已读</option>
          <option value="RESOLVED">已解决</option>
          <option value="IGNORED">已忽略</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-default" @click="handleReset">🔄 重置</button>
      </div>
    </div>

    <div class="alerts-container">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>❌ {{ error }}</p>
        <button class="btn btn-primary" @click="fetchData">重试</button>
      </div>

      <div v-else-if="records.length === 0" class="empty">
        <p>📭 暂无预警记录</p>
      </div>

      <div v-else class="alerts-list">
        <div
          v-for="record in records"
          :key="record.id"
          class="alert-item"
          :class="getLevelClass(record.level)"
        >
          <div class="alert-header">
            <div class="alert-icon">{{ getLevelIcon(record.level) }}</div>
            <div class="alert-info">
              <div class="alert-title">{{ record.title }}</div>
              <div class="alert-meta">
                <span class="alert-level-badge">{{ record.level }}</span>
                <span class="alert-time">{{
                  formatTime(record.triggered_at)
                }}</span>
                <span
                  class="alert-status-badge"
                  :class="getStatusClass(record.status)"
                >
                  {{ getStatusName(record.status) }}
                </span>
              </div>
            </div>
            <div class="alert-actions">
              <button
                v-if="record.status === 'UNREAD'"
                class="btn btn-sm btn-primary"
                @click="handleMarkAsRead(record)"
              >
                标为已读
              </button>
              <button
                v-if="record.status !== 'RESOLVED'"
                class="btn btn-sm btn-default"
                @click="handleDetail(record)"
              >
                详情
              </button>
              <button
                v-if="record.status === 'UNREAD' || record.status === 'READ'"
                class="btn btn-sm btn-success"
                @click="handleResolve(record)"
              >
                解决
              </button>
              <button
                v-if="record.status === 'UNREAD' || record.status === 'READ'"
                class="btn btn-sm btn-warning"
                @click="handleIgnore(record)"
              >
                忽略
              </button>
            </div>
          </div>
          <div class="alert-content">
            <p>{{ record.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="total > pageSize" class="pagination">
      <button
        :disabled="page <= 1"
        class="btn btn-default"
        @click="changePage(page - 1)"
      >
        上一页
      </button>
      <span class="page-info"
        >第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span
      >
      <button
        :disabled="page >= Math.ceil(total / pageSize)"
        class="btn btn-default"
        @click="changePage(page + 1)"
      >
        下一页
      </button>
    </div>

    <div
      v-if="showCreateRuleModal"
      class="modal-overlay"
      @click.self="showCreateRuleModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h2>➕ 新增预警规则</h2>
          <button class="close-btn" @click="showCreateRuleModal = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>规则名称</label>
            <input
              v-model="ruleForm.rule_name"
              type="text"
              class="form-control"
              placeholder="例如：CPU使用率警告"
            />
          </div>
          <div class="form-group">
            <label>监控指标</label>
            <select v-model="ruleForm.metric" class="form-control">
              <option value="CPU_USAGE">CPU使用率</option>
              <option value="MEMORY_USAGE">内存使用率</option>
              <option value="DISK_USAGE">磁盘使用率</option>
              <option value="API_ERROR_RATE">API错误率</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>操作符</label>
              <select v-model="ruleForm.operator" class="form-control">
                <option value=">">></option>
                <option value="<"><</option>
                <option value=">=">>=</option>
                <option value="<="><=</option>
                <option value="==">=</option>
              </select>
            </div>
            <div class="form-group">
              <label>阈值</label>
              <input
                v-model.number="ruleForm.threshold"
                type="number"
                class="form-control"
                placeholder="80"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>预警级别</label>
              <select v-model="ruleForm.level" class="form-control">
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div class="form-group">
              <label>启用</label>
              <input v-model="ruleForm.enabled" type="checkbox" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showCreateRuleModal = false">
            取消
          </button>
          <button class="btn btn-primary" @click="handleCreateRule">
            创建
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal && currentRecord"
      class="modal-overlay"
      @click.self="closeDetail"
    >
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>📋 预警详情</h2>
          <button class="close-btn" @click="closeDetail">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h3>基本信息</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">标题:</span>
                <span class="detail-value">{{ currentRecord.title }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">级别:</span>
                <span class="detail-value"
                  ><span :class="getLevelClass(currentRecord.level)">{{
                    currentRecord.level
                  }}</span></span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">指标:</span>
                <span class="detail-value">{{ currentRecord.metric }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">值 / 阈值:</span>
                <span class="detail-value"
                  >{{ currentRecord.value }} /
                  {{ currentRecord.threshold }}</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">触发时间:</span>
                <span class="detail-value">{{
                  formatTime(currentRecord.triggered_at)
                }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">状态:</span>
                <span class="detail-value"
                  ><span :class="getStatusClass(currentRecord.status)">{{
                    getStatusName(currentRecord.status)
                  }}</span></span
                >
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>预警内容</h3>
            <p>{{ currentRecord.content }}</p>
          </div>

          <div
            v-if="
              currentRecord.status === 'UNREAD' ||
              currentRecord.status === 'READ'
            "
            class="detail-section"
          >
            <h3>操作</h3>
            <div class="detail-actions">
              <div class="form-group">
                <label>解决备注 (可选)</label>
                <textarea
                  v-model="resolveNote"
                  class="form-control"
                  rows="3"
                  placeholder="输入解决的说明..."
                ></textarea>
              </div>
              <button class="btn btn-success" @click="handleConfirmResolve">
                ✅ 标记为已解决
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeDetail">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAlertStore } from '../../stores/alert';
import { useToastStore } from '../../stores/toast';

const alertStore = useAlertStore();
const toastStore = useToastStore();

const rules = ref([]);
const records = ref([]);
const stats = ref(null);
const loading = ref(false);
const error = ref(null);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filters = ref({ level: '', status: '' });

const showCreateRuleModal = ref(false);
const showDetailModal = ref(false);
const currentRecord = ref(null);
const resolveNote = ref('');

const ruleForm = ref({
  rule_name: '',
  metric: 'CPU_USAGE',
  threshold: 80,
  operator: '>',
  level: 'WARNING',
  enabled: true,
});

const fetchData = async () => {
  loading.value = true;
  await Promise.all([
    alertStore.fetchRecords(filters.value),
    alertStore.fetchStats(),
    alertStore.fetchRules(),
  ]);
  records.value = alertStore.records;
  stats.value = alertStore.stats;
  total.value = alertStore.total;
  loading.value = false;
};

const handleFilter = () => {
  page.value = 1;
  fetchData();
};

const handleReset = () => {
  filters.value = { level: '', status: '' };
  page.value = 1;
  fetchData();
};

const changePage = (newPage) => {
  page.value = newPage;
  alertStore.page = newPage;
  fetchData();
};

const triggerDemo = async () => {
  try {
    await alertStore.triggerDemo();
    toastStore.success('测试预警已触发！');
  } catch (err) {
    toastStore.error('触发失败: ' + (err.message || err));
  }
};

const handleMarkAsRead = async (record) => {
  try {
    await alertStore.markAsRead(record.id);
    toastStore.success('已标记为已读');
  } catch (err) {
    toastStore.error('标记失败: ' + (err.message || err));
  }
};

const handleDetail = async (record) => {
  try {
    await alertStore.fetchRecordDetail(record.id);
    currentRecord.value = alertStore.currentRecord;
    showDetailModal.value = true;
  } catch (err) {
    toastStore.error('获取详情失败: ' + (err.message || err));
  }
};

const handleResolve = async (record) => {
  currentRecord.value = record;
  showDetailModal.value = true;
};

const handleConfirmResolve = async () => {
  if (!currentRecord.value) return;
  try {
    await alertStore.resolveRecord(currentRecord.value.id, resolveNote.value);
    toastStore.success('已标记为解决');
    closeDetail();
    fetchData();
  } catch (err) {
    toastStore.error('操作失败: ' + (err.message || err));
  }
};

const handleIgnore = async (record) => {
  if (!confirm('确定要忽略此预警吗？')) return;
  try {
    await alertStore.ignoreRecord(record.id);
    toastStore.success('已忽略');
  } catch (err) {
    toastStore.error('操作失败: ' + (err.message || err));
  }
};

const handleCreateRule = async () => {
  try {
    await alertStore.createRule(ruleForm.value);
    toastStore.success('预警规则创建成功！');
    showCreateRuleModal.value = false;
    resetForm();
  } catch (err) {
    toastStore.error('创建失败: ' + (err.message || err));
  }
};

const closeDetail = () => {
  showDetailModal.value = false;
  currentRecord.value = null;
  resolveNote.value = '';
};

const resetForm = () => {
  ruleForm.value = {
    rule_name: '',
    metric: 'CPU_USAGE',
    threshold: 80,
    operator: '>',
    level: 'WARNING',
    enabled: true,
  };
};

const getLevelClass = (level) => {
  const classes = {
    INFO: 'level-info',
    WARNING: 'level-warning',
    ERROR: 'level-error',
    CRITICAL: 'level-critical',
  };
  return classes[level] || 'level-info';
};

const getLevelIcon = (level) => {
  const icons = {
    INFO: 'ℹ️',
    WARNING: '⚠️',
    ERROR: '❌',
    CRITICAL: '🚨',
  };
  return icons[level] || 'ℹ️';
};

const getStatusName = (status) => {
  const names = {
    UNREAD: '未读',
    READ: '已读',
    RESOLVED: '已解决',
    IGNORED: '已忽略',
  };
  return names[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    UNREAD: 'status-unread',
    READ: 'status-read',
    RESOLVED: 'status-resolved',
    IGNORED: 'status-ignored',
  };
  return classes[status] || '';
};

const formatTime = (time) => {
  if (!time) return '-';
  const date = new Date(time);
  return date.toLocaleString('zh-CN');
};

onMounted(() => {
  fetchData();
  alertStore.initWebSocket();
});
</script>

<style scoped>
.alerts-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.page-description {
  color: #666;
  margin: 0;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1890ff;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.alerts-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  min-height: 400px;
}

.loading,
.empty,
.error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.alert-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.alert-item.level-info {
  border-left: 4px solid #1890ff;
}

.alert-item.level-warning {
  border-left: 4px solid #faad14;
}

.alert-item.level-error {
  border-left: 4px solid #f5222d;
}

.alert-item.level-critical {
  border-left: 4px solid #8b0000;
}

.alert-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
}

.alert-icon {
  font-size: 28px;
}

.alert-info {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.alert-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.alert-level-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.alert-level-badge.INFO {
  background: #e6f7ff;
  color: #1890ff;
}

.alert-level-badge.WARNING {
  background: #fff7e6;
  color: #faad14;
}

.alert-level-badge.ERROR {
  background: #fff1f0;
  color: #f5222d;
}

.alert-level-badge.CRITICAL {
  background: #8b0000;
  color: white;
}

.alert-time {
  color: #666;
  font-size: 13px;
}

.alert-status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-unread {
  background: #ffccc7;
  color: #f5222d;
}

.status-read {
  background: #d6e4ff;
  color: #1890ff;
}

.status-resolved {
  background: #d9f7be;
  color: #52c41a;
}

.status-ignored {
  background: #f5f5f5;
  color: #999;
}

.alert-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.alert-content {
  padding: 12px 16px;
  color: #555;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.page-info {
  color: #666;
  font-size: 14px;
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
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.detail-label {
  color: #666;
  min-width: 80px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.detail-actions {
  margin-top: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover {
  background: #73d13d;
}

.btn-danger {
  background: #f5222d;
  color: white;
}

.btn-danger:hover {
  background: #ff4d4f;
}

.btn-warning {
  background: #faad14;
  color: white;
}

.btn-warning:hover {
  background: #ffc53d;
}

.btn-default {
  background: #f0f0f0;
  color: #333;
}

.btn-default:hover {
  background: #d9d9d9;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
