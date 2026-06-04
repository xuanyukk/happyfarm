/** * 文件名：AuditLogsPage.vue * 作者：Trae AI * 日期：2026-04-30 *
版本：v2.0.0 * 功能描述：权限变更审计日志页面 * 更新记录： * 2026-04-30 - v1.0.0
- 初始版本创建 * 2026-05-02 - v2.0.0 -
【虚拟滚动优化】添加虚拟滚动支持，提升大量日志加载性能 */
<template>
  <div class="audit-logs-page">
    <div class="render-mode-selector">
      <span class="mode-label">渲染模式：</span>
      <div class="mode-buttons">
        <button
          v-for="mode in renderModes"
          :key="mode.value"
          class="mode-button"
          :class="{ active: renderMode === mode.value }"
          @click="renderMode = mode.value"
        >
          {{ mode.icon }} {{ mode.label }}
        </button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <select v-model="filters.operationType" class="filter-select">
          <option value="">全部操作类型</option>
          <option value="ASSIGN">分配</option>
          <option value="REVOKE">撤销</option>
          <option value="CREATE">创建</option>
          <option value="UPDATE">更新</option>
          <option value="DELETE">删除</option>
        </select>
        <select v-model="filters.targetType" class="filter-select">
          <option value="">全部目标类型</option>
          <option value="ROLE">角色</option>
          <option value="USER_ROLE">用户角色</option>
          <option value="ROLE_PERMISSION">角色权限</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadAuditLogs">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div v-if="renderMode === 'traditional'" class="traditional-view">
      <div class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>操作人</th>
              <th>操作类型</th>
              <th>目标类型</th>
              <th>目标ID</th>
              <th>变更原因</th>
              <th>IP地址</th>
              <th>操作时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in auditLogs" :key="log.id">
              <td>{{ log.id }}</td>
              <td>{{ log.operator_username || '-' }}</td>
              <td>
                <span
                  class="operation-badge"
                  :class="getOperationTypeClass(log.operation_type)"
                >
                  {{ getOperationTypeText(log.operation_type) }}
                </span>
              </td>
              <td>{{ log.target_type || '-' }}</td>
              <td>{{ log.target_id || '-' }}</td>
              <td>{{ log.reason || '-' }}</td>
              <td>{{ log.ip_address || '-' }}</td>
              <td>{{ formatTime(log.created_at) }}</td>
              <td>
                <button class="btn btn-small btn-info" @click="viewDetail(log)">
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button
          :disabled="pagination.page <= 1"
          class="btn btn-small"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        <span
          >第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共
          {{ pagination.total }} 条</span
        >
        <button
          :disabled="pagination.page >= pagination.totalPages"
          class="btn btn-small"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <div v-else ref="logsScrollRef" class="virtual-view">
      <div class="virtual-scroll-wrapper" @scroll="handleVirtualScroll">
        <table class="logs-table">
          <thead class="fixed-header">
            <tr>
              <th>ID</th>
              <th>操作人</th>
              <th>操作类型</th>
              <th>目标类型</th>
              <th>目标ID</th>
              <th>变更原因</th>
              <th>IP地址</th>
              <th>操作时间</th>
              <th>操作</th>
            </tr>
          </thead>
        </table>
        <div
          class="scroll-placeholder-top"
          :style="{ height: virtualScrollData.offset + 'px' }"
        ></div>
        <table class="logs-table">
          <tbody>
            <tr v-for="log in visibleLogs" :key="log.id">
              <td>{{ log.id }}</td>
              <td>{{ log.operator_username || '-' }}</td>
              <td>
                <span
                  class="operation-badge"
                  :class="getOperationTypeClass(log.operation_type)"
                >
                  {{ getOperationTypeText(log.operation_type) }}
                </span>
              </td>
              <td>{{ log.target_type || '-' }}</td>
              <td>{{ log.target_id || '-' }}</td>
              <td>{{ log.reason || '-' }}</td>
              <td>{{ log.ip_address || '-' }}</td>
              <td>{{ formatTime(log.created_at) }}</td>
              <td>
                <button class="btn btn-small btn-info" @click="viewDetail(log)">
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          class="scroll-placeholder-bottom"
          :style="{ height: virtualScrollData.placeholderBottom + 'px' }"
        ></div>
      </div>
    </div>

    <!-- 详情模态框 -->
    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="closeDetailModal"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>审计日志详情</h3>
          <button class="btn btn-small" @click="closeDetailModal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <label>操作人ID:</label>
            <span>{{ selectedLog?.operator_id || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>操作人:</label>
            <span>{{ selectedLog?.operator_username || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>操作类型:</label>
            <span>{{ getOperationTypeText(selectedLog?.operation_type) }}</span>
          </div>
          <div class="detail-item">
            <label>目标类型:</label>
            <span>{{ selectedLog?.target_type || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>目标ID:</label>
            <span>{{ selectedLog?.target_id || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>变更原因:</label>
            <span>{{ selectedLog?.reason || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>IP地址:</label>
            <span>{{ selectedLog?.ip_address || '-' }}</span>
          </div>
          <div class="detail-item">
            <label>操作时间:</label>
            <span>{{ formatTime(selectedLog?.created_at) }}</span>
          </div>
          <div v-if="selectedLog?.old_value" class="detail-section">
            <label>变更前:</label>
            <pre class="json-data">{{
              JSON.stringify(selectedLog.old_value, null, 2)
            }}</pre>
          </div>
          <div v-if="selectedLog?.new_value" class="detail-section">
            <label>变更后:</label>
            <pre class="json-data">{{
              JSON.stringify(selectedLog.new_value, null, 2)
            }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeDetailModal">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch, nextTick } from 'vue';
import { useRbacStore } from '../../stores/rbac';

const rbacStore = useRbacStore();

const auditLogs = ref([]);
const allLogs = ref([]);
const selectedLog = ref(null);
const showDetailModal = ref(false);
const renderMode = ref('virtual');

const renderModes = [
  { value: 'traditional', label: '分页模式', icon: '📄' },
  { value: 'virtual', label: '虚拟滚动', icon: '⚡' },
];

const filters = ref({
  operationType: '',
  targetType: '',
});

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

const ITEM_HEIGHT = 52;
const BUFFER_SIZE = 10;

const virtualScrollData = reactive({
  scrollTop: 0,
  offset: 0,
  placeholderBottom: 0,
  startIndex: 0,
  endIndex: 0,
});

const visibleLogs = computed(() => {
  return allLogs.value.slice(
    virtualScrollData.startIndex,
    virtualScrollData.endIndex
  );
});

async function loadAuditLogs() {
  try {
    if (renderMode.value === 'virtual') {
      await rbacStore.fetchAuditLogs({
        page: 1,
        pageSize: 1000,
        operationType: filters.value.operationType || undefined,
        targetType: filters.value.targetType || undefined,
      });
      allLogs.value = rbacStore.auditLogs;
      pagination.value = rbacStore.pagination;
      initVirtualScroll();
    } else {
      await rbacStore.fetchAuditLogs({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        operationType: filters.value.operationType || undefined,
        targetType: filters.value.targetType || undefined,
      });
      auditLogs.value = rbacStore.auditLogs;
      pagination.value = rbacStore.pagination;
    }
  } catch (error) {
    alert(
      '加载审计日志失败: ' + (error.response?.data?.message || error.message)
    );
  }
}

function initVirtualScroll() {
  nextTick(() => {
    const scrollRef = document.querySelector('.virtual-scroll-wrapper');
    if (scrollRef) {
      const containerHeight = scrollRef.clientHeight;
      const visibleCount =
        Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2;
      virtualScrollData.startIndex = 0;
      virtualScrollData.endIndex = Math.min(visibleCount, allLogs.value.length);
      virtualScrollData.offset = 0;
      virtualScrollData.placeholderBottom = Math.max(
        0,
        (allLogs.value.length - visibleCount) * ITEM_HEIGHT
      );
    }
  });
}

function handleVirtualScroll(event) {
  const scrollTop = event.target.scrollTop;
  virtualScrollData.scrollTop = scrollTop;

  const containerHeight = event.target.clientHeight;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE
  );
  const visibleCount =
    Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2;
  const endIndex = Math.min(startIndex + visibleCount, allLogs.value.length);

  virtualScrollData.startIndex = startIndex;
  virtualScrollData.endIndex = endIndex;
  virtualScrollData.offset = startIndex * ITEM_HEIGHT;
  virtualScrollData.placeholderBottom = Math.max(
    0,
    (allLogs.value.length - endIndex) * ITEM_HEIGHT
  );
}

function resetFilters() {
  filters.value = {
    operationType: '',
    targetType: '',
  };
  pagination.value.page = 1;
  loadAuditLogs();
}

function changePage(page) {
  pagination.value.page = page;
  loadAuditLogs();
}

function viewDetail(log) {
  selectedLog.value = log;
  showDetailModal.value = true;
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedLog.value = null;
}

function getOperationTypeText(type) {
  const map = {
    ASSIGN: '分配',
    REVOKE: '撤销',
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
  };
  return map[type] || type || '-';
}

function getOperationTypeClass(type) {
  const map = {
    ASSIGN: 'assign',
    REVOKE: 'revoke',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
  };
  return map[type] || '';
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN');
}

watch(renderMode, (newMode) => {
  if (newMode === 'virtual') {
    pagination.value.page = 1;
    loadAuditLogs();
  } else {
    pagination.value.page = 1;
    loadAuditLogs();
  }
});

onMounted(() => {
  loadAuditLogs();
});
</script>

<style scoped>
.audit-logs-page {
  padding: 20px;
}

.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  margin-bottom: 20px;
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fafafa;
  color: #262626;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-button:hover {
  background: #f0f0f0;
}

.mode-button.active {
  background: #409eff;
  color: white;
  font-weight: 600;
  border-color: transparent;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-default {
  background: #909399;
  color: white;
}

.btn-default:hover {
  background: #a6a9ad;
}

.btn-info {
  background: #409eff;
  color: white;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.logs-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.virtual-view {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.virtual-scroll-wrapper {
  height: calc(100vh - 350px);
  overflow-y: auto;
  position: relative;
}

.fixed-header {
  position: sticky;
  top: 0;
  background: #f5f7fa;
  z-index: 10;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th,
.logs-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.logs-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.operation-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.operation-badge.assign {
  background: #e1f3d8;
  color: #67c23a;
}

.operation-badge.revoke {
  background: #fef0f0;
  color: #f56c6c;
}

.operation-badge.create {
  background: #e6a23c;
  color: white;
}

.operation-badge.update {
  background: #409eff;
  color: white;
}

.operation-badge.delete {
  background: #f56c6c;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
}

.detail-item label {
  width: 100px;
  font-weight: 500;
  color: #606266;
}

.detail-section {
  margin-top: 16px;
}

.detail-section label {
  display: block;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.json-data {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}
</style>
