/**
 * 文件名：TaskPage.vue
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：每日任务页面 - 展示每日任务列表、进度追踪、奖励领取
 * 更新记录：
 * 2026-05-31 - v1.0.0 - LG-02修复：初始版本创建
 */

<template>
  <div class="task-page">
    <header class="task-header">
      <button class="back-btn" @click="goBack">&larr; 返回农场</button>
      <h1>每日任务</h1>
      <div class="task-summary">
        <span class="summary-text">
          已完成 {{ completedCount }}/{{ tasks.length }}
        </span>
      </div>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载任务中...</p>
    </div>

    <div v-else-if="tasks.length === 0" class="empty">
      <span class="empty-icon">📋</span>
      <p>暂无可用任务</p>
      <p class="empty-hint">提升等级后可解锁更多任务</p>
    </div>

    <div v-else class="task-list">
      <div
        v-for="task in sortedTasks"
        :key="task.taskId"
        class="task-card"
        :class="{
          'task-completed': task.isCompleted && !task.isClaimed,
          'task-claimed': task.isClaimed,
        }"
      >
        <div class="task-info">
          <div class="task-header-row">
            <span class="task-category-badge">{{
              categoryLabel(task.taskCategory)
            }}</span>
            <span class="task-name">{{ task.taskName }}</span>
          </div>
          <p class="task-desc">{{ task.taskDescription }}</p>

          <div class="progress-bar-container">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: progressPercent(task) + '%' }"
                :class="task.isCompleted ? 'fill-completed' : ''"
              ></div>
            </div>
            <span class="progress-text">
              {{ task.progress }}/{{ task.targetCount }}
            </span>
          </div>
        </div>

        <div class="task-rewards">
          <div v-if="task.rewardExp > 0" class="reward-item">
            <span class="reward-icon">⭐</span>
            <span class="reward-value">{{ task.rewardExp }}</span>
          </div>
          <div v-if="task.rewardGold > 0" class="reward-item">
            <span class="reward-icon">🪙</span>
            <span class="reward-value">{{ task.rewardGold }}</span>
          </div>
          <div v-if="task.rewardGems > 0" class="reward-item">
            <span class="reward-icon">💎</span>
            <span class="reward-value">{{ task.rewardGems }}</span>
          </div>
          <div
            v-for="(item, idx) in task.rewardItems || []"
            :key="idx"
            class="reward-item"
          >
            <span class="reward-icon">🎁</span>
            <span class="reward-value">道具x{{ item.count }}</span>
          </div>
        </div>

        <div class="task-action">
          <button v-if="task.isClaimed" class="btn btn-claimed" disabled>
            ✓ 已领取
          </button>
          <button
            v-else-if="task.isCompleted"
            class="btn btn-claim"
            :disabled="claiming === task.taskId"
            @click="claimReward(task)"
          >
            {{ claiming === task.taskId ? '领取中...' : '领取奖励' }}
          </button>
          <button v-else class="btn btn-progress" disabled>进行中</button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import api from '../utils/request';

const router = useRouter();
const playerStore = usePlayerStore();

const tasks = ref([]);
const loading = ref(true);
const claiming = ref(null);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

const completedCount = computed(() => {
  return tasks.value.filter((t) => t.isCompleted).length;
});

const sortedTasks = computed(() => {
  return [...tasks.value].sort((a, b) => {
    if (a.isClaimed !== b.isClaimed) return a.isClaimed ? 1 : -1;
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });
});

const categoryLabel = (category) => {
  const labels = {
    plant: '种植',
    harvest: '收获',
    sell: '出售',
    use_item: '道具',
    water: '浇水',
    fertilize: '施肥',
    login: '登录',
    stamina: '体力',
  };
  return labels[category] || category;
};

const progressPercent = (task) => {
  if (task.targetCount <= 0) return 0;
  return Math.min(100, Math.round((task.progress / task.targetCount) * 100));
};

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

const fetchTasks = async () => {
  loading.value = true;
  try {
    const response = await api.get('/api/daily-tasks');
    tasks.value = response.data.data || [];
  } catch (error) {
    showToastMessage('获取每日任务失败', 'error');
  } finally {
    loading.value = false;
  }
};

const claimReward = async (task) => {
  claiming.value = task.taskId;
  try {
    const response = await api.post(`/api/daily-tasks/${task.taskId}/claim`);
    if (response.data.success) {
      const reward = response.data.data.reward;
      task.isClaimed = true;
      let msg = `领取成功！获得 ${reward.exp}经验、${reward.gold}金币`;
      if (reward.gems > 0) msg += `、${reward.gems}宝石`;
      showToastMessage(msg);
      await playerStore.updatePlayerInfo();
    }
  } catch (error) {
    showToastMessage(error.response?.data?.message || '领取失败', 'error');
  } finally {
    claiming.value = null;
  }
};

const goBack = () => {
  router.push('/');
};

onMounted(() => {
  fetchTasks();
});
</script>

<style scoped>
.task-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e0e0e0;
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.task-header h1 {
  font-size: 28px;
  margin: 0;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.task-summary {
  margin-left: auto;
}

.summary-text {
  font-size: 16px;
  color: #aaa;
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 16px;
  border-radius: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #aaa;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty {
  text-align: center;
  padding: 60px;
  color: #888;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
}

.task-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  transition: all 0.3s;
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.task-completed {
  border-color: rgba(76, 175, 80, 0.5);
  background: rgba(76, 175, 80, 0.08);
}

.task-claimed {
  opacity: 0.6;
}

.task-info {
  flex: 1;
  min-width: 200px;
}

.task-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.task-category-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  white-space: nowrap;
}

.task-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.task-desc {
  font-size: 13px;
  color: #999;
  margin: 0 0 10px 0;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90d9, #357abd);
  border-radius: 4px;
  transition: width 0.4s ease;
}

.progress-fill.fill-completed {
  background: linear-gradient(90deg, #4caf50, #66bb6a);
}

.progress-text {
  font-size: 13px;
  color: #aaa;
  min-width: 50px;
  text-align: right;
}

.task-rewards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #ccc;
}

.reward-icon {
  font-size: 16px;
}

.task-action {
  flex-shrink: 0;
}

.btn {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-claim {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: #fff;
}

.btn-claim:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
}

.btn-claim:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-claimed {
  background: rgba(255, 255, 255, 0.05);
  color: #888;
  cursor: default;
}

.btn-progress {
  background: rgba(255, 255, 255, 0.05);
  color: #888;
  cursor: default;
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 9999;
  animation: slideDown 0.3s ease;
}

.toast.success {
  background: rgba(76, 175, 80, 0.9);
  color: #fff;
}

.toast.error {
  background: rgba(244, 67, 54, 0.9);
  color: #fff;
}

@keyframes slideDown {
  from {
    top: -50px;
    opacity: 0;
  }
  to {
    top: 20px;
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .task-page {
    padding: 12px;
  }

  .task-header h1 {
    font-size: 22px;
  }

  .task-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-action {
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
</style>
