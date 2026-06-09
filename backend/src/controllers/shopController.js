/**
 * 文件名：shopController.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.1.1
 * 功能描述：商店控制器，处理商品购买、库存查询等API
 * 更新记录：
 *   2026-03-19 - v1.0.0 - 商店控制器，处理商品购买、库存查询等API
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-06-10 - v1.1.1 - 统一catch块错误处理，使用handleError根据error.statusCode动态返回HTTP状态码
 */

const { body, validationResult } = require('express-validator');
const shopService = require('../services/shopService');
const playerService = require('../services/playerService');
const logger = require('../config/logger');

/**
 * 统一错误处理 - 根据 error.statusCode 动态返回 HTTP 状态码
 * @param {Object} res - Express response 对象
 * @param {Error} error - 错误对象
 * @param {string} defaultMsg - 默认错误消息
 */
const handleError = (res, error, defaultMsg) => {
  const statusCode = error.statusCode || 400;
  return res.status(statusCode).json({
    success: false,
    message: error.message || defaultMsg,
    code: error.code || 'UNKNOWN_ERROR',
  });
};

/**
 * 获取商店商品列表
 * @swagger
 * /api/shop/goods:
 *   get:
 *     summary: 获取商品列表
 *     tags: [商店]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getGoods = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const playerData = await playerService.getPlayerData(playerId);
    const playerLevel = playerData?.player_level || 1;
    const worldLevel = playerData?.world_level || 1;
    const goods = await shopService.getShopGoods(playerLevel, worldLevel);
    res.status(200).json({ success: true, data: goods });
  } catch (error) {
    logger.error('获取商品列表失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 获取玩家库存
 * @swagger
 * /api/shop/inventory:
 *   get:
 *     summary: 获取库存
 *     tags: [商店]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getInventory = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const inventory = await shopService.getPlayerInventory(playerId);
    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    logger.error('获取库存失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 购买商品
 * @swagger
 * /api/shop/buy:
 *   post:
 *     summary: 购买商品
 *     tags: [商店]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goodsId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.buyGoods = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { goodsId, quantity } = req.body;
    const result = await shopService.buyGoods(playerId, goodsId, quantity);
    res.status(200).json(result);
  } catch (error) {
    logger.error('购买商品失败', { error: error.message });
    return handleError(res, error);
  }
};

exports.buyGoodsValidation = [
  body('goodsId').isInt({ min: 1 }).withMessage('商品ID无效'),
  body('quantity').isInt({ min: 1 }).withMessage('数量无效'),
];

/**
 * 出售道具
 * @swagger
 * /api/shop/sell:
 *   post:
 *     summary: 出售道具
 *     tags: [商店]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.sellItem = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { itemId, quantity } = req.body;
    const result = await shopService.sellItem(playerId, itemId, quantity);
    res.status(200).json(result);
  } catch (error) {
    logger.error('出售道具失败', { error: error.message });
    return handleError(res, error);
  }
};

exports.sellItemValidation = [
  body('itemId').isInt({ min: 1 }).withMessage('道具ID无效'),
  body('quantity').isInt({ min: 1 }).withMessage('数量无效'),
];

exports.getInventorySlots = async function (req, res) {
  try {
    const maxSlots = await shopService.getMaxInventorySlots();
    res.status(200).json({ success: true, data: { maxSlots } });
  } catch (error) {
    logger.error('获取背包槽位失败', { error: error.message });
    return handleError(res, error);
  }
};
