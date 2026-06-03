/**
 * 文件名：queueController.js
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：队列管理控制器
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建，提供队列管理API
 */

const { queueService, QUEUE_NAMES } = require('../services/queueService');
const logger = require('../config/logger');

/**
 * 获取所有队列统计信息
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
const getQueueStats = async (req, res) => {
  try {
    const stats = await queueService.getAllQueueStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取队列统计信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取队列统计信息失败',
      error: error.message,
    });
  }
};

/**
 * 获取指定队列的统计信息
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
const getQueueStatsByName = async (req, res) => {
  try {
    const { queueName } = req.params;

    if (!Object.values(QUEUE_NAMES).includes(queueName)) {
      return res.status(400).json({
        success: false,
        message: '无效的队列名称',
      });
    }

    const stats = await queueService.getQueueStats(queueName);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取队列统计信息失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取队列统计信息失败',
      error: error.message,
    });
  }
};

/**
 * 获取任务状态
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
const getJobStatus = async (req, res) => {
  try {
    const { queueName, jobId } = req.params;

    if (!Object.values(QUEUE_NAMES).includes(queueName)) {
      return res.status(400).json({
        success: false,
        message: '无效的队列名称',
      });
    }

    const status = await queueService.getJobStatus(queueName, jobId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: '任务不存在',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('获取任务状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取任务状态失败',
      error: error.message,
    });
  }
};

/**
 * 添加邮件任务
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
const addEmailJob = async (req, res) => {
  try {
    const { to, subject, html, template, templateData } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: '收件人不能为空',
      });
    }

    const job = await queueService.addEmailJob({
      to,
      subject,
      html,
      template,
      templateData,
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: QUEUE_NAMES.EMAIL,
      },
      message: '邮件任务已添加',
    });
  } catch (error) {
    logger.error('添加邮件任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '添加邮件任务失败',
      error: error.message,
    });
  }
};

/**
 * 添加通知任务
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
const addNotificationJob = async (req, res) => {
  try {
    const { userId, type, message, data } = req.body;

    if (!userId || !type) {
      return res.status(400).json({
        success: false,
        message: '用户ID和通知类型不能为空',
      });
    }

    const job = await queueService.addNotificationJob({
      userId,
      type,
      message,
      data,
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: QUEUE_NAMES.NOTIFICATION,
      },
      message: '通知任务已添加',
    });
  } catch (error) {
    logger.error('添加通知任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '添加通知任务失败',
      error: error.message,
    });
  }
};

/**
 * 添加备份任务
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
const addBackupJob = async (req, res) => {
  try {
    const { type, options } = req.body;

    const job = await queueService.addBackupJob({
      type: type || 'full',
      options,
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: QUEUE_NAMES.BACKUP,
      },
      message: '备份任务已添加',
    });
  } catch (error) {
    logger.error('添加备份任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '添加备份任务失败',
      error: error.message,
    });
  }
};

/**
 * 添加缓存失效任务
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
const addCacheInvalidationJob = async (req, res) => {
  try {
    const { pattern, keys } = req.body;

    if (!pattern && !keys) {
      return res.status(400).json({
        success: false,
        message: '必须提供模式或键列表',
      });
    }

    const job = await queueService.addCacheInvalidationJob({
      pattern,
      keys,
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        queue: QUEUE_NAMES.CACHE_INVALIDATION,
      },
      message: '缓存失效任务已添加',
    });
  } catch (error) {
    logger.error('添加缓存失效任务失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '添加缓存失效任务失败',
      error: error.message,
    });
  }
};

module.exports = {
  getQueueStats,
  getQueueStatsByName,
  getJobStatus,
  addEmailJob,
  addNotificationJob,
  addBackupJob,
  addCacheInvalidationJob,
};
