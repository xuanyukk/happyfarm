/**
 * 文件名：backend/src/utils/errors.js
 * 作者：AI助手
 * 日期：2026-05-12
 * 版本：v3.0.0
 * 功能描述：统一错误处理工具类，提供精确的错误分类
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 创建统一错误处理机制
 *   2026-05-12 - v3.0.0 - 增强错误分类系统，提供更精确的错误信息
 */

// ==================== 错误码常量定义 ====================
const ErrorCodes = {
  // 通用错误 (1000-1999)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // 认证错误 (2000-2999)
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_TOO_MANY_ATTEMPTS: 'AUTH_TOO_MANY_ATTEMPTS',
  AUTH_PASSWORD_REQUIRED: 'AUTH_PASSWORD_REQUIRED',
  AUTH_PASSWORD_INCORRECT: 'AUTH_PASSWORD_INCORRECT',

  // 用户错误 (3000-3999)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INVALID_DATA: 'USER_INVALID_DATA',
  USER_INSUFFICIENT_BALANCE: 'USER_INSUFFICIENT_BALANCE',
  USER_LEVEL_INSUFFICIENT: 'USER_LEVEL_INSUFFICIENT',
  USER_VIP_EXPIRED: 'USER_VIP_EXPIRED',

  // 农场错误 (4000-4999)
  FARM_NOT_FOUND: 'FARM_NOT_FOUND',
  FARM_INVALID_OPERATION: 'FARM_INVALID_OPERATION',
  FARM_PLOT_NOT_FOUND: 'FARM_PLOT_NOT_FOUND',
  FARM_PLOT_OCCUPIED: 'FARM_PLOT_OCCUPIED',
  FARM_PLOT_UNLOCK_REQUIRED: 'FARM_PLOT_UNLOCK_REQUIRED',

  // 作物错误 (5000-5999)
  CROP_NOT_FOUND: 'CROP_NOT_FOUND',
  CROP_LOCKED: 'CROP_LOCKED',
  CROP_NOT_PLANTED: 'CROP_NOT_PLANTED',
  CROP_NOT_READY: 'CROP_NOT_READY',
  CROP_ALREADY_HARVESTED: 'CROP_ALREADY_HARVESTED',
  CROP_INSUFFICIENT_QUANTITY: 'CROP_INSUFFICIENT_QUANTITY',

  // 仓库错误 (6000-6999)
  WAREHOUSE_NOT_FOUND: 'WAREHOUSE_NOT_FOUND',
  WAREHOUSE_SPACE_INSUFFICIENT: 'WAREHOUSE_SPACE_INSUFFICIENT',
  WAREHOUSE_ITEM_NOT_FOUND: 'WAREHOUSE_ITEM_NOT_FOUND',

  // 商店错误 (7000-7999)
  SHOP_ITEM_NOT_FOUND: 'SHOP_ITEM_NOT_FOUND',
  SHOP_ITEM_OUT_OF_STOCK: 'SHOP_ITEM_OUT_OF_STOCK',
  SHOP_INVALID_PURCHASE: 'SHOP_INVALID_PURCHASE',

  // 活动错误 (8000-8999)
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  EVENT_NOT_ACTIVE: 'EVENT_NOT_ACTIVE',
  EVENT_ENDED: 'EVENT_ENDED',
  EVENT_NOT_STARTED: 'EVENT_NOT_STARTED',
  EVENT_TASK_NOT_FOUND: 'EVENT_TASK_NOT_FOUND',
  EVENT_TASK_NOT_COMPLETED: 'EVENT_TASK_NOT_COMPLETED',
  EVENT_REWARD_ALREADY_CLAIMED: 'EVENT_REWARD_ALREADY_CLAIMED',
  EVENT_PROGRESS_NOT_FOUND: 'EVENT_PROGRESS_NOT_FOUND',

  // 数据库错误 (9000-9999)
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_DUPLICATE_ENTRY: 'DB_DUPLICATE_ENTRY',
  DB_FOREIGN_KEY_ERROR: 'DB_FOREIGN_KEY_ERROR',

  // 缓存错误 (10000-10999)
  CACHE_ERROR: 'CACHE_ERROR',
  CACHE_KEY_NOT_FOUND: 'CACHE_KEY_NOT_FOUND',

  // 文件错误 (11000-11999)
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  FILE_TYPE_INVALID: 'FILE_TYPE_INVALID',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
};

// ==================== 基础错误类 ====================
class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = ErrorCodes.INTERNAL_ERROR,
    details = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    const result = {
      success: false,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
    if (this.details) {
      result.details = this.details;
    }
    return result;
  }
}

// ==================== 通用错误类 ====================
class ValidationError extends AppError {
  constructor(message, code = ErrorCodes.VALIDATION_ERROR, details = null) {
    super(message, 400, code, details);
  }
}

class NotFoundError extends AppError {
  constructor(message, code = ErrorCodes.NOT_FOUND, details = null) {
    super(message, 404, code, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message, code = ErrorCodes.UNAUTHORIZED, details = null) {
    super(message, 401, code, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message, code = ErrorCodes.FORBIDDEN, details = null) {
    super(message, 403, code, details);
  }
}

class ConflictError extends AppError {
  constructor(message, code = ErrorCodes.CONFLICT, details = null) {
    super(message, 409, code, details);
  }
}

class BadRequestError extends AppError {
  constructor(message, code = ErrorCodes.BAD_REQUEST, details = null) {
    super(message, 400, code, details);
  }
}

// ==================== 认证错误类 ====================
class AuthError extends UnauthorizedError {
  constructor(message, code = ErrorCodes.UNAUTHORIZED, details = null) {
    super(message, code, details);
  }
}

class AuthInvalidTokenError extends AuthError {
  constructor(message = '无效的访问令牌', details = null) {
    super(message, ErrorCodes.AUTH_INVALID_TOKEN, details);
  }
}

class AuthTokenExpiredError extends AuthError {
  constructor(message = '访问令牌已过期', details = null) {
    super(message, ErrorCodes.AUTH_TOKEN_EXPIRED, details);
  }
}

class AuthTokenMissingError extends AuthError {
  constructor(message = '缺少访问令牌', details = null) {
    super(message, ErrorCodes.AUTH_TOKEN_MISSING, details);
  }
}

class AuthInvalidCredentialsError extends AuthError {
  constructor(message = '用户名或密码错误', details = null) {
    super(message, ErrorCodes.AUTH_INVALID_CREDENTIALS, details);
  }
}

// ==================== 用户错误类 ====================
class UserError extends AppError {
  constructor(
    message,
    statusCode = 400,
    code = ErrorCodes.BAD_REQUEST,
    details = null
  ) {
    super(message, statusCode, code, details);
  }
}

class UserNotFoundError extends NotFoundError {
  constructor(message = '用户不存在', details = null) {
    super(message, ErrorCodes.USER_NOT_FOUND, details);
  }
}

class UserAlreadyExistsError extends ConflictError {
  constructor(message = '用户已存在', details = null) {
    super(message, ErrorCodes.USER_ALREADY_EXISTS, details);
  }
}

class UserInsufficientBalanceError extends BadRequestError {
  constructor(message = '余额不足', details = null) {
    super(message, ErrorCodes.USER_INSUFFICIENT_BALANCE, details);
  }
}

class UserLevelInsufficientError extends ForbiddenError {
  constructor(message = '等级不足', details = null) {
    super(message, ErrorCodes.USER_LEVEL_INSUFFICIENT, details);
  }
}

// ==================== 农场错误类 ====================
class FarmError extends AppError {
  constructor(
    message,
    statusCode = 400,
    code = ErrorCodes.BAD_REQUEST,
    details = null
  ) {
    super(message, statusCode, code, details);
  }
}

class FarmNotFoundError extends NotFoundError {
  constructor(message = '农场不存在', details = null) {
    super(message, ErrorCodes.FARM_NOT_FOUND, details);
  }
}

class FarmPlotNotFoundError extends NotFoundError {
  constructor(message = '地块不存在', details = null) {
    super(message, ErrorCodes.FARM_PLOT_NOT_FOUND, details);
  }
}

class FarmPlotOccupiedError extends ConflictError {
  constructor(message = '地块已被占用', details = null) {
    super(message, ErrorCodes.FARM_PLOT_OCCUPIED, details);
  }
}

// ==================== 作物错误类 ====================
class CropError extends AppError {
  constructor(
    message,
    statusCode = 400,
    code = ErrorCodes.BAD_REQUEST,
    details = null
  ) {
    super(message, statusCode, code, details);
  }
}

class CropNotFoundError extends NotFoundError {
  constructor(message = '作物不存在', details = null) {
    super(message, ErrorCodes.CROP_NOT_FOUND, details);
  }
}

class CropLockedError extends ForbiddenError {
  constructor(message = '作物未解锁', details = null) {
    super(message, ErrorCodes.CROP_LOCKED, details);
  }
}

class CropNotReadyError extends BadRequestError {
  constructor(message = '作物尚未成熟', details = null) {
    super(message, ErrorCodes.CROP_NOT_READY, details);
  }
}

class CropAlreadyHarvestedError extends ConflictError {
  constructor(message = '作物已收获', details = null) {
    super(message, ErrorCodes.CROP_ALREADY_HARVESTED, details);
  }
}

// ==================== 活动错误类 ====================
class EventError extends AppError {
  constructor(
    message,
    statusCode = 400,
    code = ErrorCodes.BAD_REQUEST,
    details = null
  ) {
    super(message, statusCode, code, details);
  }
}

class EventNotFoundError extends NotFoundError {
  constructor(message = '活动不存在', details = null) {
    super(message, ErrorCodes.EVENT_NOT_FOUND, details);
  }
}

class EventNotActiveError extends BadRequestError {
  constructor(message = '活动未激活', details = null) {
    super(message, ErrorCodes.EVENT_NOT_ACTIVE, details);
  }
}

class EventEndedError extends BadRequestError {
  constructor(message = '活动已结束', details = null) {
    super(message, ErrorCodes.EVENT_ENDED, details);
  }
}

class EventTaskNotFoundError extends NotFoundError {
  constructor(message = '活动任务不存在', details = null) {
    super(message, ErrorCodes.EVENT_TASK_NOT_FOUND, details);
  }
}

class EventTaskNotCompletedError extends BadRequestError {
  constructor(message = '任务尚未完成', details = null) {
    super(message, ErrorCodes.EVENT_TASK_NOT_COMPLETED, details);
  }
}

class EventRewardAlreadyClaimedError extends ConflictError {
  constructor(message = '奖励已领取', details = null) {
    super(message, ErrorCodes.EVENT_REWARD_ALREADY_CLAIMED, details);
  }
}

class EventProgressNotFoundError extends NotFoundError {
  constructor(message = '进度记录不存在', details = null) {
    super(message, ErrorCodes.EVENT_PROGRESS_NOT_FOUND, details);
  }
}

// ==================== 数据库错误类 ====================
class DatabaseError extends AppError {
  constructor(message = '数据库错误', details = null) {
    super(message, 500, ErrorCodes.DB_QUERY_ERROR, details);
  }
}

class DbDuplicateEntryError extends ConflictError {
  constructor(message = '数据库重复记录', details = null) {
    super(message, ErrorCodes.DB_DUPLICATE_ENTRY, details);
  }
}

// ==================== 错误处理中间件 ====================
const errorHandler = (err, req, res, next) => {
  const logger = require('../config/logger');

  if (!err.isOperational) {
    logger.error('未处理的错误', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : '服务器内部错误';
  const code = err.code || ErrorCodes.INTERNAL_ERROR;

  const response = {
    success: false,
    message,
    code,
  };

  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
};

// ==================== 异步错误处理包装器 ====================
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== 导出模块 ====================
module.exports = {
  ErrorCodes,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  AuthError,
  AuthInvalidTokenError,
  AuthTokenExpiredError,
  AuthTokenMissingError,
  AuthInvalidCredentialsError,
  UserError,
  UserNotFoundError,
  UserAlreadyExistsError,
  UserInsufficientBalanceError,
  UserLevelInsufficientError,
  FarmError,
  FarmNotFoundError,
  FarmPlotNotFoundError,
  FarmPlotOccupiedError,
  CropError,
  CropNotFoundError,
  CropLockedError,
  CropNotReadyError,
  CropAlreadyHarvestedError,
  EventError,
  EventNotFoundError,
  EventNotActiveError,
  EventEndedError,
  EventTaskNotFoundError,
  EventTaskNotCompletedError,
  EventRewardAlreadyClaimedError,
  EventProgressNotFoundError,
  DatabaseError,
  DbDuplicateEntryError,
  errorHandler,
  asyncHandler,
};
