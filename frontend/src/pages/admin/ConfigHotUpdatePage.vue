/**
 * 文件名：ConfigHotUpdatePage.vue
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.1.0
 * 功能描述：配置热更新管理页面(含变更实时日志)
 * 更新记录：
 * 2026-05-06 - v1.0.0 - 初始版本创建
 * 2026-05-26 - v1.1.0 - 添加配置变更实时日志显示
 */

<template>
  <div class="config-hot-update-page">
    <div class="page-header">
      <h1 class="page-title">🔥 配置热更新管理</h1>
      <p class="page-description">实时管理游戏配置，无需重启服务</p>
    </div>

    <!-- 缓存状态卡片 -->
    <div class="cache-status-section">
      <h3>📊 缓存状态</h3>
      <div class="cache-cards">
        <div class="cache-card">
          <div class="cache-card-icon">💾</div>
          <div class="cache-card-content">
            <div class="cache-card-value">{{ cacheStatus.total }}</div>
            <div class="cache-card-label">缓存配置数</div>
          </div>
        </div>
        <div class="cache-card">
          <div class="cache-card-icon">🏷️</div>
          <div class="cache-card-content">
            <div class="cache-card-value">{{ cacheStatus.version }}</div>
            <div class="cache-card-label">缓存版本</div>
          </div>
        </div>
      </div>

      <!-- 缓存操作 -->
      <div class="cache-actions">
        <button
          class="btn btn-primary"
          :disabled="loading"
          @click="refreshCache('all')"
        >
          🔄 刷新全部缓存
        </button>
        <button
          class="btn btn-default"
          :disabled="loading"
          @click="loadCacheStatus"
        >
          🔄 刷新状态
        </button>
      </div>

      <!-- 最近更新 -->
      <div
        v-if="cacheStatus.lastUpdated && cacheStatus.lastUpdated.length > 0"
        class="last-updated"
      >
        <h4>⏰ 最近更新的配置</h4>
        <ul class="last-updated-list">
          <li v-for="(item, index) in cacheStatus.lastUpdated" :key="index">
            <span class="config-key">[{{ item.key }}]</span>
            <span class="config-time">{{ formatDate(item.time) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 批量编辑 -->
    <div class="batch-edit-section">
      <div class="section-header">
        <h3>📝 批量编辑</h3>
        <button class="btn btn-success" @click="showBatchEditModal = true">
          ➕ 添加批量修改
        </button>
      </div>

      <div v-if="batchUpdates.length > 0" class="batch-list">
        <div
          v-for="(update, index) in batchUpdates"
          :key="index"
          class="batch-item"
        >
          <div class="batch-item-info">
            <span class="config-key">[{{ update.key }}]</span>
            <span class="config-value">{{ update.value }}</span>
          </div>
          <button
            class="btn btn-sm btn-danger"
            @click="removeBatchUpdate(index)"
          >
            ✕
          </button>
        </div>
        <div class="batch-actions">
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="applyBatchUpdates"
          >
            ✅ 应用批量修改
          </button>
          <button class="btn btn-default" @click="clearBatchUpdates">
            🗑️ 清空
          </button>
        </div>
      </div>
    </div>

    <!-- 导入/导出 -->
    <div class="import-export-section">
      <h3>📦 导入/导出</h3>
      <div class="import-export-actions">
        <div class="import-area">
          <label class="import-label">
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileImport"
            />
            <div class="import-placeholder">
              <div class="import-icon">📁</div>
              <p>点击或拖拽上传 JSON 配置文件</p>
            </div>
          </label>
          <div class="import-options">
            <label>
              <input v-model="importOverride" type="checkbox" />
              覆盖已存在配置
            </label>
          </div>
        </div>
        <div class="export-area">
          <button
            class="btn btn-default"
            :disabled="loading"
            @click="exportConfigs"
          >
            📥 导出全部配置
          </button>
        </div>
      </div>
    </div>

    <!-- 快速缓存预览 -->
    <div class="cache-preview-section">
      <h3>👁️ 缓存预览</h3>
      <div class="cache-preview-controls">
        <input
          v-model="cachePreviewSearch"
          type="text"
          placeholder="搜索配置键..."
          class="form-control"
        />
      </div>
      <div v-if="cachedConfigs.length > 0" class="cache-preview-grid">
        <div
          v-for="config in filteredCachedConfigs"
          :key="config.key"
          class="cache-preview-item"
        >
          <div class="cache-preview-header">
            <span class="config-key">[{{ config.key }}]</span>
            <span class="config-name">{{ config.name }}</span>
          </div>
          <div class="cache-preview-value">
            <span class="value-label">值：</span>
            <span class="value-content">{{ config.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近变更日志 -->
    <div class="recent-changes-section">
      <div class="section-header">
        <h3>📜 最近配置变更日志</h3>
        <button
          class="btn btn-default"
          :disabled="loadingRecent"
          @click="loadRecentChanges"
        >
          🔄 刷新
        </button>
      </div>

      <div
        v-if="recentChanges.length === 0 && !loadingRecent"
        class="empty-state"
      >
        <p>📭 暂无变更日志</p>
      </div>

      <div v-else class="recent-changes-list">
        <div
          v-for="change in recentChanges"
          :key="change.id"
          class="recent-change-item"
        >
          <div class="recent-change-header">
            <span class="rc-key">[{{ change.config_key }}]</span>
            <span
              class="rc-type"
              :class="'rc-type-' + change.change_type.toLowerCase()"
              >{{ getChangeLabel(change.change_type) }}</span
            >
            <span class="rc-operator">{{
              change.operator_name || '系统'
            }}</span>
            <span class="rc-time">{{ formatTime(change.created_at) }}</span>
            <span class="rc-version">v{{ change.version }}</span>
          </div>
          <div v-if="change.change_reason" class="recent-change-reason">
            <span class="reason-label">原因：</span>{{ change.change_reason }}
          </div>
          <div
            v-if="change.changed_fields && change.changed_fields.length > 0"
            class="recent-change-fields"
          >
            <span
              v-for="field in change.changed_fields"
              :key="field"
              class="rc-field-tag"
              >{{ field }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 批量编辑弹窗 -->
    <div
      v-if="showBatchEditModal"
      class="modal-overlay"
      @click.self="showBatchEditModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h2>添加批量修改</h2>
          <button class="close-btn" @click="showBatchEditModal = false">
            ✕
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="addBatchUpdate">
            <div class="form-group">
              <label>选择配置</label>
              <select v-model="batchEditForm.key" class="form-control" required>
                <option value="">请选择配置...</option>
                <option
                  v-for="config in configs"
                  :key="config.key"
                  :value="config.key"
                  :disabled="config.is_readonly"
                >
                  [{{ config.key }}] {{ config.name }}
                  {{ config.is_readonly ? '(只读)' : '' }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>新值</label>
              <input
                v-model="batchEditForm.value"
                type="text"
                class="form-control"
                required
              />
            </div>
            <div class="form-group">
              <label>变更原因</label>
              <input
                v-model="batchEditForm.reason"
                type="text"
                class="form-control"
                placeholder="可选，说明变更原因"
              />
            </div>
            <div class="modal-actions">
              <button
                type="button"
                class="btn btn-default"
                @click="showBatchEditModal = false"
              >
                取消
              </button>
              <button type="submit" class="btn btn-primary">
                添加到批量列表
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminService from '../../services/adminService';

// 状态
const loading = ref(false);
const cacheStatus = ref({ total: 0, version: 0, lastUpdated: [] });
const cachedConfigs = ref([]);
const configs = ref([]);
const cachePreviewSearch = ref('');
const batchUpdates = ref([]);
const showBatchEditModal = ref(false);
const importOverride = ref(false);
const fileInput = ref(null);
const recentChanges = ref([]);
const loadingRecent = ref(false);

// 批量编辑表单
const batchEditForm = ref({
  key: '',
  value: '',
  reason: '',
});

// 计算属性
const filteredCachedConfigs = computed(() => {
  if (!cachePreviewSearch.value) {
    return cachedConfigs.value.slice(0, 50);
  }
  return cachedConfigs.value
    .filter(
      (c) =>
        c.key.toLowerCase().includes(cachePreviewSearch.value.toLowerCase()) ||
        c.name.toLowerCase().includes(cachePreviewSearch.value.toLowerCase())
    )
    .slice(0, 50);
});

// 方法
const loadCacheStatus = async () => {
  loading.value = true;
  try {
    const result = await adminService.getCacheStatus();
    if (result.success) {
      cacheStatus.value = result.data;
    }
  } catch (error) {
    console.error('加载缓存状态失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadConfigs = async () => {
  try {
    const result = await adminService.getConfigList();
    if (result.success) {
      configs.value = result.data;
    }
  } catch (error) {
    console.error('加载配置列表失败:', error);
  }
};

const loadCachedConfigs = async () => {
  try {
    const result = await adminService.getCachedConfigs();
    if (result.success) {
      cachedConfigs.value = result.data.configs;
    }
  } catch (error) {
    console.error('加载缓存配置失败:', error);
  }
};

const refreshCache = async (key) => {
  loading.value = true;
  try {
    const result = await adminService.refreshCache(key);
    if (result.success) {
      alert('缓存刷新成功！');
      await Promise.all([loadCacheStatus(), loadCachedConfigs()]);
    }
  } catch (error) {
    console.error('刷新缓存失败:', error);
    alert('刷新缓存失败');
  } finally {
    loading.value = false;
  }
};

const addBatchUpdate = () => {
  if (!batchEditForm.value.key || !batchEditForm.value.value) {
    alert('请填写完整信息');
    return;
  }

  batchUpdates.value.push({
    key: batchEditForm.value.key,
    value: batchEditForm.value.value,
    reason: batchEditForm.value.reason || '批量更新',
  });

  batchEditForm.value = { key: '', value: '', reason: '' };
  showBatchEditModal.value = false;
};

const removeBatchUpdate = (index) => {
  batchUpdates.value.splice(index, 1);
};

const clearBatchUpdates = () => {
  batchUpdates.value = [];
};

const applyBatchUpdates = async () => {
  if (batchUpdates.value.length === 0) {
    alert('请先添加批量修改');
    return;
  }

  if (!confirm(`确定要应用 ${batchUpdates.value.length} 个配置修改吗？`)) {
    return;
  }

  loading.value = true;
  try {
    const result = await adminService.batchUpdateConfigs(batchUpdates.value);

    if (result.success) {
      const results = result.data;
      const successCount = results.filter((r) => r.success).length;
      alert(
        `批量更新完成：成功 ${successCount} 个，失败 ${results.length - successCount} 个`
      );

      batchUpdates.value = [];
      await Promise.all([loadCacheStatus(), loadCachedConfigs()]);
    }
  } catch (error) {
    console.error('批量更新失败:', error);
    alert('批量更新失败');
  } finally {
    loading.value = false;
  }
};

const handleFileImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const configsData = JSON.parse(e.target.result);
      if (!Array.isArray(configsData)) {
        alert('请上传有效的配置数组');
        return;
      }

      if (!confirm(`确定要导入 ${configsData.length} 个配置吗？`)) {
        return;
      }

      loading.value = true;
      const result = await adminService.importConfigs(
        configsData,
        importOverride.value
      );

      if (result.success) {
        const results = result.data;
        const created = results.filter((r) => r.action === 'created').length;
        const updated = results.filter((r) => r.action === 'updated').length;
        alert(`导入完成：新增 ${created} 个，更新 ${updated} 个`);
        await Promise.all([
          loadCacheStatus(),
          loadCachedConfigs(),
          loadConfigs(),
        ]);
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入配置失败');
    } finally {
      loading.value = false;
    }
  };

  reader.readAsText(file);
};

const exportConfigs = async () => {
  try {
    const result = await adminService.exportConfigs();
    if (result.success) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `game_configs_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    }
  } catch (error) {
    console.error('导出失败:', error);
    alert('导出配置失败');
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const formatTime = (time) => {
  if (!time) return '';
  return new Date(time).toLocaleString('zh-CN');
};

const getChangeLabel = (type) => {
  const labels = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
    RESTORE: '回滚',
  };
  return labels[type] || type;
};

const loadRecentChanges = async () => {
  loadingRecent.value = true;
  try {
    const result = await adminService.getChangeStatistics();
    if (result.success && result.data) {
      recentChanges.value = result.data.recentChanges || [];
    }
  } catch (error) {
    console.error('加载最近变更失败:', error);
  } finally {
    loadingRecent.value = false;
  }
};

// 生命周期
onMounted(() => {
  Promise.all([
    loadCacheStatus(),
    loadConfigs(),
    loadCachedConfigs(),
    loadRecentChanges(),
  ]);
});
</script>

<style scoped>
.config-hot-update-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  margin: 0 0 8px 0;
  color: #333;
}

.page-description {
  color: #666;
  margin: 0;
}

.cache-status-section,
.batch-edit-section,
.import-export-section,
.cache-preview-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

h4 {
  margin: 16px 0 12px 0;
  color: #555;
  font-size: 14px;
}

.cache-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.cache-card {
  flex: 1;
  min-width: 200px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.cache-card-icon {
  font-size: 32px;
}

.cache-card-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.cache-card-label {
  color: #666;
  font-size: 14px;
}

.cache-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.last-updated-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.last-updated-list li {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.config-key {
  color: #666;
  font-family: monospace;
}

.config-time {
  color: #999;
  font-size: 13px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.batch-list {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.batch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
}

.batch-item-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.config-value {
  color: #333;
  background: #e8f4ff;
  padding: 4px 12px;
  border-radius: 4px;
  font-family: monospace;
}

.batch-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.import-export-actions {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.import-area {
  border: 2px dashed #ccc;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
}

.import-label {
  cursor: pointer;
  display: block;
}

.import-placeholder {
  margin-bottom: 16px;
}

.import-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.import-options {
  text-align: left;
  color: #666;
}

.export-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cache-preview-controls {
  margin-bottom: 16px;
}

.cache-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.cache-preview-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.cache-preview-header {
  margin-bottom: 8px;
}

.config-name {
  font-weight: 600;
  color: #333;
  margin-left: 8px;
}

.value-label {
  color: #666;
}

.value-content {
  font-family: monospace;
  color: #333;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-success {
  background: #2196f3;
  color: white;
}

.btn-success:hover {
  background: #1e87db;
}

.btn-default {
  background: #607d8b;
  color: white;
}

.btn-default:hover {
  background: #546e7a;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #da190b;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
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
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

/* 最近变更日志 */
.recent-changes-section {
  margin-top: 32px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #999;
}

.recent-changes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-change-item {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #d9d9d9;
  transition: background 0.2s;
}

.recent-change-item:hover {
  background: #f0f5ff;
}

.recent-change-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.rc-key {
  font-family: monospace;
  font-weight: 600;
  color: #555;
}

.rc-type {
  font-size: 13px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.rc-type-create {
  background: #f6ffed;
  color: #52c41a;
}

.rc-type-update {
  background: #e6f7ff;
  color: #1890ff;
}

.rc-type-delete {
  background: #fff2f0;
  color: #ff4d4f;
}

.rc-type-restore {
  background: #fff7e6;
  color: #fa8c16;
}

.rc-operator {
  color: #888;
  font-size: 13px;
}

.rc-time {
  color: #aaa;
  font-size: 13px;
  margin-left: auto;
}

.rc-version {
  font-family: monospace;
  background: #e8e8e8;
  color: #555;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.recent-change-reason {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.reason-label {
  font-weight: 500;
  color: #888;
}

.recent-change-fields {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.rc-field-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-family: monospace;
}
</style>
