/**
 * 文件名：dailyDiscountRoutes.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：每日折扣路由——折扣相关API接口
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 方案B：初始创建
 */

const express = require('express');
const router = express.Router();
const dailyDiscountController = require('../controllers/dailyDiscountController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/discounts', authMiddleware, dailyDiscountController.getDiscounts);
router.post('/discounts/refresh', authMiddleware, dailyDiscountController.refreshDiscounts);

module.exports = router;