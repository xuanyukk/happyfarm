/** * 文件名：EconomyPage.vue * 作者：开发者 * 日期：2026-05-24 * 版本：v2.1.0 *
功能描述：经济分析页面，提供经济指标分析、货币流通监控、交易数据分析、收支平衡分析等功能
* 更新记录： * 2026-05-24 - v1.0.0 - 初始版本创建 * 2026-05-24 - v2.0.0 -
修复缺少表格结束标签，统一样式风格 * 2026-06-01 - v2.1.0 -
趋势数据接入后端API动态渲染，移除硬编码趋势文本 */
<template>
  <div class="economy-page">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16">
          💰
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(economyData.totalCurrency || 0) }}
          </div>
          <div class="stat-label">总货币流通量</div>
          <div :class="['stat-trend', trendClass(economyTrends.totalCurrency)]">
            {{ trendLabel(economyTrends.totalCurrency, '本周') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
          📈
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(economyData.dailyTransactions || 0) }}
          </div>
          <div class="stat-label">今日交易量</div>
          <div
            :class="['stat-trend', trendClass(economyTrends.dailyTransactions)]"
          >
            {{ trendLabel(economyTrends.dailyTransactions, '较昨日') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
          🌾
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(economyData.totalHarvests || 0) }}
          </div>
          <div class="stat-label">今日收获次数</div>
          <div :class="['stat-trend', trendClass(economyTrends.totalHarvests)]">
            {{ trendLabel(economyTrends.totalHarvests, '较昨日') }}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f">
          🛒
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(economyData.shopTurnover || 0) }}
          </div>
          <div class="stat-label">商店营业额</div>
          <div :class="['stat-trend', trendClass(economyTrends.shopTurnover)]">
            {{ trendLabel(economyTrends.shopTurnover, '本周') }}
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
          <option value="quarter">本季度</option>
          <option value="year">本年</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadEconomyData">
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
          <h3>📊 货币流通趋势</h3>
        </div>
        <div class="panel-content">
          <div class="chart-placeholder">
            <div class="chart-icon">💹</div>
            <div class="chart-text">货币流通趋势图表</div>
            <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
          </div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>📉 收支平衡分析</h3>
        </div>
        <div class="panel-content">
          <div class="chart-placeholder">
            <div class="chart-icon">📊</div>
            <div class="chart-text">收支平衡分析图表</div>
            <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-panel full-width">
      <div class="panel-header">
        <h3>📋 交易记录详情</h3>
        <div class="header-actions">
          <select
            v-model="transactionFilter"
            class="filter-select"
            style="width: 150px"
          >
            <option value="all">全部交易</option>
            <option value="income">收入</option>
            <option value="expense">支出</option>
            <option value="trade">交易</option>
          </select>
        </div>
      </div>
      <div class="panel-content">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>玩家</th>
              <th>金额</th>
              <th>余额</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactionList" :key="tx.id">
              <td>{{ formatTime(tx.time) }}</td>
              <td>
                <span :class="getTypeClass(tx.type)">{{
                  getTypeText(tx.type)
                }}</span>
              </td>
              <td>{{ tx.playerName }}</td>
              <td :class="tx.amount > 0 ? 'positive' : 'negative'">
                {{ tx.amount > 0 ? '+' : '' }}{{ formatNumber(tx.amount) }}
              </td>
              <td>{{ formatNumber(tx.balance) }}</td>
              <td>{{ tx.detail }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>🏪 商店销售统计</h3>
        </div>
        <div class="panel-content">
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">热销商品</span>
              <span class="stat-value">{{
                shopStats.topProduct || '暂无数据'
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均客单价</span>
              <span class="stat-value">{{
                formatNumber(shopStats.avgOrderValue)
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">复购率</span>
              <span class="stat-value"
                >{{ shopStats.repurchaseRate || '暂无数据' }}%</span
              >
            </div>
            <div class="stat-item">
              <span class="stat-label">新用户购买</span>
              <span class="stat-value">{{
                formatNumber(shopStats.newUserPurchases)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-panel">
        <div class="panel-header">
          <h3>⚠️ 经济预警</h3>
        </div>
        <div class="panel-content">
          <div class="alert-list">
            <div v-if="economyAlerts.length === 0" class="alert-item info">
              <div class="alert-icon">✅</div>
              <div class="alert-content">
                <div class="alert-title">经济状况正常</div>
                <div class="alert-desc">当前无经济预警信息</div>
              </div>
            </div>
            <div
              v-for="(alert, idx) in economyAlerts"
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

const economyData = ref({
  totalCurrency: 0,
  dailyTransactions: 0,
  totalHarvests: 0,
  shopTurnover: 0,
});

const economyTrends = ref({
  totalCurrency: { direction: 'flat', label: '暂无对比数据' },
  dailyTransactions: { direction: 'flat', label: '暂无对比数据' },
  totalHarvests: { direction: 'flat', label: '暂无对比数据' },
  shopTurnover: { direction: 'flat', label: '暂无对比数据' },
});

const dateRange = ref('week');
const transactionFilter = ref('all');

const transactionList = ref([]);

const economyAlerts = ref([]);

const shopStats = ref({
  topProduct: '',
  avgOrderValue: 0,
  repurchaseRate: 0,
  newUserPurchases: 0,
});

/**
 * 加载经济分析数据
 * @returns {Promise&lt;void&gt;} 无返回值
 */
async function loadEconomyData() {
  try {
    const result = await adminService.getEconomyStats();
    if (result.success && result.data) {
      economyData.value = result.data;
      if (result.data.trends) {
        economyTrends.value = result.data.trends;
      }
    }
  } catch (error) {
    console.error('加载经济数据失败', error);
  }
}

async function loadTransactions() {
  try {
    const result = await adminService.getTransactionList({
      limit: 10,
    });
    if (result.success && result.data) {
      transactionList.value = result.data.transactions || result.data;
    }
  } catch (error) {
    console.error('加载交易记录失败', error);
  }
}

async function loadShopStats() {
  try {
    const result = await adminService.getShopStats();
    if (result.success && result.data) {
      shopStats.value = result.data;
    }
  } catch (error) {
    console.error('加载商店统计失败', error);
  }
}

async function loadEconomyAlerts() {
  try {
    const result = await adminService.getEconomyAlerts();
    if (result.success && result.data) {
      economyAlerts.value = result.data.alerts || result.data;
    }
  } catch (error) {
    console.error('加载经济预警失败', error);
  }
}

/**
 * 导出经济分析报告
 */
function exportReport() {
  alert('经济分析报告导出中...');
}

/**
 * 获取交易类型对应的CSS类名
 * @param {string} type - 交易类型
 * @returns {string} CSS类名
 */
function getTypeClass(type) {
  const classMap = {
    income: 'income-tag',
    expense: 'expense-tag',
    trade: 'trade-tag',
  };
  return classMap[type] || '';
}

/**
 * 获取交易类型对应的中文文本
 * @param {string} type - 交易类型
 * @returns {string} 中文文本
 */
function getTypeText(type) {
  const typeMap = {
    income: '收入',
    expense: '支出',
    trade: '交易',
  };
  return typeMap[type] || type;
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
 * 格式化时间显示
 * @param {string|Date} time - 时间值
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(time) {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
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
  loadEconomyData();
  loadTransactions();
  loadShopStats();
  loadEconomyAlerts();
});
</script>

<style scoped>
.economy-page {
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

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
  font-size: 14px;
}

.data-table td {
  font-size: 14px;
  color: #595959;
}

.data-table .positive {
  color: #52c41a;
  font-weight: 600;
}

.data-table .negative {
  color: #ff4d4f;
  font-weight: 600;
}

.income-tag {
  color: #52c41a;
  background: #f6ffed;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.expense-tag {
  color: #ff4d4f;
  background: #fff1f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.trade-tag {
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.stat-item .stat-label {
  color: #8c8c8c;
  font-size: 14px;
}

.stat-item .stat-value {
  font-weight: 600;
  color: #262626;
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
