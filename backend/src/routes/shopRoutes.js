// 文件名：shopRoutes.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.1.0
// 功能描述：商店路由

const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/goods', authMiddleware, shopController.getGoods);
router.get('/inventory', authMiddleware, shopController.getInventory);
router.post(
  '/buy',
  authMiddleware,
  shopController.buyGoodsValidation,
  shopController.buyGoods
);
router.post(
  '/sell',
  authMiddleware,
  shopController.sellItemValidation,
  shopController.sellItem
);
router.get(
  '/inventory-slots',
  authMiddleware,
  shopController.getInventorySlots
);

module.exports = router;
