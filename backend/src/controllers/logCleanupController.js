/**
 * 文件名：logCleanupController.js
 * 作者：开发者
 * 日期：2026-05-16
 * 版本：v1.0.0
 * 功能描述：日志清理控制器 - 提供日志清理的API接口
 * 更新记录：
 *   2026-05-16 - v1.0.0 - 初始版本
 */

const logCleanupService = require('../services/logCleanupService');
const logger = require('../config/logger');

/**
 * 获取日志保留策略
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getRetentionPolicies(req, res) {
  try {
    const policies = logCleanupService.getRetentionPolicies();
    res.json({
      success: true,
      data: policies,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('[日志清理] 获取保留策略失败', { error: err.message });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

/**
 * 更新日志保留策略
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function updateRetentionPolicy(req, res) {
  try {
    const { logType } = req.params;
    const newPolicy = req.body;

    const updatedPolicy = logCleanupService.updateRetentionPolicy(
      logType,
      newPolicy
    );

    res.json({
      success: true,
      data: updatedPolicy,
      message: `更新 ${logType} 保留策略成功`,
    });
  } catch (err) {
    logger.error('[日志清理] 更新保留策略失败', { error: err.message });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

/**
 * 获取磁盘使用情况
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getDiskUsage(req, res) {
  try {
    const usage = await logCleanupService.getDiskUsage();
    res.json({
      success: true,
      data: usage,
    });
  } catch (err) {
    logger.error('[日志清理] 获取磁盘使用情况失败', { error: err.message });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

/**
 * 执行完整的日志清理
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function cleanupAll(req, res) {
  try {
    const result = await logCleanupService.cleanupAll();
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('[日志清理] 清理失败', { error: err.message });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

/**
 * 清理指定类型的日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function cleanupByType(req, res) {
  try {
    const { logType } = req.params;
    const policies = logCleanupService.getRetentionPolicies();

    if (!policies[logType]) {
      return res.status(400).json({
        success: false,
        error: `未知的日志类型: ${logType}`,
      });
    }

    const result = await logCleanupService.cleanupByType(
      logType,
      policies[logType]
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error('[日志清理] 清理失败', { error: err.message });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

module.exports = {
  getRetentionPolicies,
  updateRetentionPolicy,
  getDiskUsage,
  cleanupAll,
  cleanupByType,
};
