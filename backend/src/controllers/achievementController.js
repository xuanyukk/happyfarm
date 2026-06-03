/**
 * 文件名：achievementController.js
 * 作者：开发者
 * 日期：2026-03-27
 * 版本：v1.0.0
 * 功能描述：成就系统API控制器，处理成就相关的HTTP请求
 * 更新记录：
 *   2026-03-27 - v1.0.0 - 新建文件，实现成就系统API
 */

const achievementService = require('../services/achievementService');

/**
 * 获取玩家成就列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getPlayerAchievements = async function (req, res) {
  try {
    const playerId = req.user.id;
    const achievements =
      await achievementService.getPlayerAchievements(playerId);
    res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('获取玩家成就失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就列表失败',
    });
  }
};

/**
 * 获取玩家已解锁的成就
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getUnlockedAchievements = async function (req, res) {
  try {
    const playerId = req.user.id;
    const achievements =
      await achievementService.getUnlockedAchievements(playerId);
    res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('获取已解锁成就失败:', error);
    res.status(500).json({
      success: false,
      message: '获取已解锁成就失败',
    });
  }
};
