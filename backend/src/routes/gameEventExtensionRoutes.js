/**
 * 文件名：gameEventExtensionRoutes.js
 * 作者：Trae AI
 * 日期：2026-05-22
 * 版本：v1.0.0
 * 功能描述：游戏活动扩展功能路由（触发器、统计）
 * 更新记录：
 *   2026-05-22 - v1.0.0 - 初始版本
 */

const express = require('express');
const router = express.Router();
const gameEventExtensionController = require('../controllers/gameEventExtensionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkAdminPermission } = require('../controllers/adminController');

// ==================== 触发器管理 ====================
router.post(
  '/triggers',
  authMiddleware,
  checkAdminPermission,
  gameEventExtensionController.createTrigger
);
router.get(
  '/triggers',
  authMiddleware,
  checkAdminPermission,
  gameEventExtensionController.getAllTriggers
);
router.get(
  '/events/:eventId/triggers',
  authMiddleware,
  gameEventExtensionController.getEventTriggers
);
router.put(
  '/triggers/:triggerId',
  authMiddleware,
  checkAdminPermission,
  gameEventExtensionController.updateTrigger
);
router.delete(
  '/triggers/:triggerId',
  authMiddleware,
  checkAdminPermission,
  gameEventExtensionController.deleteTrigger
);

// ==================== 统计管理 ====================
router.post(
  '/stats/events/:eventId/compute',
  authMiddleware,
  checkAdminPermission,
  gameEventExtensionController.computeEventStats
);
router.post(
  '/stats/compute-all',
  authMiddleware,
  checkAdminPermission,
  gameEventExtensionController.computeAllEventsStats
);
router.get(
  '/stats/events/:eventId',
  authMiddleware,
  gameEventExtensionController.getEventStats
);
router.get(
  '/stats/events/:eventId/funnel',
  authMiddleware,
  gameEventExtensionController.getEventFunnel
);

// ==================== WebSocket 管理 ====================
router.get(
  '/websocket/queue-stats',
  authMiddleware,
  checkAdminPermission,
  gameEventExtensionController.getWebSocketQueueStats
);

module.exports = router;
