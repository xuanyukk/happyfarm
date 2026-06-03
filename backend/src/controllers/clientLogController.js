/**
 * 文件名：clientLogController.js
 * 作者：开发者
 * 日期：2026-05-15
 * 版本：v1.0.0
 * 功能描述：客户端日志上报控制器
 */

const logger = require('../config/logger');

/**
 * 接收单条客户端日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createClientLog = async (req, res) => {
  try {
    const logData = req.body;

    // 记录到业务日志
    logger.info('客户端日志上报', {
      logType: 'business',
      module: 'client',
      clientLog: logData,
      clientVersion: req.headers['x-client-version'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    res.status(201).json({
      success: true,
      message: '日志已接收',
    });
  } catch (error) {
    logger.error('接收客户端日志失败', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: '日志接收失败',
    });
  }
};

/**
 * 批量接收客户端日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const batchCreateClientLogs = async (req, res) => {
  try {
    const { logs } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        message: '无效的日志数据',
      });
    }

    // 记录到业务日志
    logger.info('批量客户端日志上报', {
      logType: 'business',
      module: 'client',
      logCount: logs.length,
      clientVersion: req.headers['x-client-version'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    // 分别记录每条日志
    logs.forEach((log, index) => {
      if (log.level === 'error') {
        logger.error(`客户端错误日志 [${index + 1}/${logs.length}]`, {
          logType: 'error',
          module: log.module || 'client',
          clientLog: log,
        });
      } else if (log.level === 'warn') {
        logger.warn(`客户端警告日志 [${index + 1}/${logs.length}]`, {
          logType: 'security',
          module: log.module || 'client',
          clientLog: log,
        });
      }
    });

    res.status(201).json({
      success: true,
      message: `已接收 ${logs.length} 条日志`,
      received: logs.length,
    });
  } catch (error) {
    logger.error('批量接收客户端日志失败', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: '批量日志接收失败',
    });
  }
};

module.exports = {
  createClientLog,
  batchCreateClientLogs,
};
