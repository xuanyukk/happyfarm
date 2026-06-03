/**
 * 文件名：achievementRoutes.js
 * 作者：开发者
 * 日期：2026-03-27
 * 版本：v1.0.0
 * 功能描述：成就系统路由配置
 * 更新记录：
 *   2026-03-27 - v1.0.0 - 新建文件，添加成就系统路由
 */

const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authMiddleware } = require('../middleware/authMiddleware');

// 获取玩家成就列表
router.get(
  '/achievements',
  authMiddleware,
  achievementController.getPlayerAchievements
);

// 获取玩家已解锁的成就
router.get(
  '/achievements/unlocked',
  authMiddleware,
  achievementController.getUnlockedAchievements
);

module.exports = router;
