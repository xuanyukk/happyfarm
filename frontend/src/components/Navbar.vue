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
  gap: 10px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-md);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.nav-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.2),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-btn:hover::after {
  opacity: 1;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.45);
}

.nav-btn:active {
  transform: translateY(0) scale(0.96);
  transition: transform 0.1s ease;
}

.btn-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.nav-btn:hover .btn-icon {
  transform: scale(1.15) rotate(-5deg);
}

.logout-btn {
  background: linear-gradient(
    135deg,
    rgba(244, 67, 54, 0.25),
    rgba(233, 30, 99, 0.2)
  );
  border-color: rgba(244, 67, 54, 0.45);
}

.logout-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(244, 67, 54, 0.38),
    rgba(233, 30, 99, 0.32)
  );
  border-color: rgba(244, 67, 54, 0.65);
}

.admin-btn {
  background: linear-gradient(
    135deg,
    rgba(103, 58, 183, 0.22),
    rgba(156, 39, 176, 0.2)
  );
  border-color: rgba(103, 58, 183, 0.45);
}

.admin-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(103, 58, 183, 0.35),
    rgba(156, 39, 176, 0.32)
  );
  border-color: rgba(103, 58, 183, 0.65);
}
</style>
