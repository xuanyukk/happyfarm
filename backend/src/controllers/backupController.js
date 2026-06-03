/**
 * 文件名：backupController.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v2.0.0
 * 功能描述：备份与恢复控制器
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本创建
 *   2026-05-06 - v2.0.0 - 添加调度和恢复监控功能
 */

const backupService = require('../services/backupService');
const schedulerService = require('../services/schedulerService');
const { logger } = require('../config/logger');
const fs = require('fs');
const path = require('path');

const createBackup = async (req, res) => {
  try {
    logger.info('收到创建备份请求', { user: req.user?.username });
    const result = await backupService.createBackup();
    res.json({
      success: true,
      message: '备份创建成功',
      data: result,
    });
  } catch (error) {
    logger.error('创建备份失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '备份创建失败',
      error: error.message,
    });
  }
};

const listBackups = (req, res) => {
  try {
    const backups = backupService.listBackups();
    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    logger.error('获取备份列表失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '获取备份列表失败',
      error: error.message,
    });
  }
};

const downloadBackup = (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = backupService.getBackupDir();
    const filePath = path.join(backupDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在',
      });
    }

    logger.info('下载备份文件', {
      filename,
      user: req.user?.username,
    });

    res.download(filePath, filename);
  } catch (error) {
    logger.error('下载备份失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
      filename: req.params?.filename,
    });
    res.status(500).json({
      success: false,
      message: '下载备份失败',
      error: error.message,
    });
  }
};

const deleteBackup = (req, res) => {
  try {
    const { filename } = req.params;
    const backupDir = backupService.getBackupDir();
    const filePath = path.join(backupDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '备份文件不存在',
      });
    }

    fs.unlinkSync(filePath);

    logger.info('删除备份文件成功', {
      filename,
      user: req.user?.username,
    });

    res.json({
      success: true,
      message: '备份删除成功',
    });
  } catch (error) {
    logger.error('删除备份失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
      filename: req.params?.filename,
    });
    res.status(500).json({
      success: false,
      message: '删除备份失败',
      error: error.message,
    });
  }
};

const restoreBackup = async (req, res) => {
  try {
    const { filename } = req.body;

    logger.info('开始恢复数据库备份', {
      filename,
      user: req.user?.username,
    });

    const result = await backupService.restoreDatabase(filename);

    res.json({
      success: true,
      message: '数据库恢复成功',
      data: result,
    });
  } catch (error) {
    logger.error('恢复备份失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
      filename: req.body?.filename,
    });
    res.status(500).json({
      success: false,
      message: '恢复备份失败',
      error: error.message,
    });
  }
};

const getRestoreProgress = (req, res) => {
  try {
    const progress = backupService.getRestoreProgress();
    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('获取恢复进度失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '获取恢复进度失败',
      error: error.message,
    });
  }
};

const rollbackRestore = async (req, res) => {
  try {
    logger.warn('开始回滚恢复操作', {
      user: req.user?.username,
    });

    const result = await backupService.rollbackRestore();

    res.json({
      success: true,
      message: '回滚成功',
      data: result,
    });
  } catch (error) {
    logger.error('回滚失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '回滚失败',
      error: error.message,
    });
  }
};

const clearRestoreProgress = (req, res) => {
  try {
    backupService.clearRestoreProgress();
    res.json({
      success: true,
      message: '恢复进度已清除',
    });
  } catch (error) {
    logger.error('清除恢复进度失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '清除恢复进度失败',
      error: error.message,
    });
  }
};

const startScheduledBackup = (req, res) => {
  try {
    const { cronExpression = '0 2 * * *' } = req.body;

    logger.info('启动定时备份任务', {
      cronExpression,
      user: req.user?.username,
    });

    const jobId = schedulerService.startBackupJob(cronExpression);

    res.json({
      success: true,
      message: '定时备份任务已启动',
      data: { jobId, cronExpression },
    });
  } catch (error) {
    logger.error('启动定时备份任务失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '启动定时备份任务失败',
      error: error.message,
    });
  }
};

const stopScheduledBackup = (req, res) => {
  try {
    const { jobId = 'daily-backup' } = req.body;

    logger.info('停止定时备份任务', {
      jobId,
      user: req.user?.username,
    });

    const result = schedulerService.stopJob(jobId);

    res.json({
      success: true,
      message: result ? '定时备份任务已停止' : '定时备份任务不存在',
      data: { stopped: result },
    });
  } catch (error) {
    logger.error('停止定时备份任务失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '停止定时备份任务失败',
      error: error.message,
    });
  }
};

const listScheduledJobs = (req, res) => {
  try {
    const jobs = schedulerService.listJobs();
    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    logger.error('获取定时任务列表失败', {
      error: error.message,
      stack: error.stack,
      user: req.user?.username,
    });
    res.status(500).json({
      success: false,
      message: '获取定时任务列表失败',
      error: error.message,
    });
  }
};

module.exports = {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  getRestoreProgress,
  rollbackRestore,
  clearRestoreProgress,
  startScheduledBackup,
  stopScheduledBackup,
  listScheduledJobs,
};
