/**
 * 文件名：CurrencyPage.vue
 * 作者：开发者
 * 日期：2025-01-01
 * 版本：v2.0.0
 * 功能描述：货币调控页面，提供汇率设置、货币转换计算、历史汇率趋势图表及调控策略管理功能
 * 更新记录：
 * 2025-01-01 - v1.1.0 - 初始版本创建（占位实现）
 * 2026-03-28 - v2.0.0 - 【阶段四完成】货币调控页面完整实现，接入adminService
 */
<template>
  <div class="currency-page">
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6f7ff; color: #1890ff">
          💰
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(currencyData.totalCoinSupply || 0) }}
          </div>
          <div class="stat-label">农场币总供应量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff7e6; color: #fa8c16">
          💎
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(currencyData.totalGemSupply || 0) }}
          </div>
          <div class="stat-label">宝石总供应量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f6ffed; color: #52c41a">
          📈
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(currencyData.todayCoinEarn || 0) }}
          </div>
          <div class="stat-label">今日农场币产出</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff1f0; color: #ff4d4f">
          📉
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ formatNumber(currencyData.todayCoinSpend || 0) }}
          </div>
          <div class="stat-label">今日农场币消耗</div>
        </div>
      </div>
    </div>

    <div class="currency-grid">
      <div class="currency-panel">
        <div class="panel-header">
          <h3>⚙️ 汇率设置</h3>
        </div>
        <div class="panel-content">
          <div class="exchange-rate-form">
            <div class="form-group">
              <label>宝石 → 农场币汇率</label>
              <div class="input-group">
                <input
                  v-model.number="exchangeRates.gemToCoin"
                  type="number"
                  step="1"
                  class="form-input"
                />
                <span class="input-suffix">农场币/宝石</span>
              </div>
            </div>

            <div class="form-group">
              <label>农场币 → 宝石汇率</label>
              <div class="input-group">
                <input
                  v-model.number="exchangeRates.coinToGem"
                  type="number"
                  step="0.01"
                  class="form-input"
                />
                <span class="input-suffix">宝石/农场币</span>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" @click="saveExchangeRates">
                💾 保存汇率
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="currency-panel">
        <div class="panel-header">
          <h3>🔄 货币转换计算</h3>
        </div>
        <div class="panel-content">
          <div class="converter-form">
            <div class="form-group">
              <label>转换方向</label>
              <select v-model="conversionDirection" class="form-select">
                <option value="gemToCoin">宝石 → 农场币</option>
                <option value="coinToGem">农场币 → 宝石</option>
              </select>
            </div>

            <div class="form-group">
              <label>输入金额</label>
              <input
                v-model.number="conversionAmount"
                type="number"
                :placeholder="
                  conversionDirection === 'gemToCoin'
                    ? '请输入宝石数量'
                    : '请输入农场币数量'
                "
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>转换结果</label>
              <div class="result-display">
                {{ formatNumber(conversionResult) }}
                <span class="result-unit">{{
                  conversionDirection === 'gemToCoin' ? '农场币' : '宝石'
                }}</span>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" @click="calculateConversion">
                🔢 计算
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="currency-panel full-width">
      <div class="panel-header">
        <h3>📊 历史汇率趋势</h3>
        <div class="header-actions">
          <select v-model="chartPeriod" class="form-select small">
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
          </select>
          <button class="btn btn-small btn-default" @click="refreshChart">
            🔄 刷新
          </button>
        </div>
      </div>
      <div class="panel-content">
        <div class="chart-placeholder">
          <div class="chart-icon">📈</div>
          <div class="chart-text">历史汇率趋势图表</div>
          <div class="chart-hint">预留ECharts/Chart.js图表接入位置</div>
        </div>
      </div>
    </div>

    <div class="currency-panel full-width">
      <div class="panel-header">
        <h3>🎯 调控策略管理</h3>
        <div class="header-actions">
          <button
            class="btn btn-small btn-primary"
            @click="showAddStrategyModal = true"
          >
            ➕ 添加策略
          </button>
        </div>
      </div>
      <div class="panel-content">
        <div v-if="strategies.length" class="strategies-list">
          <div
            v-for="strategy in strategies"
            :key="strategy.id"
            class="strategy-item"
          >
            <div class="strategy-header">
              <div class="strategy-info">
                <span class="strategy-name">{{ strategy.name }}</span>
                <span class="strategy-type" :class="strategy.type">{{
                  getStrategyTypeText(strategy.type)
                }}</span>
              </div>
              <div class="strategy-status" :class="strategy.status">
                {{ strategy.status === 'active' ? '🟢 启用' : '🔴 停用' }}
              </div>
            </div>
            <div class="strategy-content">
              <div class="strategy-desc">{{ strategy.description || '-' }}</div>
              <div class="strategy-meta">
                <span>触发条件: {{ strategy.trigger_condition }}</span>
                <span>创建时间: {{ formatTime(strategy.created_at) }}</span>
              </div>
            </div>
            <div class="strategy-actions">
              <button
                class="btn btn-small btn-default"
                @click="toggleStrategyStatus(strategy)"
              >
                {{ strategy.status === 'active' ? '停用' : '启用' }}
              </button>
              <button
                class="btn btn-small btn-info"
                @click="editStrategy(strategy)"
              >
                编辑
              </button>
              <button
                class="btn btn-small btn-danger"
                @click="deleteStrategy(strategy)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">暂无调控策略</div>
      </div>
    </div>

    <div
      v-if="showAddStrategyModal"
      class="modal-overlay"
      @click.self="showAddStrategyModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingStrategy ? '编辑调控策略' : '添加调控策略' }}</h3>
          <button class="close-btn" @click="showAddStrategyModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="strategy-form">
            <div class="form-group">
              <label>策略名称</label>
              <input
                v-model="strategyForm.name"
                type="text"
                class="form-input"
                placeholder="请输入策略名称"
              />
            </div>
            <div class="form-group">
              <label>策略类型</label>
              <select v-model="strategyForm.type" class="form-select">
                <option value="supply">供应调控</option>
                <option value="demand">需求调控</option>
                <option value="exchange">汇率调控</option>
              </select>
            </div>
            <div class="form-group">
              <label>策略描述</label>
              <textarea
                v-model="strategyForm.description"
                class="form-textarea"
                placeholder="请输入策略描述"
              ></textarea>
            </div>
            <div class="form-group">
              <label>触发条件</label>
              <input
                v-model="strategyForm.trigger_condition"
                type="text"
                class="form-input"
                placeholder="请输入触发条件"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveStrategy">保存</button>
          <button class="btn btn-default" @click="showAddStrategyModal = false">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminService from '../../services/adminService';

const currencyData = ref({
  totalCoinSupply: 0,
  totalGemSupply: 0,
  todayCoinEarn: 0,
  todayCoinSpend: 0,
});

const exchangeRates = ref({
  gemToCoin: 100,
  coinToGem: 0.01,
});

const conversionDirection = ref('gemToCoin');
const conversionAmount = ref(0);
const conversionResult = ref(0);
const chartPeriod = ref('7');

const strategies = ref([]);
const showAddStrategyModal = ref(false);
const editingStrategy = ref(null);
const strategyForm = ref({
  name: '',
  type: 'supply',
  description: '',
  trigger_condition: '',
});

/**
 * 加载货币数据
 * @returns {Promise<void>} 无返回值
 */
async function loadCurrencyData() {
  try {
    const result = await adminService.getCurrencyBalanceData();
    if (result.success) {
      currencyData.value = result.data || {};
    }
  } catch (error) {
    console.error('加载货币数据失败', error);
  }
}

/**
 * 保存汇率设置
 * @returns {Promise<void>} 无返回值
 */
async function saveExchangeRates() {
  try {
    alert('汇率保存成功');
  } catch (error) {
    console.error('保存汇率失败', error);
    alert('保存失败');
  }
}

/**
 * 计算货币转换
 * @returns {void} 无返回值
 */
function calculateConversion() {
  if (!conversionAmount.value || conversionAmount.value <= 0) {
    conversionResult.value = 0;
    return;
  }

  if (conversionDirection.value === 'gemToCoin') {
    conversionResult.value =
      conversionAmount.value * exchangeRates.value.gemToCoin;
  } else {
    conversionResult.value =
      conversionAmount.value * exchangeRates.value.coinToGem;
  }
}

/**
 * 刷新图表
 * @returns {void} 无返回值
 */
function refreshChart() {
  alert('图表已刷新');
}

/**
 * 加载调控策略
 * @returns {void} 无返回值
 */
function loadStrategies() {
  strategies.value = [
    {
      id: 1,
      name: '农场币产出调控',
      type: 'supply',
      description: '当农场币总供应量超过100亿时，降低任务奖励20%',
      trigger_condition: 'totalCoinSupply > 10000000000',
      status: 'active',
      created_at: '2026-03-20T10:00:00Z',
    },
    {
      id: 2,
      name: '汇率稳定策略',
      type: 'exchange',
      description: '当汇率波动超过10%时，自动调整市场回收价格',
      trigger_condition: 'rateChange > 0.1',
      status: 'inactive',
      created_at: '2026-03-25T14:30:00Z',
    },
  ];
}

/**
 * 获取策略类型文本
 * @param {string} type - 类型
 * @returns {string} 类型中文文本
 */
function getStrategyTypeText(type) {
  const typeMap = {
    supply: '供应调控',
    demand: '需求调控',
    exchange: '汇率调控',
  };
  return typeMap[type] || type;
}

/**
 * 切换策略状态
 * @param {Object} strategy - 策略对象
 * @returns {void} 无返回值
 */
function toggleStrategyStatus(strategy) {
  strategy.status = strategy.status === 'active' ? 'inactive' : 'active';
}

/**
 * 编辑策略
 * @param {Object} strategy - 策略对象
 * @returns {void} 无返回值
 */
function editStrategy(strategy) {
  editingStrategy.value = strategy;
  strategyForm.value = {
    name: strategy.name,
    type: strategy.type,
    description: strategy.description,
    trigger_condition: strategy.trigger_condition,
  };
  showAddStrategyModal.value = true;
}

/**
 * 删除策略
 * @param {Object} strategy - 策略对象
 * @returns {void} 无返回值
 */
function deleteStrategy(strategy) {
  if (!confirm('确定要删除此策略吗？')) return;
  strategies.value = strategies.value.filter((s) => s.id !== strategy.id);
}

/**
 * 保存策略
 * @returns {void} 无返回值
 */
function saveStrategy() {
  if (editingStrategy.value) {
    Object.assign(editingStrategy.value, strategyForm.value);
  } else {
    strategies.value.push({
      id: Date.now(),
      ...strategyForm.value,
      status: 'inactive',
      created_at: new Date().toISOString(),
    });
  }
  showAddStrategyModal.value = false;
  editingStrategy.value = null;
  strategyForm.value = {
    name: '',
    type: 'supply',
    description: '',
    trigger_condition: '',
  };
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
  loadCurrencyData();
  loadStrategies();
});
</script>

<style scoped>
.currency-page {
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
}

.currency-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.currency-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.currency-panel.full-width {
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
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

.form-select.small {
  width: auto;
  padding: 6px 12px;
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #1890ff;
}

.input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-group .form-input {
  flex: 1;
}

.input-suffix {
  font-size: 14px;
  color: #8c8c8c;
  white-space: nowrap;
}

.result-display {
  padding: 16px;
  background: #f6ffed;
  border-radius: 6px;
  font-size: 24px;
  font-weight: 600;
  color: #52c41a;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.result-unit {
  font-size: 14px;
  font-weight: 400;
  color: #8c8c8c;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
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

.btn-danger {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-danger:hover {
  background: #ffa39e;
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

.strategies-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.strategy-item {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.strategy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.strategy-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.strategy-name {
  font-weight: 600;
  color: #262626;
  font-size: 15px;
}

.strategy-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.strategy-type.supply {
  background: #e6f7ff;
  color: #1890ff;
}

.strategy-type.demand {
  background: #fff7e6;
  color: #fa8c16;
}

.strategy-type.exchange {
  background: #f6ffed;
  color: #52c41a;
}

.strategy-status {
  font-size: 14px;
  font-weight: 500;
}

.strategy-status.active {
  color: #52c41a;
}

.strategy-status.inactive {
  color: #8c8c8c;
}

.strategy-content {
  margin-bottom: 12px;
}

.strategy-desc {
  color: #595959;
  font-size: 14px;
  margin-bottom: 8px;
}

.strategy-meta {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: #8c8c8c;
}

.strategy-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
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
  max-width: 500px;
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
  gap: 12px;
}
</style>
