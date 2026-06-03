// 文件名：playerRoutes.js
// 作者：开发者
// 日期：2026-03-21
// 版本：v1.1.0
// 功能描述：玩家路由

const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/data', authMiddleware, playerController.getPlayerData);
router.get('/info', authMiddleware, playerController.getPlayerInfo);
router.get(
  '/level-progress',
  authMiddleware,
  playerController.getLevelProgress
);
router.post('/check-upgrade', authMiddleware, playerController.checkAndUpgrade);
router.post(
  '/unlock-world-level',
  authMiddleware,
  playerController.unlockWorldLevelValidation,
  playerController.unlockWorldLevel
);
router.post(
  '/update-avatar',
  authMiddleware,
  playerController.updateAvatarValidation,
  playerController.updateAvatar
);
router.get('/stamina', authMiddleware, playerController.getStamina);
router.post('/stamina/recover', authMiddleware, playerController.recoverStamina);
router.get('/offline-rewards', authMiddleware, playerController.getOfflineRewards);

module.exports = router;
