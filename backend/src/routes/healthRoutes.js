/**
 * 文件名：healthRoutes.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：健康检查路由
 */

const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthCheck');

router.get('/health', healthCheck);

module.exports = router;
