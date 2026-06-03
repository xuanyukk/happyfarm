/** * 文件名：SystemStatePage.vue * 作者：开发者 * 日期：2026-05-06 *
版本：v1.0.0 * 功能描述：系统状态管理页面，查看和管理前端状态持久化、系统配置等
* 更新记录： * 2026-05-06 - v1.0.0 - 初始版本创建，完整的系统状态管理功能 */

<template>
  <div class="system-state-page">
    <div class="page-header">
      <h1>⚙️ 系统状态管理</h1>
      <button class="refresh-btn" @click="refreshState">🔄 刷新</button>
    </div>

    <!-- 功能选项卡 -->
    <div class="tabs-container">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-item', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.name }}
      </div>
    </div>

    <!-- 状态持久化 -->
    <div v-if="activeTab === 'persistence'" class="tab-content">
      <h2>💾 状态持久化管理</h2>

      <!-- 持久化配置 -->
      <div class="config-section">
        <h3>持久化配置</h3>
        <div class="config-grid">
          <div class="config-item">
            <span class="config-label">前缀</span>
            <span class="config-value">{{ persistenceConfig.prefix }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">过期时间</span>
            <span class="config-value">{{
              formatExpireTime(persistenceConfig.expireTime)
            }}</span>
          </div>
          <div class="config-item">
            <span class="config-label">持久化模块</span>
            <span class="config-value">{{
              persistenceConfig.persistedModules.join(', ') || '无'
            }}</span>
          </div>
        </div>
      </div>

      <!-- 存储使用情况 -->
      <div class="storage-section">
        <h3>存储使用情况</h3>
        <div class="storage-info">
          <div class="storage-card">
            <div class="storage-title">已用空间</div>
            <div class="storage-value">{{ storageInfo.used }}KB</div>
            <div class="storage-bar">
              <div
                class="storage-fill"
                :style="{ width: `${storageUsagePercent}%` }"
                :class="getStorageClass(storageUsagePercent)"
              ></div>
            </div>
            <div class="storage-footer">共 {{ storageInfo.total }}KB</div>
          </div>
        </div>
      </div>

      <!-- 存储内容预览 -->
      <div class="content-section">
        <h3>存储内容预览</h3>
        <div class="content-list">
          <div
            v-for="(value, key) in storageContent"
            :key="key"
            class="content-item"
          >
            <div class="content-header">
              <span class="content-key">{{ key }}</span>
              <div class="content-actions">
                <button class="btn-view" @click="viewContent(key)">查看</button>
                <button class="btn-delete" @click="deleteContent(key)">
                  删除
                </button>
              </div>
            </div>
            <div class="content-preview">
              {{ formatValue(value) }}
            </div>
          </div>
          <div
            v-if="Object.keys(storageContent).length === 0"
            class="empty-content"
          >
            暂无存储内容
          </div>
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="actions-section">
        <h3>批量操作</h3>
        <div class="action-buttons">
          <button class="btn-clear" @click="clearAllStorage">
            🧹 清空所有存储
          </button>
          <button class="btn-export" @click="exportStorage">
            📥 导出存储数据
          </button>
          <button class="btn-import" @click="importStorage">
            📤 导入存储数据
          </button>
        </div>
      </div>
    </div>

    <!-- WebP图片优化 -->
    <div v-if="activeTab === 'webp'" class="tab-content">
      <h2>🖼️ WebP图片优化</h2>

      <!-- WebP支持检测 -->
      <div class="webp-support-section">
        <h3>WebP支持状态</h3>
        <div
          :class="[
            'webp-support-card',
            webpSupported ? 'supported' : 'unsupported',
          ]"
        >
          <div class="webp-icon">{{ webpSupported ? '✅' : '❌' }}</div>
          <div class="webp-text">
            <div class="webp-title">WebP格式支持</div>
            <div class="webp-desc">
              {{
                webpSupported
                  ? '当前浏览器支持WebP格式'
                  : '当前浏览器不支持WebP格式，将自动降级为原始格式'
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- 图片格式说明 -->
      <div class="format-info-section">
        <h3>图片格式说明</h3>
        <div class="format-grid">
          <div class="format-card">
            <div class="format-icon">🆕</div>
            <div class="format-name">WebP</div>
            <div class="format-desc">
              现代图片格式，比JPEG小25-35%，支持透明和动画
            </div>
          </div>
          <div class="format-card">
            <div class="format-icon">🖼️</div>
            <div class="format-name">JPEG/JPG</div>
            <div class="format-desc">传统图片格式，兼容性好，但文件较大</div>
          </div>
          <div class="format-card">
            <div class="format-icon">🎨</div>
            <div class="format-name">PNG</div>
            <div class="format-desc">支持透明的无损压缩格式，适合图标</div>
          </div>
        </div>
      </div>

      <!-- 图片资源统计 -->
      <div class="stats-section">
        <h3>图片资源统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">已加载图片</span>
            <span class="stat-value">{{ imageStats.loaded }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">WebP格式</span>
            <span class="stat-value">{{ imageStats.webp }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">原始格式</span>
            <span class="stat-value">{{ imageStats.original }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">懒加载延迟</span>
            <span class="stat-value">{{ imageStats.avgDelay }}ms</span>
          </div>
        </div>
      </div>

      <!-- 配置选项 -->
      <div class="config-options">
        <h3>配置选项</h3>
        <div class="option-row">
          <label class="option-label">
            <input v-model="webpConfig.preferWebP" type="checkbox" />
            <span>优先使用WebP格式</span>
          </label>
        </div>
        <div class="option-row">
          <label class="option-label">
            <input v-model="webpConfig.enableLazyLoad" type="checkbox" />
            <span>启用图片懒加载</span>
          </label>
        </div>
        <div class="option-row">
          <label class="option-label">
            懒加载阈值:
            <input
              v-model="webpConfig.threshold"
              type="number"
              min="0"
              max="500"
              style="margin-left: 8px; padding: 4px 8px"
            />
            px
          </label>
        </div>
        <button class="btn-save-config" @click="saveWebPConfig">
          保存配置
        </button>
      </div>
    </div>

    <!-- 系统信息 -->
    <div v-if="activeTab === 'system'" class="tab-content">
      <h2>🖥️ 系统信息</h2>

      <!-- 浏览器信息 -->
      <div class="info-section">
        <h3>浏览器信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">User Agent</span>
            <span class="info-value">{{ systemInfo.userAgent }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">语言</span>
            <span class="info-value">{{ systemInfo.language }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">平台</span>
            <span class="info-value">{{ systemInfo.platform }}</span>
          </div>
          <div class="info">
            <span class="info-label">Cookie启用</span>
            <span class="info-value">{{
              systemInfo.cookieEnabled ? '是' : '否'
            }}</span>
          </div>
        </div>
      </div>

      <!-- 屏幕信息 -->
      <div class="info-section">
        <h3>屏幕信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">分辨率</span>
            <span class="info-value"
              >{{ systemInfo.screenWidth }} ×
              {{ systemInfo.screenHeight }}</span
            >
          </div>
          <div class="info-item">
            <span class="info-label">视口大小</span>
            <span class="info-value"
              >{{ systemInfo.viewportWidth }} ×
              {{ systemInfo.viewportHeight }}</span
            >
          </div>
          <div class="info-item">
            <span class="info-label">像素比</span>
            <span class="info-value">{{ systemInfo.devicePixelRatio }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">色彩深度</span>
            <span class="info-value">{{ systemInfo.colorDepth }}位</span>
          </div>
        </div>
      </div>

      <!-- 存储支持 -->
      <div class="info-section">
        <h3>存储支持</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">LocalStorage</span>
            <span class="info-value">{{
              systemInfo.localStorage ? '✅ 支持' : '❌ 不支持'
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">SessionStorage</span>
            <span class="info-value">{{
              systemInfo.sessionStorage ? '✅ 支持' : '❌ 不支持'
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">IndexedDB</span>
            <span class="info-value">{{
              systemInfo.indexedDB ? '✅ 支持' : '❌ 不支持'
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">ServiceWorker</span>
            <span class="info-value">{{
              systemInfo.serviceWorker ? '✅ 支持' : '❌ 不支持'
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容查看弹窗 -->
    <div
      v-if="showViewModal"
      class="modal-overlay"
      @click.self="showViewModal = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>📄 内容详情</h3>
          <button class="modal-close" @click="showViewModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="view-key">{{ viewKey }}</div>
          <pre class="view-value">{{ viewValue }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToastStore } from '../../stores/toast';

const toastStore = useToastStore();

// Tab配置
const tabs = [
  { id: 'persistence', name: '状态持久化' },
  { id: 'webp', name: 'WebP优化' },
  { id: 'system', name: '系统信息' },
];
const activeTab = ref('persistence');

// 持久化配置
const persistenceConfig = ref({
  prefix: 'happyfarm_',
  expireTime: 604800000, // 7天
  persistedModules: ['player', 'farm', 'shop'],
});

// 存储信息
const storageInfo = ref({
  used: 0,
  total: 5120,
});

// 存储内容
const storageContent = ref({});

// WebP相关
const webpSupported = ref(false);
const webpConfig = ref({
  preferWebP: true,
  enableLazyLoad: true,
  threshold: 100,
});

const imageStats = ref({
  loaded: 0,
  webp: 0,
  original: 0,
  avgDelay: 0,
});

// 系统信息
const systemInfo = ref({});

// 弹窗
const showViewModal = ref(false);
const viewKey = ref('');
const viewValue = ref('');

/**
 * 检查WebP支持
 * @returns {Promise<boolean>} 是否支持WebP
 */
async function checkWebPSupport() {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webpSupported.value = webP.height === 2;
      resolve(webpSupported.value);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgIgoCAgIAgIA';
  });
}

/**
 * 收集系统信息
 * @returns {void} 无返回值
 */
function collectSystemInfo() {
  systemInfo.value = {
    userAgent: navigator.userAgent || 'N/A',
    language: navigator.language || 'N/A',
    platform: navigator.platform || 'N/A',
    cookieEnabled: navigator.cookieEnabled,
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    colorDepth: window.screen?.colorDepth || 0,
    localStorage: !!window.localStorage,
    sessionStorage: !!window.sessionStorage,
    indexedDB: !!window.indexedDB,
    serviceWorker: 'serviceWorker' in navigator,
  };
}

/**
 * 计算存储使用情况
 * @returns {void} 无返回值
 */
function calculateStorageUsage() {
  try {
    let totalSize = 0;
    const content = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(persistenceConfig.value.prefix)) {
        const value = localStorage.getItem(key);
        totalSize += key.length + (value?.length || 0);
        content[key] = value;
      }
    }

    storageInfo.value.used = Math.round(totalSize / 1024);
    storageContent.value = content;
  } catch (e) {
    console.error('计算存储使用情况失败', e);
  }
}

/**
 * 格式化过期时间
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化后的时间
 */
function formatExpireTime(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return `${days}天${hours > 0 ? ` ${hours}小时` : ''}`;
}

/**
 * 获取存储使用百分比
 */
const storageUsagePercent = computed(() => {
  return Math.min(
    Math.round((storageInfo.value.used / storageInfo.value.total) * 100),
    100
  );
});

/**
 * 获取存储状态样式
 * @param {number} percent - 百分比
 * @returns {string} 样式类名
 */
function getStorageClass(percent) {
  if (percent < 50) return 'normal';
  if (percent < 80) return 'warning';
  return 'danger';
}

/**
 * 格式化值显示
 * @param {any} value - 值
 * @returns {string} 格式化后的字符串
 */
function formatValue(value) {
  try {
    if (!value) return '空';
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2).substring(0, 500);
  } catch {
    return value.substring(0, 500);
  }
}

/**
 * 查看内容
 * @param {string} key - 键
 */
function viewContent(key) {
  viewKey.value = key;
  viewValue.value = formatValue(storageContent.value[key]);
  showViewModal.value = true;
}

/**
 * 删除内容
 * @param {string} key - 键
 */
function deleteContent(key) {
  if (confirm(`确定要删除 "${key}" 吗？`)) {
    localStorage.removeItem(key);
    calculateStorageUsage();
    toastStore.success('删除成功');
  }
}

/**
 * 清空所有存储
 */
function clearAllStorage() {
  if (confirm('确定要清空所有应用存储吗？这将清除所有持久化状态！')) {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(persistenceConfig.value.prefix)) {
        localStorage.removeItem(key);
      }
    }
    calculateStorageUsage();
    toastStore.success('存储已清空');
  }
}

/**
 * 导出存储
 */
function exportStorage() {
  const data = {
    timestamp: new Date().toISOString(),
    content: {},
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(persistenceConfig.value.prefix)) {
      data.content[key] = localStorage.getItem(key);
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `happy-farm-storage-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toastStore.success('导出成功');
}

/**
 * 导入存储
 */
function importStorage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.content) {
          Object.entries(data.content).forEach(([key, value]) => {
            if (key.startsWith(persistenceConfig.value.prefix)) {
              localStorage.setItem(key, value);
            }
          });
          calculateStorageUsage();
          toastStore.success('导入成功');
        }
      } catch {
        toastStore.error('导入失败：无效的文件格式');
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

/**
 * 保存WebP配置
 */
function saveWebPConfig() {
  localStorage.setItem(
    'happyfarm_webp_config',
    JSON.stringify(webpConfig.value)
  );
  toastStore.success('配置已保存');
}

/**
 * 加载WebP配置
 */
function loadWebPConfig() {
  try {
    const saved = localStorage.getItem('happyfarm_webp_config');
    if (saved) {
      webpConfig.value = { ...webpConfig.value, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('加载WebP配置失败', e);
  }
}

/**
 * 刷新状态
 */
function refreshState() {
  calculateStorageUsage();
  collectSystemInfo();
  toastStore.info('状态已刷新');
}

// 组件挂载
onMounted(async () => {
  await checkWebPSupport();
  collectSystemInfo();
  calculateStorageUsage();
  loadWebPConfig();
});
</script>

<style scoped>
.system-state-page {
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
}

/* Tabs */
.tabs-container {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-item {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #8c8c8c;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab-item:hover {
  color: #1890ff;
}

.tab-item.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-content h2 {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.tab-content h3 {
  margin: 24px 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #595959;
  border-left: 3px solid #1890ff;
  padding-left: 12px;
}

/* Config Section */
.config-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.config-label {
  font-size: 14px;
  color: #8c8c8c;
}

.config-value {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

/* Storage Section */
.storage-info {
  display: flex;
  justify-content: center;
}

.storage-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
}

.storage-title {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.storage-value {
  font-size: 32px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
}

.storage-bar {
  height: 20px;
  background: #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.storage-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.storage-fill.normal {
  background: #52c41a;
}

.storage-fill.warning {
  background: #faad14;
}

.storage-fill.danger {
  background: #ff4d4f;
}

.storage-footer {
  font-size: 12px;
  color: #8c8c8c;
}

/* Content List */
.content-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-item {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.content-key {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.btn-view,
.btn-delete {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.btn-view {
  background: #e6f7ff;
  color: #1890ff;
}

.btn-delete {
  background: #fff1f0;
  color: #ff4d4f;
}

.content-preview {
  font-size: 12px;
  color: #8c8c8c;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 100px;
  overflow: hidden;
}

.empty-content {
  text-align: center;
  color: #8c8c8c;
  padding: 40px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-clear,
.btn-export,
.btn-import {
  padding: 10px 20px;
  font-size: 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-clear {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-export {
  background: #f6ffed;
  color: #52c41a;
}

.btn-import {
  background: #e6f7ff;
  color: #1890ff;
}

/* WebP Section */
.webp-support-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.webp-support-card.supported {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.webp-support-card.unsupported {
  background: #fff1f0;
  border: 1px solid #ffa39e;
}

.webp-icon {
  font-size: 48px;
}

.webp-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.webp-desc {
  font-size: 14px;
  color: #595959;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.format-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.format-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.format-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
}

.format-desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

/* Config Options */
.option-row {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.option-row:last-of-type {
  border-bottom: none;
}

.option-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #262626;
}

.btn-save-config {
  margin-top: 16px;
  padding: 10px 24px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

/* System Info */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
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

/* Modal */
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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #8c8c8c;
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.view-key {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.view-value {
  background: #fafafa;
  border-radius: 6px;
  padding: 16px;
  font-size: 12px;
  color: #595959;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 400px;
  overflow: auto;
}
</style>
