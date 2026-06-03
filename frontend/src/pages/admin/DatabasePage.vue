/** * 文件名：DatabasePage.vue * 作者：开发者 * 日期：2026-05-12 * 版本：v1.0.0
* 功能描述：数据库性能管理页面 - 展示索引统计、表大小、慢查询、缓存状态等 *
更新记录： * 2026-05-12 - v1.0.0 - 初始版本创建 */
<template>
  <div class="database-page">
    <div class="page-header">
      <h2>🗄️ 数据库性能管理</h2>
      <p>索引优化、表分析、缓存管理和数据库健康检查</p>
    </div>

    <div class="action-bar">
      <button
        class="btn btn-primary"
        :disabled="loading"
        @click="refreshAllData"
      >
        {{ loading ? '加载中...' : '🔄 刷新数据' }}
      </button>
      <button
        class="btn btn-danger"
        :disabled="loading"
        @click="clearQueryCache"
      >
        🗑️ 清除查询缓存
      </button>
    </div>

    <div v-if="healthData" class="health-summary">
      <div class="health-stat">
        <span class="health-icon">🟢</span>
        <span class="health-label">数据库状态</span>
        <span class="health-value">正常</span>
      </div>
      <div class="health-stat">
        <span class="health-icon">📊</span>
        <span class="health-label">索引总数</span>
        <span class="health-value">{{ healthData.indexes?.total || 0 }}</span>
      </div>
      <div class="health-stat">
        <span class="health-icon">⚠️</span>
        <span class="health-label">未使用索引</span>
        <span class="health-value warning">{{
          healthData.indexes?.unused || 0
        }}</span>
      </div>
      <div class="health-stat">
        <span class="health-icon">💾</span>
        <span class="health-label">缓存状态</span>
        <span
          class="health-value"
          :class="{ warning: !queryCacheStats?.enabled }"
        >
          {{ queryCacheStats?.enabled ? '✅ 启用' : '❌ 禁用' }}
        </span>
      </div>
    </div>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <div v-if="activeTab === 'indexes'" class="tab-content">
      <div class="panel">
        <div class="panel-header">
          <h3>📊 索引统计</h3>
          <p>按使用次数排序的索引列表</p>
        </div>
        <div class="panel-content">
          <div v-if="indexStats.length" class="table-container">
            <table>
              <thead>
                <tr>
                  <th>表名</th>
                  <th>索引名</th>
                  <th>扫描次数</th>
                  <th>元组读取</th>
                  <th>元组获取</th>
                  <th>大小</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(index, i) in indexStats" :key="i">
                  <td class="monospace">{{ index.tablename }}</td>
                  <td class="monospace">{{ index.indexname }}</td>
                  <td class="number">{{ index.idx_scan || 0 }}</td>
                  <td class="number">{{ index.idx_tup_read || 0 }}</td>
                  <td class="number">{{ index.idx_tup_fetch || 0 }}</td>
                  <td>{{ index.index_size || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">暂无索引数据</div>
        </div>
      </div>

      <div v-if="unusedIndexes.length" class="panel warning-panel">
        <div class="panel-header">
          <h3>⚠️ 未使用索引</h3>
          <p>这些索引从未被使用，可以考虑删除</p>
        </div>
        <div class="panel-content">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>表名</th>
                  <th>索引名</th>
                  <th>大小</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(index, i) in unusedIndexes" :key="i">
                  <td class="monospace">{{ index.tablename }}</td>
                  <td class="monospace">{{ index.indexname }}</td>
                  <td>{{ index.index_size || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'tables'" class="tab-content">
      <div class="panel">
        <div class="panel-header">
          <h3>📋 表大小统计</h3>
          <p>按总大小排序的所有表</p>
        </div>
        <div class="panel-content">
          <div v-if="tableSizes.length" class="table-container">
            <table>
              <thead>
                <tr>
                  <th>表名</th>
                  <th>总大小</th>
                  <th>表大小</th>
                  <th>索引大小</th>
                  <th>插入数</th>
                  <th>更新数</th>
                  <th>删除数</th>
                  <th>活元组</th>
                  <th>死元组</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(table, i) in tableSizes" :key="i">
                  <td class="monospace">{{ table.tablename }}</td>
                  <td>{{ table.total_size }}</td>
                  <td>{{ table.table_size }}</td>
                  <td>{{ table.index_size }}</td>
                  <td class="number">{{ table.n_tup_ins || 0 }}</td>
                  <td class="number">{{ table.n_tup_up || 0 }}</td>
                  <td class="number">{{ table.n_tup_del || 0 }}</td>
                  <td class="number">{{ table.n_live_tup || 0 }}</td>
                  <td class="number warning">{{ table.n_dead_tup || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">暂无表数据</div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'queries'" class="tab-content">
      <div class="panel">
        <div class="panel-header">
          <h3>🐢 慢查询统计</h3>
          <p>平均执行时间超过 100ms 的查询</p>
        </div>
        <div class="panel-content">
          <div v-if="slowQueries.length" class="table-container">
            <table>
              <thead>
                <tr>
                  <th>调用次数</th>
                  <th>总时间</th>
                  <th>平均时间</th>
                  <th>返回行数</th>
                  <th>查询语句</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(query, i) in slowQueries" :key="i">
                  <td class="number">{{ query.calls || 0 }}</td>
                  <td>{{ query.total_time }}ms</td>
                  <td class="warning">{{ query.mean_time }}ms</td>
                  <td class="number">{{ query.rows || 0 }}</td>
                  <td class="query-text">{{ query.query }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            暂无慢查询数据（需要 pg_stat_statements 扩展）
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'cache'" class="tab-content">
      <div class="panel">
        <div class="panel-header">
          <h3>💾 查询缓存状态</h3>
          <p>数据库查询缓存的统计信息</p>
        </div>
        <div class="panel-content">
          <div v-if="queryCacheStats" class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">缓存启用</span>
              <span
                class="stat-value"
                :class="{ success: queryCacheStats.enabled }"
              >
                {{ queryCacheStats.enabled ? '✅ 是' : '❌ 否' }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">缓存条目数</span>
              <span class="stat-value">{{ queryCacheStats.size || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最大容量</span>
              <span class="stat-value">{{
                queryCacheStats.maxSize || '-'
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3>🔧 缓存操作</h3>
        </div>
        <div class="panel-content">
          <button class="btn btn-danger" @click="clearQueryCache">
            🗑️ 清除所有查询缓存
          </button>
          <p class="help-text">
            清除缓存后，查询性能可能会暂时下降，但会提高数据一致性
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminService from '../../services/adminService';
import { useToastStore } from '../../stores/toast';
import { useLoadingStore } from '../../stores/loading';

const toastStore = useToastStore();
const loadingStore = useLoadingStore();

const loading = ref(false);
const activeTab = ref('indexes');

const healthData = ref(null);
const indexStats = ref([]);
const unusedIndexes = ref([]);
const tableSizes = ref([]);
const slowQueries = ref([]);
const queryCacheStats = ref(null);

const tabs = [
  { id: 'indexes', name: '索引管理', icon: '📊' },
  { id: 'tables', name: '表分析', icon: '📋' },
  { id: 'queries', name: '慢查询', icon: '🐢' },
  { id: 'cache', name: '缓存管理', icon: '💾' },
];

const refreshAllData = async () => {
  loading.value = true;
  try {
    loadingStore.startLoading('正在加载数据库数据...');

    const [healthRes, indexesRes, unusedRes, tablesRes, cacheRes] =
      await Promise.all([
        adminService.getDbHealth(),
        adminService.getDbIndexes(),
        adminService.getDbUnusedIndexes(),
        adminService.getDbTables(),
        adminService.getDbCacheStats(),
      ]);

    if (healthRes.success) {
      healthData.value = healthRes.data;
    }

    if (indexesRes.success) {
      indexStats.value = indexesRes.data || [];
    }

    if (unusedRes.success) {
      unusedIndexes.value = unusedRes.data || [];
    }

    if (tablesRes.success) {
      tableSizes.value = tablesRes.data || [];
    }

    if (cacheRes.success) {
      queryCacheStats.value = cacheRes.data;
    }

    toastStore.success('数据刷新成功');
  } catch (error) {
    console.error('获取数据库数据失败:', error);
    toastStore.error('获取数据库数据失败');
  } finally {
    loading.value = false;
    loadingStore.stopLoading();
  }
};

const clearQueryCache = async () => {
  if (!confirm('确定要清除所有查询缓存吗？')) return;

  try {
    loadingStore.startLoading('正在清除缓存...');
    const res = await adminService.clearDbCache();
    if (res.success) {
      toastStore.success('查询缓存已清除');
      await refreshAllData();
    }
  } catch (error) {
    console.error('清除缓存失败:', error);
    toastStore.error('清除缓存失败');
  } finally {
    loadingStore.stopLoading();
  }
};

onMounted(() => {
  refreshAllData();
});
</script>

<style scoped>
.database-page {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
}

.page-header p {
  margin: 0;
  color: #718096;
}

.action-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #096dd9;
}

.btn-danger {
  background: #fed7d7;
  color: #c53030;
}

.btn-danger:hover:not(:disabled) {
  background: #feb2b2;
}

.health-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.health-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  gap: 0.5rem;
}

.health-icon {
  font-size: 2rem;
}

.health-label {
  color: #718096;
  font-size: 0.875rem;
}

.health-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2d3748;
}

.health-value.warning {
  color: #fa8c16;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.tab-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #718096;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #1890ff;
}

.tab-button.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.warning-panel {
  border: 2px solid #faad14;
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel-header h3 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
}

.panel-header p {
  margin: 0;
  color: #718096;
  font-size: 0.875rem;
}

.panel-content {
  padding: 1.5rem;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  font-weight: 600;
  color: #4a5568;
  background: #f7fafc;
}

.monospace {
  font-family: monospace;
  font-size: 0.875rem;
}

.number {
  text-align: right;
  font-family: monospace;
}

.warning {
  color: #fa8c16;
}

.query-text {
  font-family: monospace;
  font-size: 0.75rem;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #718096;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 0.5rem;
}

.stat-label {
  color: #718096;
  font-size: 0.875rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-value.success {
  color: #52c41a;
}

.help-text {
  margin-top: 1rem;
  color: #718096;
  font-size: 0.875rem;
}
</style>
