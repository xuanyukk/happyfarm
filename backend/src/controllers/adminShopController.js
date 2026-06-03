/**
 * 文件名: adminShopController.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台商店商品管理控制器
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const { body, validationResult, query } = require('express-validator');
const adminShopService = require('../services/adminShopService');
const logger = require('../config/logger');

/**
 * 获取商店商品列表
 */
exports.getShopGoodsList = async function (req, res) {
  try {
    const { goodsType, search, isOnSale } = req.query;
    const goods = await adminShopService.getShopGoodsList({ goodsType, search, isOnSale });
    res.status(200).json({ success: true, data: goods });
  } catch (error) {
    logger.error('获取商店商品列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取商品详情
 */
exports.getShopGoodsDetail = async function (req, res) {
  try {
    const { goodsId } = req.params;
    const goods = await adminShopService.getShopGoodsDetail(parseInt(goodsId));
    res.status(200).json({ success: true, data: goods });
  } catch (error) {
    logger.error('获取商品详情失败', { error: error.message });
    if (error.message === '商品不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 创建商品
 */
exports.createShopGoods = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const goods = await adminShopService.createShopGoods(req.body);
    res.status(201).json({ success: true, data: goods, message: '创建成功' });
  } catch (error) {
    logger.error('创建商品失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 更新商品
 */
exports.updateShopGoods = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { goodsId } = req.params;
    const goods = await adminShopService.updateShopGoods(parseInt(goodsId), req.body);
    res.status(200).json({ success: true, data: goods, message: '更新成功' });
  } catch (error) {
    logger.error('更新商品失败', { error: error.message });
    if (error.message === '商品不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 删除商品
 */
exports.deleteShopGoods = async function (req, res) {
  try {
    const { goodsId } = req.params;
    const result = await adminShopService.deleteShopGoods(parseInt(goodsId));
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error('删除商品失败', { error: error.message });
    if (error.message === '商品不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 切换商品上架状态
 */
exports.toggleShopGoodsStatus = async function (req, res) {
  try {
    const { goodsId } = req.params;
    const { isOnSale } = req.body;
    const goods = await adminShopService.toggleShopGoodsStatus(parseInt(goodsId), isOnSale);
    res.status(200).json({ success: true, data: goods, message: '状态更新成功' });
  } catch (error) {
    logger.error('切换商品状态失败', { error: error.message });
    if (error.message === '商品不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 验证规则
 */
exports.createShopGoodsValidation = [
  body('goodsType').isInt({ min: 1 }).withMessage('商品类型无效'),
  body('goodsObjId').isInt({ min: 1 }).withMessage('商品对象ID无效'),
  body('goodsName').isString().notEmpty().withMessage('商品名称必填'),
  body('priceNum').isInt({ min: 0 }).withMessage('价格不能为负数'),
  body('description').isString().notEmpty().withMessage('商品描述必填')
];

exports.updateShopGoodsValidation = [
  body('goodsName').optional().isString().notEmpty().withMessage('商品名称不能为空'),
  body('priceNum').optional().isInt({ min: 0 }).withMessage('价格不能为负数')
];