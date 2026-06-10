/**
 * 文件名：router.js
 * 作者：开发者
 * 日期：2026-05-24
 * 版本：v3.3.0
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
 *   2026-06-09 - v3.2.0 - AdminRoute添加防重入保护（checkingAdmin标志位）
 *   2026-06-11 - v3.3.0 - C1修复：AdminRoute死锁（添加超时兜底+认证失败处理）；ProtectedRoute添加异常捕获
 */

import { createRouter, createWebHistory } from 'vue-router';
import { isLoggedIn } from './services/authService';
import { useAdminStore } from './stores/admin';

// AdminRoute 竞态保护标志：防止快速路由切换导致重复checkAdminStatus
const checkingAdmin = { value: false };

const Home = () => import(/* webpackChunkName: "pages" */ './pages/Home.vue');
const ShopPage = () => import(/* webpackChunkName: "pages" */ './pages/ShopPage.vue');
const InventoryPage = () => import(/* webpackChunkName: "pages" */ './pages/InventoryPage.vue');
const CurrencyLogPage = () => import(/* webpackChunkName: "pages" */ './pages/CurrencyLogPage.vue');
const QueueManager = () => import(/* webpackChunkName: "pages" */ './pages/QueueManager.vue');
const GameEvents = () => import(/* webpackChunkName: "pages" */ './pages/GameEvents.vue');
const TaskPage = () => import(/* webpackChunkName: "pages" */ './pages/TaskPage.vue');
const LoginPage = () => import(/* webpackChunkName: "auth" */ './pages/LoginPage.vue');
const RegisterPage = () => import(/* webpackChunkName: "auth" */ './pages/RegisterPage.vue');
const ForgotPasswordPage = () => import(/* webpackChunkName: "auth" */ './pages/ForgotPasswordPage.vue');
const ResetPasswordPage = () => import(/* webpackChunkName: "auth" */ './pages/ResetPasswordPage.vue');

const AdminLayout = () => import(/* webpackChunkName: "admin" */ './components/AdminLayout.vue');
const AdminDashboard = () => import(/* webpackChunkName: "admin" */ './pages/admin/DashboardPage.vue');
const AdminPlayers = () => import(/* webpackChunkName: "admin" */ './pages/admin/PlayersPage.vue');
const AdminApprovals = () => import(/* webpackChunkName: "admin" */ './pages/admin/ApprovalsPage.vue');
const AdminLogs = () => import(/* webpackChunkName: "admin" */ './pages/admin/LogsPage.vue');
const AdminMonitoring = () => import(/* webpackChunkName: "admin" */ './pages/admin/MonitoringPage.vue');
const AdminAlerts = () => import(/* webpackChunkName: "admin" */ './pages/admin/AlertsPage.vue');
const AdminCurrency = () => import(/* webpackChunkName: "admin" */ './pages/admin/CurrencyPage.vue');
const AdminStatistics = () => import(/* webpackChunkName: "admin" */ './pages/admin/StatisticsPage.vue');
const AdminRoles = () => import(/* webpackChunkName: "admin" */ './pages/admin/RolesPage.vue');
const AdminAuditLogs = () => import(/* webpackChunkName: "admin" */ './pages/admin/AuditLogsPage.vue');
const AdminAnnouncements = () => import(/* webpackChunkName: "admin" */ './pages/admin/AnnouncementsPage.vue');
const AdminConfigs = () => import(/* webpackChunkName: "admin" */ './pages/admin/ConfigsPage.vue');
const AdminBatchOperations = () =>
  import(/* webpackChunkName: "admin" */ './pages/admin/BatchOperationsPage.vue');
const AdminAlertsPush = () => import(/* webpackChunkName: "admin" */ './pages/admin/AlertsPushPage.vue');
const AdminPerformance = () => import(/* webpackChunkName: "admin" */ './pages/admin/PerformancePage.vue');
const AdminHealthCheck = () => import(/* webpackChunkName: "admin" */ './pages/admin/HealthCheckPage.vue');
const AdminSystemState = () => import(/* webpackChunkName: "admin" */ './pages/admin/SystemStatePage.vue');
const AdminBackup = () => import(/* webpackChunkName: "admin" */ './pages/admin/BackupPage.vue');
const AdminLogAnalysis = () => import(/* webpackChunkName: "admin" */ './pages/admin/LogAnalysisPage.vue');
const AdminConfigHotUpdate = () =>
  import(/* webpackChunkName: "admin" */ './pages/admin/ConfigHotUpdatePage.vue');
const AdminGameEvents = () => import(/* webpackChunkName: "admin" */ './pages/admin/GameEventsPage.vue');
const AdminDatabase = () => import(/* webpackChunkName: "admin" */ './pages/admin/DatabasePage.vue');
const AdminDocs = () => import(/* webpackChunkName: "admin" */ './pages/admin/DocsPage.vue');
const AdminCrops = () => import(/* webpackChunkName: "admin" */ './pages/admin/CropsPage.vue');
const AdminItems = () => import(/* webpackChunkName: "admin" */ './pages/admin/ItemsPage.vue');
const AdminShop = () => import(/* webpackChunkName: "admin" */ './pages/admin/ShopPage.vue');
const AdminAchievements = () => import(/* webpackChunkName: "admin" */ './pages/admin/AchievementPage.vue');
const AdminFarmLevels = () => import(/* webpackChunkName: "admin" */ './pages/admin/FarmLevelPage.vue');
const AdminEconomy = () => import(/* webpackChunkName: "admin" */ './pages/admin/EconomyPage.vue');
const AdminPlayerAnalytics = () =>
  import(/* webpackChunkName: "admin" */ './pages/admin/PlayerAnalyticsPage.vue');
const AdminBusinessMetrics = () =>
  import(/* webpackChunkName: "admin" */ './pages/admin/BusinessMetricsPage.vue');
const AdminMails = () => import(/* webpackChunkName: "admin" */ './pages/admin/MailsPage.vue');
const AdminCurrencyConfig = () =>
  import(/* webpackChunkName: "admin" */ './pages/admin/CurrencyConfigPage.vue');
const AdminGrafana = () => import(/* webpackChunkName: "admin" */ './pages/admin/GrafanaEmbedPage.vue');
const AdminDataImportExport = () =>
  import(/* webpackChunkName: "admin" */ './pages/admin/DataImportExportPage.vue');

const ProtectedRoute = (to, from, next) => {
  // C5修复：添加异常捕获，防止localStorage损坏导致路由崩溃
  try {
    return isLoggedIn() ? next() : next('/login');
  } catch (err) {
    console.error('ProtectedRoute守卫异常', err);
    return next('/login');
  }
};

const AdminRoute = async (to, from, next) => {
  if (!isLoggedIn()) {
    return next('/login');
  }

  const adminStore = useAdminStore();

  // 防重入：如果已在验证中，等待现有检查完成
  if (!adminStore.isAdminAuthenticated) {
    if (checkingAdmin.value) {
      // 已有检查在进行中，用watch轮询等待结果
      // C1修复：添加超时兜底（10秒）+ 认证失败分支处理
      let resolved = false;
      const unwatch = adminStore.$subscribe(() => {
        if (resolved) return;
        if (adminStore.isAdminAuthenticated) {
          resolved = true;
          unwatch();
          adminStore.isAdmin ? next() : next('/');
        }
      });
      // 超时保护：10秒后强制结束，防止路由永久挂起
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unwatch();
          console.error('AdminRoute认证等待超时');
          next('/');
        }
      }, 10000);
      return;
    }

    checkingAdmin.value = true;
    try {
      await adminStore.checkAdminStatus();
    } finally {
      checkingAdmin.value = false;
    }
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
