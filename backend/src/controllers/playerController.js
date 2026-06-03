/**
 * 文件名：playerController.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v1.1.0
 * 功能描述：玩家控制器，处理等级、经验、数据查询等API
 * 更新记录：
 *   2026-03-21 - v1.0.0 - 玩家控制器，处理等级、经验、数据查询等API
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 */

const { body, validationResult } = require('express-validator');
const playerService = require('../services/playerService');
const logger = require('../config/logger');

/**
 * 获取玩家信息
 * @swagger
 * /api/player/info:
 *   get:
 *     summary: 获取玩家信息
 *     tags: [玩家]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getPlayerData = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const playerData = await playerService.getPlayerData(playerId);
    res.status(200).json({ success: true, data: playerData });
  } catch (error) {
    logger.error('获取玩家数据失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPlayerInfo = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const playerInfo = await playerService.getPlayerInfo(playerId);
    res.status(200).json({ success: true, data: playerInfo });
  } catch (error) {
    logger.error('获取玩家信息失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取等级进度
 * @swagger
 * /api/player/level-progress:
 *   get:
 *     summary: 获取等级进度
 *     tags: [玩家]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getLevelProgress = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const levelProgress = await playerService.getLevelProgress(playerId);
    res.status(200).json({ success: true, data: levelProgress });
  } catch (error) {
    logger.error('获取等级进度失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 检查并升级
 * @swagger
 * /api/player/check-upgrade:
 *   post:
 *     summary: 检查并升级
 *     tags: [玩家]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.checkAndUpgrade = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const result = await playerService.checkAndUpgradeLevel(playerId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('检查升级失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 解锁世界等级
 * @swagger
 * /api/player/unlock-world-level:
 *   post:
 *     summary: 解锁世界等级
 *     tags: [玩家]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetWorldLevel:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.unlockWorldLevel = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { targetWorldLevel } = req.body;
    const result = await playerService.unlockWorldLevel(
      playerId,
      targetWorldLevel
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error('解锁世界等级失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.unlockWorldLevelValidation = [
  body('targetWorldLevel')
    .isInt({ min: 1, max: 100 })
    .withMessage('世界等级ID无效'),
];

exports.updateAvatar = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { avatar } = req.body;
    const result = await playerService.updateAvatar(playerId, avatar);
    res.status(200).json(result);
  } catch (error) {
    logger.error('更新头像失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateAvatarValidation = [
  body('avatar').isString().notEmpty().withMessage('头像不能为空'),
];

exports.getStamina = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const result = await playerService.recoverStamina(playerId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取体力失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recoverStamina = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const result = await playerService.recoverStamina(playerId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('体力恢复失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOfflineRewards = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const result = await playerService.getOfflineRewards(playerId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取离线收益失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
