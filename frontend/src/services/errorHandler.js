/**
 * 文件名：errorHandler.js
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v2.1.0
 * 功能描述：错误处理服务，提供统一的错误处理、上报和重试功能
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建，提供错误处理基础功能
 *   2026-05-07 - v2.0.0 - 添加重试机制、离线检测、错误分类优化
 *   2026-05-23 - v2.1.0 - 集成客户端日志上报API
 */

import logger from './logger';
import api from './api';

/**
 * 错误类型枚举
 */
const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  RATE_LIMIT: 'rate_limit',
  SERVER: 'server',
  OFFLINE: 'offline',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown',
};

/**
 * 可重试的错误类型
 */
const RETRYABLE_ERROR_TYPES = [
  ERROR_TYPES.NETWORK,
  ERROR_TYPES.OFFLINE,
  ERROR_TYPES.TIMEOUT,
  ERROR_TYPES.SERVER,
  ERROR_TYPES.RATE_LIMIT,
];

/**
 * 重试配置
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * 错误上下文信息
 */
let errorContext = {
  userId: null,
  sessionId: null,
  userAgent: navigator.userAgent,
  url: window.location.href,
  timestamp: Date.now(),
};

/**
 * 离线状态
 */
let isOffline = !navigator.onLine;

/**
 * 更新错误上下文
 * @param {object} context - 上下文信息
 */
const updateContext = (context) => {
  errorContext = { ...errorContext, ...context, timestamp: Date.now() };
};

/**
 * 设置用户ID
 * @param {string} userId - 用户ID
 */
const setUserId = (userId) => {
  updateContext({ userId });
};

/**
 * 设置会话ID
 * @param {string} sessionId - 会话ID
 */
const setSessionId = (sessionId) => {
  updateContext({ sessionId });
};

/**
 * 分析错误类型
 * @param {Error} error - 错误对象
 * @returns {string} 错误类型
 */
const analyzeErrorType = (error) => {
  // 优先检查离线状态
  if (!navigator.onLine || isOffline) {
    return ERROR_TYPES.OFFLINE;
  }

  if (error.name === 'AxiosError') {
    if (!error.response) {
      return ERROR_TYPES.NETWORK;
    }

    if (error.code === 'ECONNABORTED') {
      return ERROR_TYPES.TIMEOUT;
    }

    switch (error.response.status) {
      case 401:
        return ERROR_TYPES.AUTHENTICATION;
      case 403:
        return ERROR_TYPES.AUTHORIZATION;
      case 404:
        return ERROR_TYPES.NOT_FOUND;
      case 429:
        return ERROR_TYPES.RATE_LIMIT;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_TYPES.SERVER;
      default:
        return ERROR_TYPES.UNKNOWN;
    }
  }

  if (error.message?.includes('validation')) {
    return ERROR_TYPES.VALIDATION;
  }

  if (error.message?.includes('Network')) {
    return ERROR_TYPES.NETWORK;
  }

  if (error.message?.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  }

  return ERROR_TYPES.UNKNOWN;
};

/**
 * 获取用户友好的错误消息
 * @param {Error} error - 错误对象
 * @param {string} type - 错误类型
 * @returns {string} 用户友好的消息
 */
const getUserFriendlyMessage = (error, type) => {
  switch (type) {
    case ERROR_TYPES.OFFLINE:
      return '您当前处于离线状态，请检查网络连接后重试';
    case ERROR_TYPES.NETWORK:
      return '网络连接失败，请检查您的网络连接后重试';
    case ERROR_TYPES.TIMEOUT:
      return '请求超时，请检查网络后重试';
    case ERROR_TYPES.VALIDATION:
      return (
        error.response?.data?.message ||
        error.message ||
        '数据验证失败，请检查输入'
      );
    case ERROR_TYPES.AUTHENTICATION:
      return '您的会话已过期，请重新登录';
    case ERROR_TYPES.AUTHORIZATION:
      return '您没有权限执行此操作';
    case ERROR_TYPES.NOT_FOUND:
      return '请求的资源不存在';
    case ERROR_TYPES.RATE_LIMIT:
      return '请求过于频繁，请稍后再试';
    case ERROR_TYPES.SERVER:
      return '服务器暂时不可用，请稍后重试';
    default:
      return '发生了意外错误，请稍后重试';
  }
};

/**
 * 检查是否可以重试
 * @param {string} type - 错误类型
 * @param {number} attempt - 当前尝试次数
 * @returns {boolean} 是否可以重试
 */
const canRetry = (type, attempt = 0) => {
  return (
    RETRYABLE_ERROR_TYPES.includes(type) && attempt < RETRY_CONFIG.maxRetries
  );
};

/**
 * 计算重试延迟（指数退避）
 * @param {number} attempt - 当前尝试次数
 * @returns {number} 延迟毫秒数
 */
const calculateRetryDelay = (attempt) => {
  const delay =
    RETRY_CONFIG.initialDelay *
    Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

/**
 * 等待指定时间
 * @param {number} ms - 等待毫秒数
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 带重试机制的异步函数
 * @param {Function} fn - 要执行的异步函数
 * @param {object} options - 配置选项
 * @returns {Promise<any>} 执行结果
 */
const withRetry = async (fn, options = {}) => {
  const {
    onRetry = null,
    onError = null,
    maxRetries = RETRY_CONFIG.maxRetries,
    shouldRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorType = analyzeErrorType(error);

      // 检查是否应该重试
      const shouldRetryThis = shouldRetry
        ? shouldRetry(error, attempt)
        : canRetry(errorType, attempt);

      if (shouldRetryThis && attempt < maxRetries) {
        const delay = calculateRetryDelay(attempt);

        logger.warn(
          `Retrying operation (attempt ${attempt + 1}/${maxRetries}) in ${delay}ms...`,
          {
            errorType,
            attempt,
          }
        );

        if (onRetry) {
          onRetry(error, attempt, delay);
        }

        await wait(delay);
        continue;
      }

      break;
    }
  }

  throw lastError;
};

/**
 * 处理错误
 * @param {Error} error - 错误对象
 * @param {object} extraInfo - 额外信息
 * @returns {object} 处理后的错误信息
 */
const handleError = (error, extraInfo = {}) => {
  const type = analyzeErrorType(error);
  const message = getUserFriendlyMessage(error, type);

  const errorInfo = {
    type,
    message,
    originalError: error,
    context: { ...errorContext, ...extraInfo },
    timestamp: Date.now(),
    canRetry: canRetry(type, 0),
  };

  // 记录错误日志
  logError(errorInfo);

  return errorInfo;
};

/**
 * 记录错误日志
 * @param {object} errorInfo - 错误信息
 */
const logError = (errorInfo) => {
  const logData = {
    level: 'error',
    type: errorInfo.type,
    message: errorInfo.message,
    stack: errorInfo.originalError?.stack,
    context: errorInfo.context,
    timestamp: errorInfo.timestamp,
    isOffline: !navigator.onLine,
  };

  logger.error('Error occurred:', logData);
};

/**
 * 报告错误到服务器
 * @param {object} errorInfo - 错误信息
 * @param {string} userDescription - 用户描述
 */
const reportError = async (errorInfo, userDescription = '') => {
  try {
    const reportData = {
      level: 'error',
      type: errorInfo.type,
      message: errorInfo.message,
      stack: errorInfo.originalError?.stack,
      module: errorInfo.context?.component || 'unknown',
      context: errorInfo.context,
      userDescription,
      timestamp: errorInfo.timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    logger.info('Reporting error:', reportData);

    // 使用客户端日志上报API
    await api.post('/client-logs', reportData);

    logger.info('Error reported successfully');
  } catch (reportError) {
    logger.error('Failed to report error:', reportError);
  }
};

/**
 * 全局错误处理器
 * @param {ErrorEvent} event - 错误事件
 */
const globalErrorHandler = (event) => {
  const error = event.error || new Error(event.message);
  const errorInfo = handleError(error, {
    isGlobal: true,
    fileName: event.filename,
    lineNumber: event.lineno,
    columnNumber: event.colno,
  });

  logger.error('Global error', errorInfo);
};

/**
 * 未处理的Promise拒绝处理器
 * @param {PromiseRejectionEvent} event - 拒绝事件
 */
const unhandledRejectionHandler = (event) => {
  const error = event.reason || new Error('Unhandled promise rejection');
  const errorInfo = handleError(error, {
    isUnhandledRejection: true,
    promise: event.promise,
  });

  logger.error('Unhandled rejection', errorInfo);
};

/**
 * 网络状态变化处理器
 * @param {Event} event - 事件对象
 */
const onlineHandler = () => {
  isOffline = false;
  logger.info('Network is online');
};

const offlineHandler = () => {
  isOffline = true;
  logger.warn('Network is offline');
};

/**
 * 初始化错误处理服务
 */
const initErrorHandler = () => {
  window.addEventListener('error', globalErrorHandler);
  window.addEventListener('unhandledrejection', unhandledRejectionHandler);
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);

  isOffline = !navigator.onLine;

  logger.info('Error handler initialized');
};

/**
 * 销毁错误处理服务
 */
const destroyErrorHandler = () => {
  window.removeEventListener('error', globalErrorHandler);
  window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
  window.removeEventListener('online', onlineHandler);
  window.removeEventListener('offline', offlineHandler);

  logger.info('Error handler destroyed');
};

/**
 * 错误处理服务
 */
const errorHandler = {
  ERROR_TYPES,
  RETRY_CONFIG,
  updateContext,
  setUserId,
  setSessionId,
  handleError,
  logError,
  reportError,
  initErrorHandler,
  destroyErrorHandler,
  analyzeErrorType,
  getUserFriendlyMessage,
  canRetry,
  withRetry,
  wait,
};

export default errorHandler;
export {
  ERROR_TYPES,
  RETRY_CONFIG,
  updateContext,
  setUserId,
  setSessionId,
  handleError,
  logError,
  reportError,
  initErrorHandler,
  destroyErrorHandler,
  analyzeErrorType,
  getUserFriendlyMessage,
  canRetry,
  withRetry,
  wait,
};
