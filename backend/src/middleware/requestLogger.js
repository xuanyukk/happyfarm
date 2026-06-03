/**
 * 文件名：requestLogger.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v2.1.0
 * 功能描述：请求日志中间件，记录所有API请求并完善链路追踪
 * 更新记录：
 *   2026-03-18 - v1.0.0 - 请求日志中间件，记录所有API请求
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-05-16 - v2.0.0 - 完善链路追踪，requestId完整传递
 *   2026-05-28 - v2.1.0 - 集成RequestTracer、AsyncLogWriter、分级记录
 */
// 请求日志中间件
const logger = require('../config/logger');
const {
  requestTracer,
  asyncWriter,
  SensitiveDataMasker,
} = require('../utils/logger-advanced');

// 过滤敏感字段
const filterSensitiveData = (obj) => {
  if (!obj) return obj;
  const result = { ...obj };
  const sensitiveFields = ['password', 'token', 'authorization'];
  for (const field of sensitiveFields) {
    if (result[field]) {
      result[field] = '***';
    }
  }
  return result;
};

/**
 * 请求日志中间件（增强版 v2.1.0）
 * 功能：
 * - 生成/接收requestId并贯穿整个请求生命周期
 * - 集成 RequestTracer 进行链路追踪
 * - 集成 AsyncLogWriter 实现异步批量写入
 * - 记录请求开始和结束
 * - 记录请求和响应元数据
 * - 计算响应时间
 * - 慢请求检测（>1s 自动记录性能日志）
 * - 按状态码分级：5xx→error, 4xx→warn, 其他→info
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip, headers, body, query } = req;

  // 获取或生成requestId
  const requestId = headers['x-request-id'] || logger.generateRequestId();

  // 将requestId添加到请求上下文
  req.requestId = requestId;

  // 将requestId添加到响应头中
  res.setHeader('X-Request-ID', requestId);

  // ── 链路追踪集成 ──────────────────────────────
  const trace = requestTracer.startTrace(req, requestId);
  req.traceContext = {
    traceId: trace.traceId,
    requestId,
    parentRequestId: headers['x-parent-request-id'] || null,
    spanId: logger.generateRequestId().substring(0, 8),
    timestamp: new Date().toISOString(),
  };

  // 构建请求元数据（脱敏处理）
  const requestMetadata = {
    requestId,
    method,
    url: originalUrl,
    ip,
    userAgent: headers['user-agent'],
    referer: headers['referer'],
    query: filterSensitiveData(query),
    body: SensitiveDataMasker.maskObject(filterSensitiveData(body)),
    traceContext: req.traceContext,
  };

  // 异步队列记录请求开始（非阻塞）
  asyncWriter.enqueue({
    level: 'info',
    message: '请求开始 Request Started',
    logType: 'access',
    metadata: requestMetadata,
  });

  // 记录响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // 链路追踪结束
    requestTracer.endTrace(trace.traceId, statusCode);

    const logData = {
      requestId,
      method,
      url: originalUrl,
      ip,
      statusCode,
      duration: `${duration}ms`,
      durationMs: duration,
      userAgent: headers['user-agent'],
      traceContext: {
        requestId,
        timestamp: new Date().toISOString(),
        statusCode,
      },
    };

    // 根据状态码选择日志级别
    if (statusCode >= 500) {
      asyncWriter.enqueue({
        level: 'error',
        message: `请求错误 Request Error (${statusCode})`,
        logType: 'error',
        metadata: SensitiveDataMasker.maskObject(logData),
      });
    } else if (statusCode >= 400) {
      asyncWriter.enqueue({
        level: 'warn',
        message: `请求警告 Request Warning (${statusCode})`,
        logType: 'access',
        metadata: logData,
      });
    } else {
      asyncWriter.enqueue({
        level: 'info',
        message: '请求成功 Request Success',
        logType: 'access',
        metadata: logData,
      });
    }
  });

  // 记录响应错误
  res.on('error', (error) => {
    const duration = Date.now() - start;
    asyncWriter.enqueue({
      level: 'error',
      message: '请求异常 Request Exception',
      logType: 'error',
      metadata: {
        requestId,
        method,
        url: originalUrl,
        ip,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack,
      },
    });
  });

  next();
};

module.exports = requestLogger;
