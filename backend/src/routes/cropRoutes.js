/**
 * 文件名：cropRoutes.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.2.0
 * 功能描述：作物路由
 * 更新记录：
 *   2026-03-22 - v1.2.0 - 添加一键收获路由
 */

const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, cropController.getCrops);
router.post(
  '/plant',
  authMiddleware,
  cropController.plantCropValidation,
  cropController.plantCrop
);
router.post('/:landNum/harvest', authMiddleware, cropController.harvestCrop);
router.post('/harvest-all', authMiddleware, cropController.harvestAllMatured);
router.post(
  '/sell',
  authMiddleware,
  cropController.sellCropValidation,
  cropController.sellCrop
);
router.post(
  '/sell-batch',
  authMiddleware,
  cropController.sellBatchCropsValidation,
  cropController.sellBatchCrops
);

module.exports = router;
