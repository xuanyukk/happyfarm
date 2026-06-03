/**
 * 文件名: configRoutes.js
 * 作者: Trae AI
 * 日期: 2026-04-30
 * 版本: v1.3.0
 * 功能描述: 游戏参数配置管理路由配置
 * 更新记录:
 *   2026-04-30 - v1.0.0 - 初始版本创建
 *   2026-05-06 - v1.1.0 - 添加配置热更新相关路由
 *   2026-05-26 - v1.2.0 - 添加变更历史增强路由(版本对比、回滚预览、统计、导出)
 *   2026-05-26 - v1.3.0 - 集成 express-validator 请求验证
 */

const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const validate = require('../middleware/validate');

// 配置分类
router.get('/categories', configController.getConfigCategories);

// 配置列表
router.get('/list', configController.getConfigList);

// 变更统计(必须在 /:key 之前，避免 statistics 被当作 key)
router.get('/statistics', configController.getChangeStatistics);

// 配置详情
router.get('/:key', configController.getConfigDetail);

// 创建配置（需要请求体验证）
router.post('/', validate.createConfig, configController.createConfig);

// 更新配置（需要请求体验证）
router.put('/:key', validate.updateConfig, configController.updateConfig);

// 删除配置
router.delete('/:key', configController.deleteConfig);

// 配置历史版本
router.get('/:key/history', configController.getConfigHistory);

// 恢复配置版本
router.post('/:key/restore', configController.restoreConfigVersion);

// ==================== 变更历史增强路由 ====================

// 版本对比
router.get('/:key/compare', configController.compareConfigVersions);

// 回滚预览
router.get('/:key/rollback-preview', configController.getRollbackPreview);

// 增强版回滚（需要请求体验证 + 填写原因）
router.post('/:key/rollback', validate.rollbackConfig, configController.rollbackConfig);

// 导出变更历史
router.get('/:key/history/export', configController.exportChangeHistory);

// 导出配置
router.post('/export', configController.exportConfigs);

// 审批请求
router.post('/:key/approve-request', configController.createApprovalRequest);
router.put('/approve-request/:id', configController.approveConfigChange);
router.get('/approval-requests/list', configController.getApprovalRequests);

// ==================== 配置热更新相关路由 ====================

// 获取配置缓存状态
router.get('/cache/status', configController.getCacheStatus);

// 刷新配置缓存
router.post('/cache/refresh/:key', configController.refreshCache);

// 获取缓存中的配置
router.get('/cache/:key', configController.getCachedConfig);

// 批量更新配置（需要请求体验证）
router.post('/batch/update', validate.batchUpdateConfigs, configController.batchUpdateConfigs);

// 导入配置
router.post('/import', configController.importConfigs);

module.exports = router;
