/**
 * 文件名：farmController.example.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：农场控制器 - 使用DI容器的示例版本
 * 更新记录：
 *   2026-05-01 - v1.0.0 - 初始版本，展示如何使用DI容器
 *
 * 说明：
 * - 这是一个示例文件，展示如何使用DI容器
 * - 原文件（farmController.js）保持不变，向后兼容
 */

const { body, validationResult } = require('express-validator');
const serviceProvider = require('../config/serviceProvider');

// ==========================================
// 方式1：在Controller顶部直接获取服务（推荐）
// ==========================================
const farmService = serviceProvider.get('farmService');
const achievementService = serviceProvider.get('achievementService');
const logger = serviceProvider.get('logger');
const wsService = serviceProvider.get('websocketService');

/**
 * 获取玩家所有地块
 */
exports.getLands = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const lands = await farmService.getPlayerLands(playerId);
    res.status(200).json({ success: true, data: lands });
  } catch (error) {
    logger.error('获取地块失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 解锁地块
 */
exports.unlockLand = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const landNum = parseInt(req.params.landNum);
    const result = await farmService.unlockLand(playerId, landNum);

    // 触发成就系统 - 解锁地块
    await achievementService.checkAndUpdateAchievements(playerId, 'farm');

    // 推送WebSocket消息
    wsService.sendToUser(playerId, 'land_unlocked', {
      landNum: result.landNum,
      cost: result.cost,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('解锁地块失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 方式2：在函数内部获取服务（更灵活，但性能稍差）
// ==========================================
exports.exampleDynamicGet = async function (req, res) {
  try {
    // 动态获取服务（每次调用都获取）
    const dynamicFarmService = serviceProvider.get('farmService');
    const playerId = req.user.id.toString();
    const lands = await dynamicFarmService.getPlayerLands(playerId);

    res.status(200).json({ success: true, data: lands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
