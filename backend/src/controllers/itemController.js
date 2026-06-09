/**
 * 文件名：itemController.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v1.2.1
 * 功能描述：道具控制器，处理道具使用API
 * 更新记录：
 *   2026-03-21 - v1.0.0 - 道具控制器，处理道具使用API
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-03-28 - v1.2.0 - 【阶段二完成】道具使用功能完整实现，支持增产剂和加速剂
 *   2026-06-10 - v1.2.1 - 统一catch块错误处理，使用handleError根据error.statusCode动态返回HTTP状态码
 */

const { body, validationResult } = require('express-validator');
const itemService = require('../services/itemService');
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
 * 获取可用道具列表
 * @swagger
 * /api/items/available:
 *   get:
 *     summary: 获取可用道具列表
 *     tags: [道具]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getAvailableItems = async function (req, res) {
  try {
    const playerId = req.user.id.toString();
    const items = await itemService.getAvailableItems(playerId);
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    logger.error('获取道具列表失败', { error: error.message });
    return handleError(res, error);
  }
};

/**
 * 使用道具
 * @swagger
 * /api/items/use:
 *   post:
 *     summary: 使用道具
 *     tags: [道具]
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
 *               landNum:
 *                 type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.useItem = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const { itemId, landNum } = req.body;
    const result = await itemService.useItem(playerId, itemId, landNum);
    res.status(200).json(result);
  } catch (error) {
    logger.error('使用道具失败', { error: error.message });
    return handleError(res, error);
  }
};

exports.useItemValidation = [
  body('itemId').isInt({ min: 1 }).withMessage('道具ID无效'),
  body('landNum').isInt({ min: 1, max: 50 }).withMessage('地块序号无效'),
];
