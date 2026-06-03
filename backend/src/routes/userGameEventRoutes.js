/**
 * 文件名：userGameEventRoutes.js
 * 作者：开发者
 * 日期：2026-05-22
 * 版本：v1.0.0
 * 功能描述：普通用户游戏活动路由
 */

const express = require('express');
const router = express.Router();
const gameEventController = require('../controllers/gameEventController');
const { authMiddleware } = require('../middleware/authMiddleware');

// 获取所有活动（用户可见）
router.get('/', gameEventController.getAllEvents);

// 获取活跃活动
router.get('/active', gameEventController.getActiveEvents);

// 获取特定活动详情
router.get('/:id', gameEventController.getEventById);

// 获取活动任务
router.get('/:eventId/tasks', gameEventController.getEventTasks);

// 获取玩家活动进度（需要认证）
router.get(
  '/:eventId/progress',
  authMiddleware,
  (req, res, next) => {
    req.params.playerId = req.user.id;
    next();
  },
  gameEventController.getPlayerEventProgress
);

// 领取任务奖励（需要认证）
router.post(
  '/:eventId/tasks/:taskId/claim',
  authMiddleware,
  (req, res, next) => {
    req.params.playerId = req.user.id;
    next();
  },
  gameEventController.claimTaskReward
);

// 获取玩家活动统计（需要认证）
router.get(
  '/stats/my',
  authMiddleware,
  (req, res, next) => {
    req.params.playerId = req.user.id;
    next();
  },
  gameEventController.getPlayerEventStats
);

module.exports = router;
