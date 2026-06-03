/**
 * 文件名：gameActivityController.js
 * 作者：开发者
 * 日期：2026-03-26
 * 版本：v1.0.0
 * 功能描述：游戏活动日志控制器 - 处理游戏活动日志相关请求
 */

const gameActivityService = require('../services/gameActivityService');

const gameActivityController = {
  async getRecentActivities(req, res) {
    try {
      const playerId = req.user.id.toString();
      const limit = parseInt(req.query.limit) || 20;
      const sinceId = parseInt(req.query.since_id) || 0;

      const activities = await gameActivityService.getRecentActivities(
        playerId,
        limit,
        sinceId
      );

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      console.error('获取最近活动日志失败:', error);
      res.status(500).json({
        success: false,
        message: '获取活动日志失败',
      });
    }
  },

  async getPlayerActivities(req, res) {
    try {
      const playerId = req.user.id.toString();
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const activities = await gameActivityService.getPlayerActivities(
        playerId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      console.error('获取玩家活动日志失败:', error);
      res.status(500).json({
        success: false,
        message: '获取活动日志失败',
      });
    }
  },
};

module.exports = gameActivityController;
