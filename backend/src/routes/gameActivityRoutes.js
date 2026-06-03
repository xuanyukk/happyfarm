/**
 * 文件名：gameActivityRoutes.js
 * 作者：开发者
 * 日期：2026-03-26
 * 版本：v1.0.0
 * 功能描述：游戏活动日志路由
 */

const express = require('express');
const router = express.Router();
const gameActivityController = require('../controllers/gameActivityController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/recent', gameActivityController.getRecentActivities);
router.get('/all', gameActivityController.getPlayerActivities);

module.exports = router;
