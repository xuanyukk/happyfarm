/**
 * 文件名：grafanaRoutes.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v1.0.0
 * 功能描述：Grafana 监控仪表板路由配置
 * 更新记录：
 *   2026-05-26 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const grafanaController = require('../controllers/grafanaController');

/** GET /api/grafana/config - 获取Grafana配置信息 */
router.get('/config', grafanaController.getGrafanaConfig);

module.exports = router;
