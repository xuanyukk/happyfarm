/**
 * 文件名：logger-advanced.js
 * 作者：开发者
 * 日期：2026-05-13
 * 版本：v1.0.0
 * 功能描述：高级日志增强功能 - 异步写入、链路追踪、脱敏、监控
 * 更新记录：
 *   2026-05-13 - v1.0.0 - 初始版本，包含高级功能
 */

const {
  logger,
  logAlertEmitter,
  AlertConfig,
  systemLogger,
} = require('../config/logger');

/**
 * 日志性能监控指标
 */
class LogMetrics {
  constructor() {
    this.metrics = {
      total: 0,
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      byType: {},
      pendingWrites: 0,
      writeErrors: 0,
      avgWriteTime: 0,
      lastFlushTime: 0,
      flushCount: 0,
    };
    this.startTime = Date.now();
  }

  increment(level, type = 'unknown') {
    this.metrics.total++;
    this.metrics[level] = (this.metrics[level] || 0) + 1;
    this.metrics.byType[type] = (this.metrics.byType[type] || 0) + 1;
  }

  recordWriteTime(duration) {
    const total = this.metrics.flushCount;
    this.metrics.avgWriteTime =
      (this.metrics.avgWriteTime * total + duration) / (total + 1);
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    return {
      ...this.metrics,
      uptime: uptime,
      ratePerMinute: Math.round(this.metrics.total / (uptime / 60000) || 0),
      errorRate:
        this.metrics.total > 0
          ? Math.round((this.metrics.error / this.metrics.total) * 10000) / 100
          : 0,
    };
  }
}

/**
 * 敏感信息脱敏工具
 */
const SensitiveDataMasker = {
  patterns: {
    password: /password["']?\s*[:=]\s*["']([^"']+)["']/gi,
    token: /token["']?\s*[:=]\s*["']([^"']+)["']/gi,
    creditCard: /\b(\d{4})[\d\s\-]{5,14}(\d{4})\b/g,
    email: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    phone: /(\d{3})\d{4}(\d{4})/g,
    idCard: /(\d{6})\d{8}(\d{4})/g,
  },

  mask(text) {
    if (typeof text !== 'string') {
      text = JSON.stringify(text);
    }

    let masked = text;

    // 密码和token完全遮蔽
    masked = masked.replace(this.patterns.password, (match, p1) =>
      match.replace(p1, '***')
    );
    masked = masked.replace(this.patterns.token, (match, p1) =>
      match.replace(p1, '***')
    );

    // 其他部分遮蔽
    masked = masked.replace(this.patterns.creditCard, '$1****$2');
    masked = masked.replace(this.patterns.email, (match, p1, p2) => {
      const showLen = Math.min(p1.length, 2);
      return p1.substring(0, showLen) + '****@' + p2;
    });
    masked = masked.replace(this.patterns.phone, '$1****$2');
    masked = masked.replace(this.patterns.idCard, '$1********$2');

    return masked;
  },

  maskObject(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskObject(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('credit') ||
        lowerKey.includes('card')
      ) {
        result[key] = '***';
      } else if (typeof value === 'object') {
        result[key] = this.maskObject(value);
      } else if (typeof value === 'string') {
        result[key] = this.mask(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  },
};

/**
 * 异步日志写入器（批量写入优化性能）
 */
class AsyncLogWriter {
  constructor(options = {}) {
    this.buffer = [];
    this.maxBufferSize = options.maxBufferSize || 100;
    this.flushInterval = options.flushInterval || 1000; // 1秒
    this.timer = null;
    this.metrics = new LogMetrics();
    this.isFlushing = false;
  }

  /**
   * 启动异步写入器
   */
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.flushInterval);
    systemLogger.info(
      '异步日志写入器已启动',
      {
        maxBufferSize: this.maxBufferSize,
        flushInterval: this.flushInterval,
      },
      'system',
      'logger'
    );
  }

  /**
   * 停止异步写入器
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.flush();
      systemLogger.info('异步日志写入器已停止');
    }
  }

  /**
   * 添加日志到缓冲区
   */
  enqueue(logEntry) {
    this.buffer.push(logEntry);
    this.metrics.increment(logEntry.level, logEntry.logType);
    this.metrics.pendingWrites = this.buffer.length;

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * 批量刷新写入
   */
  async flush() {
    if (this.isFlushing || this.buffer.length === 0) return;

    this.isFlushing = true;
    const startTime = Date.now();
    const toWrite = [...this.buffer];
    this.buffer = [];
    this.metrics.pendingWrites = 0;

    try {
      // 实际写入操作（这里模拟批量写入）
      for (const logEntry of toWrite) {
        // 使用原有的logger方法
        const level = logEntry.level;
        const msg = logEntry.message;
        const meta = logEntry.metadata || {};
        logger[level](msg, meta);
      }

      const duration = Date.now() - startTime;
      this.metrics.recordWriteTime(duration);
      this.metrics.flushCount++;
      this.metrics.lastFlushTime = Date.now();
    } catch (error) {
      this.metrics.writeErrors++;
      systemLogger.error(
        '日志批量写入失败',
        {
          error: error.message,
          count: toWrite.length,
        },
        'system',
        'logger'
      );

      // 回滚失败的日志到缓冲区
      this.buffer.unshift(...toWrite);
    }

    this.isFlushing = false;
  }
}

/**
 * 告警渠道管理器
 */
class AlertChannelManager {
  constructor() {
    this.channels = new Map();
    this.registerDefaultChannels();
  }

  registerDefaultChannels() {
    // 控制台渠道（已默认启用）
    this.registerChannel('console', {
      name: '控制台',
      enabled: true,
      send: async (alert) => {
        console.error(
          `[LOG ALERT] ${alert.level.toUpperCase()}: ${alert.message}`,
          alert
        );
      },
    });

    // 文件渠道（用于严重告警）
    this.registerChannel('file', {
      name: '文件',
      enabled: true,
      send: async (alert) => {
        systemLogger.error('日志告警', alert, 'alert', 'logger');
      },
    });
  }

  registerChannel(name, config) {
    this.channels.set(name, {
      ...config,
      name,
    });
  }

  async send(alert) {
    const enabledChannels = Array.from(this.channels.values()).filter(
      (ch) => ch.enabled
    );

    const results = [];
    for (const channel of enabledChannels) {
      try {
        await channel.send(alert);
        results.push({ channel: channel.name, success: true });
      } catch (error) {
        results.push({
          channel: channel.name,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  getChannels() {
    return Array.from(this.channels.values()).map((ch) => ({
      name: ch.name,
      enabled: ch.enabled,
    }));
  }
}

/**
 * 请求链路追踪器
 */
class RequestTracer {
  constructor() {
    this.traceIdHeader = 'X-Trace-ID';
    this.requestTraces = new Map(); // traceId -> requestDetails
    this.maxTraceAge = 30 * 60 * 1000; // 30分钟
  }

  generateTraceId() {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`;
  }

  startTrace(req, traceId = null) {
    const id =
      traceId ||
      req.headers[this.traceIdHeader.toLowerCase()] ||
      this.generateTraceId();

    const trace = {
      traceId: id,
      startTime: Date.now(),
      request: {
        method: req.method,
        url: req.url,
        headers: SensitiveDataMasker.maskObject(req.headers),
        ip: req.ip,
      },
      logs: [],
      errors: [],
    };

    this.requestTraces.set(id, trace);

    // 清理过期的追踪
    this.cleanupExpiredTraces();

    return trace;
  }

  addLog(traceId, level, message, meta = {}) {
    const trace = this.requestTraces.get(traceId);
    if (trace) {
      trace.logs.push({
        timestamp: Date.now(),
        level,
        message,
        meta: SensitiveDataMasker.maskObject(meta),
      });
    }
  }

  addError(traceId, error) {
    const trace = this.requestTraces.get(traceId);
    if (trace) {
      trace.errors.push({
        timestamp: Date.now(),
        message: error.message,
        stack: error.stack,
      });
    }
  }

  endTrace(traceId, statusCode) {
    const trace = this.requestTraces.get(traceId);
    if (trace) {
      trace.endTime = Date.now();
      trace.duration = trace.endTime - trace.startTime;
      trace.statusCode = statusCode;

      // 记录到性能日志
      if (trace.duration > 1000) {
        systemLogger.warn(
          '慢请求检测',
          {
            traceId,
            method: trace.request.method,
            url: trace.request.url,
            duration: trace.duration,
            logCount: trace.logs.length,
            errorCount: trace.errors.length,
          },
          'performance',
          'tracer'
        );
      }

      return trace;
    }
    return null;
  }

  getTrace(traceId) {
    return this.requestTraces.get(traceId);
  }

  cleanupExpiredTraces() {
    const now = Date.now();
    for (const [id, trace] of this.requestTraces.entries()) {
      if (trace.endTime && now - trace.endTime > this.maxTraceAge) {
        this.requestTraces.delete(id);
      }
    }
  }

  getActiveTraces() {
    return Array.from(this.requestTraces.values()).filter((t) => !t.endTime);
  }
}

// 全局实例
const logMetrics = new LogMetrics();
const asyncWriter = new AsyncLogWriter();
const alertManager = new AlertChannelManager();
const requestTracer = new RequestTracer();

// 连接告警事件
logAlertEmitter.on('alert', async (alert) => {
  await alertManager.send(alert);
});

// 导出模块
module.exports = {
  LogMetrics,
  logMetrics,
  SensitiveDataMasker,
  AsyncLogWriter,
  asyncWriter,
  AlertChannelManager,
  alertManager,
  RequestTracer,
  requestTracer,
};
