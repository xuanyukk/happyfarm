/**
 * 文件名：logCleanupRoutes.js
 * 作者：开发者
 * 日期：2026-05-16
 * 版本：v1.0.0
 * 功能描述：日志清理路由
 * 更新记录：
 *   2026-05-16 - v1.0.0 - 初始版本
 */

const express = require('express');
const router = express.Router();
const logCleanupController = require('../controllers/logCleanupController');

// 获取日志保留策略
router.get('/policies', logCleanupController.getRetentionPolicies);

// 更新特定类型的保留策略
router.put('/policies/:logType', logCleanupController.updateRetentionPolicy);

// 获取磁盘使用情况
router.get('/usage', logCleanupController.getDiskUsage);

// 执行完整的日志清理
router.post('/cleanup', logCleanupController.cleanupAll);

// 清理指定类型的日志
router.post('/cleanup/:logType', logCleanupController.cleanupByType);

module.exports = router;
