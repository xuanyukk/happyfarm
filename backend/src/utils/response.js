/**
 * 文件名：response.js
 * 作者：AI助手
 * 日期：2026-05-12
 * 版本：v4.0.0
 * 功能描述：统一API响应工具，集成错误分类系统
 * 更新记录：
 *   2026-04-26 - v1.0.0 - 初始版本
 *   2026-05-12 - v2.0.0 - 增强成功响应工具
 *   2026-05-12 - v3.0.0 - 新增完整错误响应工具
 *   2026-05-12 - v4.0.0 - 集成错误分类系统
 *   2026-05-19 - v4.1.0 - 修复 paginatedResponse 别名问题和 successResponse 签名问题
 */

const { ErrorCodes } = require('./errors');

const successResponse = (
  res,
  data = null,
  message = '操作成功',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

const createdResponse = (res, data = null, message = '创建成功') => {
  return res.status(201).json({
    success: true,
    data,
    message,
  });
};

const paginationResponse = (res, data, pagination, message = '查询成功') => {
  return res.json({
    success: true,
    data,
    pagination,
    message,
  });
};

const paginatedResponse = paginationResponse; // 别名，兼容旧测试

const errorResponse = (
  res,
  message = '操作失败',
  statusCode = 500,
  code = ErrorCodes.INTERNAL_ERROR,
  details = null
) => {
  const response = {
    success: false,
    message,
    code,
  };
  if (details) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
};

const badRequestResponse = (
  res,
  message = '请求参数错误',
  code = ErrorCodes.BAD_REQUEST,
  details = null
) => {
  return errorResponse(res, message, 400, code, details);
};

const validationErrorResponse = (
  res,
  message = '数据验证失败',
  details = null
) => {
  return errorResponse(res, message, 422, ErrorCodes.VALIDATION_ERROR, details);
};

const unauthorizedResponse = (
  res,
  message = '未授权访问',
  code = ErrorCodes.UNAUTHORIZED,
  details = null
) => {
  return errorResponse(res, message, 401, code, details);
};

const forbiddenResponse = (
  res,
  message = '禁止访问',
  code = ErrorCodes.FORBIDDEN,
  details = null
) => {
  return errorResponse(res, message, 403, code, details);
};

const notFoundResponse = (
  res,
  message = '资源不存在',
  code = ErrorCodes.NOT_FOUND,
  details = null
) => {
  return errorResponse(res, message, 404, code, details);
};

const conflictResponse = (
  res,
  message = '资源冲突',
  code = ErrorCodes.CONFLICT,
  details = null
) => {
  return errorResponse(res, message, 409, code, details);
};

const appErrorResponse = (res, appError) => {
  return errorResponse(
    res,
    appError.message,
    appError.statusCode,
    appError.code,
    appError.details
  );
};

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  badRequestResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  appErrorResponse,
  paginationResponse,
  paginatedResponse, // 导出别名，兼容旧测试
  ErrorCodes,
};
