/** * 文件名：PlayerAnalyticsPage.vue * 作者：开发者 * 日期：2026-05-24 *
版本：v2.1.0 *
功能描述：玩家分析页面，提供玩家行为分析、留存分析、付费分析、玩家画像等功能 *
更新记录： * 2026-05-24 - v1.0.0 - 初始版本创建 * 2026-05-24 - v2.0.0 -
统一样式风格 * 2026-06-01 - v2.1.0 -
趋势数据接入后端API动态渲染；玩家画像接入getPlayerProfile API替换硬编码 */
<template>
  <div class="player-analytics-page">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
          👥
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(analyticsData.totalPlayers || 0) }}
          </div>
          <div class="stat-label">总玩家数</div>
          <div
            :class="['stat-trend', trendClass(analyticsTrends.totalPlayers)]"
          >
            {{ trendLabel(analyticsTrends.totalPlayers, '本周') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
          📱
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(analyticsData.dailyActive || 0) }}
          </div>
          <div class="stat-label">日活玩家</div>
          <div :class="['stat-trend', trendClass(analyticsTrends.dailyActive)]">
            {{ trendLabel(analyticsTrends.dailyActive, '较昨日') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16">
          📊
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ analyticsData.retentionRate || 0 }}%</div>
          <div class="stat-label">7日留存</div>
          <div
            :class="['stat-trend', trendClass(analyticsTrends.retentionRate)]"
          >
            {{ trendLabel(analyticsTrends.retentionRate, '较上周') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f">
          💎
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(analyticsData.totalRevenue || 0) }}
          </div>
          <div class="stat-label">总收入</div>
          <div
            :class="['stat-trend', trendClass(analyticsTrends.totalRevenue)]"
          >
            {{ trendLabel(analyticsTrends.totalRevenue, '本周') }}
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
        <select v-model="segmentType" class="filter-select">
          <option value="all">全部玩家</option>
          <option value="new">新玩家</option>
          <option value="active">活跃玩家</option>
          <option value="paid">付费玩家</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadAnalyticsData">
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
          <h3>📈 玩家增长趋势</h3>
        </div>
        <div class="panel-content">
          <div class="chart-placeholder">
            <div class="chart-icon">📊</div>
            <div class="chart-text">玩家增长趋势图表</div>
            <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
          </div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>📉 留存率分析</h3>
        </div>
        <div class="panel-content">
          <div class="chart-placeholder">
            <div class="chart-icon">📊</div>
            <div class="chart-text">留存率分析图表</div>
            <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-panel full-width">
      <div class="panel-header">
        <h3>🎯 玩家画像</h3>
      </div>
      <div class="panel-content">
        <div class="profile-grid">
          <div class="profile-card">
            <div class="profile-title">等级分布</div>
            <div class="profile-stats">
              <template
                v-if="
                  playerProfile.levelDistribution &&
                  playerProfile.levelDistribution.length > 0
                "
              >
                <div
                  v-for="item in playerProfile.levelDistribution"
                  :key="item.range"
                  class="profile-stat"
                >
                  <span class="stat-label">{{ item.range }}</span>
                  <span class="stat-value">{{ item.percentage }}%</span>
                </div>
              </template>
              <div v-else class="profile-stat">
                <span class="stat-label">数据加载中...</span>
              </div>
            </div>
          </div>
          <div class="profile-card">
            <div class="profile-title">游戏时长</div>
            <div class="profile-stats">
              <div class="profile-stat">
                <span class="stat-label">日均在线</span>
                <span class="stat-value">{{
                  playerProfile.gameTime?.avgDailyOnline || '数据收集中'
                }}</span>
              </div>
              <div class="profile-stat">
                <span class="stat-label">单次最长</span>
                <span class="stat-value">{{
                  playerProfile.gameTime?.maxSingleSession || '数据收集中'
                }}</span>
              </div>
              <div class="profile-stat">
                <span class="stat-label">活跃时段</span>
                <span class="stat-value">{{
                  playerProfile.gameTime?.peakHours || '数据收集中'
                }}</span>
              </div>
            </div>
          </div>
          <div class="profile-card">
            <div class="profile-title">付费偏好</div>
            <div class="profile-stats">
              <div class="profile-stat">
                <span class="stat-label">付费率</span>
                <span class="stat-value">{{
                  playerProfile.payPrefs?.payRate || '数据收集中'
                }}</span>
              </div>
              <div class="profile-stat">
                <span class="stat-label">ARPU</span>
                <span class="stat-value">{{
                  playerProfile.payPrefs?.arpu || '数据收集中'
                }}</span>
              </div>
              <div class="profile-stat">
                <span class="stat-label">ARPPU</span>
                <span class="stat-value">{{
                  playerProfile.payPrefs?.arppu || '数据收集中'
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
          <h3>🏆 活跃玩家排行</h3>
        </div>
        <div class="panel-content">
          <div class="ranking-list">
            <div
              v-for="(player, index) in topPlayers"
              :key="player.id"
              class="ranking-item"
            >
              <span class="ranking-number" :class="'rank-' + (index + 1)">{{
                index + 1
              }}</span>
              <span class="ranking-name">{{ player.name }}</span>
              <span class="ranking-value">{{
                formatNumber(player.score)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>⚠️ 异常行为预警</h3>
        </div>
        <div class="panel-content">
          <div class="alert-list">
            <div v-if="playerAlerts.length === 0" class="alert-item info">
              <div class="alert-icon">✅</div>
              <div class="alert-content">
                <div class="alert-title">行为正常</div>
                <div class="alert-desc">当前无异常行为预警</div>
              </div>
            </div>
            <div
              v-for="(alert, idx) in playerAlerts"
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
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-desc">{{ alert.message }}</div>
              </div>
              <button class="btn btn-small btn-default">查看</button>
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

const analyticsData = ref({
  totalPlayers: 0,
  dailyActive: 0,
  retentionRate: 0,
  totalRevenue: 0,
});

const analyticsTrends = ref({
  totalPlayers: { direction: 'flat', label: '暂无对比数据' },
  dailyActive: { direction: 'flat', label: '暂无对比数据' },
  retentionRate: { direction: 'flat', label: '暂无对比数据' },
  totalRevenue: { direction: 'flat', label: '暂无对比数据' },
});

const playerProfile = ref({
  levelDistribution: [],
  gameTime: {},
  payPrefs: {},
});

const dateRange = ref('week');
const segmentType = ref('all');

const topPlayers = ref([]);

const playerAlerts = ref([]);

/**
 * 加载玩家分析数据
 * @returns {Promise&lt;void&gt;} 无返回值
 */
async function loadAnalyticsData() {
  try {
    const result = await adminService.getPlayerAnalytics();
    if (result.success && result.data) {
      analyticsData.value = result.data;
      if (result.data.trends) {
        analyticsTrends.value = result.data.trends;
      }
    }
  } catch (error) {
    console.error('加载分析数据失败', error);
  }
}

async function loadPlayerProfile() {
  try {
    const result = await adminService.getPlayerProfile();
    if (result.success && result.data) {
      playerProfile.value = result.data;
    }
  } catch (error) {
    console.error('加载玩家画像失败', error);
  }
}

async function loadTopPlayers() {
  try {
    const result = await adminService.getTopPlayers({ limit: 5 });
    if (result.success && result.data) {
      topPlayers.value = result.data.players || result.data;
    }
  } catch (error) {
    console.error('加载玩家排行失败', error);
  }
}

async function loadPlayerAlerts() {
  try {
    const result = await adminService.getPlayerAlerts();
    if (result.success && result.data) {
      playerAlerts.value = result.data.alerts || result.data;
    }
  } catch (error) {
    console.error('加载玩家预警失败', error);
  }
}

/**
 * 导出玩家分析报告
 */
function exportReport() {
  alert('玩家分析报告导出中...');
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
  loadAnalyticsData();
  loadPlayerProfile();
  loadTopPlayers();
  loadPlayerAlerts();
});
</script>

<style scoped>
.player-analytics-page {
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
  margin-bottom: 24px;
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

.btn-small {
  padding: 4px 12px;
  font-size: 12px;
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

.profile-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.profile-card {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
}

.profile-title {
  font-weight: 600;
  color: #262626;
  font-size: 14px;
  margin-bottom: 12px;
}

.profile-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-stat {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.profile-stat .stat-label {
  color: #8c8c8c;
}

.profile-stat .stat-value {
  font-weight: 600;
  color: #262626;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.ranking-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.ranking-number.rank-1 {
  background: #f5222d;
  color: white;
}

.ranking-number.rank-2 {
  background: #faad14;
  color: white;
}

.ranking-number.rank-3 {
  background: #1890ff;
  color: white;
}

.ranking-number:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #d9d9d9;
  color: #595959;
}

.ranking-name {
  flex: 1;
  font-size: 14px;
  color: #262626;
}

.ranking-value {
  font-weight: 600;
  color: #1890ff;
  font-size: 14px;
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
