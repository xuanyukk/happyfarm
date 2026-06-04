/**
 * 文件名: adminAchievementRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台成就管理路由
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminAchievementController = require('../controllers/adminAchievementController');

router.use(checkAdminPermission);

router.get('/', adminAchievementController.getAchievementList);
router.get('/:achievementId', adminAchievementController.getAchievementDetail);
router.post(
  '/',
  adminAchievementController.createAchievementValidation,
  adminAchievementController.createAchievement
);
router.put(
  '/:achievementId',
  adminAchievementController.updateAchievementValidation,
  adminAchievementController.updateAchievement
);
router.delete('/:achievementId', adminAchievementController.deleteAchievement);
router.get(
  '/:achievementId/statistics',
  adminAchievementController.getAchievementStatistics
);

module.exports = router;
