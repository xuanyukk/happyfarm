/**
 * 文件名：clientLogRoutes.js
 * 作者：开发者
 * 日期：2026-05-15
 * 版本：v1.0.0
 * 功能描述：客户端日志上报路由
 */

const express = require('express');
const router = express.Router();
const {
  createClientLog,
  batchCreateClientLogs,
} = require('../controllers/clientLogController');

// 单条日志上报
router.post('/', createClientLog);

// 批量日志上报
router.post('/batch', batchCreateClientLogs);

module.exports = router;
