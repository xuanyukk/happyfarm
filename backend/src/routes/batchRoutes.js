//
// 文件名: batchRoutes.js
// 作者: Trae AI
// 日期: 2026-05-01
// 版本: v1.0.0
// 功能描述: 批量操作功能路由配置
// 更新记录:
//   2026-05-01 - v1.0.0 - 初始版本创建
//

const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

// 获取批量操作列表
router.get('/list', batchController.getBatchList);

// 获取批量操作详情
router.get('/:id', batchController.getBatchDetail);

// 创建批量操作
router.post('/', batchController.createBatch);

// 执行批量操作
router.post('/:id/execute', batchController.executeBatch);

// 取消批量操作
router.post('/:id/cancel', batchController.cancelBatch);

// 导出结果
router.get('/:id/export', batchController.exportResult);

// 批量更新状态
router.post('/status-update', batchController.batchStatusUpdate);

// 批量删除
router.post('/delete', batchController.batchDelete);

module.exports = router;
