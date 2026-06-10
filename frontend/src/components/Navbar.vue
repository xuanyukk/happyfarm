/**
 * 文件名：Navbar.vue
 * 作者：开发者
 * 日期：2026-05-22
 * 版本：v2.11.0
 * 功能描述：导航栏组件，包含商店、背包、流水、成就、队列、退出等按钮
 * 更新记录：
 * 2026-05-22 - v2.11.0 - 从Home.vue中拆分出独立组件
 */

<template>
  <nav class="nav">
    <button class="nav-btn" :class="{ 'nav-btn--active': isActive('/shop') }"
      title="商店 - 购买种子和道具" @click="handleShopClick">
      <img class="btn-icon-img" :src="btnIcons.shop" @error="onImgError" alt="商店" />
      <span>商店</span>
    </button>
    <button class="nav-btn" :class="{ 'nav-btn--active': isActive('/inventory') }"
      title="背包 - 查看你的种子和物品" @click="handleInventoryClick">
      <img class="btn-icon-img" :src="btnIcons.bag" @error="onImgError" alt="背包" />
      <span>背包</span>
    </button>
    <button class="nav-btn" :class="{ 'nav-btn--active': isActive('/currency-log') }"
      title="流水 - 查看金币和宝石变动记录" @click="handleCurrencyLogClick">
      <img class="btn-icon-img" :src="btnIcons.log" @error="onImgError" alt="流水" />
      <span>流水</span>
    </button>
    <button class="nav-btn" :class="{ 'nav-btn--active': isActive('/game-events') }"
      title="活动 - 参与限时活动赢取奖励" @click="handleGameEventsClick">
      <img class="btn-icon-img" :src="btnIcons.event" @error="onImgError" alt="活动" />
      <span>活动</span>
    </button>
    <button class="nav-btn" :class="{ 'nav-btn--active': isActive('/achievements') }"
      title="成就 - 查看你获得的成就徽章" @click="handleAchievementsClick">
      <img class="btn-icon-img" :src="btnIcons.achievement" @error="onImgError" alt="成就" />
      <span>成就</span>
    </button>
    <button class="nav-btn" :class="{ 'nav-btn--active': isActive('/daily-tasks') }"
      title="每日 - 完成每日任务赚取奖励" @click="handleDailyTasksClick">
      <img class="btn-icon-img" :src="btnIcons.daily" @error="onImgError" alt="每日" />
      <span>每日</span>
    </button>
    <button class="nav-btn" :class="{ 'nav-btn--active': isActive('/queue-manager') }"
      title="队列 - 管理种植和收获队列" @click="handleQueueManagerClick">
      <img class="btn-icon-img" :src="btnIcons.queue" @error="onImgError" alt="队列" />
      <span>队列</span>
    </button>
    <button v-if="isAdmin" class="nav-btn admin-btn"
      :class="{ 'nav-btn--active': isActive('/admin') }"
      title="管理后台 - 系统运维和数据管理" @click="handleAdminClick">
      <img class="btn-icon-img" :src="btnIcons.admin" @error="onImgError" alt="管理" />
      <span>管理</span>
    </button>
    <button class="nav-btn logout-btn" title="退出登录" @click="handleLogoutClick">
      <img class="btn-icon-img" :src="btnIcons.logout" @error="onImgError" alt="退出" />
      <span>退出</span>
    </button>
  </nav>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { usePlayerStore } from '../stores/player';
import { computed } from 'vue';
import { getUIButtonImage } from '../utils/imagePaths';

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
const route = useRoute();
const playerStore = usePlayerStore();

const isAdmin = computed(() => {
  return playerStore.playerData?.is_admin || false;
});

/**
 * 判断当前路由是否匹配指定路径
 * @param {string} path 目标路径
 * @returns {boolean} 是否匹配
 */
function isActive(path) {
  if (path === '/admin') {
    return route.path.startsWith('/admin');
  }
  return route.path === path;
}

/** 按钮图标路径映射 */
const btnIcons = computed(() => ({
  shop: getUIButtonImage('shop'),
  bag: getUIButtonImage('bag'),
  log: getUIButtonImage('log'),
  event: getUIButtonImage('event'),
  achievement: getUIButtonImage('achievement'),
  daily: getUIButtonImage('daily'),
  queue: getUIButtonImage('queue'),
  admin: getUIButtonImage('admin'),
  logout: getUIButtonImage('logout'),
}));

/** 图片加载失败时隐藏图片，显示原生 emoji fallback（由 alt 属性提供） */
function onImgError(event) {
  event.target.style.display = 'none';
}

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
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15),
    0 0 16px rgba(212, 160, 23, 0.1);
  border-color: rgba(255, 255, 255, 0.45);
}

/* 路由高亮活跃态 */
.nav-btn--active {
  background: rgba(255, 255, 255, 0.26);
  border-color: var(--gold-500);
  box-shadow: 0 2px 12px rgba(212, 160, 23, 0.18);
  position: relative;
}

.nav-btn--active::before {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 3px;
  background: var(--gold-500);
  border-radius: 3px 3px 0 0;
  animation: activePulse 2s ease-in-out infinite;
}

@keyframes activePulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.nav-btn:active {
  transform: translateY(0) scale(0.96);
  transition: transform 0.1s ease;
}

.btn-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  transition: transform 0.3s ease, filter 0.3s ease;
  flex-shrink: 0;
}

.nav-btn:hover .btn-icon-img {
  transform: scale(1.2);
  filter: drop-shadow(0 0 6px rgba(212, 160, 23, 0.5));
}

/* 退出按钮 — 暖棕土色 */
.logout-btn {
  background: linear-gradient(
    135deg,
    rgba(139, 105, 20, 0.22),
    rgba(92, 61, 14, 0.18)
  );
  border-color: rgba(139, 105, 20, 0.4);
}

.logout-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(139, 105, 20, 0.35),
    rgba(92, 61, 14, 0.28)
  );
  border-color: rgba(139, 105, 20, 0.6);
}

/* 管理按钮 — 丰收金色 */
.admin-btn {
  background: linear-gradient(
    135deg,
    rgba(212, 160, 23, 0.22),
    rgba(184, 134, 11, 0.18)
  );
  border-color: rgba(212, 160, 23, 0.4);
}

.admin-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(212, 160, 23, 0.35),
    rgba(184, 134, 11, 0.28)
  );
  border-color: rgba(212, 160, 23, 0.6);
}
</style>
