/**
 * 文件名：queueRoutes.js
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：队列管理API路由
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建，提供队列管理API路由
 */

const express = require('express');
const redisClient = require('../config/redis');
const logger = require('../config/logger');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getQueueStats,
  getQueueStatsByName,
  getJobStatus,
  addEmailJob,
  addNotificationJob,
  addBackupJob,
  addCacheInvalidationJob,
} = require('../controllers/queueController');

const router = express.Router();

/**
 * 队列可用性检查中间件
 * 当 Redis 未启用时，所有队列接口返回友好提示
 */
const checkQueueAvailable = (req, res, next) => {
  if (!redisClient) {
    logger.warn('队列API调用被拒绝：Redis未启用', {
      url: req.originalUrl,
      ip: req.ip,
    });
    return res.status(503).json({
      success: false,
      message: '队列服务不可用：Redis 未启用，请先配置 Redis',
    });
  }
  next();
};

// 对所有队列路由应用可用性检查
router.use(checkQueueAvailable);

/**
 * @swagger
 * /api/queue/stats:
 *   get:
 *     summary: 获取所有队列的统计信息
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 获取统计信息成功
 *       401:
 *         description: 未授权
 */
router.get('/stats', authMiddleware, getQueueStats);

/**
 * @swagger
 * /api/queue/{queueName}/stats:
 *   get:
 *     summary: 获取指定队列的统计信息
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *         description: 队列名称
 *     responses:
 *       200:
 *         description: 获取统计信息成功
 *       400:
 *         description: 无效的队列名称
 *       401:
 *         description: 未授权
 */
router.get('/:queueName/stats', authMiddleware, getQueueStatsByName);

/**
 * @swagger
 * /api/queue/{queueName}/job/{jobId}:
 *   get:
 *     summary: 获取任务状态
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         required: true
 *         schema:
 *           type: string
 *         description: 队列名称
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务ID
 *     responses:
 *       200:
 *         description: 获取任务状态成功
 *       404:
 *         description: 任务不存在
 *       401:
 *         description: 未授权
 */
router.get('/:queueName/job/:jobId', authMiddleware, getJobStatus);

/**
 * @swagger
 * /api/queue/email:
 *   post:
 *     summary: 添加邮件任务
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: 收件人
 *               subject:
 *                 type: string
 *                 description: 主题
 *               html:
 *                 type: string
 *                 description: HTML内容
 *               template:
 *                 type: string
 *                 description: 模板名称
 *               templateData:
 *                 type: object
 *                 description: 模板数据
 *             required:
 *               - to
 *     responses:
 *       200:
 *         description: 任务添加成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.post('/email', authMiddleware, addEmailJob);

/**
 * @swagger
 * /api/queue/notification:
 *   post:
 *     summary: 添加通知任务
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               type:
 *                 type: string
 *                 description: 通知类型
 *               message:
 *                 type: string
 *                 description: 消息内容
 *               data:
 *                 type: object
 *                 description: 附加数据
 *             required:
 *               - userId
 *               - type
 *     responses:
 *       200:
 *         description: 任务添加成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.post('/notification', authMiddleware, addNotificationJob);

/**
 * @swagger
 * /api/queue/backup:
 *   post:
 *     summary: 添加备份任务
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: 备份类型
 *               options:
 *                 type: object
 *                 description: 备份选项
 *     responses:
 *       200:
 *         description: 任务添加成功
 *       401:
 *         description: 未授权
 */
router.post('/backup', authMiddleware, addBackupJob);

/**
 * @swagger
 * /api/queue/cache-invalidation:
 *   post:
 *     summary: 添加缓存失效任务
 *     tags: [Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 description: 键模式
 *               keys:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 键列表
 *     responses:
 *       200:
 *         description: 任务添加成功
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 */
router.post('/cache-invalidation', authMiddleware, addCacheInvalidationJob);

module.exports = router;
