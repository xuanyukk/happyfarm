/**
 * 文件名：economyController.js
 * 作者：开发者
 * 日期：2026-03-22
 * 版本：v1.1.1
 * 功能描述：经济系统API控制器
 * 更新记录：
 *   2026-03-22 - v1.1.1 - 恢复真实的 economyService 调用
 *   2026-03-22 - v1.1.0 - 初始版本创建
 */

const economyService = require('../services/economyService');
const logger = require('../config/logger');

/**
 * 获取货币流水记录
 * @swagger
 * /api/economy/logs:
 *   get:
 *     summary: 获取货币流水记录
 *     description: 获取玩家的货币交易流水记录，支持分页和类型筛选
 *     tags: [经济系统]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: changeType
 *         schema:
 *           type: string
 *           enum: [earn, spend]
 *         description: 交易类型筛选
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
async function getCurrencyLogs(req, res) {
  try {
    const playerId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const changeType = req.query.changeType || null;

    const result = await economyService.getCurrencyLogs(
      playerId,
      page,
      limit,
      changeType
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('获取货币流水失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取货币流水失败',
    });
  }
}

/**
 * 获取收入统计
 * @swagger
 * /api/economy/stats/earnings:
 *   get:
 *     summary: 获取收入统计
 *     description: 获取玩家的收入统计数据
 *     tags: [经济系统]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
async function getEarningsStats(req, res) {
  try {
    const playerId = req.user.id;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    const stats = await economyService.getEarningsStats(
      playerId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取收入统计失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取收入统计失败',
    });
  }
}

/**
 * 获取支出统计
 * @swagger
 * /api/economy/stats/spendings:
 *   get:
 *     summary: 获取支出统计
 *     description: 获取玩家的支出统计数据
 *     tags: [经济系统]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期 (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期 (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
async function getSpendingsStats(req, res) {
  try {
    const playerId = req.user.id;
    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;

    const stats = await economyService.getSpendingsStats(
      playerId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取支出统计失败', { error: error.message });
    res.status(500).json({
      success: false,
      message: '获取支出统计失败',
    });
  }
}

module.exports = {
  getCurrencyLogs,
  getEarningsStats,
  getSpendingsStats,
};
