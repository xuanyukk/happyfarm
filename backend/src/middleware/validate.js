/**
 * 文件名：validate.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v1.0.0
 * 功能描述：统一的请求体验证中间件
 *   基于 express-validator，为敏感接口提供请求数据的 schema 校验
 *   支持 body、query、params 三种来源的验证
 * 更新记录：
 *   2026-05-26 - v1.0.0 - 初始版本创建
 */

const { body, query, param, validationResult } = require('express-validator');
const { errorResponse } = require('../utils/response');
const logger = require('../config/logger');

/**
 * 通用验证结果处理中间件
 * 收集所有验证错误并以统一格式返回
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    logger.warn('请求数据验证失败', {
      path: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      ip: req.ip,
    });

    return errorResponse(
      res,
      '请求数据验证失败',
      400,
      'VALIDATION_ERROR',
      formattedErrors
    );
  }

  next();
};

// ============================================================
// 配置管理验证规则 (configRoutes)
// ============================================================

/** 创建/更新/回滚配置的 body 验证 */
const configBodyRules = [
  body('key')
    .optional()
    .trim()
    .isString()
    .withMessage('配置键(key)必须为字符串')
    .isLength({ min: 1, max: 200 })
    .withMessage('配置键长度必须在 1-200 之间')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_.]*$/)
    .withMessage('配置键只能包含字母、数字、下划线和点号，且必须以字母或下划线开头'),

  body('value')
    .notEmpty()
    .withMessage('配置值(value)不能为空'),

  body('category')
    .optional()
    .trim()
    .isString()
    .withMessage('配置分类(category)必须为字符串')
    .isLength({ max: 100 })
    .withMessage('配置分类长度不能超过 100'),

  body('description')
    .optional()
    .trim()
    .isString()
    .withMessage('配置描述(description)必须为字符串')
    .isLength({ max: 500 })
    .withMessage('配置描述长度不能超过 500'),

  body('reason')
    .optional()
    .trim()
    .isString()
    .withMessage('变更原因(reason)必须为字符串')
    .isLength({ max: 500 })
    .withMessage('变更原因长度不能超过 500'),
];

/** 回滚操作的验证规则 */
const rollbackRules = [
  body('version')
    .isInt({ min: 1 })
    .withMessage('版本号(version)必须是大于0的整数'),

  body('reason')
    .trim()
    .isString()
    .withMessage('回滚原因(reason)必须为字符串')
    .isLength({ min: 1, max: 500 })
    .withMessage('回滚原因长度必须在 1-500 之间'),
];

/** 配置键路径参数验证 */
const configKeyParamRules = [
  param('key')
    .trim()
    .isString()
    .withMessage('配置键(key)必须为字符串')
    .isLength({ min: 1, max: 200 })
    .withMessage('配置键长度必须在 1-200 之间'),
];

/** 批量更新配置验证 */
const batchUpdateRules = [
  body('configs')
    .isArray({ min: 1, max: 50 })
    .withMessage('批量配置(configs)必须是非空数组且不超过50条'),

  body('configs.*.key')
    .trim()
    .isString()
    .withMessage('配置键(key)必须为字符串')
    .isLength({ min: 1, max: 200 })
    .withMessage('配置键长度必须在 1-200 之间'),

  body('configs.*.value')
    .notEmpty()
    .withMessage('配置值(value)不能为空'),
];

// ============================================================
// 玩家管理验证规则 (adminRoutes)
// ============================================================

/** 更新玩家状态验证 */
const updatePlayerStatusRules = [
  param('playerId')
    .isInt({ min: 1 })
    .withMessage('玩家ID(playerId)必须是大于0的整数'),

  body('status')
    .trim()
    .isIn(['active', 'frozen', 'banned'])
    .withMessage('状态(status)必须是 active、frozen 或 banned'),

  body('reason')
    .optional()
    .trim()
    .isString()
    .withMessage('原因(reason)必须为字符串')
    .isLength({ max: 500 })
    .withMessage('原因长度不能超过 500'),
];

/** 创建审批请求验证 */
const createApprovalRules = [
  body('type')
    .trim()
    .isIn(['config_update', 'config_delete', 'batch_operation', 'data_import', 'other'])
    .withMessage('审批类型(type)不合法'),

  body('target_key')
    .optional()
    .trim()
    .isString()
    .withMessage('目标键(target_key)必须为字符串'),

  body('detail')
    .notEmpty()
    .withMessage('审批详情(detail)不能为空'),

  body('reason')
    .optional()
    .trim()
    .isString()
    .withMessage('审批原因(reason)必须为字符串')
    .isLength({ max: 1000 })
    .withMessage('审批原因长度不能超过 1000'),
];

/** 审批操作验证 */
const approveOperationRules = [
  param('requestId')
    .isInt({ min: 1 })
    .withMessage('审批请求ID(requestId)必须是大于0的整数'),

  body('action')
    .trim()
    .isIn(['approve', 'reject'])
    .withMessage('审批动作(action)必须是 approve 或 reject'),

  body('comment')
    .optional()
    .trim()
    .isString()
    .withMessage('审批意见(comment)必须为字符串')
    .isLength({ max: 1000 })
    .withMessage('审批意见长度不能超过 1000'),
];

/** 处理告警验证 */
const handleAlertRules = [
  param('alertId')
    .isInt({ min: 1 })
    .withMessage('告警ID(alertId)必须是大于0的整数'),

  body('action')
    .trim()
    .isIn(['acknowledge', 'resolve', 'mute', 'escalate'])
    .withMessage('告警处理动作(action)必须是 acknowledge、resolve、mute 或 escalate'),

  body('comment')
    .optional()
    .trim()
    .isString()
    .withMessage('处理意见(comment)必须为字符串')
    .isLength({ max: 500 })
    .withMessage('处理意见长度不能超过 500'),
];

// ============================================================
// 批量导入导出验证规则 (batchImportExportRoutes)
// ============================================================

/** 导出数据验证 */
const exportDataRules = [
  body('table_name')
    .trim()
    .isString()
    .withMessage('表名(table_name)必须为字符串')
    .isLength({ min: 1, max: 100 })
    .withMessage('表名长度必须在 1-100 之间')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('表名只能包含字母、数字和下划线，且必须以字母或下划线开头'),

  body('format')
    .optional()
    .trim()
    .isIn(['csv', 'json', 'excel'])
    .withMessage('导出格式(format)必须是 csv、json 或 excel'),

  body('filters')
    .optional()
    .isObject()
    .withMessage('过滤条件(filters)必须是对象'),

  body('columns')
    .optional()
    .isArray()
    .withMessage('导出字段(columns)必须是数组'),
];

/** 导入数据验证 */
const importDataRules = [
  body('table_name')
    .trim()
    .isString()
    .withMessage('表名(table_name)必须为字符串')
    .isLength({ min: 1, max: 100 })
    .withMessage('表名长度必须在 1-100 之间')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
    .withMessage('表名只能包含字母、数字和下划线，且必须以字母或下划线开头'),

  body('mode')
    .optional()
    .trim()
    .isIn(['insert', 'update', 'upsert', 'replace'])
    .withMessage('导入模式(mode)必须是 insert、update、upsert 或 replace'),

  body('validate_only')
    .optional()
    .isBoolean()
    .withMessage('仅验证(validate_only)必须是布尔值'),
];

// ============================================================
// 通用验证规则
// ============================================================

/** 分页查询参数验证 */
const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码(page)必须是大于0的整数'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('每页条数(pageSize)必须在 1-1000 之间'),
];

/** ID 参数验证（通用） */
const idParamRules = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID必须是大于0的整数'),
];

// ============================================================
// 导出验证规则集
// ============================================================

module.exports = {
  // 通用工具
  handleValidationErrors,
  // body/query/param 构建器（方便路由文件自行组合）
  body,
  query,
  param,

  // 组合好的验证规则集
  /** 创建配置 */
  createConfig: [...configBodyRules, body('key').notEmpty().withMessage('创建时配置键(key)必填'), handleValidationErrors],
  /** 更新配置 */
  updateConfig: [body('key').optional(), ...configBodyRules, handleValidationErrors],
  /** 回滚配置 */
  rollbackConfig: [...rollbackRules, handleValidationErrors],
  /** 批量更新配置 */
  batchUpdateConfigs: [...batchUpdateRules, handleValidationErrors],
  /** 配置键参数 */
  configKeyParam: [...configKeyParamRules, handleValidationErrors],

  /** 更新玩家状态 */
  updatePlayerStatus: [...updatePlayerStatusRules, handleValidationErrors],
  /** 创建审批请求 */
  createApproval: [...createApprovalRules, handleValidationErrors],
  /** 审批操作 */
  approveOperation: [...approveOperationRules, handleValidationErrors],
  /** 处理告警 */
  handleAlert: [...handleAlertRules, handleValidationErrors],

  /** 导出数据 */
  exportData: [...exportDataRules, handleValidationErrors],
  /** 导入数据 */
  importData: [...importDataRules, handleValidationErrors],

  /** 分页 */
  pagination: [...paginationRules, handleValidationErrors],
  /** 通用ID参数 */
  idParam: [...idParamRules, handleValidationErrors],
};