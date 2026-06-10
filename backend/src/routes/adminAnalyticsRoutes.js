/**
 * 文件名：adminAnalyticsRoutes.js
 * 作者：开发者
 * 日期：2026-06-09
 * 版本：v1.0.0
 * 功能描述：管理后台数据分析路由——经济分析 + 玩家分析
 * 更新记录：
 *   2026-06-09 - v1.0.0 - 初始创建，补全 adminAnalyticsController 路由注册
 */

const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// 所有路由需要认证 + 管理员权限
router.use(authMiddleware.verifyToken);
router.use(adminController.checkAdminPermission);

// ====== 经济分析 ======
router.get('/economy/stats', adminAnalyticsController.getEconomyStats);
router.get('/economy/transactions', adminAnalyticsController.getTransactionList);
router.get('/economy/shop-stats', adminAnalyticsController.getShopStats);
router.get('/economy/alerts', adminAnalyticsController.getEconomyAlerts);

// ====== 玩家分析 ======
router.get('/player/analytics', adminAnalyticsController.getPlayerAnalytics);
router.get('/player/top', adminAnalyticsController.getTopPlayers);
router.get('/player/alerts', adminAnalyticsController.getPlayerAlerts);
router.get('/player/:playerId', adminAnalyticsController.getPlayerProfile);

module.exports = router;