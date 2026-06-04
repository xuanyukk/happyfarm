/**
 * 文件名：adminGameConfigController.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：管理后台游戏配置管理控制器——player_level/daily_task/item_drop 三表CRUD
 * 更新记录：
 *   2026-05-31 - v1.0.0 - LG-01修复：初始版本创建
 */

const { body, validationResult } = require('express-validator');
const adminGameConfigService = require('../services/adminGameConfigService');
const logger = require('../config/logger');

const VALID_TYPES = ['player_level', 'daily_task', 'item_drop'];

exports.getList = async function (req, res) {
  try {
    const { type } = req.params;
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的配置类型，可选：player_level/daily_task/item_drop',
      });
    }
    const result = await adminGameConfigService.getList(type, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取配置列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDetail = async function (req, res) {
  try {
    const { type, id } = req.params;
    if (!VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: '无效的配置类型' });
    }
    const result = await adminGameConfigService.getDetail(type, parseInt(id));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取配置详情失败', { error: error.message });
    if (error.message === '记录不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

exports.create = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    const { type } = req.params;
    if (!VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: '无效的配置类型' });
    }
    const result = await adminGameConfigService.create(type, req.body);
    res.status(201).json({ success: true, data: result, message: '创建成功' });
  } catch (error) {
    logger.error('创建配置失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }
    const { type, id } = req.params;
    if (!VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: '无效的配置类型' });
    }
    const result = await adminGameConfigService.update(
      type,
      parseInt(id),
      req.body
    );
    res.status(200).json({ success: true, data: result, message: '更新成功' });
  } catch (error) {
    logger.error('更新配置失败', { error: error.message });
    if (error.message === '记录不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

exports.remove = async function (req, res) {
  try {
    const { type, id } = req.params;
    if (!VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: '无效的配置类型' });
    }
    const result = await adminGameConfigService.remove(type, parseInt(id));
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('删除配置失败', { error: error.message });
    if (error.message === '记录不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

exports.createValidation = [body().isObject().withMessage('请求体必须是对象')];

exports.updateValidation = [body().isObject().withMessage('请求体必须是对象')];
