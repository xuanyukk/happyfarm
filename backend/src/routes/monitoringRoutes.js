/**
 * 文件名：monitoringRoutes.js
 * 作者：运维团队
 * 日期：2026-05-18
 * 版本：v1.0.0
 * 功能描述：监控告警API路由配置
 * 更新记录：
 *   2026-05-18 - v1.0.0 - 初始创建监控告警路由
 */

const express = require('express');
const monitoringController = require('../controllers/monitoringController');
const router = express.Router();

// ==================== 监控指标 API ====================

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: 获取所有监控指标
 *     description: 获取服务器CPU、内存、磁盘、网络等监控指标
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取监控指标
 */
router.get('/metrics', monitoringController.getMetrics);

/**
 * @swagger
 * /api/monitoring/metrics/cpu:
 *   get:
 *     summary: 获取CPU指标
 *     description: 获取服务器CPU使用率和核心数
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取CPU指标
 */
router.get('/metrics/cpu', monitoringController.getCpuMetrics);

/**
 * @swagger
 * /api/monitoring/metrics/memory:
 *   get:
 *     summary: 获取内存指标
 *     description: 获取服务器内存使用情况
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取内存指标
 */
router.get('/metrics/memory', monitoringController.getMemoryMetrics);

/**
 * @swagger
 * /api/monitoring/metrics/disk:
 *   get:
 *     summary: 获取磁盘指标
 *     description: 获取服务器磁盘使用情况
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取磁盘指标
 */
router.get('/metrics/disk', monitoringController.getDiskMetrics);

/**
 * @swagger
 * /api/monitoring/metrics/network:
 *   get:
 *     summary: 获取网络指标
 *     description: 获取服务器网络连接数
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取网络指标
 */
router.get('/metrics/network', monitoringController.getNetworkMetrics);

// ==================== 告警管理 API ====================

/**
 * @swagger
 * /api/monitoring/alerts/check:
 *   get:
 *     summary: 检查告警
 *     description: 检查当前是否有触发的告警
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功检查告警
 */
router.get('/alerts/check', monitoringController.checkAlerts);

/**
 * @swagger
 * /api/monitoring/alerts/history:
 *   get:
 *     summary: 获取告警历史
 *     description: 获取历史告警记录
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取告警历史
 */
router.get('/alerts/history', monitoringController.getAlertHistory);

/**
 * @swagger
 * /api/monitoring/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: 确认告警
 *     description: 标记告警为已确认
 *     tags: [监控告警]
 *     parameters:
 *       - name: alertId
 *         in: path
 *         required: true
 *         description: 告警ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功确认告警
 *       404:
 *         description: 告警不存在
 */
router.post(
  '/alerts/:alertId/acknowledge',
  monitoringController.acknowledgeAlert
);

/**
 * @swagger
 * /api/monitoring/alerts/thresholds:
 *   get:
 *     summary: 获取告警阈值配置
 *     description: 获取当前告警阈值设置
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取告警阈值配置
 */
router.get('/alerts/thresholds', monitoringController.getAlertThresholds);

/**
 * @swagger
 * /api/monitoring/alerts/thresholds:
 *   put:
 *     summary: 设置告警阈值
 *     description: 更新告警阈值配置
 *     tags: [监控告警]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cpu:
 *                 type: object
 *                 properties:
 *                   warning:
 *                     type: number
 *                   critical:
 *                     type: number
 *               memory:
 *                 type: object
 *                 properties:
 *                   warning:
 *                     type: number
 *                   critical:
 *                     type: number
 *               disk:
 *                 type: object
 *                 properties:
 *                   warning:
 *                     type: number
 *                   critical:
 *                     type: number
 *               network:
 *                 type: object
 *                 properties:
 *                   connections:
 *                     type: number
 *                   bandwidth:
 *                     type: number
 *     responses:
 *       200:
 *         description: 成功更新告警阈值配置
 */
router.put('/alerts/thresholds', monitoringController.setAlertThresholds);

// ==================== 通知渠道 API ====================

/**
 * @swagger
 * /api/monitoring/channels:
 *   get:
 *     summary: 获取通知渠道配置
 *     description: 获取所有通知渠道的状态
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取通知渠道配置
 */
router.get('/channels', monitoringController.getNotificationChannels);

/**
 * @swagger
 * /api/monitoring/channels/{channelName}:
 *   put:
 *     summary: 配置通知渠道
 *     description: 更新指定通知渠道的配置
 *     tags: [监控告警]
 *     parameters:
 *       - name: channelName
 *         in: path
 *         required: true
 *         description: 渠道名称 (console, email, wechat, dingtalk, sms)
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               priority:
 *                 type: array
 *                 items:
 *                   type: string
 *               webhookUrl:
 *                 type: string
 *               transportConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: 成功配置通知渠道
 */
router.put(
  '/channels/:channelName',
  monitoringController.configureNotificationChannel
);

/**
 * @swagger
 * /api/monitoring/alerts/test:
 *   post:
 *     summary: 发送测试告警
 *     description: 发送测试告警通知到所有启用的渠道
 *     tags: [监控告警]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               level:
 *                 type: string
 *                 enum: [critical, warning, info]
 *                 default: info
 *               message:
 *                 type: string
 *                 default: 测试告警消息
 *               type:
 *                 type: string
 *                 default: test
 *     responses:
 *       200:
 *         description: 成功发送测试告警
 */
router.post('/alerts/test', monitoringController.sendTestAlert);

/**
 * @swagger
 * /api/monitoring/notifications/history:
 *   get:
 *     summary: 获取通知历史
 *     description: 获取告警通知发送历史记录
 *     tags: [监控告警]
 *     responses:
 *       200:
 *         description: 成功获取通知历史
 */
router.get(
  '/notifications/history',
  monitoringController.getNotificationHistory
);

module.exports = router;
