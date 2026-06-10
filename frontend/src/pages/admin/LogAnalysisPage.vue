/**
 * 文件名：LogAnalysisPage.vue
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：日志分析与可视化页面
 * 更新记录：
 * 2026-05-06 - v1.0.0 - 初始版本创建
 */

<template>
  <div class="log-analysis-page">
    <h1 class="page-title">📊 日志分析与可视化</h1>

    <!-- 文件选择区域 -->
    <div class="file-select-section">
      <label for="log-file-select">选择日志文件：</label>
      <select
        id="log-file-select"
        v-model="selectedFile"
        class="form-select"
        @change="onFileSelect"
      >
        <option value="">请选择文件...</option>
        <option v-for="file in logFiles" :key="file.name" :value="file.name">
          {{ file.name }} ({{ file.sizeFormatted }},
          {{ formatDate(file.modified) }})
        </option>
      </select>
      <button
        class="btn btn-secondary"
        :disabled="loading"
        @click="refreshFiles"
      >
        刷新文件列表
      </button>
    </div>

    <!-- 过滤区域 -->
    <div v-if="selectedFile" class="filter-section">
      <h3>📋 过滤条件</h3>
      <div class="filter-grid">
        <div class="filter-item">
          <label>日志级别：</label>
          <select v-model="filters.level" class="form-select">
            <option value="">全部</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div class="filter-item">
          <label>搜索关键词：</label>
          <input
            v-model="filters.searchTerm"
            type="text"
            class="form-input"
            placeholder="输入关键词搜索..."
          />
        </div>

        <div class="filter-item">
          <label>开始日期：</label>
          <input
            v-model="filters.startDate"
            type="datetime-local"
            class="form-input"
          />
        </div>

        <div class="filter-item">
          <label>结束日期：</label>
          <input
            v-model="filters.endDate"
            type="datetime-local"
            class="form-input"
          />
        </div>

        <div class="filter-item">
          <label>显示行数：</label>
          <input
            v-model.number="filters.limit"
            type="number"
            min="10"
            max="1000"
            class="form-input"
          />
        </div>

        <div class="filter-item">
          <button class="btn btn-primary" :disabled="loading" @click="loadLogs">
            加载日志
          </button>
          <button
            class="btn btn-secondary"
            :disabled="loading"
            @click="exportLogs('json')"
          >
            导出 JSON
          </button>
          <button
            class="btn btn-secondary"
            :disabled="loading"
            @click="exportLogs('csv')"
          >
            导出 CSV
          </button>
        </div>
      </div>
    </div>

    <!-- 统计与分析区域 -->
    <div v-if="selectedFile && stats" class="stats-section">
      <div class="stats-cards">
        <div class="stat-card">
          <h4>📈 总日志数</h4>
          <p class="stat-value">{{ stats.total }}</p>
        </div>
        <div class="stat-card error-card">
          <h4>❌ 错误数</h4>
          <p class="stat-value">{{ stats.error }}</p>
        </div>
        <div class="stat-card warning-card">
          <h4>⚠️ 警告数</h4>
          <p class="stat-value">{{ stats.warn }}</p>
        </div>
        <div class="stat-card info-card">
          <h4>ℹ️ 信息数</h4>
          <p class="stat-value">{{ stats.info }}</p>
        </div>
      </div>

      <!-- 级别分布图表 -->
      <div class="chart-section">
        <h3>📊 日志级别分布</h3>
        <div class="chart-container">
          <div
            v-for="(count, level) in stats.byLevel"
            :key="level"
            :class="['level-bar', level]"
          >
            <div :style="{ width: (count / stats.total) * 100 + '%' }"></div>
            <span>{{ level }}: {{ count }}</span>
          </div>
        </div>
      </div>

      <!-- 错误分析 -->
      <div
        v-if="errorAnalysis && errorAnalysis.totalErrors > 0"
        class="error-analysis"
      >
        <h3>🔍 错误分析报告</h3>
        <p>总错误数：{{ errorAnalysis.totalErrors }}</p>
        <div class="top-errors">
          <h4>Top 10 常见错误：</h4>
          <ul>
            <li v-for="(error, index) in errorAnalysis.topErrors" :key="index">
              {{ error.message }} ({{ error.count }}次)
            </li>
          </ul>
        </div>
      </div>

      <!-- 性能统计 -->
      <div v-if="performanceStats" class="performance-stats">
        <h3>🚀 性能统计</h3>
        <div class="perf-cards">
          <div class="perf-card">
            <h5>平均响应时间</h5>
            <p class="perf-value">{{ performanceStats.avgResponseTime }} ms</p>
          </div>
          <div class="perf-card">
            <h5>最大响应时间</h5>
            <p class="perf-value">{{ performanceStats.maxResponseTime }} ms</p>
          </div>
          <div class="perf-card">
            <h5>最小响应时间</h5>
            <p class="perf-value">
              {{
                performanceStats.minResponseTime === Infinity
                  ? '-'
                  : performanceStats.minResponseTime + ' ms'
              }}
            </p>
          </div>
        </div>

        <div
          v-if="
            performanceStats.slowRequests &&
            performanceStats.slowRequests.length > 0
          "
          class="slow-requests"
        >
          <h5>⚠️ 慢速请求 ( >1s )</h5>
          <table class="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>方法</th>
                <th>端点</th>
                <th>响应时间</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(req, index) in performanceStats.slowRequests"
                :key="index"
              >
                <td>{{ formatDate(req.timestamp) }}</td>
                <td>{{ req.method }}</td>
                <td>{{ req.endpoint }}</td>
                <td class="slow">{{ req.responseTime }} ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 日志列表 -->
    <div v-if="selectedFile && logs.length > 0" class="logs-list">
      <h3>📝 日志列表</h3>
      <div class="logs-container">
        <div
          v-for="(log, index) in logs"
          :key="index"
          :class="['log-entry', log.level]"
        >
          <div class="log-meta">
            <span class="log-timestamp">{{ formatDate(log.timestamp) }}</span>
            <span :class="['log-level', log.level]">{{
              log.level?.toUpperCase()
            }}</span>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.metadata" class="log-metadata">
            <pre>{{ JSON.stringify(log.metadata, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import adminService from '../../services/adminService';

const logFiles = ref([]);
const selectedFile = ref('');
const logs = ref([]);
const stats = ref(null);
const errorAnalysis = ref(null);
const performanceStats = ref(null);
const loading = ref(false);

const filters = reactive({
  level: '',
  searchTerm: '',
  startDate: '',
  endDate: '',
  limit: 100,
});

// 获取日志文件列表
const refreshFiles = async () => {
  loading.value = true;
  try {
    const response = await adminService.getLogFiles();
    if (response.success) {
      logFiles.value = response.data;
    }
  } catch (error) {
    console.error('获取文件列表失败', error);
  } finally {
    loading.value = false;
  }
};

// 文件选择变化
const onFileSelect = async () => {
  if (selectedFile.value) {
    await Promise.all([
      loadLogs(),
      loadStats(),
      loadErrorAnalysis(),
      loadPerformanceStats(),
    ]);
  }
};

// 加载日志
const loadLogs = async () => {
  if (!selectedFile.value) return;

  loading.value = true;
  try {
    const response = await adminService.getLogFileContent(
      selectedFile.value,
      filters
    );
    if (response.success) {
      logs.value = response.data;
    }
  } catch (error) {
    console.error('加载日志失败', error);
  } finally {
    loading.value = false;
  }
};

// 加载统计
const loadStats = async () => {
  if (!selectedFile.value) return;

  try {
    const response = await adminService.getLogFileStats(selectedFile.value);
    if (response.success) {
      stats.value = response.data;
    }
  } catch (error) {
    console.error('加载统计失败', error);
  }
};

// 加载错误分析
const loadErrorAnalysis = async () => {
  if (!selectedFile.value) return;

  try {
    const response = await adminService.getLogFileErrors(selectedFile.value);
    if (response.success) {
      errorAnalysis.value = response.data;
    }
  } catch (error) {
    console.error('加载错误分析失败', error);
  }
};

// 加载性能统计
const loadPerformanceStats = async () => {
  if (!selectedFile.value) return;

  try {
    const response = await adminService.getLogFilePerformance(
      selectedFile.value
    );
    if (response.success) {
      performanceStats.value = response.data;
    }
  } catch (error) {
    console.error('加载性能统计失败', error);
  }
};

// 导出日志
const exportLogs = async (format) => {
  if (!selectedFile.value) return;

  loading.value = true;
  try {
    const response = await adminService.exportLogFile(selectedFile.value, {
      format,
      ...filters,
    });

    // 创建下载链接
    const url = window.URL.createObjectURL(response);
    const link = document.createElement('a');
    link.href = url;
    const extension = format === 'json' ? 'json' : 'csv';
    link.setAttribute(
      'download',
      `${selectedFile.value.replace('.log', '')}.${extension}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('导出失败', error);
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

onMounted(() => {
  refreshFiles();
});
</script>

<style scoped>
.log-analysis-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  margin-bottom: 24px;
  color: #333;
}

.file-select-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.form-select,
.form-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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

.btn-secondary {
  background: #607d8b;
  color: white;
}

.btn-secondary:hover {
  background: #546e7a;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-weight: 500;
  color: #555;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #2196f3;
}

.error-card {
  border-left-color: #f44336;
}

.warning-card {
  border-left-color: #ff9800;
}

.info-card {
  border-left-color: #4caf50;
}

.stat-card h4 {
  margin: 0 0 8px 0;
  color: #555;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.level-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-bar > div {
  height: 32px;
  background: #2196f3;
  border-radius: 4px;
  min-width: 4px;
}

.level-bar.error > div {
  background: #f44336;
}

.level-bar.warn > div {
  background: #ff9800;
}

.level-bar.info > div {
  background: #4caf50;
}

.level-bar.debug > div {
  background: #9e9e9e;
}

.error-analysis,
.performance-stats {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.top-errors ul {
  list-style: none;
  padding: 0;
}

.top-errors li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.perf-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.perf-card {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.perf-card h5 {
  margin: 0 0 8px 0;
  color: #666;
}

.perf-value {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #2196f3;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.slow {
  color: #f44336;
  font-weight: 600;
}

.logs-list {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logs-container {
  max-height: 600px;
  overflow-y: auto;
  margin-top: 16px;
}

.log-entry {
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #f8f9fa;
  border-left: 4px solid #607d8b;
}

.log-entry.error {
  background: #ffebee;
  border-left-color: #f44336;
}

.log-entry.warn {
  background: #fff3e0;
  border-left-color: #ff9800;
}

.log-entry.info {
  background: #e8f5e9;
  border-left-color: #4caf50;
}

.log-entry.debug {
  background: #eceff1;
  border-left-color: #9e9e9e;
}

.log-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.log-timestamp {
  color: #666;
  font-size: 13px;
}

.log-level {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.log-level.ERROR {
  background: #f44336;
  color: white;
}

.log-level.WARN {
  background: #ff9800;
  color: white;
}

.log-level.INFO {
  background: #4caf50;
  color: white;
}

.log-level.DEBUG {
  background: #9e9e9e;
  color: white;
}

.log-message {
  color: #333;
  line-height: 1.5;
}

.log-metadata {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.log-metadata pre {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
