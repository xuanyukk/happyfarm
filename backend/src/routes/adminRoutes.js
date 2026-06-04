/**
 * 文件名：adminRoutes.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.2.0
 * 功能描述：后台管理路由配置
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始版本创建
 *   2026-05-26 - v1.1.0 - 集成 express-validator 请求验证
 *   2026-05-31 - v1.2.0 - 新增健康检查/系统状态/审计日志/告警推送路由
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  checkAdminPermission,
  getPlayerList,
  getPlayerDetail,
  updatePlayerStatus,
  updatePlayerStatusValidation,
  createApprovalRequest,
  createApprovalRequestValidation,
  getApprovalList,
  approveOperation,
  approveOperationValidation,
  getOperationLogs,
  getMonitoringData,
  getAlertList,
  handleAlert,
  handleAlertValidation,
  getCurrencyBalanceData,
  getStatisticsData,
  getDashboardData,
  exportDatabaseDocs,
  getTableStructureDoc,
  getTableDataDoc,
} = adminController;

router.use(authMiddleware);
router.use(checkAdminPermission);

/**
 * @swagger
 * tags:
 *   name: 后台管理
 *   description: 后台管理相关API
 */

// 仪表板
router.get('/dashboard', getDashboardData);

// 玩家管理
router.get('/players', getPlayerList);
router.get('/players/:playerId', getPlayerDetail);
router.put(
  '/players/:playerId/status',
  validate.updatePlayerStatus,
  updatePlayerStatus
);

// 审批流程
router.post('/approvals', validate.createApproval, createApprovalRequest);
router.get('/approvals', getApprovalList);
router.post(
  '/approvals/:requestId/approve',
  validate.approveOperation,
  approveOperation
);

// 日志管理
router.get('/logs', getOperationLogs);

// 审计日志（与操作日志同源）
router.get('/audit-logs', getOperationLogs);

// 系统监控
router.get('/monitoring/:type', getMonitoringData);
router.get('/alerts', getAlertList);
router.post('/alerts/:alertId/handle', validate.handleAlert, handleAlert);

// 预警推送（目前复用告警列表）
router.get('/alerts-push', getAlertList);

// 货币调控
router.get('/currency-balance', getCurrencyBalanceData);

// 数据统计
router.get('/statistics', getStatisticsData);

// 文档管理
router.post('/docs/export', exportDatabaseDocs);
router.get('/docs/structure', getTableStructureDoc);
router.get('/docs/data', getTableDataDoc);

// 健康检查（管理后台入口）
router.get('/health-check', (req, res) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.floor(uptime),
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// 系统状态
router.get('/system-state', (req, res) => {
  const os = require('os');
  const uptime = process.uptime();
  const cpuUsage = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  res.status(200).json({
    success: true,
    data: {
      cpu: {
        loadAverage: cpuUsage.map((v) => Math.round(v * 100) / 100),
        cores: os.cpus().length,
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024),
        free: Math.round(freeMem / 1024 / 1024),
        used: Math.round((totalMem - freeMem) / 1024 / 1024),
      },
      uptime: Math.floor(uptime),
      platform: os.platform(),
      hostname: os.hostname(),
      nodeVersion: process.version,
    },
  });
});

// 数据分析
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
router.get('/analytics/economy', adminAnalyticsController.getEconomyStats);
router.get('/analytics/players', adminAnalyticsController.getPlayerAnalytics);
router.get(
  '/analytics/transactions',
  adminAnalyticsController.getTransactionList
);
router.get('/analytics/shop-stats', adminAnalyticsController.getShopStats);
router.get(
  '/analytics/economy-alerts',
  adminAnalyticsController.getEconomyAlerts
);
router.get('/analytics/top-players', adminAnalyticsController.getTopPlayers);
router.get(
  '/analytics/player-alerts',
  adminAnalyticsController.getPlayerAlerts
);
router.get(
  '/analytics/player-profile',
  adminAnalyticsController.getPlayerProfile
);

module.exports = router;
