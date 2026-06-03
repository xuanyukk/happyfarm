
/**
 * 文件名: adminCropRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-23
 * 版本: v1.0.0
 * 功能描述: 管理后台作物配置管理路由
 * 更新记录:
 *   2026-05-23 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminCropController = require('../controllers/adminCropController');

router.use(checkAdminPermission);

router.get('/', adminCropController.getCropList);
router.get('/:cropId', adminCropController.getCropDetail);
router.post('/', adminCropController.createCropValidation, adminCropController.createCrop);
router.put('/:cropId', adminCropController.updateCropValidation, adminCropController.updateCrop);
router.delete('/:cropId', adminCropController.deleteCrop);

module.exports = router;

