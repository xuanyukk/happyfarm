/**
 * 文件名：BusinessMetricsPage.vue
 * 作者：开发者
 * 日期：2026-05-24
 * 版本：v2.1.0
 * 功能描述：业务指标监控页面，提供关键业务指标监控、趋势分析、预警管理等功能
 * 更新记录：
 *   2026-05-24 - v1.0.0 - 初始版本创建
 *   2026-05-24 - v2.0.0 - 修复 HTML 编码问题，统一样式风格
 *   2026-06-01 - v2.1.0 - 趋势数据接入后端API动态渲染；detailMetrics从API响应提取真实数据替换硬编码0值
 */
<template>
  <div class="business-metrics-page">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
          📈
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(metricsData.dau || 0) }}</div>
          <div class="stat-label">日活跃用户(DAU)</div>
          <div :class="['stat-trend', trendClass(metricsTrends.dau)]">
            {{ trendLabel(metricsTrends.dau, '较昨日') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
          💰
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(metricsData.revenue || 0) }}
          </div>
          <div class="stat-label">今日收入</div>
          <div :class="['stat-trend', trendClass(metricsTrends.revenue)]">
            {{ trendLabel(metricsTrends.revenue, '较昨日') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16">
          🛍️
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ metricsData.arpu || 0 }}</div>
          <div class="stat-label">人均收入(ARPU)</div>
          <div :class="['stat-trend', trendClass(metricsTrends.arpu)]">
            {{ trendLabel(metricsTrends.arpu, '较昨日') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f">
          🎯
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ metricsData.conversionRate || 0 }}%</div>
          <div class="stat-label">付费转化率</div>
          <div
            :class="['stat-trend', trendClass(metricsTrends.conversionRate)]"
          >
            {{ trendLabel(metricsTrends.conversionRate, '较昨日') }}
          </div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <select v-model="dateRange" class="filter-select">
          <option value="today">今日</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
        <select v-model="metricType" class="filter-select">
          <option value="all">全部指标</option>
          <option value="user">用户指标</option>
          <option value="revenue">收入指标</option>
          <option value="engagement">参与指标</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadMetricsData">
          🔄 刷新数据
        </button>
        <button class="btn btn-default" @click="exportReport">
          📥 导出报告
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>📊 用户增长趋势</h3>
        </div>
        <div class="panel-content">
          <div class="chart-placeholder">
            <div class="chart-icon">📈</div>
            <div class="chart-text">用户增长趋势图表</div>
            <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
          </div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>💰 收入趋势分析</h3>
        </div>
        <div class="panel-content">
          <div class="chart-placeholder">
            <div class="chart-icon">📊</div>
            <div class="chart-text">收入趋势图表</div>
            <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-panel full-width">
      <div class="panel-header">
        <h3>📋 关键业务指标详情</h3>
      </div>
      <div class="panel-content">
        <div class="metrics-detail-grid">
          <div class="metric-detail-card">
            <div class="detail-title">用户指标</div>
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="stat-label">新增用户</span>
                <span class="stat-value">{{
                  formatNumber(detailMetrics.newUsers)
                }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">活跃用户</span>
                <span class="stat-value">{{
                  formatNumber(detailMetrics.activeUsers)
                }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">留存率(7日)</span>
                <span class="stat-value">{{
                  detailMetrics.retentionRate || '数据收集中'
                }}</span>
              </div>
            </div>
          </div>
          <div class="metric-detail-card">
            <div class="detail-title">收入指标</div>
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="stat-label">付费用户</span>
                <span class="stat-value">{{
                  formatNumber(detailMetrics.payingUsers)
                }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">付费率</span>
                <span class="stat-value"
                  >{{ detailMetrics.payRate || '数据收集中' }}%</span
                >
              </div>
              <div class="detail-stat">
                <span class="stat-label">ARPPU</span>
                <span class="stat-value">{{
                  detailMetrics.arppu || '数据收集中'
                }}</span>
              </div>
            </div>
          </div>
          <div class="metric-detail-card">
            <div class="detail-title">参与指标</div>
            <div class="detail-stats">
              <div class="detail-stat">
                <span class="stat-label">日均时长</span>
                <span class="stat-value">{{
                  detailMetrics.avgSessionTime || '数据收集中'
                }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">日均次数</span>
                <span class="stat-value">{{
                  detailMetrics.dailySessions || '数据收集中'
                }}</span>
              </div>
              <div class="detail-stat">
                <span class="stat-label">互动率</span>
                <span class="stat-value">{{
                  detailMetrics.engagementRate || '数据收集中'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>⚡ 实时指标监控</h3>
        </div>
        <div class="panel-content">
          <div class="realtime-list">
            <div class="realtime-item">
              <span class="realtime-name">当前在线</span>
              <span class="realtime-value">{{
                formatNumber(realtimeMetrics.onlineUsers)
              }}</span>
              <span class="realtime-status up">↑</span>
            </div>
            <div class="realtime-item">
              <span class="realtime-name">交易数</span>
              <span class="realtime-value">{{
                formatNumber(realtimeMetrics.transactionsPerMin)
              }}</span>
              <span class="realtime-status up">↑</span>
            </div>
            <div class="realtime-item">
              <span class="realtime-name">API响应</span>
              <span class="realtime-value"
                >{{ realtimeMetrics.apiResponseTime }}ms</span
              >
              <span class="realtime-status down">↓</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>⚠️ 指标预警</h3>
        </div>
        <div class="panel-content">
          <div class="alert-list">
            <div v-if="alerts.length === 0" class="alert-item info">
              <div class="alert-icon">✅</div>
              <div class="alert-content">
                <div class="alert-title">指标正常</div>
                <div class="alert-desc">当前所有业务指标在正常范围内</div>
              </div>
            </div>
            <div
              v-for="(alert, idx) in alerts"
              :key="idx"
              :class="[
                'alert-item',
                alert.level === 'critical' ? 'warning' : 'info',
              ]"
            >
              <div class="alert-icon">
                {{ alert.level === 'critical' ? '⚠️' : 'ℹ️' }}
              </div>
              <div class="alert-content">
                <div class="alert-title">{{ alert.metric || '指标异常' }}</div>
                <div class="alert-desc">
                  {{ alert.message || '指标超出阈值' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminService from '../../services/adminService';

const metricsData = ref({
  dau: 0,
  revenue: 0,
  arpu: 0,
  conversionRate: 0,
});

const metricsTrends = ref({
  dau: { direction: 'flat', label: '暂无对比数据' },
  revenue: { direction: 'flat', label: '暂无对比数据' },
  arpu: { direction: 'flat', label: '暂无对比数据' },
  conversionRate: { direction: 'flat', label: '暂无对比数据' },
});

const detailMetrics = ref({
  newUsers: 0,
  activeUsers: 0,
  retentionRate: 0,
  payingUsers: 0,
  payRate: 0,
  arppu: 0,
  avgSessionTime: 0,
  dailySessions: 0,
  engagementRate: 0,
});

const realtimeMetrics = ref({
  onlineUsers: 0,
  transactionsPerMin: 0,
  apiResponseTime: 0,
});

const alerts = ref([]);

const dateRange = ref('week');
const metricType = ref('all');
const loading = ref(false);

/**
 * 加载业务指标数据
 */
async function loadMetricsData() {
  loading.value = true;
  try {
    const [metricsRes, alertsRes] = await Promise.all([
      adminService.getBusinessMetrics(),
      adminService.checkBusinessAlerts(),
    ]);

    if (metricsRes.success && metricsRes.data) {
      const d = metricsRes.data;
      const ua = d.userActivity || {};
      const ga = d.gameActivity || {};
      const ts = d.transactionSuccess || {};
      const perf = d.performance || {};

      metricsData.value = {
        dau: ua.dailyActiveUsers || 0,
        revenue: ga.transactionCount || 0,
        arpu:
          ua.dailyActiveUsers > 0
            ? Math.round(
                ((ga.transactionCount || 0) / ua.dailyActiveUsers) * 100
              ) / 100
            : 0,
        conversionRate: ts.payment ? Math.round(ts.payment.rate * 10) / 10 : 0,
      };

      if (d.trends) {
        metricsTrends.value = {
          dau: d.trends.dau || { direction: 'flat', label: '暂无对比数据' },
          revenue: d.trends.revenue || {
            direction: 'flat',
            label: '暂无对比数据',
          },
          arpu: d.trends.arpu || { direction: 'flat', label: '暂无对比数据' },
          conversionRate: d.trends.conversionRate || {
            direction: 'flat',
            label: '暂无对比数据',
          },
        };
      }

      detailMetrics.value = {
        newUsers: ua.newUsers || 0,
        activeUsers: ua.dailyActiveUsers || 0,
        retentionRate: ua.retentionRate7d || 0,
        payingUsers: ts.payment ? ts.payment.success : 0,
        payRate: ts.payment ? Math.round(ts.payment.rate * 10) / 10 : 0,
        arppu: ts.payment ? ts.payment.arppu || 0 : 0,
        avgSessionTime: ua.avgSessionTime || 0,
        dailySessions: ua.dailySessions || 0,
        engagementRate: ua.engagementRate || 0,
      };

      realtimeMetrics.value = {
        onlineUsers: ua.onlineUsers || 0,
        transactionsPerMin: ga.transactionCount || 0,
        apiResponseTime: perf.avgResponseTime || 0,
      };
    }

    if (alertsRes.success && alertsRes.data) {
      alerts.value = Array.isArray(alertsRes.data) ? alertsRes.data : [];
    }
  } catch (error) {
    console.error('加载业务指标数据失败', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 导出业务指标报告
 */
function exportReport() {
  alert('业务指标报告导出中...');
}

/**
 * 格式化数字显示
 * @param {number|null|undefined} num - 数字值
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('zh-CN');
}

/**
 * 获取趋势CSS类名
 * @param {Object} trend - 趋势对象
 * @returns {string} CSS类名
 */
function trendClass(trend) {
  if (!trend || !trend.direction) return '';
  return trend.direction;
}

/**
 * 获取趋势显示文本
 * @param {Object} trend - 趋势对象
 * @param {string} suffix - 后缀文本
 * @returns {string} 趋势文本
 */
function trendLabel(trend, suffix = '') {
  if (!trend || !trend.label) return '';
  return suffix ? `${trend.label} ${suffix}` : trend.label;
}

onMounted(() => {
  loadMetricsData();
});
</script>

<style scoped>
.business-metrics-page {
  padding: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
}

.stat-trend.up {
  color: #52c41a;
}

.stat-trend.down {
  color: #ff4d4f;
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

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.dashboard-panel.full-width {
  grid-column: 1 / -1;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.panel-content {
  padding: 20px;
}

.chart-placeholder {
  padding: 60px 20px;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
}

.chart-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.chart-text {
  font-size: 18px;
  color: #262626;
  margin-bottom: 8px;
}

.chart-hint {
  font-size: 14px;
  color: #8c8c8c;
}

.metrics-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-detail-card {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.detail-title {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
  margin-bottom: 12px;
}

.detail-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-stat {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.detail-stat .stat-label {
  color: #8c8c8c;
}

.detail-stat .stat-value {
  font-weight: 600;
  color: #262626;
}

.realtime-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.realtime-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.realtime-name {
  font-size: 14px;
  color: #595959;
}

.realtime-value {
  font-weight: 600;
  color: #1890ff;
  font-size: 14px;
}

.realtime-status {
  font-weight: 600;
  font-size: 16px;
}

.realtime-status.up {
  color: #52c41a;
}

.realtime-status.down {
  color: #ff4d4f;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
}

.alert-item.warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.alert-item.info {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
}

.alert-icon {
  font-size: 24px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
