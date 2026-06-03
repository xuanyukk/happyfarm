/**
 * 文件名：router.js
 * 作者：开发者
 * 日期：2026-05-24
 * 版本：v3.1.0
 * 功能描述：路由配置，包含受保护路由守卫和组件懒加载
 * 更新记录：
 *   2026-03-22 - v1.6.0 - 添加货币流水页面路由
 *   2026-03-28 - v1.7.0 - 添加后台管理路由
 *   2026-04-30 - v1.8.0 - 添加队列管理路由
 *   2026-04-30 - v1.9.0 - 添加RBAC权限管理路由
 *   2026-04-30 - v2.0.0 - 添加游戏公告发布系统路由
 *   2026-04-30 - v2.3.0 - 添加游戏参数配置、批量操作和预警推送路由
 *   2026-05-06 - v2.4.0 - 添加健康检查和系统状态管理路由
 *   2026-05-06 - v2.5.0 - 添加备份与恢复管理路由
 *   2026-05-06 - v2.6.0 - 添加配置热更新路由
 *   2026-05-06 - v2.7.0 - 添加游戏活动管理路由
 *   2026-05-12 - v2.8.0 - 添加数据库性能管理路由
 *   2026-05-23 - v2.9.0 - 添加商店管理、成就管理、农场配置路由
 *   2026-05-24 - v3.0.0 - 添加经济分析、玩家分析、业务指标、邮件管理、货币配置路由
 *   2026-05-26 - v3.1.0 - 添加Grafana监控嵌入和数据导入/导出路由
 */

import { createRouter, createWebHistory } from 'vue-router';
import { isLoggedIn } from './services/authService';
import { useAdminStore } from './stores/admin';

const Home = () => import('./pages/Home.vue');
const ShopPage = () => import('./pages/ShopPage.vue');
const InventoryPage = () => import('./pages/InventoryPage.vue');
const CurrencyLogPage = () => import('./pages/CurrencyLogPage.vue');
const QueueManager = () => import('./pages/QueueManager.vue');
const GameEvents = () => import('./pages/GameEvents.vue');
const TaskPage = () => import('./pages/TaskPage.vue');
const LoginPage = () => import('./pages/LoginPage.vue');
const RegisterPage = () => import('./pages/RegisterPage.vue');
const ForgotPasswordPage = () => import('./pages/ForgotPasswordPage.vue');
const ResetPasswordPage = () => import('./pages/ResetPasswordPage.vue');

const AdminLayout = () => import('./components/AdminLayout.vue');
const AdminDashboard = () => import('./pages/admin/DashboardPage.vue');
const AdminPlayers = () => import('./pages/admin/PlayersPage.vue');
const AdminApprovals = () => import('./pages/admin/ApprovalsPage.vue');
const AdminLogs = () => import('./pages/admin/LogsPage.vue');
const AdminMonitoring = () => import('./pages/admin/MonitoringPage.vue');
const AdminAlerts = () => import('./pages/admin/AlertsPage.vue');
const AdminCurrency = () => import('./pages/admin/CurrencyPage.vue');
const AdminStatistics = () => import('./pages/admin/StatisticsPage.vue');
const AdminRoles = () => import('./pages/admin/RolesPage.vue');
const AdminAuditLogs = () => import('./pages/admin/AuditLogsPage.vue');
const AdminAnnouncements = () => import('./pages/admin/AnnouncementsPage.vue');
const AdminConfigs = () => import('./pages/admin/ConfigsPage.vue');
const AdminBatchOperations = () =>
  import('./pages/admin/BatchOperationsPage.vue');
const AdminAlertsPush = () => import('./pages/admin/AlertsPushPage.vue');
const AdminPerformance = () => import('./pages/admin/PerformancePage.vue');
const AdminHealthCheck = () => import('./pages/admin/HealthCheckPage.vue');
const AdminSystemState = () => import('./pages/admin/SystemStatePage.vue');
const AdminBackup = () => import('./pages/admin/BackupPage.vue');
const AdminLogAnalysis = () => import('./pages/admin/LogAnalysisPage.vue');
const AdminConfigHotUpdate = () =>
  import('./pages/admin/ConfigHotUpdatePage.vue');
const AdminGameEvents = () => import('./pages/admin/GameEventsPage.vue');
const AdminDatabase = () => import('./pages/admin/DatabasePage.vue');
const AdminDocs = () => import('./pages/admin/DocsPage.vue');
const AdminCrops = () => import('./pages/admin/CropsPage.vue');
const AdminItems = () => import('./pages/admin/ItemsPage.vue');
const AdminShop = () => import('./pages/admin/ShopPage.vue');
const AdminAchievements = () => import('./pages/admin/AchievementPage.vue');
const AdminFarmLevels = () => import('./pages/admin/FarmLevelPage.vue');
const AdminEconomy = () => import('./pages/admin/EconomyPage.vue');
const AdminPlayerAnalytics = () =>
  import('./pages/admin/PlayerAnalyticsPage.vue');
const AdminBusinessMetrics = () =>
  import('./pages/admin/BusinessMetricsPage.vue');
const AdminMails = () => import('./pages/admin/MailsPage.vue');
const AdminCurrencyConfig = () =>
  import('./pages/admin/CurrencyConfigPage.vue');
const AdminGrafana = () => import('./pages/admin/GrafanaEmbedPage.vue');
const AdminDataImportExport = () =>
  import('./pages/admin/DataImportExportPage.vue');

const ProtectedRoute = (to, from, next) => {
  return isLoggedIn() ? next() : next('/login');
};

const AdminRoute = async (to, from, next) => {
  if (!isLoggedIn()) {
    return next('/login');
  }

  const adminStore = useAdminStore();
  if (!adminStore.isAdminAuthenticated) {
    await adminStore.checkAdminStatus();
  }

  if (adminStore.isAdmin) {
    next();
  } else {
    next('/');
  }
};

const routes = [
  {
    path: '/',
    component: Home,
    beforeEnter: ProtectedRoute,
  },
  {
    path: '/shop',
    component: ShopPage,
    beforeEnter: ProtectedRoute,
  },
  {
    path: '/inventory',
    component: InventoryPage,
    beforeEnter: ProtectedRoute,
  },
  {
    path: '/currency-log',
    component: CurrencyLogPage,
    beforeEnter: ProtectedRoute,
  },
  {
    path: '/queue-manager',
    component: QueueManager,
    beforeEnter: ProtectedRoute,
  },
  {
    path: '/game-events',
    component: GameEvents,
    beforeEnter: ProtectedRoute,
  },
  {
    path: '/daily-tasks',
    component: TaskPage,
    beforeEnter: ProtectedRoute,
  },
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/register',
    component: RegisterPage,
  },
  {
    path: '/forgot-password',
    component: ForgotPasswordPage,
  },
  {
    path: '/reset-password',
    component: ResetPasswordPage,
  },
  {
    path: '/admin',
    component: AdminLayout,
    beforeEnter: AdminRoute,
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        component: AdminDashboard,
      },
      {
        path: 'players',
        component: AdminPlayers,
      },
      {
        path: 'approvals',
        component: AdminApprovals,
      },
      {
        path: 'logs',
        component: AdminLogs,
      },
      {
        path: 'monitoring',
        component: AdminMonitoring,
      },
      {
        path: 'alerts',
        component: AdminAlerts,
      },
      {
        path: 'currency',
        component: AdminCurrency,
      },
      {
        path: 'statistics',
        component: AdminStatistics,
      },
      {
        path: 'roles',
        component: AdminRoles,
      },
      {
        path: 'audit-logs',
        component: AdminAuditLogs,
      },
      {
        path: 'announcements',
        component: AdminAnnouncements,
      },
      {
        path: 'configs',
        component: AdminConfigs,
      },
      {
        path: 'batch-operations',
        component: AdminBatchOperations,
      },
      {
        path: 'alerts-push',
        component: AdminAlertsPush,
      },
      {
        path: 'performance',
        component: AdminPerformance,
      },
      {
        path: 'health-check',
        component: AdminHealthCheck,
      },
      {
        path: 'system-state',
        component: AdminSystemState,
      },
      {
        path: 'backup',
        component: AdminBackup,
      },
      {
        path: 'docs',
        component: AdminDocs,
      },
      {
        path: 'log-analysis',
        component: AdminLogAnalysis,
      },
      {
        path: 'config-hot-update',
        component: AdminConfigHotUpdate,
      },
      {
        path: 'game-events',
        component: AdminGameEvents,
      },
      {
        path: 'database',
        component: AdminDatabase,
      },
      {
        path: 'crops',
        component: AdminCrops,
      },
      {
        path: 'items',
        component: AdminItems,
      },
      {
        path: 'shop',
        component: AdminShop,
      },
      {
        path: 'achievements',
        component: AdminAchievements,
      },
      {
        path: 'farm-levels',
        component: AdminFarmLevels,
      },
      {
        path: 'economy',
        component: AdminEconomy,
      },
      {
        path: 'player-analytics',
        component: AdminPlayerAnalytics,
      },
      {
        path: 'business-metrics',
        component: AdminBusinessMetrics,
      },
      {
        path: 'mails',
        component: AdminMails,
      },
      {
        path: 'currency-config',
        component: AdminCurrencyConfig,
      },
      {
        path: 'grafana',
        component: AdminGrafana,
      },
      {
        path: 'data-import-export',
        component: AdminDataImportExport,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
