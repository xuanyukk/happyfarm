/**
 * 文件名：adminManagementRoutes.js
 * 作者：AI助手
 * 日期：2026-06-05
 * 版本：v1.0.0
 * 功能描述：管理员专用路由——缓存管理、数据库性能、备份管理、日志管理
 * 更新记录：
 *   2026-06-05 - v1.0.0 - 从 server.js 拆分出行内管理员路由，遵循单一职责原则
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const logger = require('../config/logger');
const pool = require('../config/db');
const cacheService = require('../services/cacheService');
const backupService = require('../services/backupService');
const {
  logMetrics,
  alertManager,
  requestTracer,
  SensitiveDataMasker,
} = require('../utils/logger-advanced');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
} = require('../utils/response');

// ================================
// 缓存管理API
// ================================

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: 获取缓存统计
 *     description: 返回Redis缓存系统的统计信息
 *     tags: [缓存管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cache/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    successResponse(res, stats, '获取缓存统计成功');
  } catch (error) {
    logger.error('获取缓存统计失败', { error: error.message });
    errorResponse(res, '获取缓存统计失败', 500);
  }
});

/**
 * @swagger
 * /api/cache/prewarm:
 *   post:
 *     summary: 手动触发缓存预热
 *     description: 预加载热点数据到缓存中
 *     tags: [缓存管理]
 *     security:
 *       - bearerAuth: []
 */
router.post('/cache/prewarm', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    cacheService.prewarm().catch((err) => {
      logger.error('缓存预热失败', { error: err.message });
    });
    successResponse(res, null, '缓存预热已启动');
  } catch (error) {
    logger.error('触发缓存预热失败', { error: error.message });
    errorResponse(res, '触发缓存预热失败', 500);
  }
});

// ================================
// 数据库性能管理API
// ================================

/**
 * @swagger
 * /api/db/health:
 *   get:
 *     summary: 获取数据库健康状态
 *     tags: [数据库性能管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/db/health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const healthStatus = await pool.indexManager.getHealthStatus();
    successResponse(res, healthStatus, '获取数据库健康状态成功');
  } catch (error) {
    logger.error('获取数据库健康状态失败', { error: error.message });
    errorResponse(res, '获取数据库健康状态失败', 500);
  }
});

/**
 * @swagger
 * /api/db/indexes:
 *   get:
 *     summary: 获取索引统计信息
 *     tags: [数据库性能管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/db/indexes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const indexStats = await pool.indexManager.getIndexStats();
    successResponse(res, indexStats, '获取索引统计信息成功');
  } catch (error) {
    logger.error('获取索引统计信息失败', { error: error.message });
    errorResponse(res, '获取索引统计信息失败', 500);
  }
});

/**
 * @swagger
 * /api/db/indexes/unused:
 *   get:
 *     summary: 获取未使用的索引
 *     tags: [数据库性能管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/db/indexes/unused', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const unusedIndexes = await pool.indexManager.getUnusedIndexes();
    successResponse(res, unusedIndexes, '获取未使用索引成功');
  } catch (error) {
    logger.error('获取未使用索引失败', { error: error.message });
    errorResponse(res, '获取未使用索引失败', 500);
  }
});

/**
 * @swagger
 * /api/db/tables:
 *   get:
 *     summary: 获取表大小统计
 *     tags: [数据库性能管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/db/tables', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tableSizes = await pool.indexManager.getTableSizes();
    successResponse(res, tableSizes, '获取表大小统计成功');
  } catch (error) {
    logger.error('获取表大小统计失败', { error: error.message });
    errorResponse(res, '获取表大小统计失败', 500);
  }
});

/**
 * @swagger
 * /api/db/cache/clear:
 *   post:
 *     summary: 清除查询缓存
 *     tags: [数据库性能管理]
 *     security:
 *       - bearerAuth: []
 */
router.post('/db/cache/clear', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    pool.cache.clear();
    successResponse(res, null, '查询缓存已清除');
  } catch (error) {
    logger.error('清除查询缓存失败', { error: error.message });
    errorResponse(res, '清除查询缓存失败', 500);
  }
});

/**
 * @swagger
 * /api/db/cache/stats:
 *   get:
 *     summary: 获取查询缓存统计
 *     tags: [数据库性能管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/db/cache/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = pool.cache.getStats();
    successResponse(res, stats, '获取查询缓存统计成功');
  } catch (error) {
    logger.error('获取查询缓存统计失败', { error: error.message });
    errorResponse(res, '获取查询缓存统计失败', 500);
  }
});

// ================================
// 备份管理API
// ================================

/**
 * @swagger
 * /api/admin/backup:
 *   post:
 *     summary: 创建数据库备份
 *     tags: [备份管理]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin/backup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await backupService.createBackup();
    logger.info('管理员创建备份', {
      userId: req.user.id,
      username: req.user.username,
    });
    successResponse(res, result, '备份创建成功');
  } catch (error) {
    logger.error('手动备份失败', { error: error.message });
    errorResponse(res, '备份失败', 500);
  }
});

/**
 * @swagger
 * /api/admin/backups:
 *   get:
 *     summary: 获取备份列表
 *     tags: [备份管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/backups', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const backups = backupService.listBackups();
    successResponse(res, backups, '获取备份列表成功');
  } catch (error) {
    logger.error('获取备份列表失败', { error: error.message });
    errorResponse(res, '获取备份列表失败', 500);
  }
});

// ================================
// 高级日志管理API
// ================================

/**
 * @swagger
 * /api/admin/logs/metrics:
 *   get:
 *     summary: 获取日志系统指标
 *     tags: [日志管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/logs/metrics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const metrics = logMetrics.getMetrics();
    successResponse(res, metrics, '获取日志指标成功');
  } catch (error) {
    logger.error('获取日志指标失败', { error: error.message });
    errorResponse(res, '获取日志指标失败', 500);
  }
});

/**
 * @swagger
 * /api/admin/logs/alerts/channels:
 *   get:
 *     summary: 获取告警渠道列表
 *     tags: [日志管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/logs/alerts/channels', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const channels = alertManager.getChannels();
    successResponse(res, channels, '获取告警渠道成功');
  } catch (error) {
    logger.error('获取告警渠道失败', { error: error.message });
    errorResponse(res, '获取告警渠道失败', 500);
  }
});

/**
 * @swagger
 * /api/admin/logs/trace/:traceId:
 *   get:
 *     summary: 获取请求链路追踪
 *     tags: [日志管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/logs/trace/:traceId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const trace = requestTracer.getTrace(req.params.traceId);
    if (!trace) {
      return notFoundResponse(res, '未找到追踪信息');
    }
    successResponse(res, trace, '获取追踪信息成功');
  } catch (error) {
    logger.error('获取追踪信息失败', { error: error.message });
    errorResponse(res, '获取追踪信息失败', 500);
  }
});

/**
 * @swagger
 * /api/admin/logs/trace/active:
 *   get:
 *     summary: 获取活跃请求追踪
 *     tags: [日志管理]
 *     security:
 *       - bearerAuth: []
 */
router.get('/admin/logs/trace/active', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const traces = requestTracer.getActiveTraces();
    successResponse(res, traces, '获取活跃追踪成功');
  } catch (error) {
    logger.error('获取活跃追踪失败', { error: error.message });
    errorResponse(res, '获取活跃追踪失败', 500);
  }
});

/**
 * @swagger
 * /api/admin/logs/mask/test:
 *   post:
 *     summary: 测试敏感信息脱敏
 *     tags: [日志管理]
 *     security:
 *       - bearerAuth: []
 */
router.post('/admin/logs/mask/test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const maskedData = SensitiveDataMasker.maskObject(req.body.data);
    successResponse(res, maskedData, '测试脱敏成功');
  } catch (error) {
    logger.error('测试脱敏失败', { error: error.message });
    errorResponse(res, '测试脱敏失败', 500);
  }
});

module.exports = router;