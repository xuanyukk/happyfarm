/**
 * 文件名：economyRoutes.js
 * 作者：开发者
 * 日期：2026-03-22
 * 版本：v1.1.0
 * 功能描述：经济系统API路由
 * 更新记录：
 *   2026-03-22 - v1.1.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const economyController = require('../controllers/economyController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/logs', economyController.getCurrencyLogs);
router.get('/stats/earnings', economyController.getEarningsStats);
router.get('/stats/spendings', economyController.getSpendingsStats);

module.exports = router;
