/**
 * 文件名：dailyDiscountController.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：每日折扣控制器——处理折扣相关HTTP请求
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 方案B：初始创建
 */

const dailyDiscountService = require('../services/dailyDiscountService');
const logger = require('../config/logger');

/**
 * 获取当前每日折扣列表
 * GET /api/discounts
 */
const getDiscounts = async function (req, res) {
  try {
    const discounts = await dailyDiscountService.getDailyDiscounts();
    res.json({
      success: true,
      data: discounts,
      count: discounts.length,
    });
  } catch (error) {
    logger.error('获取折扣列表失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取折扣列表失败',
    });
  }
};

/**
 * 手动刷新每日折扣（管理后台）
 * POST /api/discounts/refresh
 */
const refreshDiscounts = async function (req, res) {
  try {
    const result = await dailyDiscountService.refreshDailyDiscounts();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('刷新折扣失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '刷新折扣失败',
    });
  }
};

module.exports = {
  getDiscounts,
  refreshDiscounts,
};
