
/**
 * 文件名: adminItemController.js
 * 作者: Trae AI
 * 日期: 2026-05-23
 * 版本: v1.0.0
 * 功能描述: 管理后台道具配置管理控制器
 * 更新记录:
 *   2026-05-23 - v1.0.0 - 初始版本创建
 */

const { body, validationResult, query } = require('express-validator');
const adminItemService = require('../services/adminItemService');
const logger = require('../config/logger');

/**
 * 获取道具列表
 */
exports.getItemList = async function (req, res) {
  try {
    const { itemType, search } = req.query;
    const items = await adminItemService.getItemList({ itemType, search });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    logger.error('获取道具列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取道具详情
 */
exports.getItemDetail = async function (req, res) {
  try {
    const { itemId } = req.params;
    const item = await adminItemService.getItemDetail(parseInt(itemId));
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    logger.error('获取道具详情失败', { error: error.message });
    if (error.message === '道具不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 创建道具
 */
exports.createItem = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const item = await adminItemService.createItem(req.body);
    res.status(201).json({ success: true, data: item, message: '创建成功' });
  } catch (error) {
    logger.error('创建道具失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 更新道具
 */
exports.updateItem = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { itemId } = req.params;
    const item = await adminItemService.updateItem(parseInt(itemId), req.body);
    res.status(200).json({ success: true, data: item, message: '更新成功' });
  } catch (error) {
    logger.error('更新道具失败', { error: error.message });
    if (error.message === '道具不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 删除道具
 */
exports.deleteItem = async function (req, res) {
  try {
    const { itemId } = req.params;
    const result = await adminItemService.deleteItem(parseInt(itemId));
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('删除道具失败', { error: error.message });
    if (error.message === '道具不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 验证规则
 */
exports.createItemValidation = [
  body('itemType').isInt({ min: 1, max: 20 }).withMessage('道具类型无效'),
  body('itemName').isString().notEmpty().withMessage('道具名称必填'),
  body('itemDesc').isString().notEmpty().withMessage('道具描述必填'),
  body('effectValue').isFloat().withMessage('效果值格式无效'),
  body('effectDuration').optional().isInt({ min: 0 }).withMessage('持续时间格式无效'),
  body('unlockWorldLevel').isInt({ min: 1 }).withMessage('解锁世界等级无效'),
  body('unlockPlayerLevel').isInt({ min: 1 }).withMessage('解锁玩家等级无效'),
  body('maxStack').isInt({ min: 1 }).withMessage('最大堆叠至少为1'),
];

exports.updateItemValidation = [
  body('itemName').optional().isString().notEmpty().withMessage('道具名称不能为空'),
  body('effectValue').optional().isFloat().withMessage('效果值格式无效'),
];

