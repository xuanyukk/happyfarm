/** * 文件名：AlertsPage.vue * 作者：开发者 * 日期：2025-01-01 * 版本：v2.0.0 *
功能描述：预警管理页面，提供预警信息列表展示、级别分类、状态跟踪、详情查看及批量处理功能
* 更新记录： * 2025-01-01 - v1.1.0 - 初始版本创建（占位实现） * 2026-03-28 -
v2.0.0 - 【阶段四完成】预警管理页面完整实现，接入adminService */
<template>
  <div class="alerts-page">
    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.keyword"
          type="text"
          placeholder="搜索预警标题"
          class="filter-input"
        />
      </div>
      <div class="filter-group">
        <select v-model="filters.level" class="filter-select">
          <option value="">全部级别</option>
          <option value="critical">紧急</option>
          <option value="error">重要</option>
          <option value="warning">一般</option>
          <option value="info">信息</option>
        </select>
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="ignored">已忽略</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadAlerts">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
        <button
          v-if="selectedAlerts.length > 0"
          class="btn btn-success"
          @click="batchHandle"
        >
          批量处理 ({{ selectedAlerts.length }})
        </button>
      </div>
    </div>

    <div class="alerts-table-container">
      <table class="alerts-table">
        <thead>
          <tr>
            <th style="width: 50px">
              <input
                v-model="selectAll"
                type="checkbox"
                @change="toggleSelectAll"
              />
            </th>
            <th>预警ID</th>
            <th>预警标题</th>
            <th>预警级别</th>
            <th>预警类型</th>
            <th>关联对象</th>
            <th>触发时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alert in alerts" :key="alert.id">
            <td>
              <input
                v-model="selectedAlerts"
                type="checkbox"
                :value="alert.id"
              />
            </td>
            <td>{{ alert.id }}</td>
            <td>{{ alert.alert_name }}</td>
            <td>
              <span class="level-badge" :class="alert.alert_level">
                {{ getLevelText(alert.alert_level) }}
              </span>
            </td>
            <td>{{ alert.alert_type }}</td>
            <td>{{ alert.related_object || '-' }}</td>
            <td>{{ formatTime(alert.created_at) }}</td>
            <td>
              <span class="status-badge" :class="alert.status">
                {{ getStatusText(alert.status) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="viewDetail(alert)"
                >
                  详情
                </button>
                <button
                  v-if="
                    alert.status === 'pending' || alert.status === 'processing'
                  "
                  class="btn btn-small btn-success"
                  @click="handleAlert(alert, 'resolved')"
                >
                  处理
                </button>
                <button
                  v-if="alert.status === 'pending'"
                  class="btn btn-small btn-default"
                  @click="handleAlert(alert, 'ignored')"
                >
                  忽略
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!alerts.length" class="empty-state">暂无预警数据</div>
    </div>

    <div class="pagination">
      <button
        :disabled="currentPage <= 1"
        class="btn btn-default"
        @click="
          currentPage--;
          loadAlerts();
        "
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ currentPage }} / {{ totalPages }} 页，共 {{ total }} 条
      </span>
      <button
        :disabled="currentPage >= totalPages"
        class="btn btn-default"
        @click="
          currentPage++;
          loadAlerts();
        "
      >
        下一页
      </button>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="showDetailModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>预警详情</h3>
          <button class="close-btn" @click="showDetailModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedAlert" class="alert-detail">
            <div class="detail-section">
              <h4>基本信息</h4>
              <div class="detail-row">
                <span class="label">预警ID:</span>
                <span class="value">{{ selectedAlert.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">预警标题:</span>
                <span class="value">{{ selectedAlert.alert_name }}</span>
              </div>
              <div class="detail-row">
                <span class="label">预警级别:</span>
                <span class="value">
                  <span class="level-badge" :class="selectedAlert.alert_level">
                    {{ getLevelText(selectedAlert.alert_level) }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="label">状态:</span>
                <span class="value">
                  <span class="status-badge" :class="selectedAlert.status">
                    {{ getStatusText(selectedAlert.status) }}
                  </span>
                </span>
              </div>
            </div>

            <div class="detail-section">
              <h4>详细描述</h4>
              <div class="detail-row">
                <span class="label">预警内容:</span>
                <span class="value">{{ selectedAlert.alert_desc || '-' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">预警类型:</span>
                <span class="value">{{ selectedAlert.alert_type }}</span>
              </div>
              <div class="detail-row">
                <span class="label">关联对象:</span>
                <span class="value">{{
                  selectedAlert.related_object || '-'
                }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>时间信息</h4>
              <div class="detail-row">
                <span class="label">触发时间:</span>
                <span class="value">{{
                  formatTime(selectedAlert.created_at)
                }}</span>
              </div>
              <div class="detail-row">
                <span class="label">更新时间:</span>
                <span class="value">{{
                  formatTime(selectedAlert.updated_at)
                }}</span>
              </div>
            </div>

            <div
              v-if="
                selectedAlert.status !== 'resolved' &&
                selectedAlert.status !== 'ignored'
              "
              class="detail-section"
            >
              <h4>处理操作</h4>
              <div class="handle-section">
                <textarea
                  v-model="handleNote"
                  placeholder="请输入处理备注（可选）"
                  class="handle-textarea"
                ></textarea>
                <div class="handle-buttons">
                  <button
                    class="btn btn-success"
                    @click="submitHandle('resolved')"
                  >
                    标记已解决
                  </button>
                  <button
                    class="btn btn-default"
                    @click="submitHandle('ignored')"
                  >
                    忽略此预警
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="showDetailModal = false">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminService from '../../services/adminService';

const filters = ref({
  keyword: '',
  level: '',
  status: '',
});

const alerts = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(1);
const selectedAlerts = ref([]);
const selectAll = ref(false);
const showDetailModal = ref(false);
const selectedAlert = ref(null);
const handleNote = ref('');

/**
 * 加载预警列表数据
 * @returns {Promise<void>} 无返回值
 */
async function loadAlerts() {
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filters.value,
    };

    const result = await adminService.getAlertList(params);
    if (result.success) {
      alerts.value = result.data.alerts || [];
      total.value = result.data.total || 0;
      totalPages.value = result.data.totalPages || 1;
    }
  } catch (error) {
    console.error('加载预警列表失败', error);
  }
}

/**
 * 重置筛选条件
 * @returns {void} 无返回值
 */
function resetFilters() {
  filters.value = {
    keyword: '',
    level: '',
    status: '',
  };
  currentPage.value = 1;
  selectedAlerts.value = [];
  selectAll.value = false;
  loadAlerts();
}

/**
 * 切换全选
 * @returns {void} 无返回值
 */
function toggleSelectAll() {
  if (selectAll.value) {
    selectedAlerts.value = alerts.value.map((a) => a.id);
  } else {
    selectedAlerts.value = [];
  }
}

/**
 * 查看预警详情
 * @param {Object} alert - 预警对象
 * @returns {void} 无返回值
 */
function viewDetail(alert) {
  selectedAlert.value = alert;
  handleNote.value = '';
  showDetailModal.value = true;
}

/**
 * 处理预警
 * @param {Object} alert - 预警对象
 * @param {string} status - 新状态
 * @returns {Promise<void>} 无返回值
 */
async function handleAlert(alert, status) {
  if (!confirm(`确定要${status === 'resolved' ? '处理' : '忽略'}此预警吗？`)) {
    return;
  }

  try {
    const result = await adminService.handleAlert(alert.id, status, '');
    if (result.success) {
      loadAlerts();
    }
  } catch (error) {
    console.error('处理预警失败', error);
    alert('操作失败');
  }
}

/**
 * 提交处理结果
 * @param {string} status - 新状态
 * @returns {Promise<void>} 无返回值
 */
async function submitHandle(status) {
  if (!selectedAlert.value) return;

  try {
    const result = await adminService.handleAlert(
      selectedAlert.value.id,
      status,
      handleNote.value
    );
    if (result.success) {
      showDetailModal.value = false;
      loadAlerts();
    }
  } catch (error) {
    console.error('处理预警失败', error);
    alert('操作失败');
  }
}

/**
 * 批量处理
 * @returns {void} 无返回值
 */
async function batchHandle() {
  if (selectedAlerts.value.length === 0) return;

  const action = prompt('请选择批量操作：\n1 - 标记已解决\n2 - 忽略');
  if (!action) return;

  const status = action === '1' ? 'resolved' : 'ignored';

  if (
    !confirm(
      `确定要批量${status === 'resolved' ? '处理' : '忽略'} ${selectedAlerts.value.length} 条预警吗？`
    )
  ) {
    return;
  }

  try {
    const promises = selectedAlerts.value.map((id) =>
      adminService.handleAlert(id, status, '批量处理')
    );
    await Promise.all(promises);
    selectedAlerts.value = [];
    selectAll.value = false;
    loadAlerts();
  } catch (error) {
    console.error('批量处理失败', error);
    alert('批量处理失败');
  }
}

/**
 * 获取预警级别文本
 * @param {string} level - 预警级别
 * @returns {string} 预警级别中文文本
 */
function getLevelText(level) {
  const levelMap = {
    info: '信息',
    warning: '一般',
    error: '重要',
    critical: '紧急',
  };
  return levelMap[level] || level;
}

/**
 * 获取状态文本
 * @param {string} status - 状态
 * @returns {string} 状态中文文本
 */
function getStatusText(status) {
  const statusMap = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    ignored: '已忽略',
  };
  return statusMap[status] || status;
}

/**
 * 格式化时间显示
 * @param {string|Date} time - 时间值
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(time) {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

onMounted(() => {
  loadAlerts();
});
</script>

<style scoped>
.alerts-page {
  padding: 0;
}

.filter-bar {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.filter-input:focus,
.filter-select:focus {
  border-color: #1890ff;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-default {
  background: #fafafa;
  color: #262626;
  border: 1px solid #d9d9d9;
}

.btn-default:hover {
  background: #f5f5f5;
}

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-info {
  background: #e6f7ff;
  color: #1890ff;
}

.btn-info:hover {
  background: #bae7ff;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover {
  background: #73d13d;
}

.alerts-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.alerts-table {
  width: 100%;
  border-collapse: collapse;
}

.alerts-table th,
.alerts-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.alerts-table th {
  background: #fafafa;
  font-weight: 600;
  color: #595959;
  font-size: 14px;
}

.alerts-table td {
  color: #262626;
  font-size: 14px;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.level-badge.info {
  background: #e6f7ff;
  color: #1890ff;
}

.level-badge.warning {
  background: #fffbe6;
  color: #faad14;
}

.level-badge.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.level-badge.critical {
  background: #fff1f0;
  color: #cf1322;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.processing {
  background: #e6f7ff;
  color: #1890ff;
}

.status-badge.resolved {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.ignored {
  background: #f5f5f5;
  color: #8c8c8c;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.page-info {
  color: #595959;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  color: #8c8c8c;
  padding: 60px;
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
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #262626;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #8c8c8c;
  cursor: pointer;
}

.close-btn:hover {
  color: #262626;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.alert-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #262626;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row {
  display: flex;
  padding: 8px 0;
}

.detail-row .label {
  width: 120px;
  color: #8c8c8c;
  flex-shrink: 0;
}

.detail-row .value {
  color: #262626;
  flex: 1;
}

.handle-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.handle-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
}

.handle-textarea:focus {
  border-color: #1890ff;
}

.handle-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
