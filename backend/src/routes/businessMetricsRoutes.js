/**
 * 文件名：businessMetricsRoutes.js
 * 作者：运维团队
 * 日期：2026-05-18
 * 版本：v1.0.0
 * 功能描述：业务指标监控API路由配置
 * 更新记录：
 *   2026-05-18 - v1.0.0 - 初始创建业务指标监控路由
 */

const express = require('express');
const businessMetricsController = require('../controllers/businessMetricsController');
const router = express.Router();

// ==================== 业务指标 API ====================

/**
 * @swagger
 * /api/business-metrics:
 *   get:
 *     summary: 获取所有业务指标
 *     description: 获取所有业务指标，包括交易成功率、用户活跃度、游戏业务、性能等指标
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功获取业务指标
 */
router.get('/', businessMetricsController.getAllMetrics);

/**
 * @swagger
 * /api/business-metrics/transaction-success:
 *   get:
 *     summary: 获取交易成功率指标
 *     description: 获取登录、支付、数据保存的成功率指标
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功获取交易成功率指标
 */
router.get(
  '/transaction-success',
  businessMetricsController.getTransactionSuccessRates
);

/**
 * @swagger
 * /api/business-metrics/user-activity:
 *   get:
 *     summary: 获取用户活跃度指标
 *     description: 获取在线用户数、日活、峰值在线等指标
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功获取用户活跃度指标
 */
router.get('/user-activity', businessMetricsController.getUserActivityMetrics);

/**
 * @swagger
 * /api/business-metrics/game-activity:
 *   get:
 *     summary: 获取游戏业务指标
 *     description: 获取游戏相关的玩家、交易、访问等指标
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功获取游戏业务指标
 */
router.get('/game-activity', businessMetricsController.getGameActivityMetrics);

/**
 * @swagger
 * /api/business-metrics/performance:
 *   get:
 *     summary: 获取性能指标
 *     description: 获取响应时间、QPS、错误率等指标
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功获取性能指标
 */
router.get('/performance', businessMetricsController.getPerformanceMetrics);

/**
 * @swagger
 * /api/business-metrics/history:
 *   get:
 *     summary: 获取历史指标数据
 *     description: 获取指定时间范围内的指标历史数据
 *     tags: [业务指标监控]
 *     parameters:
 *       - name: startTime
 *         in: query
 *         description: 开始时间
 *         schema:
 *           type: string
 *       - name: endTime
 *         in: query
 *         description: 结束时间
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         description: 返回记录数限制
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: 成功获取历史指标
 */
router.get('/history', businessMetricsController.getMetricsHistory);

/**
 * @swagger
 * /api/business-metrics/analysis:
 *   get:
 *     summary: 获取多维度数据分析
 *     description: 获取业务指标多维度分析报告
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功获取多维度分析
 */
router.get('/analysis', businessMetricsController.getMultiDimensionAnalysis);

/**
 * @swagger
 * /api/business-metrics/predict:
 *   get:
 *     summary: 趋势预测
 *     description: 对指定指标进行趋势预测
 *     tags: [业务指标监控]
 *     parameters:
 *       - name: metricName
 *         in: query
 *         description: 指标名称
 *         schema:
 *           type: string
 *           default: loginSuccessRate
 *       - name: futureMinutes
 *         in: query
 *         description: 预测未来分钟数
 *         schema:
 *           type: integer
 *           default: 60
 *     responses:
 *       200:
 *         description: 成功获取趋势预测
 */
router.get('/predict', businessMetricsController.predictTrends);

// ==================== 告警管理 API ====================

/**
 * @swagger
 * /api/business-metrics/alerts/thresholds:
 *   get:
 *     summary: 获取告警阈值配置
 *     description: 获取业务指标告警阈值配置
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功获取告警阈值
 */
router.get('/alerts/thresholds', businessMetricsController.getAlertThresholds);

/**
 * @swagger
 * /api/business-metrics/alerts/thresholds:
 *   put:
 *     summary: 更新告警阈值配置
 *     description: 更新业务指标告警阈值配置
 *     tags: [业务指标监控]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               loginSuccessRate:
 *                 type: object
 *                 properties:
 *                   warning:
 *                     type: number
 *                   critical:
 *                     type: number
 *               paymentSuccessRate:
 *                 type: object
 *                 properties:
 *                   warning:
 *                     type: number
 *                   critical:
 *                     type: number
 *               onlineUsers:
 *                 type: object
 *                 properties:
 *                   warning:
 *                     type: number
 *                   critical:
 *                     type: number
 *               peakCapacityRate:
 *                 type: object
 *                 properties:
 *                   warning:
 *                     type: number
 *                   critical:
 *                     type: number
 *     responses:
 *       200:
 *         description: 成功更新告警阈值
 */
router.put(
  '/alerts/thresholds',
  businessMetricsController.updateAlertThresholds
);

/**
 * @swagger
 * /api/business-metrics/alerts/check:
 *   get:
 *     summary: 检查业务告警
 *     description: 检查是否有触发的业务指标告警
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功检查告警
 */
router.get('/alerts/check', businessMetricsController.checkAlerts);

// ==================== 业务事件记录 API ====================

/**
 * @swagger
 * /api/business-metrics/event:
 *   post:
 *     summary: 记录业务事件
 *     description: 手动记录业务事件（用于测试和调试）
 *     tags: [业务指标监控]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventType:
 *                 type: string
 *                 enum: [login, payment, dataSave, cropHarvest, shopVisit, logout]
 *                 description: 事件类型
 *               success:
 *                 type: boolean
 *                 description: 事件是否成功
 *     responses:
 *       200:
 *         description: 成功记录事件
 */
router.post('/event', businessMetricsController.recordEvent);

// ==================== 自定义指标 API ====================

/**
 * @swagger
 * /api/business-metrics/custom/register:
 *   post:
 *     summary: 注册自定义指标
 *     description: 注册新的自定义业务指标
 *     tags: [业务指标监控]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metricName:
 *                 type: string
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: 成功注册自定义指标
 */
router.post('/custom/register', businessMetricsController.registerCustomMetric);

/**
 * @swagger
 * /api/business-metrics/custom/update:
 *   post:
 *     summary: 更新自定义指标值
 *     description: 更新自定义业务指标值
 *     tags: [业务指标监控]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metricName:
 *                 type: string
 *               value:
 *                 type: number
 *     responses:
 *       200:
 *         description: 成功更新自定义指标
 */
router.post('/custom/update', businessMetricsController.updateCustomMetric);

/**
 * @swagger
 * /api/business-metrics/reset:
 *   post:
 *     summary: 重置业务指标
 *     description: 重置所有业务指标（用于新的统计周期）
 *     tags: [业务指标监控]
 *     responses:
 *       200:
 *         description: 成功重置指标
 */
router.post('/reset', businessMetricsController.resetMetrics);

module.exports = router;
