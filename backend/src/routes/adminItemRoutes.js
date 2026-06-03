
/**
 * 文件名: adminItemRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-23
 * 版本: v1.0.0
 * 功能描述: 管理后台道具配置管理路由
 * 更新记录:
 *   2026-05-23 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminItemController = require('../controllers/adminItemController');

router.use(checkAdminPermission);

router.get('/', adminItemController.getItemList);
router.get('/:itemId', adminItemController.getItemDetail);
router.post('/', adminItemController.createItemValidation, adminItemController.createItem);
router.put('/:itemId', adminItemController.updateItemValidation, adminItemController.updateItem);
router.delete('/:itemId', adminItemController.deleteItem);

module.exports = router;

