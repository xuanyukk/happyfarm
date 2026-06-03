/**
 * 文件名: adminShopRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台商店商品管理路由
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminShopController = require('../controllers/adminShopController');

router.use(checkAdminPermission);

router.get('/', adminShopController.getShopGoodsList);
router.get('/:goodsId', adminShopController.getShopGoodsDetail);
router.post('/', adminShopController.createShopGoodsValidation, adminShopController.createShopGoods);
router.put('/:goodsId', adminShopController.updateShopGoodsValidation, adminShopController.updateShopGoods);
router.delete('/:goodsId', adminShopController.deleteShopGoods);
router.post('/:goodsId/status', adminShopController.toggleShopGoodsStatus);

module.exports = router;