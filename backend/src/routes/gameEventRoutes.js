/**
 * 文件名：gameEventRoutes.js
 * 作者：开发者
 * 日期：2026-05-22
 * 版本：v1.2.0
 * 功能描述：游戏活动管理路由（需管理员权限）
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本
 *   2026-05-22 - v1.1.0 - 添加权限保护中间件
 *   2026-05-31 - v1.2.0 - 移除 /events 路径前缀，与前端 adminService 路径匹配；
 *                         stats 重命名为 statistics；新增管理后台进度查询端点
 */

const express = require('express');
const router = express.Router();
const gameEventController = require('../controllers/gameEventController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkAdminPermission } = require('../controllers/adminController');

router.use(authMiddleware);
router.use(checkAdminPermission);

// ==================== 活动管理 ====================

router.get('/', gameEventController.getAllEvents);

router.get('/active', gameEventController.getActiveEvents);

router.get('/:id', gameEventController.getEventById);

router.post('/', gameEventController.createEvent);

router.put('/:id', gameEventController.updateEvent);

router.delete('/:id', gameEventController.deleteEvent);

router.post('/:id/start', gameEventController.startEvent);
router.post('/:id/pause', gameEventController.pauseEvent);
router.post('/:id/end', gameEventController.endEvent);
router.post('/:id/resume', gameEventController.resumeEvent);

// ==================== 任务管理 ====================

router.get('/:eventId/tasks', gameEventController.getEventTasks);

router.post('/:eventId/tasks', gameEventController.addTask);

router.put('/tasks/:taskId', gameEventController.updateTask);

router.delete('/tasks/:taskId', gameEventController.deleteTask);

// ==================== 玩家进度 ====================

router.get(
  '/players/:playerId/events/:eventId/progress',
  gameEventController.getPlayerEventProgress
);

router.get('/:eventId/progress', gameEventController.getAdminEventProgress);

router.post(
  '/players/:playerId/events/:eventId/tasks/:taskId/claim',
  gameEventController.claimTaskReward
);

// ==================== 统计 ====================

router.get('/:eventId/statistics', gameEventController.getEventStats);

router.get('/players/:playerId/stats', gameEventController.getPlayerEventStats);

module.exports = router;