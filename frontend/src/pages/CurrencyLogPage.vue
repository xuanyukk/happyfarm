/** * 文件名：CurrencyLogPage.vue * 作者：开发者 * 日期：2026-03-22 *
版本：v2.0.0 * 功能描述：货币流水页面 - 收入支出统计、交易记录查看 * 更新记录：
* 2026-03-22 - v1.4.0 -
完全重写，添加统计卡片、筛选器、改进的分页；优化显示内容，添加时间和余额说明；显示具体交易物品信息；优化字体颜色和余额显示，提升可读性
* 2026-05-02 - v2.0.0 - 添加虚拟滚动支持，提升大量记录的性能 */
<template>
  <div class="currency-log-page">
    <header class="header glass">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>
      <div class="header-title">
        <span class="title-icon">📊</span>
        <h1>货币流水</h1>
      </div>
      <div class="header-spacer"></div>
    </header>

    <main class="main">
      <div class="stats-section">
        <div class="stat-card card" :class="'earnings'">
          <div class="stat-icon">📈</div>
          <h3>收入统计</h3>
          <div v-if="earningsStats" class="stat-value">
            <p class="stat-item">
              <span class="stat-label">交易次数</span>
              <span class="stat-number">{{
                earningsStats.transaction_count || 0
              }}</span>
            </p>
            <p class="stat-item">
              <span class="stat-label">总收入</span>
              <span class="stat-number highlight"
                >💰 {{ earningsStats.total_earnings || 0 }}</span
              >
            </p>
            <p class="stat-item">
              <span class="stat-label">平均收入</span>
              <span class="stat-number">{{
                Math.round(earningsStats.avg_earnings || 0)
              }}</span>
            </p>
          </div>
          <div v-else class="stat-loading">
            <div class="loading-spinner-small"></div>
          </div>
        </div>
        <div class="stat-card card" :class="'spendings'">
          <div class="stat-icon">📉</div>
          <h3>支出统计</h3>
          <div v-if="spendingsStats" class="stat-value">
            <p class="stat-item">
              <span class="stat-label">交易次数</span>
              <span class="stat-number">{{
                spendingsStats.transaction_count || 0
              }}</span>
            </p>
            <p class="stat-item">
              <span class="stat-label">总支出</span>
              <span class="stat-number highlight"
                >💰 {{ spendingsStats.total_spendings || 0 }}</span
              >
            </p>
            <p class="stat-item">
              <span class="stat-label">平均支出</span>
              <span class="stat-number">{{
                Math.round(spendingsStats.avg_spending || 0)
              }}</span>
            </p>
          </div>
          <div v-else class="stat-loading">
            <div class="loading-spinner-small"></div>
          </div>
        </div>
      </div>

      <div class="render-mode-selector">
        <span class="mode-label">渲染模式：</span>
        <div class="mode-buttons">
          <button
            v-for="mode in renderModes"
            :key="mode.value"
            class="mode-button"
            :class="{ active: renderMode === mode.value }"
            @click="renderMode = mode.value"
          >
            {{ mode.icon }} {{ mode.label }}
          </button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-label">
          <span class="filter-icon">🔍</span>
          <span>筛选类型</span>
        </div>
        <select
          v-model="changeTypeFilter"
          class="filter-select"
          @change="loadLogs"
        >
          <option value="">全部记录</option>
          <option value="earn">仅收入</option>
          <option value="spend">仅支出</option>
        </select>
      </div>

      <div class="logs-container">
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">正在加载记录...</p>
        </div>

        <div v-else-if="renderMode === 'traditional'" class="traditional-view">
          <div v-if="logs.length > 0" class="logs-list">
            <div
              v-for="log in logs"
              :key="log.id"
              class="log-item card"
              :class="log.change_type"
            >
              <div class="log-icon">
                <span v-if="log.change_type === 'earn'">📥</span>
                <span v-else>📤</span>
              </div>
              <div class="log-content">
                <div class="log-header">
                  <span class="log-type" :class="log.change_type">
                    {{ log.change_type === 'earn' ? '+' : '-' }}
                  </span>
                  <span class="log-reason">{{ formatReason(log.reason) }}</span>
                </div>
                <div v-if="log.item_name" class="log-item-info">
                  <span class="item-label">📦 物品：</span>
                  <span class="item-name">{{ log.item_name }}</span>
                </div>
                <div class="log-details">
                  <span class="log-amount" :class="log.change_type">
                    {{ log.change_type === 'earn' ? '+' : '-'
                    }}{{ log.amount }} 💰
                  </span>
                  <span class="log-balance">
                    <span class="balance-label">余额</span>
                    <strong>{{ log.balance_after }} 💰</strong>
                  </span>
                </div>
                <div class="log-time">
                  <span class="time-icon">🕐</span>
                  <span>{{ formatTime(log.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon">📋</span>
            <p>暂无交易记录</p>
          </div>

          <div v-if="totalPages > 1" class="pagination">
            <button
              :disabled="currentPage === 1"
              class="page-btn btn-secondary"
              @click="prevPage"
            >
              <span>←</span>
              上一页
            </button>
            <span class="page-info">
              <span class="current-page">{{ currentPage }}</span>
              <span class="page-separator">/</span>
              <span class="total-pages">{{ totalPages }}</span>
            </span>
            <button
              :disabled="currentPage === totalPages"
              class="page-btn btn-primary"
              @click="nextPage"
            >
              下一页
              <span>→</span>
            </button>
          </div>
        </div>

        <div v-else ref="logsScrollRef" class="virtual-view">
          <div
            v-if="allLogs.length > 0"
            class="virtual-scroll-wrapper"
            @scroll="handleVirtualScroll"
          >
            <div
              class="scroll-placeholder-top"
              :style="{ height: virtualScrollData.offset + 'px' }"
            ></div>
            <div
              v-for="(log, index) in visibleLogs"
              :key="log.id"
              class="log-item card"
              :class="log.change_type"
            >
              <div class="log-icon">
                <span v-if="log.change_type === 'earn'">📥</span>
                <span v-else>📤</span>
              </div>
              <div class="log-content">
                <div class="log-header">
                  <span class="log-type" :class="log.change_type">
                    {{ log.change_type === 'earn' ? '+' : '-' }}
                  </span>
                  <span class="log-reason">{{ formatReason(log.reason) }}</span>
                </div>
                <div v-if="log.item_name" class="log-item-info">
                  <span class="item-label">📦 物品：</span>
                  <span class="item-name">{{ log.item_name }}</span>
                </div>
                <div class="log-details">
                  <span class="log-amount" :class="log.change_type">
                    {{ log.change_type === 'earn' ? '+' : '-'
                    }}{{ log.amount }} 💰
                  </span>
                  <span class="log-balance">
                    <span class="balance-label">余额</span>
                    <strong>{{ log.balance_after }} 💰</strong>
                  </span>
                </div>
                <div class="log-time">
                  <span class="time-icon">🕐</span>
                  <span>{{ formatTime(log.created_at) }}</span>
                </div>
              </div>
            </div>
            <div
              class="scroll-placeholder-bottom"
              :style="{ height: virtualScrollData.placeholderBottom + 'px' }"
            ></div>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon">📋</span>
            <p>暂无交易记录</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { gameService } from '../services/gameService';

const router = useRouter();
const logs = ref([]);
const allLogs = ref([]);
const earningsStats = ref(null);
const spendingsStats = ref(null);
const currentPage = ref(1);
const totalPages = ref(1);
const totalLogs = ref(0);
const changeTypeFilter = ref('');
const loading = ref(false);
const renderMode = ref('virtual');
const logsScrollRef = ref(null);

const renderModes = [
  { value: 'traditional', label: '分页模式', icon: '📄' },
  { value: 'virtual', label: '虚拟滚动', icon: '⚡' },
];

const ITEM_HEIGHT = 220;
const BUFFER_SIZE = 5;

const virtualScrollData = reactive({
  scrollTop: 0,
  offset: 0,
  placeholderBottom: 0,
  startIndex: 0,
  endIndex: 0,
});

const visibleLogs = computed(() => {
  return allLogs.value.slice(
    virtualScrollData.startIndex,
    virtualScrollData.endIndex
  );
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const result = await gameService.getCurrencyLogs(
      currentPage.value,
      renderMode.value === 'virtual' ? 1000 : 20,
      changeTypeFilter.value || null
    );
    if (renderMode.value === 'virtual') {
      allLogs.value = result.data.logs;
      totalLogs.value = result.data.total || result.data.logs.length;
    } else {
      logs.value = result.data.logs;
      totalPages.value = result.data.totalPages;
    }
  } catch (error) {
    console.error('加载流水失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadAllLogs = async () => {
  loading.value = true;
  try {
    const result = await gameService.getCurrencyLogs(
      1,
      1000,
      changeTypeFilter.value || null
    );
    allLogs.value = result.data.logs;
    totalLogs.value = result.data.total || result.data.logs.length;
  } catch (error) {
    console.error('加载全部流水失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const [earnings, spendings] = await Promise.all([
      gameService.getEarningsStats(),
      gameService.getSpendingsStats(),
    ]);
    earningsStats.value = earnings.data;
    spendingsStats.value = spendings.data;
  } catch (error) {
    console.error('加载统计失败:', error);
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadLogs();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadLogs();
  }
};

const initVirtualScroll = () => {
  nextTick(() => {
    if (logsScrollRef.value) {
      const wrapper = logsScrollRef.value.querySelector(
        '.virtual-scroll-wrapper'
      );
      if (wrapper) {
        const containerHeight = wrapper.clientHeight;
        const visibleCount =
          Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2;
        virtualScrollData.startIndex = 0;
        virtualScrollData.endIndex = Math.min(
          visibleCount,
          allLogs.value.length
        );
        virtualScrollData.offset = 0;
        virtualScrollData.placeholderBottom = Math.max(
          0,
          (allLogs.value.length - visibleCount) * ITEM_HEIGHT
        );
      }
    }
  });
};

const handleVirtualScroll = (event) => {
  const scrollTop = event.target.scrollTop;
  virtualScrollData.scrollTop = scrollTop;

  const containerHeight = event.target.clientHeight;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE
  );
  const visibleCount =
    Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2;
  const endIndex = Math.min(startIndex + visibleCount, allLogs.value.length);

  virtualScrollData.startIndex = startIndex;
  virtualScrollData.endIndex = endIndex;
  virtualScrollData.offset = startIndex * ITEM_HEIGHT;
  virtualScrollData.placeholderBottom = Math.max(
    0,
    (allLogs.value.length - endIndex) * ITEM_HEIGHT
  );
};

const formatReason = (reason) => {
  const reasonMap = {
    crop_sell: '出售作物',
    shop_buy: '商店购买',
    land_unlock: '解锁地块',
    quality_upgrade: '提升品质',
    quest_reward: '任务奖励',
    daily_login: '每日登录',
    admin_give: '系统发放',
  };
  return reasonMap[reason] || reason;
};

const formatTime = (time) => {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const goBack = () => {
  router.push('/');
};

watch(renderMode, (newMode) => {
  if (newMode === 'virtual') {
    loadAllLogs();
  } else {
    currentPage.value = 1;
    loadLogs();
  }
});

watch(
  () => changeTypeFilter.value,
  () => {
    if (renderMode.value === 'virtual') {
      loadAllLogs();
    } else {
      currentPage.value = 1;
      loadLogs();
    }
  }
);

watch(
  () => allLogs.value,
  () => {
    if (renderMode.value === 'virtual') {
      initVirtualScroll();
    }
  },
  { deep: true }
);

onMounted(() => {
  if (renderMode.value === 'virtual') {
    loadAllLogs();
  } else {
    loadLogs();
  }
  loadStats();
});
</script>

<style scoped>
.currency-log-page {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-radius: var(--border-radius-xl);
  animation: fadeIn 0.5s ease;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(-4px);
}

.back-icon {
  font-size: 18px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 28px;
  animation: float 3s ease-in-out infinite;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.header-spacer {
  width: 100px;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeInUp 0.5s ease;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.stat-card.earnings::before {
  background: linear-gradient(90deg, var(--success-500), var(--success-400));
}

.stat-card.spendings::before {
  background: linear-gradient(90deg, var(--error-500), var(--error-400));
}

.stat-icon {
  font-size: 40px;
  margin-bottom: 12px;
  animation: float 3s ease-in-out infinite;
}

.stat-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-value {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--glass-border);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.stat-number.highlight {
  font-size: 24px;
  color: #fbbf24;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
}

.stat-loading {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.loading-spinner-small {
  width: 24px;
  height: 24px;
  border: 2px solid var(--glass-border);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.render-mode-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.mode-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.mode-buttons {
  display: flex;
  gap: 8px;
}

.mode-button {
  padding: 8px 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mode-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mode-button.active {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  font-weight: 600;
  border-color: transparent;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.filter-icon {
  font-size: 16px;
}

.filter-select {
  padding: 10px 16px;
  border: 2px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.filter-select:hover {
  border-color: var(--primary-500);
}

.filter-select:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.logs-container {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  animation: fadeIn 0.5s ease;
}

.loading-text {
  font-size: 16px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.traditional-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.virtual-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 450px);
  overflow: hidden;
}

.virtual-scroll-wrapper {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.scroll-placeholder-top,
.scroll-placeholder-bottom {
  width: 100%;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  align-items: flex-start;
  animation: fadeIn 0.3s ease;
}

.log-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-type {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.log-type.earn {
  color: var(--success-600);
}

.log-type.spend {
  color: var(--error-600);
}

.log-reason {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.log-item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: var(--border-radius-md);
  margin-top: 10px;
}

.item-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.item-name {
  font-size: 15px;
  color: #818cf8;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.log-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.log-amount {
  font-size: 22px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.log-amount.earn {
  color: #22c55e;
}

.log-amount.spend {
  color: #ef4444;
}

.log-balance {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: var(--border-radius-md);
}

.balance-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
}

.log-balance strong {
  color: #fbbf24;
  font-weight: 700;
  font-size: 18px;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

.log-time {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 255, 255, 0.15);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.time-icon {
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
}

.page-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: white;
  font-weight: 600;
}

.current-page {
  font-size: 20px;
  color: var(--gold-500);
}

.page-separator {
  color: rgba(255, 255, 255, 0.5);
}

.total-pages {
  color: rgba(255, 255, 255, 0.8);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .currency-log-page {
    padding: 12px;
  }

  .header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }

  .header-title {
    order: -1;
  }

  .header-spacer {
    display: none;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
  }

  .log-item {
    padding: 16px;
  }

  .pagination {
    flex-wrap: wrap;
    gap: 12px;
  }

  .page-btn {
    padding: 10px 16px;
    font-size: 13px;
  }

  .virtual-view {
    height: calc(100vh - 500px);
  }
}
</style>
