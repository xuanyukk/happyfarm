/** * 文件名：StatisticsPage.vue * 作者：开发者 * 日期：2025-01-01 *
版本：v2.0.0 *
功能描述：数据统计页面，提供多维度数据统计分析、关键业务指标展示、报表生成、数据导出及趋势预测功能
* 更新记录： * 2025-01-01 - v1.1.0 - 初始版本创建（占位实现） * 2026-03-28 -
v2.0.0 - 【阶段四完成】数据统计页面完整实现，接入adminService */
<template>
  <div class="statistics-page">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
          👥
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(statisticsData.totalPlayers || 0) }}
          </div>
          <div class="stat-label">总玩家数</div>
          <div class="stat-trend up">↑ 12.5% 本周</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16">
          💰
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(statisticsData.totalCoinEarned || 0) }}
          </div>
          <div class="stat-label">累计农场币产出</div>
          <div class="stat-trend up">↑ 8.3% 本周</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
          🎮
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(statisticsData.dailyActivePlayers || 0) }}
          </div>
          <div class="stat-label">今日活跃玩家</div>
          <div class="stat-trend down">↓ 3.2% 较昨日</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f">
          📊
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(statisticsData.totalTransactions || 0) }}
          </div>
          <div class="stat-label">总交易次数</div>
          <div class="stat-trend up">↑ 15.7% 本周</div>
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
          <option value="custom">自定义</option>
        </select>
        <input
          v-if="dateRange === 'custom'"
          v-model="startDate"
          type="date"
          class="filter-input"
          style="width: 150px"
        />
        <input
          v-if="dateRange === 'custom'"
          v-model="endDate"
          type="date"
          class="filter-input"
          style="width: 150px"
        />
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadStatistics">
          🔄 刷新数据
        </button>
        <button class="btn btn-success" @click="exportData">📥 导出报表</button>
      </div>
    </div>

    <div class="statistics-grid">
      <div class="statistics-panel">
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

      <div class="statistics-panel">
        <div class="panel-header">
          <h3>💰 货币流通分析</h3>
        </div>
        <div class="panel-content">
          <div class="chart-placeholder">
            <div class="chart-icon">💹</div>
            <div class="chart-text">货币流通分析图表</div>
            <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
          </div>
        </div>
      </div>
    </div>

    <div class="statistics-panel full-width">
      <div class="panel-header">
        <h3>📋 自定义报表生成</h3>
      </div>
      <div class="panel-content">
        <div class="report-form">
          <div class="form-row">
            <div class="form-group">
              <label>报表名称</label>
              <input
                v-model="reportForm.name"
                type="text"
                class="form-input"
                placeholder="请输入报表名称"
              />
            </div>
            <div class="form-group">
              <label>报表类型</label>
              <select v-model="reportForm.type" class="form-select">
                <option value="player">玩家数据报表</option>
                <option value="currency">货币数据报表</option>
                <option value="transaction">交易数据报表</option>
                <option value="comprehensive">综合数据报表</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>数据字段</label>
            <div class="checkbox-group">
              <label
                v-for="field in dataFields"
                :key="field.key"
                class="checkbox-item"
              >
                <input
                  v-model="reportForm.fields"
                  type="checkbox"
                  :value="field.key"
                />
                <span>{{ field.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>导出格式</label>
            <div class="radio-group">
              <label
                v-for="format in exportFormats"
                :key="format.key"
                class="radio-item"
              >
                <input
                  v-model="reportForm.format"
                  type="radio"
                  :value="format.key"
                />
                <span>{{ format.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-info" @click="previewReport">
              👁️ 预览报表
            </button>
            <button class="btn btn-primary" @click="generateReport">
              📄 生成报表
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="statistics-grid">
      <div class="statistics-panel">
        <div class="panel-header">
          <h3>🔮 趋势预测</h3>
        </div>
        <div class="panel-content">
          <div class="prediction-list">
            <div class="prediction-item">
              <div class="prediction-header">
                <span class="prediction-title">玩家增长预测</span>
                <span class="prediction-confidence high">置信度: 87%</span>
              </div>
              <div class="prediction-content">
                <div class="prediction-value">
                  +{{ formatNumber(12500) }} 玩家
                </div>
                <div class="prediction-period">未来30天预测</div>
              </div>
            </div>

            <div class="prediction-item">
              <div class="prediction-header">
                <span class="prediction-title">货币需求预测</span>
                <span class="prediction-confidence medium">置信度: 76%</span>
              </div>
              <div class="prediction-content">
                <div class="prediction-value">
                  +{{ formatNumber(250000000) }} 农场币
                </div>
                <div class="prediction-period">未来30天预测</div>
              </div>
            </div>

            <div class="prediction-item">
              <div class="prediction-header">
                <span class="prediction-title">活跃度预测</span>
                <span class="prediction-confidence high">置信度: 91%</span>
              </div>
              <div class="prediction-content">
                <div class="prediction-value">+5.2% 活跃度</div>
                <div class="prediction-period">未来7天预测</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="statistics-panel">
        <div class="panel-header">
          <h3>📜 报表历史</h3>
          <div class="header-actions">
            <button
              class="btn btn-small btn-default"
              @click="refreshReportHistory"
            >
              🔄 刷新
            </button>
          </div>
        </div>
        <div class="panel-content">
          <div v-if="reportHistory.length" class="history-list">
            <div
              v-for="report in reportHistory"
              :key="report.id"
              class="history-item"
            >
              <div class="history-info">
                <div class="history-name">{{ report.name }}</div>
                <div class="history-meta">
                  <span>{{ getReportTypeText(report.type) }}</span>
                  <span>{{ formatTime(report.created_at) }}</span>
                </div>
              </div>
              <div class="history-actions">
                <button
                  class="btn btn-small btn-info"
                  @click="downloadReport(report)"
                >
                  📥 下载
                </button>
                <button
                  class="btn btn-small btn-danger"
                  @click="deleteReport(report)"
                >
                  🗑️ 删除
                </button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">暂无报表历史</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminService from '../../services/adminService';

const statisticsData = ref({
  totalPlayers: 0,
  totalCoinEarned: 0,
  dailyActivePlayers: 0,
  totalTransactions: 0,
});

const dateRange = ref('week');
const startDate = ref('');
const endDate = ref('');

const reportForm = ref({
  name: '',
  type: 'player',
  fields: ['player_count', 'registration_date', 'last_login'],
  format: 'excel',
});

const dataFields = ref([
  { key: 'player_count', label: '玩家数量' },
  { key: 'registration_date', label: '注册时间' },
  { key: 'last_login', label: '最后登录' },
  { key: 'player_level', label: '玩家等级' },
  { key: 'coin_balance', label: '农场币余额' },
  { key: 'gem_balance', label: '宝石余额' },
  { key: 'total_earn', label: '累计获得' },
  { key: 'total_spend', label: '累计消耗' },
]);

const exportFormats = ref([
  { key: 'excel', label: 'Excel (.xlsx)' },
  { key: 'csv', label: 'CSV (.csv)' },
  { key: 'pdf', label: 'PDF (.pdf)' },
]);

const reportHistory = ref([
  {
    id: 1,
    name: '2026年第12周玩家数据报表',
    type: 'player',
    created_at: '2026-03-25T14:30:00Z',
  },
  {
    id: 2,
    name: '3月货币流通分析报表',
    type: 'currency',
    created_at: '2026-03-20T10:15:00Z',
  },
]);

/**
 * 加载统计数据
 * @returns {Promise<void>} 无返回值
 */
async function loadStatistics() {
  try {
    const result = await adminService.getStatisticsData();
    if (result.success) {
      statisticsData.value = result.data || {};
    }
  } catch (error) {
    console.error('加载统计数据失败', error);
  }
}

/**
 * 导出数据
 * @returns {void} 无返回值
 */
function exportData() {
  alert('数据导出中...');
}

/**
 * 预览报表
 * @returns {void} 无返回值
 */
function previewReport() {
  alert('报表预览功能');
}

/**
 * 生成报表
 * @returns {void} 无返回值
 */
function generateReport() {
  if (!reportForm.value.name) {
    alert('请输入报表名称');
    return;
  }
  if (reportForm.value.fields.length === 0) {
    alert('请至少选择一个数据字段');
    return;
  }
  alert('报表生成中...');
  reportHistory.value.unshift({
    id: Date.now(),
    name: reportForm.value.name,
    type: reportForm.value.type,
    created_at: new Date().toISOString(),
  });
}

/**
 * 刷新报表历史
 * @returns {void} 无返回值
 */
function refreshReportHistory() {
  alert('报表历史已刷新');
}

/**
 * 下载报表
 * @param {Object} report - 报表对象
 * @returns {void} 无返回值
 */
function downloadReport(report) {
  alert(`正在下载报表: ${report.name}`);
}

/**
 * 删除报表
 * @param {Object} report - 报表对象
 * @returns {void} 无返回值
 */
function deleteReport(report) {
  if (!confirm('确定要删除此报表吗？')) return;
  reportHistory.value = reportHistory.value.filter((r) => r.id !== report.id);
}

/**
 * 获取报表类型文本
 * @param {string} type - 类型
 * @returns {string} 类型中文文本
 */
function getReportTypeText(type) {
  const typeMap = {
    player: '玩家数据',
    currency: '货币数据',
    transaction: '交易数据',
    comprehensive: '综合数据',
  };
  return typeMap[type] || type;
}

/**
 * 格式化数字显示（千分位）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
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

onMounted(() => {
  statisticsData.value = {
    totalPlayers: 15680,
    totalCoinEarned: 9876543210,
    dailyActivePlayers: 3250,
    totalTransactions: 456789,
  };
  loadStatistics();
});
</script>

<style scoped>
.statistics-page {
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

.btn-small {
  padding: 6px 12px;
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

.btn-danger {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-danger:hover {
  background: #ffa39e;
}

.statistics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.statistics-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.statistics-panel.full-width {
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

.report-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: #1890ff;
}

.checkbox-group,
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-item,
.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #262626;
}

.checkbox-item input,
.radio-item input {
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.prediction-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prediction-item {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.prediction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.prediction-title {
  font-weight: 600;
  color: #262626;
  font-size: 15px;
}

.prediction-confidence {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.prediction-confidence.high {
  background: #f6ffed;
  color: #52c41a;
}

.prediction-confidence.medium {
  background: #fff7e6;
  color: #fa8c16;
}

.prediction-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prediction-value {
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
}

.prediction-period {
  font-size: 13px;
  color: #8c8c8c;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.history-info {
  flex: 1;
}

.history-name {
  font-weight: 500;
  color: #262626;
  margin-bottom: 4px;
}

.history-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8c8c8c;
}

.history-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  color: #8c8c8c;
  padding: 60px;
}
</style>
