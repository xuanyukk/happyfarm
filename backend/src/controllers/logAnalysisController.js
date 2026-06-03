/**
 * 文件名：logAnalysisController.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：日志分析控制器，处理日志相关的API请求
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本创建
 */

const logAnalysisService = require('../services/logAnalysisService');
const logger = require('../config/logger');

/**
 * 获取日志文件列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getLogFiles = async (req, res) => {
  try {
    const files = await logAnalysisService.getLogFiles();
    res.status(200).json({
      success: true,
      data: files,
      message: '获取日志文件列表成功',
    });
  } catch (error) {
    logger.error('获取日志文件列表失败', { error });
    res.status(500).json({
      success: false,
      message: '获取日志文件列表失败',
      error: error.message,
    });
  }
};

/**
 * 读取日志文件内容
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const readLogFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    const {
      limit = 100,
      level = '',
      searchTerm = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const logs = await logAnalysisService.readLogFile(
      fileName,
      parseInt(limit),
      level,
      searchTerm,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: logs,
      message: '读取日志文件成功',
    });
  } catch (error) {
    logger.error('读取日志文件失败', { error });
    res.status(500).json({
      success: false,
      message: '读取日志文件失败',
      error: error.message,
    });
  }
};

/**
 * 获取日志统计信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getLogStats = async (req, res) => {
  try {
    const { fileName } = req.params;
    const stats = await logAnalysisService.getLogStats(fileName);
    res.status(200).json({
      success: true,
      data: stats,
      message: '获取日志统计信息成功',
    });
  } catch (error) {
    logger.error('获取日志统计信息失败', { error });
    res.status(500).json({
      success: false,
      message: '获取日志统计信息失败',
      error: error.message,
    });
  }
};

/**
 * 获取错误分析报告
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getErrorAnalysis = async (req, res) => {
  try {
    const { fileName } = req.params;
    const analysis = await logAnalysisService.getErrorAnalysis(fileName);
    res.status(200).json({
      success: true,
      data: analysis,
      message: '获取错误分析报告成功',
    });
  } catch (error) {
    logger.error('获取错误分析报告失败', { error });
    res.status(500).json({
      success: false,
      message: '获取错误分析报告失败',
      error: error.message,
    });
  }
};

/**
 * 获取性能统计信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getPerformanceStats = async (req, res) => {
  try {
    const { fileName } = req.params;
    const stats = await logAnalysisService.getPerformanceStats(fileName);
    res.status(200).json({
      success: true,
      data: stats,
      message: '获取性能统计信息成功',
    });
  } catch (error) {
    logger.error('获取性能统计信息失败', { error });
    res.status(500).json({
      success: false,
      message: '获取性能统计信息失败',
      error: error.message,
    });
  }
};

/**
 * 导出日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const exportLogs = async (req, res) => {
  try {
    const { fileName } = req.params;
    const { format = 'json', ...filters } = req.query;

    const content = await logAnalysisService.exportLogs(
      fileName,
      format,
      filters
    );

    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    const extension = format === 'json' ? 'json' : 'csv';

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName.replace('.log', '')}.${extension}"`
    );
    res.send(content);
  } catch (error) {
    logger.error('导出日志失败', { error });
    res.status(500).json({
      success: false,
      message: '导出日志失败',
      error: error.message,
    });
  }
};

module.exports = {
  getLogFiles,
  readLogFile,
  getLogStats,
  getErrorAnalysis,
  getPerformanceStats,
  exportLogs,
};
