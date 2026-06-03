/**
 * 文件名：currencyConfigController.js
 * 作者：开发者
 * 日期：2026-05-25
 * 版本：v1.0.0
 * 功能描述：货币配置管理控制器，提供货币配置CRUD和管理功能
 * 更新记录：
 *   2026-05-25 - v1.0.0 - 初始版本创建
 */

const { body, validationResult } = require('express-validator');
const currencyConfigService = require('../services/currencyConfigService');
const gemService = require('../services/gemService');
const logger = require('../config/logger');

/**
 * 获取所有货币配置列表
 * GET /api/admin/currency-config
 */
exports.getCurrencyConfigList = async function (req, res) {
  try {
    const list = await currencyConfigService.getFormattedConfigList();
    return res.json({
      success: true,
      data: list,
      message: '获取货币配置成功',
    });
  } catch (error) {
    logger.error('获取货币配置列表失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '获取货币配置列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取单个货币配置详情
 * GET /api/admin/currency-config/:id
 */
exports.getCurrencyConfigById = async function (req, res) {
  try {
    const configId = parseInt(req.params.id) || 1;
    const config = await currencyConfigService.getConfig(configId);
    const testValues = [0, 1000, 10000, 1500000, 120000000, 99999999999];

    return res.json({
      success: true,
      data: {
        configId: config.configId,
        currencyName: config.currencyName,
        currencySymbol: config.currencySymbol,
        maxHold: config.maxHold,
        maxHoldFormatted: config.format(config.maxHold),
        description: config.description,
        isActive: config.isActive,
        formatRules:
          config.formatRules || currencyConfigService.DEFAULT_FORMAT_RULES,
        formatPreviews: testValues.map((v) => ({
          value: v,
          formatted: config.format(v),
        })),
      },
      message: '获取货币配置详情成功',
    });
  } catch (error) {
    logger.error('获取货币配置详情失败', {
      configId: req.params.id,
      error: error.message,
    });
    return res.status(500).json({
      success: false,
      message: '获取货币配置详情失败',
      error: error.message,
    });
  }
};

/**
 * 更新货币配置
 * PUT /api/admin/currency-config/:id
 */
exports.updateCurrencyConfig = [
  body('max_hold')
    .optional()
    .isInt({ min: 1, max: 999999999999 })
    .withMessage('最大持有量必须是1-999999999999之间的整数'),
  body('description').optional().isString().isLength({ max: 500 }),
  body('is_active').optional().isBoolean(),
  body('format_rules').optional().isObject(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    try {
      const configId = parseInt(req.params.id) || 1;
      const operatorId = req.user ? req.user.id : 1;
      const configs = [
        {
          config_id: configId,
          max_hold: req.body.max_hold,
          description: req.body.description,
          is_active: req.body.is_active,
          format_rules: req.body.format_rules,
        },
      ];

      const result = await currencyConfigService.batchUpdateConfigs(
        configs,
        operatorId
      );

      return res.json({
        success: true,
        data: result.data[0] || null,
        message: '货币配置更新成功',
      });
    } catch (error) {
      logger.error('更新货币配置失败', {
        configId: req.params.id,
        error: error.message,
      });
      return res.status(500).json({
        success: false,
        message: '更新货币配置失败',
        error: error.message,
      });
    }
  },
];

/**
 * 批量更新货币配置
 * POST /api/admin/currency-config/batch
 */
exports.batchUpdateCurrencyConfig = [
  body('configs').isArray({ min: 1 }).withMessage('配置数组不能为空'),
  body('configs.*.config_id').isInt({ min: 1 }).withMessage('配置ID无效'),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    try {
      const operatorId = req.user ? req.user.id : 1;
      const result = await currencyConfigService.batchUpdateConfigs(
        req.body.configs,
        operatorId
      );

      return res.json({
        success: true,
        data: result,
        message: '批量更新货币配置成功',
      });
    } catch (error) {
      logger.error('批量更新货币配置失败', { error: error.message });
      return res.status(500).json({
        success: false,
        message: '批量更新货币配置失败',
        error: error.message,
      });
    }
  },
];

/**
 * 获取货币格式化预览
 * GET /api/admin/currency-config/format-preview?value=10000
 */
exports.getFormatPreview = async function (req, res) {
  try {
    const value = parseInt(req.query.value) || 0;
    const configId = parseInt(req.query.configId) || 1;
    const config = await currencyConfigService.getConfig(configId);

    return res.json({
      success: true,
      data: {
        value,
        formatted: config.format(value),
        currencyName: config.currencyName,
        currencySymbol: config.currencySymbol,
      },
      message: '格式化预览成功',
    });
  } catch (error) {
    logger.error('格式化预览失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '格式化预览失败',
      error: error.message,
    });
  }
};

/**
 * 清除货币配置缓存
 * POST /api/admin/currency-config/clear-cache
 */
exports.clearCurrencyCache = async function (req, res) {
  try {
    currencyConfigService.clearCache();
    return res.json({
      success: true,
      message: '货币配置缓存已清除',
    });
  } catch (error) {
    logger.error('清除缓存失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '清除缓存失败',
      error: error.message,
    });
  }
};

/**
 * 获取公共货币显示规则（无需管理员权限）
 * GET /api/currency-config/public
 */
exports.getPublicCurrencyConfig = async function (req, res) {
  try {
    const list = await currencyConfigService.getFormattedConfigList();
    const publicList = list.map((item) => ({
      configId: item.configId,
      currencyName: item.currencyName,
      currencySymbol: item.currencySymbol,
      maxHold: item.maxHold,
      formatRules: item.formatRules,
      formatPreviews: item.formatPreviews,
    }));

    return res.json({
      success: true,
      data: publicList,
      message: '获取公共货币配置成功',
    });
  } catch (error) {
    logger.error('获取公共货币配置失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '获取公共货币配置失败',
      error: error.message,
    });
  }
};

// ==========================================
// 农场宝石币端点
// ==========================================

/**
 * 查询玩家宝石币余额
 * GET /api/currency-config/gem/balance
 */
exports.getGemBalance = async function (req, res) {
  try {
    const playerId = req.query.player_id || req.user.player_id;
    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: '缺少玩家ID参数',
      });
    }

    const balance = await gemService.getGemBalance(playerId);
    return res.json({
      success: true,
      data: balance,
      message: '获取宝石币余额成功',
    });
  } catch (error) {
    logger.error('获取宝石币余额失败', { error: error.message });
    return res.status(500).json({
      success: false,
      message: '获取宝石币余额失败',
      error: error.message,
    });
  }
};

/**
 * 【预留接口】增加宝石币
 * POST /api/admin/currency-config/gem/add
 */
exports.addGems = [
  body('player_id').notEmpty().withMessage('玩家ID不能为空'),
  body('amount')
    .isInt({ min: 1, max: 999999 })
    .withMessage('数量必须是1-999999之间的整数'),
  body('source').optional().isString(),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array(),
      });
    }

    try {
      const result = await gemService.addGems(
        req.body.player_id,
        parseInt(req.body.amount),
        req.body.source || 'admin_operation'
      );

      return res.json({
        success: result.success,
        data: result,
        message: result.message,
      });
    } catch (error) {
      logger.error('增加宝石币失败', { error: error.message });
      return res.status(500).json({
        success: false,
        message: '增加宝石币失败',
        error: error.message,
      });
    }
  },
];
