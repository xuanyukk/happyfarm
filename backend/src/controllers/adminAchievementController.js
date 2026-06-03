/**
 * 文件名: adminAchievementController.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台成就管理控制器
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const { body, validationResult, query } = require('express-validator');
const adminAchievementService = require('../services/adminAchievementService');
const logger = require('../config/logger');

/**
 * 获取成就列表
 */
exports.getAchievementList = async function (req, res) {
  try {
    const { category, rarity, search, isActive } = req.query;
    const achievements = await adminAchievementService.getAchievementList({
      category, rarity, search, isActive
    });
    res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    logger.error('获取成就列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取成就详情
 */
exports.getAchievementDetail = async function (req, res) {
  try {
    const { achievementId } = req.params;
    const achievement = await adminAchievementService.getAchievementDetail(parseInt(achievementId));
    res.status(200).json({ success: true, data: achievement });
  } catch (error) {
    logger.error('获取成就详情失败', { error: error.message });
    if (error.message === '成就不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 创建成就
 */
exports.createAchievement = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const achievement = await adminAchievementService.createAchievement(req.body);
    res.status(201).json({ success: true, data: achievement, message: '创建成功' });
  } catch (error) {
    logger.error('创建成就失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 更新成就
 */
exports.updateAchievement = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { achievementId } = req.params;
    const achievement = await adminAchievementService.updateAchievement(parseInt(achievementId), req.body);
    res.status(200).json({ success: true, data: achievement, message: '更新成功' });
  } catch (error) {
    logger.error('更新成就失败', { error: error.message });
    if (error.message === '成就不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 删除成就
 */
exports.deleteAchievement = async function (req, res) {
  try {
    const { achievementId } = req.params;
    const result = await adminAchievementService.deleteAchievement(parseInt(achievementId));
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('删除成就失败', { error: error.message });
    if (error.message === '成就不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 获取成就统计
 */
exports.getAchievementStatistics = async function (req, res) {
  try {
    const { achievementId } = req.params;
    const statistics = await adminAchievementService.getAchievementStatistics(parseInt(achievementId));
    res.status(200).json({ success: true, data: statistics });
  } catch (error) {
    logger.error('获取成就统计失败', { error: error.message });
    if (error.message === '成就不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 验证规则
 */
exports.createAchievementValidation = [
  body('achievementName').isString().notEmpty().withMessage('成就名称必填'),
  body('description').isString().notEmpty().withMessage('成就描述必填'),
  body('category').isString().notEmpty().withMessage('成就分类必填'),
  body('requiredCount').isInt({ min: 1 }).withMessage('要求次数至少为1')
];

exports.updateAchievementValidation = [
  body('achievementName').optional().isString().notEmpty().withMessage('成就名称不能为空'),
  body('description').optional().isString().notEmpty().withMessage('成就描述不能为空')
];