/**
 * 文件名：performanceRoutes.js
 * 作者：开发者
 * 日期：2026-05-05
 * 版本：v1.1.0
 * 功能描述：性能监控路由 - API响应时间监控端点
 * 更新记录：
 *   2026-05-05 - v1.0.0 - 初始版本创建
 *   2026-05-07 - v1.1.0 - 添加性能告警、趋势分析、缓存统计等端点
 */

const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { checkAdminPermission } = require('../controllers/adminController');

/**
 * @swagger
 * /api/performance/stats:
 *   get:
 *     summary: 获取性能统计概览
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get(
  '/stats',
  checkAdminPermission,
  performanceController.getPerformanceStats
);

/**
 * @swagger
 * /api/performance/slowest:
 *   get:
 *     summary: 获取最慢的路由
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功
 */
router.get(
  '/slowest',
  checkAdminPermission,
  performanceController.getSlowestRoutes
);

/**
 * @swagger
 * /api/performance/most-requested:
 *   get:
 *     summary: 获取最常请求的路由
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 成功
 */
router.get(
  '/most-requested',
  checkAdminPermission,
  performanceController.getMostRequestedRoutes
);

/**
 * @swagger
 * /api/performance/reset:
 *   post:
 *     summary: 重置性能统计
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.post(
  '/reset',
  checkAdminPermission,
  performanceController.resetPerformanceStats
);

/**
 * @swagger
 * /api/performance/trend:
 *   get:
 *     summary: 获取性能趋势
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get(
  '/trend',
  checkAdminPermission,
  performanceController.getPerformanceTrend
);

/**
 * @swagger
 * /api/performance/alerts/clear:
 *   post:
 *     summary: 清除当前告警
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.post(
  '/alerts/clear',
  checkAdminPermission,
  performanceController.clearAlerts
);

/**
 * @swagger
 * /api/performance/alerts/thresholds:
 *   put:
 *     summary: 更新告警阈值配置
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slowRequestRate:
 *                 type: number
 *                 description: 慢请求率阈值(%)
 *               avgResponseTime:
 *                 type: number
 *                 description: 平均响应时间阈值(ms)
 *               errorRate:
 *                 type: number
 *                 description: 错误率阈值(%)
 *     responses:
 *       200:
 *         description: 成功
 */
router.put(
  '/alerts/thresholds',
  checkAdminPermission,
  performanceController.updateAlertThresholds
);

/**
 * @swagger
 * /api/performance/cache/clear:
 *   post:
 *     summary: 清空查询缓存
 *     tags: [性能监控]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.post(
  '/cache/clear',
  checkAdminPermission,
  performanceController.clearQueryCache
);

module.exports = router;
