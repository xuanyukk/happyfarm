/** * 文件名：GameEvents.vue * 作者：开发者 * 日期：2026-05-22 * 版本：v2.0.0 *
功能描述：游戏活动页面 - 展示和参与游戏活动 * 更新记录： * 2026-05-22 - v1.0.1 -
修复HTML实体编码问题 * 2026-05-22 - v2.0.0 -
完整重构：修复数据字段映射、添加状态计算、优化错误处理 */

<template>
  <div class="game-events-page">
    <div class="page-header">
      <h1>🎉 游戏活动</h1>
      <button class="btn-back" @click="goBack">返回农场</button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载活动中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <span class="error-icon">⚠️</span>
      <p class="error-text">{{ error }}</p>
      <button class="btn-retry" @click="fetchEvents">重试</button>
    </div>

    <div v-else class="events-content">
      <div class="events-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <div class="events-list">
        <div v-if="filteredEvents.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>
            暂无{{
              activeTab === 'active'
                ? '进行中'
                : activeTab === 'upcoming'
                  ? '即将开始'
                  : '已结束'
            }}的活动
          </p>
        </div>

        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="event-card glass"
        >
          <div class="event-header">
            <div class="event-title-section">
              <h3 class="event-title">{{ event.event_name }}</h3>
              <span class="event-badge" :class="getStatusClass(event.status)">
                {{ getStatusLabel(event.status) }}
              </span>
            </div>
            <div class="event-dates">
              <span class="date-item">
                <span class="date-icon">📅</span>
                开始：{{ formatDate(event.start_time) }}
              </span>
              <span v-if="event.end_time" class="date-item">
                <span class="date-icon">📅</span>
                结束：{{ formatDate(event.end_time) }}
              </span>
            </div>
          </div>

          <div class="event-description">
            {{ event.event_description || '暂无活动描述' }}
          </div>

          <div
            v-if="event.rewards && event.rewards.length > 0"
            class="event-rewards"
          >
            <h4>🎁 活动奖励</h4>
            <div class="rewards-list">
              <span
                v-for="(reward, index) in event.rewards"
                :key="index"
                class="reward-item"
              >
                {{ reward }}
              </span>
            </div>
          </div>

          <div class="event-footer">
            <button
              v-if="event.status === 'active'"
              class="btn btn-primary"
              @click="showEventDetail(event)"
            >
              查看详情
            </button>
            <button
              v-else-if="event.status === 'upcoming'"
              class="btn btn-secondary"
              disabled
            >
              即将开始
            </button>
            <button v-else class="btn btn-secondary" disabled>已结束</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动详情弹窗 -->
    <ActionModal v-model="showDetailModal" title="活动详情" :width="600">
      <div v-if="selectedEvent" class="event-detail">
        <div class="detail-section">
          <h4>📋 活动信息</h4>
          <p><strong>活动名称：</strong>{{ selectedEvent.event_name }}</p>
          <p>
            <strong>活动描述：</strong
            >{{ selectedEvent.event_description || '暂无描述' }}
          </p>
          <p>
            <strong>活动状态：</strong>
            <span :class="getStatusClass(selectedEvent.status)">
              {{ getStatusLabel(selectedEvent.status) }}
            </span>
          </p>
        </div>

        <div class="detail-section">
          <h4>📅 时间安排</h4>
          <p>
            <strong>开始时间：</strong
            >{{ formatDate(selectedEvent.start_time) }}
          </p>
          <p v-if="selectedEvent.end_time">
            <strong>结束时间：</strong>{{ formatDate(selectedEvent.end_time) }}
          </p>
        </div>

        <div v-if="selectedEvent.rules" class="detail-section">
          <h4>📜 活动规则</h4>
          <p>{{ selectedEvent.rules }}</p>
        </div>

        <div
          v-if="selectedEvent.rewards && selectedEvent.rewards.length > 0"
          class="detail-section"
        >
          <h4>🎁 活动奖励</h4>
          <ul class="rewards-detail">
            <li v-for="(reward, index) in selectedEvent.rewards" :key="index">
              {{ reward }}
            </li>
          </ul>
        </div>
      </div>
    </ActionModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ActionModal from '../components/ActionModal.vue';
import request from '../utils/request';
import { useToastStore } from '../stores/toast';

const router = useRouter();
const toastStore = useToastStore();

const loading = ref(true);
const error = ref(null);
const events = ref([]);
const activeTab = ref('active');
const showDetailModal = ref(false);
const selectedEvent = ref(null);

const tabs = [
  { value: 'active', label: '进行中', icon: '🔥' },
  { value: 'upcoming', label: '即将开始', icon: '⏰' },
  { value: 'ended', label: '已结束', icon: '📜' },
];

/**
 * 计算活动状态
 * @param {Object} event - 活动对象
 * @returns {string} 状态: 'upcoming' | 'active' | 'ended'
 */
function calculateEventStatus(event) {
  if (!event.is_active) {
    return 'ended';
  }

  const now = new Date();
  const startTime = new Date(event.start_time);
  const endTime = event.end_time ? new Date(event.end_time) : null;

  if (now < startTime) {
    return 'upcoming';
  }

  if (endTime && now > endTime) {
    return 'ended';
  }

  return 'active';
}

/**
 * 转换并增强活动数据
 * @param {Object} rawEvent - 原始活动数据
 * @returns {Object} 处理后的活动数据
 */
function transformEventData(rawEvent) {
  const status = calculateEventStatus(rawEvent);

  // 从 event_config 中提取奖励信息
  let rewards = [];
  if (rawEvent.event_config) {
    try {
      const config =
        typeof rawEvent.event_config === 'string'
          ? JSON.parse(rawEvent.event_config)
          : rawEvent.event_config;
      rewards = config.rewards || [];
    } catch (e) {
      console.warn('解析活动配置失败:', e);
    }
  }

  return {
    ...rawEvent,
    status,
    rewards,
    description: rawEvent.event_description,
  };
}

const filteredEvents = computed(() => {
  return events.value.filter((event) => event.status === activeTab.value);
});

async function fetchEvents() {
  try {
    loading.value = true;
    error.value = null;
    const response = await request.get('/game-events');
    if (response.data.success) {
      const rawEvents = response.data.data || [];
      events.value = rawEvents.map(transformEventData);
    } else {
      error.value = response.data.message || '加载活动失败';
    }
  } catch (err) {
    console.error('获取活动失败:', err);
    error.value = err.response?.data?.message || '网络错误，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function getStatusClass(status) {
  const classes = {
    active: 'status-active',
    upcoming: 'status-upcoming',
    ended: 'status-ended',
  };
  return classes[status] || 'status-default';
}

function getStatusLabel(status) {
  const labels = {
    active: '进行中',
    upcoming: '即将开始',
    ended: '已结束',
  };
  return labels[status] || '未知';
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showEventDetail(event) {
  selectedEvent.value = event;
  showDetailModal.value = true;
}

function goBack() {
  router.push('/');
}

onMounted(() => {
  fetchEvents();
});
</script>

<style scoped>
.game-events-page {
  min-height: 100vh;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0;
  font-size: 32px;
  color: var(--text-primary);
}

.btn-back,
.btn-retry {
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover,
.btn-retry:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.error-text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.error-icon {
  font-size: 48px;
}

.events-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--border-radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tab-btn.active {
  background: var(--primary-color);
  color: white;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.event-card {
  padding: 24px;
  border-radius: var(--border-radius-xl);
}

.event-header {
  margin-bottom: 16px;
}

.event-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.event-title {
  margin: 0;
  font-size: 22px;
  color: var(--text-primary);
}

.event-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.status-active {
  background: linear-gradient(135deg, var(--success-500), var(--success-600));
  color: white;
}

.status-upcoming {
  background: linear-gradient(135deg, var(--warning-500), var(--warning-600));
  color: white;
}

.status-ended {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.event-dates {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.date-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-icon {
  font-size: 14px;
}

.event-description {
  margin-bottom: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.event-rewards {
  margin-bottom: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.event-rewards h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-item {
  padding: 6px 14px;
  background: rgba(251, 191, 36, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  color: var(--gold-400);
  font-size: 13px;
}

.event-footer {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: not-allowed;
}

.btn-secondary:disabled {
  opacity: 0.6;
}

.event-detail {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.detail-section p {
  margin: 6px 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.rewards-detail {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
}

.rewards-detail li {
  margin: 6px 0;
}
</style>
