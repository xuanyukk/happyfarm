/** * 文件名：HealthCheckPage.vue * 作者：开发者 * 日期：2026-05-06 *
版本：v1.0.0 * 功能描述：系统健康检查仪表盘，实时监控数据库、Redis、系统状态 *
更新记录： * 2026-05-06 - v1.0.0 - 初始版本创建，完整的健康检查功能 */

<template>
  <div class="health-check-page">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <h1>🩺 系统健康检查</h1>
      <button
        class="refresh-btn"
        :disabled="loading"
        @click="refreshHealthCheck"
      >
        {{ loading ? '检查中...' : '🔄 刷新' }}
      </button>
    </div>

    <!-- 总体健康状态 -->
    <div class="health-status-summary">
      <div :class="['summary-card', healthStatusClass]">
        <div class="status-icon">{{ healthStatusIcon }}</div>
        <div class="status-content">
          <div class="status-title">系统状态</div>
          <div class="status-value">{{ healthStatusText }}</div>
          <div class="status-time">最后检查：{{ lastCheckTime }}</div>
        </div>
      </div>
    </div>

    <!-- 服务状态卡片 -->
    <div class="services-grid">
      <!-- 数据库服务状态 -->
      <div class="service-card">
        <div class="service-header">
          <span class="service-icon">🗄️</span>
          <span class="service-name">数据库服务</span>
        </div>
        <div class="service-body">
          <div
            :class="['status-badge', healthData?.services?.database?.status]"
          >
            {{ getStatusText(healthData?.services?.database?.status) }}
          </div>
          <div class="service-details">
            <div class="detail-row">
              <span class="detail-label">响应时间</span>
              <span class="detail-value"
                >{{ healthData?.services?.database?.responseTime }}ms</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">服务类型</span>
              <span class="detail-value">PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Redis服务状态 -->
      <div class="service-card">
        <div class="service-header">
          <span class="service-icon">🔴</span>
          <span class="service-name">Redis缓存</span>
        </div>
        <div class="service-body">
          <div :class="['status-badge', healthData?.services?.redis?.status]">
            {{ getStatusText(healthData?.services?.redis?.status) }}
          </div>
          <div class="service-details">
            <div class="detail-row">
              <span class="detail-label">响应时间</span>
              <span class="detail-value"
                >{{ healthData?.services?.redis?.responseTime }}ms</span
              >
            </div>
            <div class="detail-row">
              <span class="detail-label">服务类型</span>
              <span class="detail-value">Redis</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 后端API服务状态 -->
      <div class="service-card">
        <div class="service-header">
          <span class="service-icon">🚀</span>
          <span class="service-name">API服务</span>
        </div>
        <div class="service-body">
          <div class="status-badge healthy">正常运行</div>
          <div class="service-details">
            <div class="detail-row">
              <span class="detail-label">服务版本</span>
              <span class="detail-value">{{
                healthData?.version || 'v1.0.0'
              }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">运行时间</span>
              <span class="detail-value">{{
                formatUptime(healthData?.system?.uptime)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统资源使用情况 -->
    <div class="system-resources">
      <h3>💻 系统资源使用</h3>
      <div class="resources-grid">
        <!-- 内存使用 -->
        <div class="resource-card">
          <div class="resource-header">
            <span class="resource-icon">🧠</span>
            <span class="resource-name">内存使用</span>
          </div>
          <div class="resource-body">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${memoryUsagePercent}%` }"
                :class="getProgressClass(memoryUsagePercent)"
              ></div>
            </div>
            <div class="resource-metrics">
              <span class="metric-item"
                >已用: {{ healthData?.system?.memory?.heapUsed }}MB</span
              >
              <span class="metric-item"
                >总计: {{ healthData?.system?.memory?.heapTotal }}MB</span
              >
              <span class="metric-item"
                >RSS: {{ healthData?.system?.memory?.rss }}MB</span
              >
            </div>
          </div>
        </div>

        <!-- CPU负载 -->
        <div class="resource-card">
          <div class="resource-header">
            <span class="resource-icon">⚡</span>
            <span class="resource-name">CPU负载</span>
          </div>
          <div class="resource-body">
            <div class="load-average">
              <div class="load-item">
                <span class="load-label">1分钟</span>
                <span class="load-value">{{
                  healthData?.system?.loadavg?.[0]?.toFixed(2)
                }}</span>
              </div>
              <div class="load-item">
                <span class="load-label">5分钟</span>
                <span class="load-value">{{
                  healthData?.system?.loadavg?.[1]?.toFixed(2)
                }}</span>
              </div>
              <div class="load-item">
                <span class="load-label">15分钟</span>
                <span class="load-value">{{
                  healthData?.system?.loadavg?.[2]?.toFixed(2)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 系统信息 -->
        <div class="resource-card">
          <div class="resource-header">
            <span class="resource-icon">📊</span>
            <span class="resource-name">系统信息</span>
          </div>
          <div class="resource-body">
            <div class="system-info-list">
              <div class="info-row">
                <span class="info-label">Node版本</span>
                <span class="info-value">{{
                  healthData?.system?.nodeVersion || 'N/A'
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">平台</span>
                <span class="info-value">{{
                  healthData?.system?.platform || 'N/A'
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">检查时间</span>
                <span class="info-value">{{
                  formatTime(healthData?.timestamp)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史检查记录 -->
    <div class="check-history">
      <h3>📋 检查历史</h3>
      <div class="history-list">
        <div
          v-for="(record, index) in checkHistory"
          :key="index"
          class="history-item"
        >
          <span class="history-time">{{ formatTime(record.timestamp) }}</span>
          <span :class="['history-status', record.status]">
            {{ getStatusText(record.status) }}
          </span>
          <span class="history-message">{{ record.message }}</span>
        </div>
        <div v-if="checkHistory.length === 0" class="empty-history">
          暂无检查记录
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToastStore } from '../../stores/toast';
import api from '../../services/api';

const toastStore = useToastStore();
const loading = ref(false);
const healthData = ref(null);
const checkHistory = ref([]);
const lastCheckTime = ref('');

/**
 * 获取健康检查数据
 * @returns {Promise<void>} 无返回值
 */
async function loadHealthData() {
  try {
    loading.value = true;
    const result = await api.get('/health');
    if (result.success) {
      healthData.value = result.data;
      lastCheckTime.value = formatTime(new Date());

      // 记录到历史
      checkHistory.value.unshift({
        timestamp: new Date(),
        status: healthData.value.status,
        message: `数据库: ${healthData.value.services?.database?.status}, Redis: ${healthData.value.services?.redis?.status}`,
      });

      // 保留最近10条记录
      if (checkHistory.value.length > 10) {
        checkHistory.value = checkHistory.value.slice(0, 10);
      }
    }
  } catch (error) {
    console.error('健康检查失败', error);
    toastStore.error('健康检查失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

/**
 * 刷新健康检查
 * @returns {Promise<void>} 无返回值
 */
async function refreshHealthCheck() {
  toastStore.info('正在检查系统状态...');
  await loadHealthData();
  if (healthData.value?.status === 'healthy') {
    toastStore.success('系统健康检查完成，所有服务正常');
  } else if (healthData.value?.status === 'degraded') {
    toastStore.warning('系统健康检查完成，部分服务异常');
  } else {
    toastStore.error('系统健康检查完成，系统状态异常');
  }
}

/**
 * 获取状态文本
 * @param {string} status - 状态值
 * @returns {string} 状态文本
 */
function getStatusText(status) {
  const statusMap = {
    healthy: '正常',
    degraded: '异常',
    unhealthy: '故障',
  };
  return statusMap[status] || '未知';
}

/**
 * 格式化时间
 * @param {string|Date} time - 时间值
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(time) {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
}

/**
 * 格式化运行时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的运行时间字符串
 */
function formatUptime(seconds) {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}天 ${hours}小时 ${mins}分钟 ${secs}秒`;
}

/**
 * 获取进度条样式类
 * @param {number} percent - 百分比
 * @returns {string} 样式类名
 */
function getProgressClass(percent) {
  if (percent < 50) return 'normal';
  if (percent < 80) return 'warning';
  return 'danger';
}

// 计算属性
const healthStatusClass = computed(() => {
  return healthData.value?.status || 'unknown';
});

const healthStatusIcon = computed(() => {
  const iconMap = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
    unknown: '❓',
  };
  return iconMap[healthData.value?.status] || '❓';
});

const healthStatusText = computed(() => {
  const textMap = {
    healthy: '运行良好',
    degraded: '部分异常',
    unhealthy: '系统故障',
    unknown: '未知状态',
  };
  return textMap[healthData.value?.status] || '未知状态';
});

const memoryUsagePercent = computed(() => {
  if (!healthData.value?.system?.memory) return 0;
  const { heapUsed, heapTotal } = healthData.value.system.memory;
  if (!heapUsed || !heapTotal) return 0;
  return Math.round((heapUsed / heapTotal) * 100);
});

// 组件挂载时加载数据
onMounted(() => {
  loadHealthData();

  // 每30秒自动刷新
  const interval = setInterval(() => {
    loadHealthData();
  }, 30000);

  return () => clearInterval(interval);
});
</script>

<style scoped>
.health-check-page {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.refresh-btn {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 健康状态概览 */
.health-status-summary {
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.summary-card.healthy {
  border-left: 4px solid #52c41a;
}

.summary-card.degraded {
  border-left: 4px solid #faad14;
}

.summary-card.unhealthy {
  border-left: 4px solid #ff4d4f;
}

.summary-card.unknown {
  border-left: 4px solid #8c8c8c;
}

.status-icon {
  font-size: 48px;
}

.status-content {
  flex: 1;
}

.status-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.status-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.status-time {
  font-size: 12px;
  color: #8c8c8c;
}

/* 服务状态卡片 */
.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.service-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.service-header {
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-icon {
  font-size: 24px;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.service-body {
  padding: 20px;
}

.status-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
}

.status-badge.healthy {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.degraded {
  background: #fffbe6;
  color: #faad14;
}

.status-badge.unhealthy {
  background: #fff2f0;
  color: #ff4d4f;
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: #8c8c8c;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

/* 系统资源使用 */
.system-resources {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.system-resources h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.resource-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.resource-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.resource-icon {
  font-size: 24px;
}

.resource-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.resource-body {
  min-height: 100px;
}

.progress-bar {
  height: 20px;
  background: #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.progress-fill.normal {
  background: #52c41a;
}

.progress-fill.warning {
  background: #faad14;
}

.progress-fill.danger {
  background: #ff4d4f;
}

.resource-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #595959;
}

.metric-item {
  display: flex;
  justify-content: space-between;
}

.load-average {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.load-label {
  font-size: 14px;
  color: #8c8c8c;
}

.load-value {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.system-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.info-label {
  font-size: 14px;
  color: #8c8c8c;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

/* 检查历史 */
.check-history {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.check-history h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.history-time {
  font-size: 14px;
  color: #8c8c8c;
  min-width: 180px;
}

.history-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.history-status.healthy {
  background: #f6ffed;
  color: #52c41a;
}

.history-status.degraded {
  background: #fffbe6;
  color: #faad14;
}

.history-status.unhealthy {
  background: #fff2f0;
  color: #ff4d4f;
}

.history-message {
  flex: 1;
  font-size: 14px;
  color: #595959;
}

.empty-history {
  text-align: center;
  color: #8c8c8c;
  padding: 40px;
}
</style>
