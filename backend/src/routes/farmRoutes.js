/**
 * 文件名：farmRoutes.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.3.0
 * 功能描述：农场路由
 * 更新记录：
 *   2026-03-29 - v1.2.0 - 添加增量数据接口
 *   2026-06-10 - v1.3.0 - 补全 unlockLand/upgradeLandStar 参数校验中间件
 */

const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const incrementalController = require('../controllers/incrementalController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/lands', authMiddleware, farmController.getLands);
router.post(
  '/lands/:landNum/unlock',
  authMiddleware,
  farmController.unlockLandValidation,
  farmController.unlockLand
);
router.post(
  '/lands/:landNum/quality',
  authMiddleware,
  farmController.upgradeLandQualityValidation,
  farmController.upgradeLandQuality
);
router.post(
  '/lands/:landNum/star',
  authMiddleware,
  farmController.upgradeLandStarValidation,
  farmController.upgradeLandStar
);
router.get(
  '/star-configs/:qualityId',
  authMiddleware,
  farmController.getLandStarConfigs
);
router.get(
  '/incremental',
  authMiddleware,
  incrementalController.getIncrementalData
);

module.exports = router;
