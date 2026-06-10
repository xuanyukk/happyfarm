/**
 * 文件名：LogsPage.vue
 * 作者：开发者
 * 日期：2025-01-01
 * 版本：v3.1.0
 * 功能描述：操作日志查询页面，展示管理员操作记录，支持多维度筛选
 * 更新记录：
 * 2025-01-01 - v1.1.0 - 初始版本创建
 * 2026-03-28 - v2.0.0 - 【阶段四完成】接入adminService，操作日志功能完整实现
 * 2026-05-02 - v3.0.0 - 【虚拟滚动优化】添加虚拟滚动支持，提升大量日志加载性能
 * 2026-06-10 - v3.1.0 - 美化：玻璃拟态容器/表格、CSS变量替代硬编码色、
 *             表格行hover效果、统一农场主题色系
 */
<template>
  <div class="logs-page">
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
          <option value="">全部操作</option>
          <option value="create">创建</option>
          <option value="update">更新</option>
          <option value="delete">删除</option>
          <option value="query">查询</option>
          <option value="export">导出</option>
          <option value="import">导入</option>
          <option value="approve">审批</option>
          <option value="reject">拒绝</option>
        </select>
        <select v-model="filters.module" class="filter-select">
          <option value="">全部模块</option>
          <option value="player">玩家管理</option>
          <option value="currency">货币调控</option>
          <option value="approval">审批流程</option>
          <option value="monitoring">系统监控</option>
          <option value="alert">预警管理</option>
          <option value="statistics">数据统计</option>
          <option value="system">系统设置</option>
        </select>
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadLogs">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
      </div>
    </div>

    <div v-if="renderMode === 'traditional'" class="traditional-view">
      <div class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>管理员</th>
              <th>模块</th>
              <th>操作</th>
              <th>描述</th>
              <th>状态</th>
              <th>执行时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ formatTime(log.created_at) }}</td>
              <td>{{ log.admin_username || '-' }}</td>
              <td>{{ log.operation_module }}</td>
              <td>{{ log.operation_type }}</td>
              <td>{{ log.operation_desc }}</td>
              <td>
                <span class="status-badge" :class="log.status">
                  {{ log.status === 'success' ? '成功' : '失败' }}
                </span>
              </td>
              <td>
                {{ log.execution_time ? log.execution_time + 'ms' : '-' }}
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!logs.length" class="empty-state">暂无操作日志</div>
      </div>

      <div class="pagination">
        <button
          :disabled="currentPage <= 1"
          class="btn btn-default"
          @click="
            currentPage--;
            loadLogs();
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
            loadLogs();
          "
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
              <th>时间</th>
              <th>管理员</th>
              <th>模块</th>
              <th>操作</th>
              <th>描述</th>
              <th>状态</th>
              <th>执行时间</th>
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
              <td>{{ formatTime(log.created_at) }}</td>
              <td>{{ log.admin_username || '-' }}</td>
              <td>{{ log.operation_module }}</td>
              <td>{{ log.operation_type }}</td>
              <td>{{ log.operation_desc }}</td>
              <td>
                <span class="status-badge" :class="log.status">
                  {{ log.status === 'success' ? '成功' : '失败' }}
                </span>
              </td>
              <td>
                {{ log.execution_time ? log.execution_time + 'ms' : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
        <div
          class="scroll-placeholder-bottom"
          :style="{ height: virtualScrollData.placeholderBottom + 'px' }"
        ></div>
        <div v-if="!allLogs.length" class="empty-state">暂无操作日志</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import adminService from '../../services/adminService';

const filters = ref({
  operationType: '',
  module: '',
  status: '',
});

const logs = ref([]);
const allLogs = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalPages = ref(1);
const renderMode = ref('virtual');

const renderModes = [
  { value: 'traditional', label: '分页模式', icon: '📄' },
  { value: 'virtual', label: '虚拟滚动', icon: '⚡' },
];

const ITEM_HEIGHT = 48;
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

async function loadLogs() {
  try {
    if (renderMode.value === 'virtual') {
      const params = {
        page: 1,
        pageSize: 1000,
        ...filters.value,
      };
      const result = await adminService.getOperationLogs(params);
      if (result.success) {
        allLogs.value = result.data.logs;
        total.value = result.data.total;
        initVirtualScroll();
      }
    } else {
      const params = {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...filters.value,
      };
      const result = await adminService.getOperationLogs(params);
      if (result.success) {
        logs.value = result.data.logs;
        total.value = result.data.total;
        totalPages.value = result.data.totalPages;
      }
    }
  } catch (error) {
    console.error('加载操作日志失败', error);
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
    module: '',
    status: '',
  };
  currentPage.value = 1;
  loadLogs();
}

function formatTime(time) {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

watch(renderMode, (newMode) => {
  if (newMode === 'virtual') {
    loadLogs();
  } else {
    currentPage.value = 1;
    loadLogs();
  }
});

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.logs-page {
  padding: 0;
}

.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  margin-bottom: 20px;
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-button {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: rgba(139,105,20,.06);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-button:hover {
  background: rgba(139,105,20,.14);
}

.mode-button.active {
  background: var(--primary-500);
  color: white;
  font-weight: 600;
  border-color: transparent;
}

.filter-bar {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  padding: 16px 20px;
  border-radius: var(--radius-xl);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  outline: none;
  background: rgba(255,252,245,.6);
  color: var(--text-primary);
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-400);
}

.btn-default {
  background: rgba(139,105,20,.06);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-default:hover {
  background: rgba(139,105,20,.14);
}

.logs-table-container {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.virtual-view {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.virtual-scroll-wrapper {
  height: calc(100vh - 300px);
  overflow-y: auto;
  position: relative;
}

.fixed-header {
  position: sticky;
  top: 0;
  background: rgba(139,105,20,.08);
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
  border-bottom: 1px solid var(--border-color);
}

.logs-table th {
  background: rgba(139,105,20,.06);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.logs-table td {
  color: var(--text-primary);
  font-size: 14px;
}

.logs-table tbody tr:hover {
  background: rgba(255,252,245,.18);
}

.status-badge {
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
}

.status-badge.success {
  background: rgba(74,124,89,.12);
  color: var(--primary-600);
}

.status-badge.failed {
  background: rgba(220,38,38,.1);
  color: var(--error-600);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
}

.page-info {
  color: var(--text-secondary);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px;
}
</style>
