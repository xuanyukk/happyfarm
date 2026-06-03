// 文件名：itemRoutes.js
// 作者：开发者
// 日期：2026-03-21
// 版本：v1.0.0
// 功能描述：道具路由

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/available', authMiddleware, itemController.getAvailableItems);
router.post(
  '/use',
  authMiddleware,
  itemController.useItemValidation,
  itemController.useItem
);

module.exports = router;
