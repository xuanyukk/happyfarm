/**
 * 文件名: adminAnalyticsController.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.1.0
 * 功能描述: 管理后台数据分析控制器
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 *   2026-06-01 - v1.1.0 - 服务层新增trends字段，控制器兼容返回趋势数据；getShopStats返回复购率和新用户购买；getTransactionList返回真实金额/余额/用户名
 */

const adminAnalyticsService = require('../services/adminAnalyticsService');
const logger = require('../config/logger');

/**
 * 获取经济分析数据
 */
exports.getEconomyStats = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getEconomyStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取经济分析数据失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取交易记录列表
 */
exports.getTransactionList = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getTransactionList(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取交易记录失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取商店统计数据
 */
exports.getShopStats = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getShopStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取商店统计失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取经济预警列表
 */
exports.getEconomyAlerts = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getEconomyAlerts();
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取经济预警失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取玩家分析数据
 */
exports.getPlayerAnalytics = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getPlayerAnalytics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取玩家分析数据失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取玩家排行榜
 */
exports.getTopPlayers = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getTopPlayers(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取玩家排行失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取玩家异常行为预警
 */
exports.getPlayerAlerts = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getPlayerAlerts();
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取玩家预警失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取玩家画像数据
 */
exports.getPlayerProfile = async function (req, res) {
  try {
    const data = await adminAnalyticsService.getPlayerProfile();
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('获取玩家画像失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};