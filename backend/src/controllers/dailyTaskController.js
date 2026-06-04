/**
 * 文件名：dailyTaskController.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：每日任务控制器——获取任务列表、领取奖励
 * 更新记录：
 *   2026-05-31 - v1.0.0 - LG-02修复：初始版本创建
 */

const dailyTaskService = require('../services/dailyTaskService');
const logger = require('../config/logger');

exports.getDailyTasks = async function (req, res) {
  try {
    const playerId = req.user.playerId;
    const result = await dailyTaskService.getPlayerDailyTasks(playerId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取每日任务失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.claimReward = async function (req, res) {
  try {
    const playerId = req.user.playerId;
    const taskId = parseInt(req.params.taskId);
    if (!taskId || taskId <= 0) {
      return res.status(400).json({ success: false, message: '无效的任务ID' });
    }
    const result = await dailyTaskService.claimTaskReward(playerId, taskId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('领取每日任务奖励失败', { error: error.message });
    const statusMap = {
      任务未完成: 400,
      奖励已领取: 400,
      今日任务不存在: 404,
    };
    const status = statusMap[error.message] || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
