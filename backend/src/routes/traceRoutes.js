/**
 * 文件名：traceRoutes.js
 * 作者：开发者
 * 日期：2026-05-16
 * 版本：v1.0.0
 * 功能描述：链路追踪路由
 * 更新记录：
 *   2026-05-16 - v1.0.0 - 初始版本，链路追踪路由
 */

const express = require('express');
const router = express.Router();
const traceController = require('../controllers/traceController');

/**
 * 获取追踪详情
 * GET /api/traces/:traceId
 */
router.get('/:traceId', traceController.getTrace);

/**
 * 根据requestId获取追踪
 * GET /api/traces/request/:requestId
 */
router.get('/request/:requestId', traceController.getTraceByRequestId);

/**
 * 搜索追踪信息
 * GET /api/traces
 */
router.get('/', traceController.searchTraces);

/**
 * 获取追踪统计信息
 * GET /api/traces/stats/overview
 */
router.get('/stats/overview', traceController.getTraceStats);

/**
 * 开始一个新的追踪（手动调用）
 * POST /api/traces
 */
router.post('/', traceController.startManualTrace);

/**
 * 结束追踪（手动调用）
 * POST /api/traces/:traceId/end
 */
router.post('/:traceId/end', traceController.endManualTrace);

/**
 * 记录追踪事件
 * POST /api/traces/:traceId/events
 */
router.post('/:traceId/events', traceController.recordTraceEvent);

module.exports = router;
