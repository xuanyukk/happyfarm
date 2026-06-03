/** * 文件名：GrafanaEmbedPage.vue * 作者：开发者 * 日期：2026-05-26 *
版本：v1.0.0 * 功能描述：Grafana
仪表板嵌入页面，支持仪表板选择、全屏、时间范围和刷新间隔控制 * 更新记录： *
2026-05-26 - v1.0.0 - 初始版本创建 */
<template>
  <div class="grafana-page">
    <div class="page-header">
      <h1>📊 Grafana 监控</h1>
      <div class="header-actions">
        <button
          class="btn btn-secondary"
          :title="isFullscreen ? '退出全屏' : '全屏模式'"
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? '📥 退出全屏' : '📤 全屏' }}
        </button>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <!-- 仪表板选择器 -->
        <div class="control-group">
          <label class="control-label">📋 仪表板</label>
          <select
            v-model="selectedDashboardUid"
            class="control-select"
            @change="onDashboardChange"
          >
            <option
              v-for="dash in dashboards"
              :key="dash.uid"
              :value="dash.uid"
            >
              {{ dash.title }}
            </option>
          </select>
        </div>

        <!-- 时间范围选择 -->
        <div class="control-group">
          <label class="control-label">⏱ 时间范围</label>
          <select
            v-model="selectedTimeRange"
            class="control-select"
            @change="updateIframeSrc"
          >
            <option v-for="tr in timeRanges" :key="tr.value" :value="tr.value">
              {{ tr.label }}
            </option>
          </select>
        </div>

        <!-- 刷新间隔选择 -->
        <div class="control-group">
          <label class="control-label">🔄 刷新间隔</label>
          <select
            v-model="selectedRefresh"
            class="control-select"
            @change="updateIframeSrc"
          >
            <option
              v-for="rf in refreshOptions"
              :key="rf.value"
              :value="rf.value"
            >
              {{ rf.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- 当前面板信息 -->
      <div v-if="currentDashboard" class="current-dashboard-info">
        <span class="dashboard-title"
          >📌 当前面板：{{ currentDashboard.title }}</span
        >
        <span class="dashboard-desc">{{ currentDashboard.description }}</span>
      </div>
    </div>

    <!-- Grafana iframe 容器 -->
    <div class="grafana-container" :class="{ fullscreen: isFullscreen }">
      <div v-if="loading" class="grafana-loading">
        <div class="spinner"></div>
        <span>正在加载 Grafana 仪表板...</span>
      </div>
      <div v-if="error" class="grafana-error">
        <p>⚠️ 加载失败：{{ error }}</p>
        <button class="btn btn-secondary" @click="loadConfig">
          🔄 重新加载
        </button>
      </div>
      <iframe
        v-show="!loading && !error"
        ref="grafanaIframe"
        :src="iframeSrc"
        class="grafana-iframe"
        frameborder="0"
        @load="onIframeLoad"
        @error="onIframeError"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import adminService from '../../services/adminService';

/** Grafana 基础 URL */
const grafanaUrl = ref('http://localhost:3001');

/** 可用仪表板列表 */
const dashboards = ref([]);

/** 当前选中的仪表板 UID */
const selectedDashboardUid = ref('happy-farm-business-metrics');

/** 加载状态 */
const loading = ref(true);

/** 错误信息 */
const error = ref('');

/** 是否全屏 */
const isFullscreen = ref(false);

/** iframe 引用 */
const grafanaIframe = ref(null);

/** 时间范围选项 */
const timeRanges = [
  { label: '最近5分钟', value: '5m' },
  { label: '最近15分钟', value: '15m' },
  { label: '最近1小时', value: '1h' },
  { label: '最近6小时', value: '6h' },
  { label: '最近24小时', value: '24h' },
];

/** 当前选择的时间范围 */
const selectedTimeRange = ref('1h');

/** 刷新间隔选项 */
const refreshOptions = [
  { label: '5秒', value: '5s' },
  { label: '10秒', value: '10s' },
  { label: '30秒', value: '30s' },
  { label: '1分钟', value: '1m' },
  { label: '5分钟', value: '5m' },
  { label: '关闭自动刷新', value: 'off' },
];

/** 当前选择的刷新间隔 */
const selectedRefresh = ref('30s');

/** 当前选中的仪表板信息 */
const currentDashboard = computed(() => {
  return dashboards.value.find((d) => d.uid === selectedDashboardUid.value);
});

/** iframe 的 src 地址 */
const iframeSrc = computed(() => {
  if (!grafanaUrl.value || !selectedDashboardUid.value) {
    return '';
  }

  const baseUrl = grafanaUrl.value.replace(/\/+$/, '');
  let url = `${baseUrl}/d/${selectedDashboardUid.value}?kiosk=tv`;

  if (selectedTimeRange.value) {
    url += `&from=now-${selectedTimeRange.value}&to=now`;
  }

  if (selectedRefresh.value && selectedRefresh.value !== 'off') {
    url += `&refresh=${selectedRefresh.value}`;
  }

  return url;
});

/** 仪表板切换回调 */
function onDashboardChange() {
  updateIframeSrc();
}

/** 从后端加载 Grafana 配置 */
async function loadConfig() {
  loading.value = true;
  error.value = '';

  try {
    const result = await adminService.getGrafanaConfig();

    if (result.success && result.data) {
      grafanaUrl.value = result.data.grafanaUrl || 'http://localhost:3001';
      dashboards.value = result.data.dashboards || [];

      if (dashboards.value.length > 0 && !selectedDashboardUid.value) {
        selectedDashboardUid.value = dashboards.value[0].uid;
      }
    } else {
      throw new Error(result.message || '获取Grafana配置失败');
    }
  } catch (err) {
    error.value = err.message;
    console.error('加载Grafana配置失败:', err);
  } finally {
    loading.value = false;
  }
}

/** 更新 iframe 地址触发重新加载 */
function updateIframeSrc() {
  loading.value = true;
  error.value = '';
}

/** iframe 加载完成 */
function onIframeLoad() {
  loading.value = false;
}

/** iframe 加载错误 */
function onIframeError() {
  loading.value = false;
  error.value = 'Grafana 仪表板加载失败，请检查 Grafana 服务是否正常运行';
}

/** 全屏切换 */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

/** 监听 ESC 键退出全屏 */
function handleKeydown(e) {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false;
  }
}

/** 窗口大小变化时重新计算 */
function handleResize() {}

onMounted(() => {
  loadConfig();
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.grafana-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
  color: #262626;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 控制面板 */
.control-panel {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}

.control-label {
  font-size: 13px;
  font-weight: 600;
  color: #595959;
}

.control-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #262626;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.control-select:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.current-dashboard-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dashboard-title {
  font-size: 14px;
  font-weight: 600;
  color: #1890ff;
}

.dashboard-desc {
  font-size: 12px;
  color: #8c8c8c;
}

/* Grafana 容器 */
.grafana-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  position: relative;
  min-height: 500px;
}

.grafana-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  border-radius: 0;
  margin: 0;
}

.grafana-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.grafana-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #8c8c8c;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.grafana-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #ff4d4f;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #595959;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 响应式 */
@media (max-width: 768px) {
  .control-row {
    flex-direction: column;
  }

  .control-group {
    min-width: 100%;
  }

  .grafana-container {
    min-height: 400px;
  }
}
</style>
