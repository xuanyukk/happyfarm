/**
 * 文件名：DataImportExportPage.vue
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v1.0.0
 * 功能描述：批量数据导入/导出页面，支持CSV、JSON、Excel格式的数据导入导出
 * 更新记录：
 * 2026-05-26 - v1.0.0 - 初始版本创建
 */
<template>
  <div class="data-io-page">
    <div class="page-header">
      <h1>📁 数据导入/导出</h1>
    </div>

    <!-- 标签页切换 -->
    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'export' }"
        @click="activeTab = 'export'"
      >
        📤 数据导出
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'import' }"
        @click="activeTab = 'import'"
      >
        📥 数据导入
      </button>
    </div>

    <!-- ==================== 导出标签页 ==================== -->
    <div v-show="activeTab === 'export'" class="tab-content">
      <div class="section-card">
        <h3>导出配置</h3>

        <div class="form-grid">
          <!-- 表选择 -->
          <div class="form-group">
            <label>📋 选择数据表</label>
            <select v-model="exportForm.tableName" class="form-select">
              <option value="">-- 请选择数据表 --</option>
              <option v-for="tbl in tables" :key="tbl.name" :value="tbl.name">
                {{ tbl.name }} ({{ tbl.columnCount }} 列)
              </option>
            </select>
          </div>

          <!-- 格式选择 -->
          <div class="form-group">
            <label>📄 导出格式</label>
            <select v-model="exportForm.format" class="form-select">
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
              <option value="excel">Excel (.xlsx)</option>
            </select>
          </div>

          <!-- 字段选择 -->
          <div class="form-group">
            <label>🔍 选择字段（不选则导出全部）</label>
            <div class="checkbox-grid">
              <label
                v-for="field in availableFields"
                :key="field"
                class="checkbox-item"
              >
                <input
                  v-model="exportForm.fields"
                  type="checkbox"
                  :value="field"
                />
                <span>{{ field }}</span>
              </label>
            </div>
            <button
              v-if="availableFields.length > 0"
              class="btn-link"
              @click="toggleSelectAll"
            >
              {{
                exportForm.fields.length === availableFields.length
                  ? '取消全选'
                  : '全选'
              }}
            </button>
          </div>
        </div>

        <!-- 过滤条件（可选） -->
        <details class="filter-section">
          <summary>🔎 过滤条件（可选）</summary>
          <div class="filter-inputs">
            <div class="form-group">
              <label>过滤字段</label>
              <select v-model="exportFilter.key" class="form-select">
                <option value="">-- 选择字段 --</option>
                <option
                  v-for="field in availableFields"
                  :key="field"
                  :value="field"
                >
                  {{ field }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>过滤值</label>
              <input
                v-model="exportFilter.value"
                class="form-input"
                placeholder="输入过滤值"
              />
            </div>
          </div>
        </details>

        <div class="form-actions">
          <button
            class="btn btn-primary"
            :disabled="exporting"
            @click="startExport"
          >
            {{ exporting ? '⏳ 导出中...' : '📤 开始导出' }}
          </button>
        </div>
      </div>

      <!-- 导出进度 -->
      <div v-if="exportProgress" class="section-card">
        <h3>导出进度</h3>
        <div class="progress-info">
          <div class="progress-text">
            <span
              >状态：{{
                exportProgress.status === 'completed' ? '✅ 完成' : '🔄 处理中'
              }}</span
            >
            <span
              >{{ exportProgress.processed }} /
              {{ exportProgress.total }} 条</span
            >
          </div>
          <div class="progress-bar-container">
            <div
              class="progress-bar-fill"
              :style="{ width: exportPercent + '%' }"
              :class="{ completed: exportProgress.status === 'completed' }"
            ></div>
          </div>
          <div class="progress-percent">{{ exportPercent }}%</div>
        </div>
        <div v-if="exportProgress.status === 'completed'" class="download-area">
          <button class="btn btn-success" @click="downloadExportFile">
            💾 下载文件
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 导入标签页 ==================== -->
    <div v-show="activeTab === 'import'" class="tab-content">
      <div class="section-card">
        <h3>导入配置</h3>

        <div class="form-grid">
          <!-- 表选择 -->
          <div class="form-group">
            <label>📋 目标数据表</label>
            <select v-model="importForm.tableName" class="form-select">
              <option value="">-- 请选择数据表 --</option>
              <option v-for="tbl in tables" :key="tbl.name" :value="tbl.name">
                {{ tbl.name }} ({{ tbl.columnCount }} 列)
              </option>
            </select>
          </div>

          <!-- 导入模式 -->
          <div class="form-group">
            <label>⚙️ 导入模式</label>
            <select v-model="importForm.mode" class="form-select">
              <option value="insert">新增 (insert) - 仅插入新记录</option>
              <option value="upsert">更新或新增 (upsert) - 存在则更新</option>
            </select>
          </div>

          <!-- 文件上传 -->
          <div class="form-group">
            <label>📂 选择文件</label>
            <div class="upload-area">
              <input
                ref="fileInput"
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                class="file-input"
                @change="onFileSelected"
              />
              <div class="upload-hint">
                支持 CSV、JSON、Excel (.xlsx) 格式，最大 50MB
              </div>
            </div>
            <div v-if="uploadProgress.show" class="upload-progress">
              <div class="progress-bar-container">
                <div
                  class="progress-bar-fill"
                  :style="{ width: uploadProgress.percent + '%' }"
                ></div>
              </div>
              <span>{{ uploadProgress.percent }}%</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            class="btn btn-primary"
            :disabled="importing || !importFile"
            @click="startImport"
          >
            {{ importing ? '⏳ 导入中...' : '📥 开始导入' }}
          </button>
        </div>
      </div>

      <!-- 预览数据 -->
      <div v-if="previewData.length > 0" class="section-card">
        <h3>📋 数据预览（前10行）</h3>
        <div class="preview-table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th>#</th>
                <th v-for="col in previewColumns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewData" :key="idx">
                <td>{{ idx + 1 }}</td>
                <td v-for="col in previewColumns" :key="col">
                  {{ formatCellValue(row[col]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 导入进度 -->
      <div v-if="importProgress" class="section-card">
        <h3>导入进度</h3>
        <div class="progress-info">
          <div class="progress-text">
            <span>状态：{{ importStatusText }}</span>
            <span
              >{{ importProgress.processed }} /
              {{ importProgress.total }} 条</span
            >
          </div>
          <div class="progress-bar-container">
            <div
              class="progress-bar-fill"
              :style="{ width: importPercent + '%' }"
              :class="{
                completed: importProgress.status === 'completed',
                error: importProgress.skipped > 0,
              }"
            ></div>
          </div>
          <div class="progress-percent">{{ importPercent }}%</div>
        </div>
        <div class="import-stats">
          <div class="stat-item">
            <span class="stat-label">总计</span>
            <span class="stat-value">{{ importProgress.total }}</span>
          </div>
          <div class="stat-item success">
            <span class="stat-label">成功导入</span>
            <span class="stat-value">{{ importProgress.imported || 0 }}</span>
          </div>
          <div class="stat-item warning">
            <span class="stat-label">跳过</span>
            <span class="stat-value">{{ importProgress.skipped || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 错误详情 -->
      <div v-if="importErrors.length > 0" class="section-card error-card">
        <h3>⚠️ 导入错误详情 ({{ importErrors.length }} 条)</h3>
        <div class="errors-list">
          <div
            v-for="(err, idx) in displayErrors"
            :key="idx"
            class="error-item"
          >
            <div class="error-row">第 {{ err.row }} 行</div>
            <div class="error-msgs">
              <span
                v-for="(msg, eIdx) in err.errors"
                :key="eIdx"
                class="error-msg"
              >
                {{ msg }}
              </span>
            </div>
          </div>
        </div>
        <button
          v-if="importErrors.length > displayErrors.length"
          class="btn-link"
          @click="showAllErrors = !showAllErrors"
        >
          {{ showAllErrors ? '收起' : `显示全部 (${importErrors.length} 条)` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import adminService from '../../services/adminService';

const activeTab = ref('export');

const tables = ref([]);

const exportForm = ref({
  tableName: '',
  format: 'csv',
  fields: [],
});

const exportFilter = ref({ key: '', value: '' });

const exportProgress = ref(null);

const exporting = ref(false);

const exportTaskId = ref('');

let exportPollTimer = null;

const importForm = ref({
  tableName: '',
  mode: 'insert',
});

const importFile = ref(null);

const fileInput = ref(null);

const uploadProgress = ref({ show: false, percent: 0 });

const previewData = ref([]);

const previewColumns = ref([]);

const importProgress = ref(null);

const importErrors = ref([]);

const importing = ref(false);

const showAllErrors = ref(false);

const availableFields = computed(() => {
  const tbl = tables.value.find((t) => t.name === exportForm.value.tableName);
  if (!tbl) return [];
  return getUserFriendlyFields(tbl.name);
});

const exportPercent = computed(() => {
  if (!exportProgress.value || exportProgress.value.total === 0) return 0;
  return Math.round(
    (exportProgress.value.processed / exportProgress.value.total) * 100
  );
});

const importPercent = computed(() => {
  if (!importProgress.value || importProgress.value.total === 0) return 0;
  return Math.round(
    (importProgress.value.processed / importProgress.value.total) * 100
  );
});

const importStatusText = computed(() => {
  if (!importProgress.value) return '';
  const statusMap = {
    processing: '🔄 处理中',
    completed: '✅ 完成',
  };
  return statusMap[importProgress.value.status] || importProgress.value.status;
});

const displayErrors = computed(() => {
  if (showAllErrors.value) return importErrors.value;
  return importErrors.value.slice(0, 10);
});

function getUserFriendlyFields(tableName) {
  const fieldMap = {
    players: [
      'id',
      'username',
      'email',
      'level',
      'experience',
      'gold',
      'diamond',
      'created_at',
    ],
    crops: [
      'id',
      'name',
      'growth_time',
      'harvest_count',
      'price',
      'seed_price',
      'level_required',
    ],
    items: [
      'id',
      'name',
      'type',
      'price',
      'description',
      'effect_value',
      'rarity',
    ],
    shop_goods: [
      'id',
      'name',
      'type',
      'price',
      'currency_type',
      'stock',
      'created_at',
    ],
    player_base: [
      'id',
      'username',
      'email',
      'password_hash',
      'is_admin',
      'created_at',
      'updated_at',
    ],
    farm_land: [
      'id',
      'player_id',
      'land_index',
      'quality',
      'crop_id',
      'planted_at',
      'water_count',
    ],
    currency_config: [
      'id',
      'currency_type',
      'name',
      'exchange_rate',
      'min_amount',
      'max_amount',
    ],
    game_events: [
      'id',
      'name',
      'type',
      'start_time',
      'end_time',
      'reward_config',
      'status',
    ],
  };

  if (fieldMap[tableName]) return fieldMap[tableName];

  const tbl = tables.value.find((t) => t.name === tableName);
  if (tbl) {
    return Array.from({ length: tbl.columnCount }, (_, i) => `column_${i + 1}`);
  }
  return [];
}

function toggleSelectAll() {
  if (exportForm.value.fields.length === availableFields.value.length) {
    exportForm.value.fields = [];
  } else {
    exportForm.value.fields = [...availableFields.value];
  }
}

async function loadTables() {
  try {
    const result = await adminService.getBatchTables();
    if (result.success) {
      tables.value = result.data || [];
    }
  } catch (err) {
    console.error('加载表列表失败:', err);
  }
}

async function startExport() {
  if (!exportForm.value.tableName) {
    alert('请选择数据表');
    return;
  }

  exporting.value = true;
  exportProgress.value = null;

  try {
    const filters = {};
    if (exportFilter.value.key && exportFilter.value.value) {
      filters[exportFilter.value.key] = exportFilter.value.value;
    }

    const payload = {
      tableName: exportForm.value.tableName,
      format: exportForm.value.format,
      fields:
        exportForm.value.fields.length > 0
          ? exportForm.value.fields
          : undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };

    const result = await adminService.exportData(payload);

    if (result.success && result.data) {
      exportTaskId.value = result.data.taskId;
      pollExportProgress();
    } else {
      alert(`导出失败: ${result.message || '未知错误'}`);
      exporting.value = false;
    }
  } catch (err) {
    console.error('导出失败:', err);
    alert(`导出失败: ${err.message}`);
    exporting.value = false;
  }
}

function pollExportProgress() {
  if (exportPollTimer) clearInterval(exportPollTimer);

  exportPollTimer = setInterval(async () => {
    try {
      const result = await adminService.getExportProgress(exportTaskId.value);

      if (result.success) {
        exportProgress.value = result.data;

        if (result.data.status === 'completed') {
          clearInterval(exportPollTimer);
          exportPollTimer = null;
          exporting.value = false;
        }
      }
    } catch (err) {
      console.error('获取导出进度失败:', err);
    }
  }, 2000);
}

function downloadExportFile() {
  if (!exportTaskId.value) return;
  const apiBase = import.meta.env.VITE_API_URL || '';
  const url = `${apiBase}/api/batch/export/${exportTaskId.value}/download`;
  window.open(url, '_blank');
}

async function onFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  importFile.value = file;
  importErrors.value = [];

  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    previewCSV(file);
  } else if (ext === 'json') {
    previewJSON(file);
  } else {
    previewData.value = [];
    previewColumns.value = [];
  }
}

async function previewCSV(file) {
  try {
    const text = await file.text();
    const lines = text.trim().split('\n');
    if (lines.length === 0) return;

    const headers = parseCSVLine(lines[0]);
    previewColumns.value = headers;

    const rows = [];
    const limit = Math.min(lines.length - 1, 10);
    for (let i = 1; i <= limit; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
    previewData.value = rows;
  } catch (err) {
    console.error('CSV预览失败:', err);
    previewData.value = [];
    previewColumns.value = [];
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

async function previewJSON(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      previewData.value = [];
      previewColumns.value = [];
      return;
    }

    const limit = Math.min(data.length, 10);
    previewData.value = data.slice(0, limit);

    if (previewData.value.length > 0) {
      previewColumns.value = Object.keys(previewData.value[0]);
    }
  } catch (err) {
    console.error('JSON预览失败:', err);
    previewData.value = [];
    previewColumns.value = [];
  }
}

function formatCellValue(val) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

async function startImport() {
  if (!importFile.value || !importForm.value.tableName) {
    alert('请选择文件和目标数据表');
    return;
  }

  importing.value = true;
  importProgress.value = null;
  importErrors.value = [];

  try {
    const formData = new FormData();
    formData.append('file', importFile.value);
    formData.append('tableName', importForm.value.tableName);
    formData.append('mode', importForm.value.mode);

    const result = await adminService.importData(formData, (percent) => {
      uploadProgress.value = { show: true, percent };
    });

    if (result.success && result.data) {
      importProgress.value = {
        status: 'completed',
        total: result.data.total,
        processed: result.data.total,
        imported: result.data.imported,
        skipped: result.data.skipped,
      };

      if (result.data.errorCount > 0) {
        await fetchImportErrors(result.data.taskId);
      }

      importing.value = false;
    } else {
      alert(`导入失败: ${result.message || '未知错误'}`);
      importing.value = false;
    }
  } catch (err) {
    console.error('导入失败:', err);
    alert(`导入失败: ${err.message}`);
    importing.value = false;
  }
}

async function fetchImportErrors(taskId) {
  try {
    const result = await adminService.getImportErrors(taskId);
    if (result.success && result.data) {
      importErrors.value = result.data.errors || [];
    }
  } catch (err) {
    console.error('获取错误详情失败:', err);
  }
}

onMounted(() => {
  loadTables();
});
</script>

<style scoped>
.data-io-page {
  height: 100%;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
  color: #262626;
}

/* 标签页 */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  background: none;
  font-size: 15px;
  color: #595959;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.3s;
}

.tab-btn.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 600;
}

.tab-btn:hover {
  color: #1890ff;
}

/* 卡片 */
.section-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.section-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #262626;
}

/* 表单 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #595959;
}

.form-select,
.form-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #262626;
  transition: border-color 0.3s;
}

.form-select:focus,
.form-input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.checkbox-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #262626;
  cursor: pointer;
}

.btn-link {
  background: none;
  border: none;
  color: #1890ff;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}

.btn-link:hover {
  text-decoration: underline;
}

/* 过滤条件 */
.filter-section {
  margin-top: 16px;
}

.filter-section summary {
  cursor: pointer;
  font-size: 14px;
  color: #595959;
  padding: 4px 0;
}

.filter-inputs {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.filter-inputs .form-group {
  flex: 1;
}

/* 按钮 */
.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 8px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
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

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover {
  background: #73d13d;
}

.btn-secondary {
  background: #f0f0f0;
  color: #595959;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 上传区域 */
.upload-area {
  margin-top: 4px;
}

.file-input {
  display: block;
  width: 100%;
  padding: 8px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
}

.upload-hint {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 4px;
}

.upload-progress {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 进度条 */
.progress-info {
  margin-top: 12px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #595959;
  margin-bottom: 8px;
}

.progress-bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: #1890ff;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-bar-fill.completed {
  background: #52c41a;
}

.progress-bar-fill.error {
  background: #faad14;
}

.progress-percent {
  text-align: right;
  font-size: 13px;
  color: #595959;
  margin-top: 4px;
}

.download-area {
  margin-top: 16px;
  text-align: center;
}

/* 导入统计 */
.import-stats {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 6px;
  background: #fafafa;
}

.stat-item.success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.stat-item.warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
}

.stat-item.success .stat-value {
  color: #52c41a;
}

.stat-item.warning .stat-value {
  color: #faad14;
}

/* 预览表格 */
.preview-table-wrapper {
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.preview-table th,
.preview-table td {
  padding: 8px 12px;
  border: 1px solid #f0f0f0;
  text-align: left;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-table th {
  background: #fafafa;
  font-weight: 600;
  color: #262626;
  position: sticky;
  top: 0;
}

.preview-table tr:hover td {
  background: #f5f5f5;
}

/* 错误卡片 */
.error-card {
  border-left: 4px solid #ff4d4f;
}

.errors-list {
  max-height: 300px;
  overflow-y: auto;
}

.error-item {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.error-row {
  font-size: 13px;
  font-weight: 600;
  color: #ff4d4f;
}

.error-msgs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.error-msg {
  font-size: 12px;
  color: #595959;
  background: #fff2f0;
  padding: 2px 8px;
  border-radius: 3px;
}

/* 响应式 */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .filter-inputs {
    flex-direction: column;
  }

  .import-stats {
    flex-direction: column;
  }

  .preview-table th,
  .preview-table td {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>
