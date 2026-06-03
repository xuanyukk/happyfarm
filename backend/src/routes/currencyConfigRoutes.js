/**
 * 文件名：currencyConfigRoutes.js
 * 作者：开发者
 * 日期：2026-05-25
 * 版本：v1.0.0
 * 功能描述：货币配置管理路由
 * 更新记录：
 *   2026-05-25 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/currencyConfigController');
const { authMiddleware } = require('../middleware/authMiddleware');

// 公共接口（无需管理员权限）
router.get('/public', ctrl.getPublicCurrencyConfig);

// 导入宝石币端点
const {
  getCurrencyConfigList,
  getCurrencyConfigById,
  updateCurrencyConfig,
  batchUpdateCurrencyConfig,
  getFormatPreview,
  clearCurrencyCache,
  getGemBalance,
  addGems,
} = ctrl;

// 宝石币公开端点（需认证但无需管理员权限）
router.get('/gem/balance', getGemBalance);

// 应用认证和管理员权限
router.use(authMiddleware);

router.get('/', getCurrencyConfigList);
router.get('/format-preview', getFormatPreview);
router.get('/:id', getCurrencyConfigById);
router.put('/:id', updateCurrencyConfig);
router.post('/batch', batchUpdateCurrencyConfig);
router.post('/clear-cache', clearCurrencyCache);

// 宝石币管理员端点
router.post('/gem/add', addGems);

module.exports = router;
