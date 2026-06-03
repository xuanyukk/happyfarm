/**
 * 文件名：itemUsageLogController.js
 * 作者：SOLO
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：道具使用日志控制器 - 查询和统计分析接口
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 初始创建
 */

const { validationResult } = require('express-validator');
const itemUsageLogService = require('../services/itemUsageLogService');
const logger = require('../config/logger');

/**
 * 查询当前玩家的道具使用日志
 */
exports.getMyLogs = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const {
      itemId, usageScene, result,
      startTime, endTime,
      page = 1, limit = 20,
    } = req.query;

    const filters = {};
    if (itemId) {
      filters.itemId = parseInt(itemId, 10);
    }
    if (usageScene) {
      filters.usageScene = usageScene;
    }
    if (result) {
      filters.result = result;
    }
    if (startTime) {
      filters.startTime = startTime;
    }
    if (endTime) {
      filters.endTime = endTime;
    }

    const data = await itemUsageLogService.queryLogs(
      playerId,
      filters,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('查询道具使用日志失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取道具使用统计（管理接口）
 */
exports.getStats = async function (req, res) {
  try {
    const { startTime, endTime, limit = 20 } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: '请提供统计时间范围 startTime 和 endTime',
      });
    }

    const data = await itemUsageLogService.getItemUsageStats(
      startTime,
      endTime,
      parseInt(limit, 10)
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取道具使用统计失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 防作弊异常检测（管理接口）
 */
exports.getAnomalies = async function (req, res) {
  try {
    const { thresholdMinutes = 10, maxUsage = 100 } = req.query;

    const data = await itemUsageLogService.detectAnomalies(
      parseInt(thresholdMinutes, 10),
      parseInt(maxUsage, 10)
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('道具使用异常检测失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};