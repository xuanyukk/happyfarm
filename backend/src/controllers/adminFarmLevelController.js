/**
 * 文件名: adminFarmLevelController.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台农场等级管理控制器
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const { body, validationResult } = require('express-validator');
const adminFarmLevelService = require('../services/adminFarmLevelService');
const logger = require('../config/logger');

/**
 * 获取农场等级列表
 */
exports.getFarmLevelList = async function (req, res) {
  try {
    const { search } = req.query;
    const levels = await adminFarmLevelService.getFarmLevelList({ search });
    res.status(200).json({ success: true, data: levels });
  } catch (error) {
    logger.error('获取农场等级列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取农场等级详情
 */
exports.getFarmLevelDetail = async function (req, res) {
  try {
    const { levelId } = req.params;
    const level = await adminFarmLevelService.getFarmLevelDetail(
      parseInt(levelId)
    );
    res.status(200).json({ success: true, data: level });
  } catch (error) {
    logger.error('获取农场等级详情失败', { error: error.message });
    if (error.message === '农场等级不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 创建农场等级
 */
exports.createFarmLevel = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const level = await adminFarmLevelService.createFarmLevel(req.body);
    res.status(201).json({ success: true, data: level, message: '创建成功' });
  } catch (error) {
    logger.error('创建农场等级失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 更新农场等级
 */
exports.updateFarmLevel = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const { levelId } = req.params;
    const level = await adminFarmLevelService.updateFarmLevel(
      parseInt(levelId),
      req.body
    );
    res.status(200).json({ success: true, data: level, message: '更新成功' });
  } catch (error) {
    logger.error('更新农场等级失败', { error: error.message });
    if (error.message === '农场等级不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 删除农场等级
 */
exports.deleteFarmLevel = async function (req, res) {
  try {
    const { levelId } = req.params;
    const result = await adminFarmLevelService.deleteFarmLevel(
      parseInt(levelId)
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('删除农场等级失败', { error: error.message });
    if (error.message === '农场等级不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 验证规则
 */
exports.createFarmLevelValidation = [
  body('levelNum').isInt({ min: 1 }).withMessage('等级编号至少为1'),
  body('levelName').isString().notEmpty().withMessage('等级名称必填'),
  body('experienceRequired').isInt({ min: 1 }).withMessage('经验要求至少为1'),
  body('maxLandCount').isInt({ min: 1 }).withMessage('最大地块数至少为1'),
];

exports.updateFarmLevelValidation = [
  body('levelName')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('等级名称不能为空'),
  body('experienceRequired')
    .optional()
    .isInt({ min: 1 })
    .withMessage('经验要求至少为1'),
  body('maxLandCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('最大地块数至少为1'),
];
