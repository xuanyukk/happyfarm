/**
 * 文件名：adminRoutes.js
 * 作者：开发者
 * 日期：2026-06-06
 * 版本：v2.0.0
 * 功能描述：管理员核心路由——仪表板、玩家管理、审批流程、统计分析
 * 更新记录：
 *   2026-06-06 - v1.0.0 - 创建占位文件，解决模块找不到错误
 *   2026-06-09 - v2.0.0 - 全面重写，接入 adminController 已实现的全部功能，
 *                         连接仪表板、玩家管理、审批流、货币分析、统计数据
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// 所有路由需要认证 + 管理员权限
router.use(authMiddleware.verifyToken);
router.use(adminController.checkAdminPermission);

// ====== 仪表板 ======
router.get('/dashboard', adminController.getDashboardData);

// ====== 玩家管理 ======
router.get('/players', adminController.getPlayerList);
router.get('/players/:playerId', adminController.getPlayerDetail);
router.put('/players/:playerId/status',
  adminController.updatePlayerStatusValidation,
  adminController.updatePlayerStatus
);

// ====== 审批流程 ======
router.get('/approvals', adminController.getApprovalList);
router.post('/approvals',
  adminController.createApprovalRequestValidation,
  adminController.createApprovalRequest
);
router.post('/approvals/:requestId/approve',
  adminController.approveOperationValidation,
  adminController.approveOperation
);

// ====== 操作日志 ======
// 注：详细日志功能在 adminManagementRoutes.js 中

// ====== 货币平衡 ======
router.get('/currency-balance', adminController.getCurrencyBalanceData);

// ====== 数据统计 ======
router.get('/statistics', adminController.getStatisticsData);

// ====== 文档管理 ======
router.get('/docs/export', adminController.exportDatabaseDocs);
router.get('/docs/structure', adminController.getTableStructureDoc);
router.get('/docs/data', adminController.getTableDataDoc);

module.exports = router;