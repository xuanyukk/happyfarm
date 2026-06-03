/** * 文件名：Navbar.vue * 作者：开发者 * 日期：2026-05-22 * 版本：v2.11.0 *
功能描述：导航栏组件，包含商店、背包、流水、成就、队列、退出等按钮 * 更新记录：
* 2026-05-22 - v2.11.0 - 从Home.vue中拆分出独立组件 */

<template>
  <nav class="nav">
    <button class="nav-btn" @click="handleShopClick">
      <span class="btn-icon">🛒</span>
      <span>商店</span>
    </button>
    <button class="nav-btn" @click="handleInventoryClick">
      <span class="btn-icon">🎒</span>
      <span>背包</span>
    </button>
    <button class="nav-btn" @click="handleCurrencyLogClick">
      <span class="btn-icon">📊</span>
      <span>流水</span>
    </button>
    <button class="nav-btn" @click="handleGameEventsClick">
      <span class="btn-icon">🎉</span>
      <span>活动</span>
    </button>
    <button class="nav-btn" @click="handleAchievementsClick">
      <span class="btn-icon">🏆</span>
      <span>成就</span>
    </button>
    <button class="nav-btn" @click="handleDailyTasksClick">
      <span class="btn-icon">📝</span>
      <span>每日</span>
    </button>
    <button class="nav-btn" @click="handleQueueManagerClick">
      <span class="btn-icon">📋</span>
      <span>队列</span>
    </button>
    <button v-if="isAdmin" class="nav-btn admin-btn" @click="handleAdminClick">
      <span class="btn-icon">⚙️</span>
      <span>管理</span>
    </button>
    <button class="nav-btn logout-btn" @click="handleLogoutClick">
      <span class="btn-icon">🚪</span>
      <span>退出</span>
    </button>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import { computed } from 'vue';

const emit = defineEmits([
  'shop',
  'inventory',
  'currencyLog',
  'gameEvents',
  'achievements',
  'dailyTasks',
  'queueManager',
  'logout',
]);

const router = useRouter();
const playerStore = usePlayerStore();

const isAdmin = computed(() => {
  return playerStore.playerData?.is_admin || false;
});

const handleShopClick = () => {
  emit('shop');
};

const handleInventoryClick = () => {
  emit('inventory');
};

const handleCurrencyLogClick = () => {
  emit('currencyLog');
};

const handleGameEventsClick = () => {
  emit('gameEvents');
};

const handleAchievementsClick = () => {
  emit('achievements');
};

const handleDailyTasksClick = () => {
  emit('dailyTasks');
};

const handleQueueManagerClick = () => {
  emit('queueManager');
};

const handleAdminClick = () => {
  router.push('/admin');
};

const handleLogoutClick = () => {
  emit('logout');
};
</script>

<style scoped>
.nav {
  display: flex;
  gap: 12px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
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

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.logout-btn {
  background: linear-gradient(
    135deg,
    rgba(244, 67, 54, 0.3),
    rgba(233, 30, 99, 0.3)
  );
  border-color: rgba(244, 67, 54, 0.5);
}

.logout-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(244, 67, 54, 0.4),
    rgba(233, 30, 99, 0.4)
  );
  border-color: rgba(244, 67, 54, 0.7);
}

.admin-btn {
  background: linear-gradient(
    135deg,
    rgba(103, 58, 183, 0.3),
    rgba(156, 39, 176, 0.3)
  );
  border-color: rgba(103, 58, 183, 0.5);
}

.admin-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(103, 58, 183, 0.4),
    rgba(156, 39, 176, 0.4)
  );
  border-color: rgba(103, 58, 183, 0.7);
}

.btn-icon {
  font-size: 18px;
}
</style>
