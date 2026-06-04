/**
 * 文件名：dailyTaskRoutes.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：每日任务路由
 * 更新记录：
 *   2026-05-31 - v1.0.0 - LG-02修复：初始版本创建
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const dailyTaskController = require('../controllers/dailyTaskController');

router.get('/', authMiddleware, dailyTaskController.getDailyTasks);
router.post('/:taskId/claim', authMiddleware, dailyTaskController.claimReward);

module.exports = router;
