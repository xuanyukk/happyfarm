/**
 * 文件名：farmController.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.3.0
 * 功能描述：农场控制器，处理地块相关API
 * 更新记录：
 *   2026-03-19 - v1.0.0 - 农场控制器，处理地块相关API
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-06-08 - v1.2.0 - 统一使用response.js响应工具函数
 *   2026-06-10 - v1.2.1 - 统一catch块错误处理，使用handleError根据error.statusCode动态返回HTTP状态码
 *   2026-06-10 - v1.3.0 - 补全 unlockLand/upgradeLandStar 参数校验导出
 */

const { body, param, validationResult } = require('express-validator');
const farmService = require('../services/farmService');
const achievementService = require('../services/achievementService');
const logger = require('../config/logger');
const wsService = require('../services/websocketService');
const {
  successResponse,
  badRequestResponse,
} = require('../utils/response');

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
 * 获取玩家所有地块
 * @swagger
 * /api/farm/lands:
 *   get:
 *     summary: 获取所有地块
 *     tags: [农场]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getLands = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const lands = await farmService.getPlayerLands(playerId);
    return successResponse(res, lands);
  } catch (error) {
    logger.error('获取地块失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 解锁地块
 * @swagger
 * /api/farm/lands/{landNum}/unlock:
 *   post:
 *     summary: 解锁地块
 *     tags: [农场]
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
exports.unlockLand = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, errors.array()[0].msg);
    }

    const playerId = req.user.id.toString();
    const landNum = parseInt(req.params.landNum);
    const result = await farmService.unlockLand(playerId, landNum);

    // 触发成就系统 - 解锁地块
    await achievementService.checkAndUpdateAchievements(playerId, 'farm');

    // 推送WebSocket消息
    wsService.sendToUser(playerId, 'land_unlocked', {
      landNum: result.landNum,
      cost: result.cost,
      timestamp: new Date().toISOString(),
    });

    return successResponse(res, result, '地块解锁成功');
  } catch (error) {
    logger.error('解锁地块失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 提升地块品质
 * @swagger
 * /api/farm/lands/{landNum}/quality:
 *   post:
 *     summary: 提升地块品质
 *     tags: [农场]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: landNum
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetQualityId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.upgradeLandQuality = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return badRequestResponse(res, errors.array()[0].msg);
    }

    const playerId = req.user.id.toString();
    const landNum = parseInt(req.params.landNum);
    const { targetQualityId } = req.body;
    const result = await farmService.upgradeLandQuality(
      playerId,
      landNum,
      targetQualityId
    );

    // 触发成就系统 - 提升地块品质
    await achievementService.checkAndUpdateAchievements(playerId, 'farm');

    // 推送WebSocket消息
    wsService.sendToUser(playerId, 'quality_upgraded', {
      landNum: result.landNum,
      qualityId: result.qualityId,
      qualityName: result.qualityName,
      cost: result.cost,
      timestamp: new Date().toISOString(),
    });

    return successResponse(res, result, '地块品质提升成功');
  } catch (error) {
    logger.error('提升地块品质失败', { error: error.message });
    return handleError(res, error);
  }
};

exports.upgradeLandQualityValidation = [
  body('targetQualityId').isInt({ min: 1, max: 8 }).withMessage('品质ID无效'),
];

/**
 * unlockLand 参数校验
 */
exports.unlockLandValidation = [
  param('landNum').isInt({ min: 1, max: 50 }).withMessage('地块编号无效（1-50）'),
];

/**
 * upgradeLandStar 参数校验
 */
exports.upgradeLandStarValidation = [
  param('landNum').isInt({ min: 1, max: 50 }).withMessage('地块编号无效（1-50）'),
];

/**
 * 提升地块星级
 */
exports.upgradeLandStar = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const landNum = parseInt(req.params.landNum);
    const result = await farmService.upgradeLandStar(playerId, landNum);
    return successResponse(res, result, '地块星级提升成功');
  } catch (error) {
    logger.error('地块星级提升失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 获取地块星级配置
 */
exports.getLandStarConfigs = async function (req, res) {
  try {
    const qualityId = parseInt(req.params.qualityId);
    const result = await farmService.getLandStarConfigs(qualityId);
    return successResponse(res, result);
  } catch (error) {
    logger.error('获取星级配置失败', { error: error.message });
    return handleError(res, error);
  }
};