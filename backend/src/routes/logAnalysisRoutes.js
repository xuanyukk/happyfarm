/**
 * 文件名：logAnalysisRoutes.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：日志分析路由配置
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const logAnalysisController = require('../controllers/logAnalysisController');

/**
 * 获取日志文件列表
 * GET /api/log-analysis/files
 */
router.get('/files', logAnalysisController.getLogFiles);

/**
 * 读取日志文件内容
 * GET /api/log-analysis/files/:fileName
 */
router.get('/files/:fileName', logAnalysisController.readLogFile);

/**
 * 获取日志统计信息
 * GET /api/log-analysis/files/:fileName/stats
 */
router.get('/files/:fileName/stats', logAnalysisController.getLogStats);

/**
 * 获取错误分析报告
 * GET /api/log-analysis/files/:fileName/errors
 */
router.get('/files/:fileName/errors', logAnalysisController.getErrorAnalysis);

/**
 * 获取性能统计信息
 * GET /api/log-analysis/files/:fileName/performance
 */
router.get(
  '/files/:fileName/performance',
  logAnalysisController.getPerformanceStats
);

/**
 * 导出日志
 * GET /api/log-analysis/files/:fileName/export
 */
router.get('/files/:fileName/export', logAnalysisController.exportLogs);

module.exports = router;
