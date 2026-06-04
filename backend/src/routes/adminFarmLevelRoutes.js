/**
 * 文件名: adminFarmLevelRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台农场等级管理路由
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminFarmLevelController = require('../controllers/adminFarmLevelController');

router.use(checkAdminPermission);

router.get('/', adminFarmLevelController.getFarmLevelList);
router.get('/:levelId', adminFarmLevelController.getFarmLevelDetail);
router.post(
  '/',
  adminFarmLevelController.createFarmLevelValidation,
  adminFarmLevelController.createFarmLevel
);
router.put(
  '/:levelId',
  adminFarmLevelController.updateFarmLevelValidation,
  adminFarmLevelController.updateFarmLevel
);
router.delete('/:levelId', adminFarmLevelController.deleteFarmLevel);

module.exports = router;
