/**
 * 文件名：adminGameConfigRoutes.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：管理后台游戏配置管理路由——player_level/daily_task/item_drop CRUD
 * 更新记录：
 *   2026-05-31 - v1.0.0 - LG-01修复：初始版本创建
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminGameConfigController = require('../controllers/adminGameConfigController');

router.use(checkAdminPermission);

router.get('/:type', adminGameConfigController.getList);
router.get('/:type/:id', adminGameConfigController.getDetail);
router.post('/:type', adminGameConfigController.createValidation, adminGameConfigController.create);
router.put('/:type/:id', adminGameConfigController.updateValidation, adminGameConfigController.update);
router.delete('/:type/:id', adminGameConfigController.remove);

module.exports = router;