// 文件名：itemUsageLogRoutes.js
// 作者：SOLO
// 日期：2026-05-31
// 版本：v1.0.0
// 功能描述：道具使用日志路由

const express = require('express');
const router = express.Router();
const controller = require('../controllers/itemUsageLogController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

router.get('/mylogs', authMiddleware, controller.getMyLogs);
router.get('/stats', authMiddleware, adminMiddleware, controller.getStats);
router.get(
  '/anomalies',
  authMiddleware,
  adminMiddleware,
  controller.getAnomalies
);

module.exports = router;
