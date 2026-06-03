/** * 文件名：PerformancePage.vue * 作者：开发者 * 日期：2026-05-05 *
版本：v1.1.0 * 功能描述：性能监控页面 -
展示API响应时间统计、最慢路由、最频繁调用等数据 * 更新记录： * 2026-05-05 -
v1.0.0 - 初始版本创建 * 2026-05-06 - v1.1.0 -
集成WebP优化、存储状态、健康检查等新功能 */
<template>
  <div class="performance-page">
    <div class="page-header">
      <h2>⚡ 性能监控</h2>
      <p>API响应时间监控和性能分析</p>
    </div>

    <div class="action-bar">
      <button class="btn btn-secondary" @click="refreshData">刷新数据</button>
      <button class="btn btn-danger" @click="resetStats">重置统计</button>
      <router-link to="/admin/health-check" class="btn btn-primary">
        🩺 健康检查
      </router-link>
      <router-link to="/admin/system-state" class="btn btn-success">
        ⚡ 系统状态
      </router-link>
    </div>

    <div class="feature-cards">
      <div class="feature-card">
        <div class="feature-header">
          <span class="feature-icon">🖼️</span>
          <span class="feature-title">WebP图片优化</span>
        </div>
        <div class="feature-content">
          <div class="feature-stat">
            <span class="label">WebP支持检测</span>
            <span class="value">{{
              webPSupported ? '✅ 支持' : '❌ 不支持'
            }}</span>
          </div>
          <div class="feature-desc">
            自动检测浏览器WebP支持能力，优先使用WebP格式图片，节省带宽50-70%
          </div>
        </div>
      </div>

      <div class="feature-card">
        <div class="feature-header">
          <span class="feature-icon">💾</span>
          <span class="feature-title">LocalStorage持久化</span>
        </div>
        <div class="feature-content">
          <div class="feature-stat">
            <span class="label">存储状态</span>
            <span class="value">{{ storageStatus }}</span>
          </div>
          <div class="feature-desc">
            Pinia状态自动持久化到LocalStorage，支持过期时间配置和安全存储
          </div>
        </div>
      </div>

      <div class="feature-card">
        <div class="feature-header">
          <span class="feature-icon">🩺</span>
          <span class="feature-title">健康检查</span>
        </div>
        <div class="feature-content">
          <div class="feature-stat">
            <span class="label">系统健康度</span>
            <span
              class="value"
              :style="{
                color: healthStatus === 'healthy' ? '#52c41a' : '#ff4d4f',
              }"
            >
              {{ healthStatus === 'healthy' ? '🟢 健康' : '🔴 异常' }}
            </span>
          </div>
          <div class="feature-desc">
            实时监控数据库、Redis、API网关状态，确保系统稳定运行
          </div>
        </div>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
          📊
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ performanceStats.totalRequests || 0 }}
          </div>
          <div class="stat-label">总请求数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16">
          ⏱️
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ performanceStats.averageTime || 0 }}ms
          </div>
          <div class="stat-label">平均响应时间</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
          🐢
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ performanceStats.slowRequests || 0 }}</div>
          <div class="stat-label">慢请求数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f">
          📈
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ performanceStats.slowRequestRate || '0%' }}
          </div>
          <div class="stat-label">慢请求比率</div>
        </div>
      </div>
    </div>

    <div class="performance-grid">
      <div class="performance-panel">
        <div class="panel-header">
          <h3>🐢 最慢路由（按平均响应时间）</h3>
        </div>
        <div class="panel-content">
          <div v-if="slowRoutes.length" class="route-list">
            <div
              v-for="route in slowRoutes"
              :key="route.route"
              class="route-item"
            >
              <div class="route-info">
                <span class="route-path">{{ route.route }}</span>
                <span class="route-count">调用 {{ route.count }} 次</span>
              </div>
              <div class="route-metrics">
                <span
                  class="route-average"
                  :class="getAverageTimeClass(route.averageTime)"
                >
                  {{ route.averageTime }}ms
                </span>
                <div class="route-range">
                  <span class="route-min">{{ route.minTime }}ms</span>
                  <span>→</span>
                  <span class="route-max">{{ route.maxTime }}ms</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无数据</div>
        </div>
      </div>

      <div class="performance-panel">
        <div class="panel-header">
          <h3>🔄 最频繁调用路由</h3>
        </div>
        <div class="panel-content">
          <div v-if="mostRequestedRoutes.length" class="route-list">
            <div
              v-for="route in mostRequestedRoutes"
              :key="route.route"
              class="route-item"
            >
              <div class="route-info">
                <span class="route-path">{{ route.route }}</span>
                <span class="route-average"
                  >平均 {{ route.averageTime }}ms</span
                >
              </div>
              <div class="route-count-badge">{{ route.count }} 次</div>
            </div>
          </div>
          <div v-else class="empty-state">暂无数据</div>
        </div>
      </div>
    </div>

    <div class="performance-panel full-width">
      <div class="panel-header">
        <h3>📋 所有路由统计</h3>
      </div>
      <div class="panel-content">
        <div
          v-if="Object.keys(performanceStats.requestsByRoute || {}).length"
          class="route-table"
        >
          <table>
            <thead>
              <tr>
                <th>路由</th>
                <th>调用次数</th>
                <th>平均响应时间</th>
                <th>最快响应</th>
                <th>最慢响应</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(stats, route) in performanceStats.requestsByRoute"
                :key="route"
              >
                <td class="route-cell">{{ route }}</td>
                <td class="count-cell">{{ stats.count }}</td>
                <td
                  class="time-cell"
                  :class="getAverageTimeClass(stats.averageTime)"
                >
                  {{ stats.averageTime }}ms
                </td>
                <td class="time-cell">{{ stats.minTime }}ms</td>
                <td
                  class="time-cell"
                  :class="getAverageTimeClass(stats.maxTime)"
                >
                  {{ stats.maxTime }}ms
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import adminService from '../../services/adminService';
import { useToastStore } from '../../stores/toast';
import { useLoadingStore } from '../../stores/loading';
import { storage } from '../../utils/localStorage';

const toastStore = useToastStore();
const loadingStore = useLoadingStore();

// WebP支持检测
const checkWebPSupport = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

const webPSupported = ref(false);

// 存储状态
const storageStatus = computed(() => {
  try {
    const testKey = '__test__';
    storage.set(testKey, 'ok');
    storage.remove(testKey);
    return '✅ 正常';
  } catch (e) {
    return '❌ 异常';
  }
});

// 健康状态
const healthStatus = ref('healthy');

const checkHealth = async () => {
  try {
    const res = await adminService.checkHealth();
    if (res.success) {
      healthStatus.value = res.data.allHealthy ? 'healthy' : 'unhealthy';
    }
  } catch (error) {
    healthStatus.value = 'unhealthy';
  }
};

const performanceStats = ref({
  totalRequests: 0,
  totalTime: 0,
  averageTime: 0,
  slowRequests: 0,
  slowRequestRate: '0%',
  requestsByRoute: {},
  slowThresholds: {},
});

const slowRoutes = ref([]);
const mostRequestedRoutes = ref([]);

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString();
};

const getAverageTimeClass = (time) => {
  const t = parseInt(time) || 0;
  if (t > 2000) return 'time-error';
  if (t > 500) return 'time-warning';
  if (t > 100) return 'time-info';
  return 'time-normal';
};

const refreshData = async () => {
  try {
    loadingStore.startLoading('正在加载性能数据...');

    const [statsRes, slowRes, requestedRes] = await Promise.all([
      adminService.getPerformanceStats(),
      adminService.getSlowestRoutes(10),
      adminService.getMostRequestedRoutes(10),
    ]);

    if (statsRes.success) {
      performanceStats.value = statsRes.data;
    }

    if (slowRes.success) {
      slowRoutes.value = slowRes.data || [];
    }

    if (requestedRes.success) {
      mostRequestedRoutes.value = requestedRes.data || [];
    }

    toastStore.success('数据刷新成功');
  } catch (error) {
    console.error('获取性能数据失败:', error);
    toastStore.error('获取性能数据失败');
  } finally {
    loadingStore.stopLoading();
  }
};

const resetStats = async () => {
  if (!confirm('确定要重置性能统计数据吗？')) return;

  try {
    const res = await adminService.resetPerformanceStats();
    if (res.success) {
      await refreshData();
      toastStore.success('性能统计已重置');
    }
  } catch (error) {
    console.error('重置性能统计失败:', error);
    toastStore.error('重置性能统计失败');
  }
};

onMounted(async () => {
  refreshData();
  webPSupported.value = await checkWebPSupport();
  checkHealth();
});
</script>

<style scoped>
.performance-page {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
}

.page-header p {
  margin: 0;
  color: #718096;
}

.action-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-secondary {
  background: #edf2f7;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-danger {
  background: #fed7d7;
  color: #c53030;
}

.btn-primary {
  background: #1890ff;
  color: white;
  text-decoration: none;
}

.btn-primary:hover {
  background: #096dd9;
}

.btn-success {
  background: #52c41a;
  color: white;
  text-decoration: none;
}

.btn-success:hover {
  background: #389e0d;
}

.btn-danger:hover {
  background: #feb2b2;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.feature-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid #e2e8f0;
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-title {
  font-weight: 600;
  color: #2d3748;
  font-size: 1.125rem;
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.feature-stat .label {
  color: #718096;
}

.feature-stat .value {
  font-weight: 600;
  color: #2d3748;
}

.feature-desc {
  font-size: 0.875rem;
  color: #718096;
  line-height: 1.6;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.75rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
}

.performance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.performance-panel {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.performance-panel.full-width {
  grid-column: 1 / -1;
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0;
  color: #2d3748;
}

.panel-content {
  padding: 1.5rem;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.route-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
}

.route-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.route-path {
  font-family: monospace;
  font-size: 0.875rem;
  color: #2d3748;
}

.route-count {
  font-size: 0.75rem;
  color: #718096;
}

.route-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.route-average {
  font-weight: bold;
  font-size: 1.125rem;
}

.route-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
}

.route-count-badge {
  padding: 0.5rem 1rem;
  background: #3182ce;
  color: white;
  border-radius: 2rem;
  font-weight: bold;
}

.time-normal {
  color: #52c41a;
}

.time-info {
  color: #1890ff;
}

.time-warning {
  color: #fa8c16;
}

.time-error {
  color: #ff4d4f;
}

.route-table {
  overflow-x: auto;
}

.route-table table {
  width: 100%;
  border-collapse: collapse;
}

.route-table th,
.route-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.route-table th {
  font-weight: 600;
  color: #4a5568;
  background: #f7fafc;
}

.route-cell {
  font-family: monospace;
  font-size: 0.875rem;
}

.count-cell {
  text-align: center;
}

.time-cell {
  text-align: right;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #718096;
}
</style>
