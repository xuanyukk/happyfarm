/** * 文件名：AdminLayout.vue * 作者：开发者 * 日期：2026-05-24 * 版本：v2.4.0 *
功能描述：后台管理系统布局组件，包含侧边栏导航、顶部状态栏和主内容区域，增加移动端响应式支持
* 更新记录： * 2026-01-01 - v1.1.0 - 初始版本创建 * 2026-04-30 - v1.2.0 -
添加公告管理菜单项 * 2026-05-06 - v1.3.0 - 添加健康检查和系统状态管理菜单项 *
2026-05-06 - v1.4.0 - 添加备份与恢复管理菜单项 * 2026-05-06 - v1.5.0 -
添加日志分析与可视化菜单项 * 2026-05-06 - v1.6.0 - 添加配置热更新菜单项 *
2026-05-06 - v1.7.0 - 添加游戏活动管理菜单项 * 2026-05-12 - v1.8.0 -
添加数据库性能管理菜单项 * 2026-05-12 - v2.0.0 -
添加移动端响应式支持，包含侧边栏抽屉、移动端菜单按钮 * 2026-05-23 - v2.1.0 -
添加商店管理、成就管理、农场配置菜单项，优化菜单分组 * 2026-05-24 - v2.2.0 -
添加经济分析、玩家分析、业务指标、邮件管理菜单项 * 2026-05-26 - v2.3.0 -
添加Grafana监控和数据导入/导出菜单项 * 2026-06-09 - v2.4.0 -
视觉统一到大地色系：侧边栏深绿渐变、菜单项暖金悬浮/活跃态、顶部栏玻璃拟态、退出按钮棕色调、修复菜单组初始折叠 */
<template>
  <div class="admin-layout">
    <div
      v-if="sidebarOpen"
      class="admin-sidebar-overlay show"
      @click="closeSidebar"
    ></div>
    <aside class="sidebar admin-sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-header">
        <h2>🎮 后台管理</h2>
      </div>
      <nav class="sidebar-nav">
        <div v-for="group in menuGroups" :key="group.id" class="menu-group">
          <div class="menu-group-header" @click="toggleGroup(group.id)">
            <span class="group-icon">{{ group.icon }}</span>
            <span class="group-title">{{ group.title }}</span>
            <span class="group-toggle">{{
              expandedGroups.includes(group.id) ? '▼' : '▶'
            }}</span>
          </div>
          <div
            v-show="expandedGroups.includes(group.id)"
            class="menu-group-items"
          >
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              active-class="active"
              @click="closeSidebarOnMobile"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.name }}</span>
            </router-link>
          </div>
        </div>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">🚪 退出登录</button>
      </div>
    </aside>

    <main class="main-content admin-main">
      <header class="top-header admin-header">
        <div class="header-left admin-header-left">
          <button class="mobile-menu-btn show-mobile" @click="toggleSidebar">
            {{ sidebarOpen ? '✕' : '☰' }}
          </button>
          <h1 class="admin-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="header-right">
          <span class="admin-info">
            👤 {{ adminStore.adminUser?.username || '管理员' }}
          </span>
        </div>
      </header>

      <div class="content-area">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminStore } from '../stores/admin';
import { usePlayerStore } from '../stores/player';

const adminStore = useAdminStore();
const playerStore = usePlayerStore();
const router = useRouter();
const route = useRoute();

const sidebarOpen = ref(false);
const isMobile = ref(window.innerWidth <= 768);
const expandedGroups = ref([
  'dashboard',
  'users',
  'content',
  'config',
  'operations',
  'monitoring',
  'performance',
  'data',
  'communications',
]);

const menuGroups = [
  {
    id: 'dashboard',
    title: '仪表板',
    icon: '📊',
    items: [{ path: '/admin/dashboard', name: '仪表板', icon: '📊' }],
  },
  {
    id: 'users',
    title: '用户与权限',
    icon: '👥',
    items: [
      { path: '/admin/players', name: '玩家管理', icon: '👥' },
      { path: '/admin/roles', name: '角色权限', icon: '🔐' },
      { path: '/admin/audit-logs', name: '审计日志', icon: '📜' },
    ],
  },
  {
    id: 'content',
    title: '内容管理',
    icon: '📢',
    items: [
      { path: '/admin/announcements', name: '公告管理', icon: '📢' },
      { path: '/admin/game-events', name: '游戏活动', icon: '🎪' },
      { path: '/admin/shop', name: '商店管理', icon: '🏪' },
      { path: '/admin/achievements', name: '成就管理', icon: '🏆' },
    ],
  },
  {
    id: 'config',
    title: '系统配置',
    icon: '⚙️',
    items: [
      { path: '/admin/configs', name: '参数配置', icon: '⚙️' },
      { path: '/admin/config-hot-update', name: '配置热更新', icon: '🔥' },
      { path: '/admin/backup', name: '备份恢复', icon: '💾' },
      { path: '/admin/farm-levels', name: '农场配置', icon: '🏡' },
    ],
  },
  {
    id: 'operations',
    title: '运营工具',
    icon: '🛠️',
    items: [
      { path: '/admin/approvals', name: '审批流程', icon: '✅' },
      { path: '/admin/batch-operations', name: '批量操作', icon: '📦' },
      { path: '/admin/data-import-export', name: '数据导入导出', icon: '📁' },
      { path: '/admin/crops', name: '作物管理', icon: '🌱' },
      { path: '/admin/items', name: '道具管理', icon: '🎁' },
    ],
  },
  {
    id: 'monitoring',
    title: '系统监控',
    icon: '📈',
    items: [
      { path: '/admin/monitoring', name: '系统监控', icon: '📈' },
      { path: '/admin/grafana', name: 'Grafana监控', icon: '📊' },
      { path: '/admin/alerts', name: '预警管理', icon: '⚠️' },
      { path: '/admin/alerts-push', name: '实时预警', icon: '🔔' },
      { path: '/admin/health-check', name: '健康检查', icon: '🩺' },
      { path: '/admin/system-state', name: '系统状态', icon: '⚡' },
    ],
  },
  {
    id: 'performance',
    title: '性能分析',
    icon: '📉',
    items: [
      { path: '/admin/performance', name: '性能监控', icon: '🚀' },
      { path: '/admin/database', name: '数据库管理', icon: '🗄️' },
      { path: '/admin/log-analysis', name: '日志分析', icon: '🔍' },
    ],
  },
  {
    id: 'data',
    title: '数据与统计',
    icon: '📊',
    items: [
      { path: '/admin/currency', name: '货币调控', icon: '💰' },
      { path: '/admin/currency-config', name: '货币配置', icon: '⚙️' },
      { path: '/admin/economy', name: '经济分析', icon: '📈' },
      { path: '/admin/player-analytics', name: '玩家分析', icon: '👥' },
      { path: '/admin/business-metrics', name: '业务指标', icon: '🎯' },
      { path: '/admin/statistics', name: '数据统计', icon: '📉' },
      { path: '/admin/logs', name: '操作日志', icon: '📝' },
      { path: '/admin/docs', name: '文档管理', icon: '📚' },
    ],
  },
  {
    id: 'communications',
    title: '沟通与通知',
    icon: '✉️',
    items: [{ path: '/admin/mails', name: '邮件管理', icon: '✉️' }],
  },
];

const allMenuItems = computed(() => {
  return menuGroups.flatMap((group) => group.items);
});

const currentPageTitle = computed(() => {
  const item = allMenuItems.value.find((m) => m.path === route.path);
  return item?.name || '后台管理';
});

function toggleGroup(groupId) {
  const index = expandedGroups.value.indexOf(groupId);
  if (index === -1) {
    expandedGroups.value.push(groupId);
  } else {
    expandedGroups.value.splice(index, 1);
  }
}

function handleLogout() {
  adminStore.logoutAdmin();
  // 清除 playerStore 中的管理员状态
  if (playerStore.playerData) {
    playerStore.playerData.is_admin = false;
  }
  router.push('/login');
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

function closeSidebarOnMobile() {
  if (isMobile.value) {
    sidebarOpen.value = false;
  }
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) {
    sidebarOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #2c4d37 0%, #1f3827 100%);
  color: var(--text-on-dark);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
}

.menu-group {
  margin-bottom: 4px;
}

.menu-group-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.menu-group-header:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
}

.group-icon {
  font-size: 16px;
  margin-right: 10px;
}

.group-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-toggle {
  font-size: 10px;
  transition: transform 0.2s ease;
}

.menu-group-items {
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px 12px 42px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(212, 160, 23, 0.12);
  color: var(--text-on-dark);
}

.nav-item.active {
  background: rgba(212, 160, 23, 0.15);
  color: var(--text-on-dark);
  border-left-color: var(--gold-500);
}

.nav-icon {
  font-size: 16px;
  margin-right: 10px;
}

.nav-text {
  font-size: 13px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.logout-btn {
  width: 100%;
  padding: 10px 16px;
  background: rgba(139, 105, 20, 0.2);
  border: none;
  color: var(--text-on-dark);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.logout-btn:hover {
  background: rgba(139, 105, 20, 0.4);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-header {
  height: 64px;
  background: var(--glass-bg-strong);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 20px;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.admin-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.content-area {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 响应式：表格横向滚动 */
@media (max-width: 768px) {
  .content-area :deep(table) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .content-area {
    padding: 16px;
  }
}

.mobile-menu-btn {
  display: none;
}
</style>
