/**
 * 文件名：CurrencyConfigPage.vue
 * 作者：开发者
 * 日期：2026-05-25
 * 版本：v1.0.0
 * 功能描述：后台管理-货币配置页面，可视化管理各货币的数额上限、格式化规则和启用状态
 * 更新记录：
 * 2026-05-25 - v1.0.0 - 初始版本创建
 */

<template>
  <div class="currency-config-page">
    <div class="page-header">
      <h2>💰 货币配置管理</h2>
      <p class="page-desc">
        管理各货币类型的数额上限、显示格式化规则和启用状态
      </p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div
        v-for="config in configList"
        :key="config.configId"
        class="stat-card"
      >
        <div class="stat-icon">
          {{ config.configId === 1 ? '💰' : '💎' }}
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ config.currencyName }}</div>
          <div class="stat-value">{{ config.maxHoldFormatted }}</div>
          <div class="stat-meta">
            上限 {{ config.maxHold.toLocaleString('zh-CN') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 配置列表 -->
    <div v-if="loading" class="loading-state">加载中...</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else class="config-panels">
      <div
        v-for="config in configList"
        :key="config.configId"
        class="config-card"
      >
        <div class="card-header">
          <div class="card-title">
            <span class="currency-icon">{{ config.currencySymbol }}</span>
            <span>{{ config.currencyName }}</span>
          </div>
          <span
            class="status-badge"
            :class="config.isActive ? 'active' : 'inactive'"
          >
            {{ config.isActive ? '已启用' : '已停用' }}
          </span>
        </div>

        <div class="card-body">
          <!-- 上限设置 -->
          <div class="form-group">
            <label>数额上限</label>
            <div class="input-row">
              <input
                v-model.number="editConfigs[config.configId].maxHold"
                type="number"
                min="1"
                max="99999999999"
                class="form-input"
              />
              <span class="input-hint">
                当前上限：{{
                  formatCurrency(editConfigs[config.configId].maxHold)
                }}
              </span>
            </div>
          </div>

          <!-- 描述 -->
          <div class="form-group">
            <label>描述</label>
            <input
              v-model="editConfigs[config.configId].description"
              type="text"
              class="form-input"
              maxlength="500"
            />
          </div>

          <!-- 启用状态 -->
          <div class="form-group">
            <label>启用状态</label>
            <div class="toggle-row">
              <label class="toggle">
                <input
                  v-model="editConfigs[config.configId].isActive"
                  type="checkbox"
                />
                <span class="toggle-track">
                  <span class="toggle-knob"></span>
                </span>
                <span class="toggle-label">{{
                  editConfigs[config.configId].isActive ? '启用' : '停用'
                }}</span>
              </label>
            </div>
          </div>

          <!-- 格式化规则 -->
          <div class="form-section">
            <label class="section-label">📊 显示格式化规则</label>
            <div class="rules-grid">
              <div class="form-group">
                <label>"万"单位阈值</label>
                <input
                  v-model.number="
                    editConfigs[config.configId].formatRules.wanThreshold
                  "
                  type="number"
                  min="1000"
                  class="form-input small-input"
                />
              </div>
              <div class="form-group">
                <label>"亿"单位阈值</label>
                <input
                  v-model.number="
                    editConfigs[config.configId].formatRules.yiThreshold
                  "
                  type="number"
                  min="10000000"
                  class="form-input small-input"
                />
              </div>
              <div class="form-group">
                <label>小数位数</label>
                <input
                  v-model.number="
                    editConfigs[config.configId].formatRules.decimals
                  "
                  type="number"
                  min="0"
                  max="3"
                  class="form-input small-input"
                />
              </div>
              <div class="form-group">
                <label>去除末尾零</label>
                <div class="toggle-row">
                  <label class="toggle">
                    <input
                      v-model="
                        editConfigs[config.configId].formatRules
                          .stripTrailingZero
                      "
                      type="checkbox"
                    />
                    <span class="toggle-track">
                      <span class="toggle-knob"></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 格式化预览 -->
          <div class="form-section">
            <label class="section-label">👁️ 格式化预览</label>
            <div class="preview-grid">
              <div
                v-for="preview in getFormattedPreview(config)"
                :key="preview.value"
                class="preview-item"
              >
                <div class="preview-value">
                  {{ preview.value.toLocaleString('zh-CN') }}
                </div>
                <div class="preview-arrow">→</div>
                <div class="preview-formatted">{{ preview.formatted }}</div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button
              class="btn btn-primary"
              :disabled="saving"
              @click="saveConfig(config.configId)"
            >
              💾 {{ saving ? '保存中...' : '保存配置' }}
            </button>
            <button
              class="btn btn-default"
              :disabled="saving"
              @click="resetConfig(config.configId)"
            >
              🔄 重置
            </button>
          </div>

          <div
            v-if="saveMessages[config.configId]"
            class="save-message"
            :class="saveMessages[config.configId].type"
          >
            {{ saveMessages[config.configId].text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { formatCurrency } from '../../utils/currencyFormatter';
import adminService from '../../services/adminService';

const configList = ref([]);
const editConfigs = reactive({});
const loading = ref(true);
const error = ref(null);
const saving = ref(false);
const saveMessages = reactive({});

/**
 * 加载货币配置列表
 */
async function loadConfigs() {
  loading.value = true;
  error.value = null;
  try {
    const response = await adminService.getCurrencyConfigList();
    if (response.success) {
      configList.value = response.data || [];
      for (const config of configList.value) {
        editConfigs[config.configId] = {
          maxHold: config.maxHold,
          description: config.description || '',
          isActive: config.isActive,
          formatRules: {
            wanThreshold: config.formatRules.wanThreshold || 10000,
            yiThreshold: config.formatRules.yiThreshold || 100000000,
            decimals: config.formatRules.decimals || 1,
            stripTrailingZero: config.formatRules.stripTrailingZero !== false,
          },
        };
      }
    } else {
      error.value = '获取配置失败: ' + (response.message || '未知错误');
    }
  } catch (err) {
    error.value = '网络请求失败: ' + err.message;
  } finally {
    loading.value = false;
  }
}

/**
 * 获取格式化预览
 * @param {object} config - 货币配置
 * @returns {Array} 预览数据
 */
function getFormattedPreview(config) {
  const rules = editConfigs[config.configId]?.formatRules || config.formatRules;
  const testValues = [0, 1000, 10000, 1500000, 120000000, 99999999999];
  return testValues.map((v) => ({
    value: v,
    formatted: formatCurrency(v, rules),
  }));
}

/**
 * 保存单个配置
 * @param {number} configId - 配置ID
 */
async function saveConfig(configId) {
  saving.value = true;
  saveMessages[configId] = null;
  try {
    const edit = editConfigs[configId];
    const response = await adminService.updateCurrencyConfig(configId, {
      max_hold: edit.maxHold,
      description: edit.description,
      is_active: edit.isActive,
      format_rules: edit.formatRules,
    });
    if (response.success) {
      saveMessages[configId] = { type: 'success', text: '保存成功！' };
      await loadConfigs();
    } else {
      saveMessages[configId] = {
        type: 'error',
        text: '保存失败: ' + (response.message || '未知错误'),
      };
    }
  } catch (err) {
    saveMessages[configId] = {
      type: 'error',
      text: '保存失败: ' + err.message,
    };
  } finally {
    saving.value = false;
    setTimeout(() => {
      delete saveMessages[configId];
    }, 3000);
  }
}

/**
 * 重置配置到上次加载的值
 * @param {number} configId - 配置ID
 */
function resetConfig(configId) {
  const original = configList.value.find((c) => c.configId === configId);
  if (!original) return;

  editConfigs[configId] = {
    maxHold: original.maxHold,
    description: original.description || '',
    isActive: original.isActive,
    formatRules: {
      wanThreshold: original.formatRules.wanThreshold || 10000,
      yiThreshold: original.formatRules.yiThreshold || 100000000,
      decimals: original.formatRules.decimals || 1,
      stripTrailingZero: original.formatRules.stripTrailingZero !== false,
    },
  };
}

onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.currency-config-page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  color: #262626;
}

.page-desc {
  color: #8c8c8c;
  font-size: 14px;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #262626;
  margin-bottom: 4px;
}

.stat-meta {
  font-size: 12px;
  color: #bfbfbf;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px;
  color: #8c8c8c;
}

.error-state {
  color: #ff4d4f;
}

.config-panels {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.card-header {
  padding: 16px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.currency-icon {
  font-size: 20px;
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.status-badge.active {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-badge.inactive {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}

.card-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #595959;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.small-input {
  max-width: 200px;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-hint {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
}

.toggle-row {
  display: flex;
  align-items: center;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle input {
  display: none;
}

.toggle-track {
  width: 44px;
  height: 22px;
  background: #d9d9d9;
  border-radius: 11px;
  position: relative;
  transition: background 0.3s;
}

.toggle input:checked + .toggle-track {
  background: #1890ff;
}

.toggle-knob {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.toggle input:checked + .toggle-track .toggle-knob {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 13px;
  color: #595959;
}

.form-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.section-label {
  display: block;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 14px;
}

.preview-value {
  color: #8c8c8c;
  min-width: 100px;
  text-align: right;
  font-family: 'Consolas', 'Monaco', monospace;
}

.preview-arrow {
  color: #d9d9d9;
}

.preview-formatted {
  color: #1890ff;
  font-weight: 600;
  min-width: 80px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-default {
  background: #fafafa;
  color: #262626;
  border: 1px solid #d9d9d9;
}

.btn-default:hover:not(:disabled) {
  background: #f5f5f5;
}

.save-message {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
}

.save-message.success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.save-message.error {
  background: #fff1f0;
  color: #ff4d4f;
  border: 1px solid #ffa39e;
}
</style>
