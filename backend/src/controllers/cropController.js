/**
 * 文件名：cropController.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.2.1
 * 功能描述：作物控制器，处理种植、收获、出售等API
 * 更新记录：
 *   2026-03-19 - v1.0.0 - 作物控制器，处理种植、收获、出售等API
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-03-22 - v1.2.0 - 添加一键收获接口
 *   2026-06-10 - v1.2.1 - 统一catch块错误处理，使用handleError根据error.statusCode动态返回HTTP状态码
 */

const { body, validationResult } = require('express-validator');
const cropService = require('../services/cropService');
const playerService = require('../services/playerService');
const achievementService = require('../services/achievementService');
const logger = require('../config/logger');
const wsService = require('../services/websocketService');

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
 * 获取已解锁作物列表
 * @swagger
 * /api/crops:
 *   get:
 *     summary: 获取作物列表
 *     tags: [作物]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getCrops = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const playerData = await playerService.getPlayerData(playerId);
    const worldLevel = playerData?.world_level || 1;
    const crops = await cropService.getUnlockedCrops(null, worldLevel);
    res.status(200).json({ success: true, data: crops });
  } catch (error) {
    logger.error('获取作物列表失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 种植作物
 * @swagger
 * /api/crops/plant:
 *   post:
 *     summary: 种植作物
 *     tags: [作物]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               landNum:
 *                 type: integer
 *               cropId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.plantCrop = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { landNum, cropId } = req.body;
    const result = await cropService.plantCrop(playerId, landNum, cropId);

    // 触发成就系统 - 种植作物
    await achievementService.checkAndUpdateAchievements(playerId, 'farming');

    // 推送WebSocket消息
    wsService.sendToUser(playerId, 'crop_planted', {
      landNum,
      cropId,
      cropName: result.cropName,
      harvestTime: result.harvestTime,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('种植作物失败', { error: error.message });
    return handleError(res, error);
  }
};

exports.plantCropValidation = [
  body('landNum').isInt({ min: 1, max: 50 }).withMessage('地块序号无效'),
  body('cropId').isInt({ min: 1 }).withMessage('作物ID无效'),
];

/**
 * 收获作物
 * @swagger
 * /api/crops/{landNum}/harvest:
 *   post:
 *     summary: 收获作物
 *     tags: [作物]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: landNum
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.harvestCrop = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const landNum = parseInt(req.params.landNum);
    const result = await cropService.harvestCrop(playerId, landNum);

    // 触发成就系统 - 收获作物
    await achievementService.checkAndUpdateAchievements(playerId, 'farming');

    // 推送WebSocket消息
    wsService.sendToUser(playerId, 'crop_harvested', {
      landNum,
      cropName: result.cropName,
      yield: result.yield,
      exp: result.exp,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('收获作物失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 出售作物
 * @swagger
 * /api/crops/sell:
 *   post:
 *     summary: 出售作物
 *     tags: [作物]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cropId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.sellCrop = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { cropId, quantity } = req.body;
    const result = await cropService.sellCrop(playerId, cropId, quantity);

    // 触发成就系统 - 出售作物
    await achievementService.checkAndUpdateAchievements(
      playerId,
      'economy',
      quantity
    );

    // 推送WebSocket消息
    wsService.sendToUser(playerId, 'crop_sold', {
      cropId,
      cropName: result.cropName,
      quantity,
      income: result.income,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('出售作物失败', { error: error.message });
    return handleError(res, error);
  }
};

exports.sellCropValidation = [
  body('cropId').isInt({ min: 1 }).withMessage('作物ID无效'),
  body('quantity').isInt({ min: 1 }).withMessage('数量无效'),
];

/**
 * 批量出售作物
 * @swagger
 * /api/crops/sell-batch:
 *   post:
 *     summary: 批量出售作物
 *     tags: [作物]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cropId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.sellBatchCrops = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { items } = req.body;
    const result = await cropService.sellBatchCrops(playerId, items);

    const totalQuantity = result.sold.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    if (totalQuantity > 0) {
      try {
        await achievementService.checkAndUpdateAchievements(
          playerId,
          'economy',
          totalQuantity
        );
      } catch (achErr) {
        logger.warn('成就检查失败', { error: achErr.message });
      }
    }

    wsService.sendToUser(playerId, 'batch_sell_completed', {
      soldCount: result.sold.length,
      totalIncome: result.totalIncome,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('批量出售失败', { error: error.message });
    return handleError(res, error);
  }
};

exports.sellBatchCropsValidation = [
  body('items').isArray({ min: 1 }).withMessage('出售列表不能为空'),
  body('items.*.cropId').isInt({ min: 1 }).withMessage('作物ID无效'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('数量无效'),
];

/**
 * 一键收获所有成熟作物
 * @swagger
 * /api/crops/harvest-all:
 *   post:
 *     summary: 一键收获所有成熟作物
 *     tags: [作物]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.harvestAllMatured = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const result = await cropService.harvestAllMatured(playerId);

    // 触发成就系统 - 收获作物
    await achievementService.checkAndUpdateAchievements(
      playerId,
      'farming',
      result.harvestedCount
    );

    // 触发成就系统 - 一键收获
    await achievementService.checkAndUpdateAchievements(playerId, 'farming');

    // 推送WebSocket消息
    wsService.sendToUser(playerId, 'harvest_all_completed', {
      message: result.message,
      totalYield: result.totalYield,
      totalExp: result.totalExp,
      harvestedCount: result.harvested.length,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json(result);
  } catch (error) {
    logger.error('一键收获失败', { error: error.message });
    return handleError(res, error);
  }
};
