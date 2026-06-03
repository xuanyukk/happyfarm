/**
 * 文件名: alertRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-01
 * 版本: v1.0.0
 * 功能描述: 预警推送系统路由配置
 */
const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/rules', alertController.getRuleList);
router.post('/rules', alertController.createRule);
router.put('/rules/:id', alertController.updateRule);
router.delete('/rules/:id', alertController.deleteRule);

router.get('/records', alertController.getRecordList);
router.get('/records/:id', alertController.getRecordDetail);
router.put('/records/:id/read', alertController.markAsRead);
router.put('/records/:id/resolve', alertController.resolveRecord);
router.put('/records/:id/ignore', alertController.ignoreRecord);

router.post('/trigger', alertController.triggerDemo);
router.get('/stats/overview', alertController.getOverviewStats);

module.exports = router;
