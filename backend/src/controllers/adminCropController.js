
/**
 * 文件名: adminCropController.js
 * 作者: Trae AI
 * 日期: 2026-05-23
 * 版本: v1.0.0
 * 功能描述: 管理后台作物配置管理控制器
 * 更新记录:
 *   2026-05-23 - v1.0.0 - 初始版本创建
 */

const { body, validationResult, query } = require('express-validator');
const adminCropService = require('../services/adminCropService');
const logger = require('../config/logger');

/**
 * 获取作物列表
 */
exports.getCropList = async function (req, res) {
  try {
    const { worldId, cropType, search } = req.query;
    const crops = await adminCropService.getCropList({ worldId, cropType, search });
    res.status(200).json({ success: true, data: crops });
  } catch (error) {
    logger.error('获取作物列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取作物详情
 */
exports.getCropDetail = async function (req, res) {
  try {
    const { cropId } = req.params;
    const crop = await adminCropService.getCropDetail(parseInt(cropId));
    res.status(200).json({ success: true, data: crop });
  } catch (error) {
    logger.error('获取作物详情失败', { error: error.message });
    if (error.message === '作物不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 创建作物
 */
exports.createCrop = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const operatorId = req.user?.id;
    const crop = await adminCropService.createCrop(req.body, operatorId);
    res.status(201).json({ success: true, data: crop, message: '创建成功' });
  } catch (error) {
    logger.error('创建作物失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 更新作物
 */
exports.updateCrop = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { cropId } = req.params;
    const crop = await adminCropService.updateCrop(parseInt(cropId), req.body);
    res.status(200).json({ success: true, data: crop, message: '更新成功' });
  } catch (error) {
    logger.error('更新作物失败', { error: error.message });
    if (error.message === '作物不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 删除作物
 */
exports.deleteCrop = async function (req, res) {
  try {
    const { cropId } = req.params;
    const result = await adminCropService.deleteCrop(parseInt(cropId));
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('删除作物失败', { error: error.message });
    if (error.message === '作物不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 验证规则
 */
exports.createCropValidation = [
  body('cropName').isString().notEmpty().withMessage('作物名称必填'),
  body('worldId').isInt({ min: 1 }).withMessage('世界等级无效'),
  body('growthCycle').isInt({ min: 3 }).withMessage('生长周期至少3分钟'),
  body('baseYield').isInt({ min: 1 }).withMessage('基础产量至少为1'),
  body('minYield').isInt({ min: 1 }).withMessage('最小产量至少为1'),
  body('maxYield').isInt({ min: 1 }).withMessage('最大产量至少为1'),
  body('sellPrice').isInt({ min: 0 }).withMessage('售价不能为负数'),
  body('seedCost').isInt({ min: 0 }).withMessage('种子成本不能为负数'),
  body('gpPerMin').isFloat().withMessage('单位时间收益格式无效'),
  body('cropType').isString().notEmpty().withMessage('作物类型必填'),
];

exports.updateCropValidation = [
  body('cropName').optional().isString().notEmpty().withMessage('作物名称不能为空'),
  body('worldId').optional().isInt({ min: 1 }).withMessage('世界等级无效'),
  body('growthCycle').optional().isInt({ min: 3 }).withMessage('生长周期至少3分钟'),
];

