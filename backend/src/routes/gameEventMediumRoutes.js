
/**
 * 文件名: gameEventMediumRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-22
 * 版本: v1.0.0
 * 功能描述: 游戏活动中期规划路由 (模板系统 + 定时任务)
 */

const express = require('express');
const router = express.Router();
const { templateController, schedulerController } = require('../controllers/gameEventMediumController');

// 模板系统路由
router.get('/templates', templateController.getAllTemplates);
router.get('/templates/:id', templateController.getTemplate);
router.post('/templates', templateController.createTemplate);
router.put('/templates/:id', templateController.updateTemplate);
router.post('/templates/:id/create-event', templateController.createEventFromTemplate);
router.delete('/templates/:id', templateController.deactivateTemplate);
router.get('/templates/:id/compare', templateController.compareVersions);

// 定时任务路由
router.get('/scheduler/task-types', schedulerController.getAvailableTasks);
router.get('/scheduler/tasks', schedulerController.getTasks);
router.get('/scheduler/tasks/:id', schedulerController.getTask);
router.post('/scheduler/tasks', schedulerController.createTask);
router.delete('/scheduler/tasks/:id', schedulerController.cancelTask);

module.exports = router;

