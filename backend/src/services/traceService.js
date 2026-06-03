/**
 * 文件名：traceService.js
 * 作者：开发者
 * 日期：2026-05-16
 * 版本：v1.0.0
 * 功能描述：链路追踪服务，提供完整的链路追踪功能
 * 更新记录：
 *   2026-05-16 - v1.0.0 - 初始版本，提供链路追踪功能
 */

const logger = require('../config/logger');

// 内存存储（生产环境建议使用Redis）
const traceStore = new Map();

/**
 * 链路追踪服务类
 */
class TraceService {
  constructor() {
    this.traceStore = traceStore;
    this.maxTraces = 10000; // 最大保留追踪数量
    this.ttl = 24 * 60 * 60 * 1000; // 24小时过期
  }

  /**
   * 开始一个新的链路追踪
   * @param {Object} options - 追踪选项
   * @param {string} options.requestId - 请求ID（可选）
   * @param {string} options.traceId - 链路ID（可选）
   * @param {string} options.parentSpanId - 父跨度ID（可选）
   * @param {string} options.operationName - 操作名称
   * @param {Object} options.metadata - 元数据
   * @returns {Object} 追踪上下文
   */
  startTrace(options = {}) {
    const {
      requestId,
      traceId,
      parentSpanId,
      operationName = 'unknown',
      metadata = {},
    } = options;

    const now = Date.now();

    // 生成新的追踪上下文
    const traceContext = {
      requestId: requestId || logger.generateRequestId(),
      traceId: traceId || logger.generateRequestId(),
      spanId: logger.generateRequestId().substring(0, 8),
      parentSpanId: parentSpanId || null,
      operationName,
      startTime: now,
      startTimeISO: new Date().toISOString(),
      metadata: {
        ...metadata,
        operationName,
      },
    };

    // 存储到内存中
    this.storeTrace(traceContext);

    // 记录开始追踪
    logger.info('链路追踪开始', {
      traceContext,
      ...metadata,
    });

    return traceContext;
  }

  /**
   * 结束链路追踪
   * @param {Object} traceContext - 追踪上下文
   * @param {Object} options - 结束选项
   * @param {string} options.status - 状态（success/error）
   * @param {Object} options.result - 结果
   * @param {Error} options.error - 错误
   */
  endTrace(traceContext, options = {}) {
    const { status = 'success', result, error } = options;
    const now = Date.now();
    const duration = now - traceContext.startTime;

    // 更新追踪信息
    const completeTrace = {
      ...traceContext,
      endTime: now,
      endTimeISO: new Date().toISOString(),
      duration,
      durationMs: duration,
      durationFormatted: this.formatDuration(duration),
      status,
      result: this.sanitizeData(result),
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : null,
    };

    // 更新存储
    this.updateTrace(traceContext.traceId, completeTrace);

    // 记录结束追踪
    if (status === 'error') {
      logger.error('链路追踪错误', {
        traceContext: completeTrace,
        error: error?.message,
      });
    } else {
      logger.info('链路追踪结束', {
        traceContext: completeTrace,
        duration: completeTrace.durationFormatted,
      });
    }

    return completeTrace;
  }

  /**
   * 记录追踪事件
   * @param {Object} traceContext - 追踪上下文
   * @param {string} eventName - 事件名称
   * @param {Object} eventData - 事件数据
   */
  recordEvent(traceContext, eventName, eventData = {}) {
    const event = {
      eventName,
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      data: this.sanitizeData(eventData),
    };

    // 更新追踪记录，添加事件
    const existingTrace = this.getTrace(traceContext.traceId);
    if (existingTrace) {
      if (!existingTrace.events) {
        existingTrace.events = [];
      }
      existingTrace.events.push(event);
      this.storeTrace(existingTrace);
    }

    // 记录事件日志
    logger.debug('追踪事件', {
      traceId: traceContext.traceId,
      spanId: traceContext.spanId,
      eventName,
      ...eventData,
    });
  }

  /**
   * 存储追踪信息
   * @param {Object} trace - 追踪信息
   */
  storeTrace(trace) {
    this.traceStore.set(trace.traceId, {
      ...trace,
      storedAt: Date.now(),
      storedAtISO: new Date().toISOString(),
    });

    // 清理过期数据
    this.cleanupOldTraces();
  }

  /**
   * 更新追踪信息
   * @param {string} traceId - 追踪ID
   * @param {Object} updates - 更新内容
   */
  updateTrace(traceId, updates) {
    const existing = this.traceStore.get(traceId);
    if (existing) {
      this.traceStore.set(traceId, {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * 获取追踪信息
   * @param {string} traceId - 追踪ID
   * @returns {Object|null} 追踪信息
   */
  getTrace(traceId) {
    const trace = this.traceStore.get(traceId);
    if (trace && this.isExpired(trace)) {
      this.traceStore.delete(traceId);
      return null;
    }
    return trace;
  }

  /**
   * 根据requestId获取追踪信息
   * @param {string} requestId - 请求ID
   * @returns {Object|null} 追踪信息
   */
  getTraceByRequestId(requestId) {
    for (const [traceId, trace] of this.traceStore.entries()) {
      if (trace.requestId === requestId && !this.isExpired(trace)) {
        return trace;
      }
    }
    return null;
  }

  /**
   * 搜索追踪信息
   * @param {Object} filters - 搜索过滤条件
   * @returns {Array} 匹配的追踪列表
   */
  searchTraces(filters = {}) {
    const {
      operationName,
      status,
      minDuration,
      maxDuration,
      startTimeFrom,
      startTimeTo,
      limit = 100,
    } = filters;

    const results = [];

    for (const [traceId, trace] of this.traceStore.entries()) {
      if (this.isExpired(trace)) continue;

      // 应用过滤条件
      if (operationName && !trace.operationName?.includes(operationName))
        continue;
      if (status && trace.status !== status) continue;
      if (minDuration !== undefined && trace.duration < minDuration) continue;
      if (maxDuration !== undefined && trace.duration > maxDuration) continue;
      if (startTimeFrom && trace.startTime < new Date(startTimeFrom).getTime())
        continue;
      if (startTimeTo && trace.startTime > new Date(startTimeTo).getTime())
        continue;

      results.push(trace);

      if (results.length >= limit) break;
    }

    // 按时间倒序排列
    return results.sort((a, b) => b.startTime - a.startTime);
  }

  /**
   * 清理过期追踪
   */
  cleanupOldTraces() {
    const now = Date.now();
    let deleted = 0;

    for (const [traceId, trace] of this.traceStore.entries()) {
      if (now - trace.storedAt > this.ttl) {
        this.traceStore.delete(traceId);
        deleted++;
      }
    }

    // 如果超过最大数量，删除最早的
    if (this.traceStore.size > this.maxTraces) {
      const sorted = Array.from(this.traceStore.entries()).sort(
        (a, b) => a[1].storedAt - b[1].storedAt
      );

      const toDelete = sorted.slice(0, this.traceStore.size - this.maxTraces);
      toDelete.forEach(([id]) => this.traceStore.delete(id));
      deleted += toDelete.length;
    }

    if (deleted > 0) {
      logger.debug('清理过期追踪', { deleted });
    }
  }

  /**
   * 检查追踪是否过期
   * @param {Object} trace - 追踪信息
   * @returns {boolean} 是否过期
   */
  isExpired(trace) {
    return Date.now() - trace.storedAt > this.ttl;
  }

  /**
   * 获取追踪统计
   * @returns {Object} 统计信息
   */
  getTraceStats() {
    const now = Date.now();
    let total = 0;
    let successful = 0;
    let error = 0;
    let totalDuration = 0;
    let maxDuration = 0;
    let minDuration = Infinity;
    const operations = new Map();

    for (const [traceId, trace] of this.traceStore.entries()) {
      if (this.isExpired(trace)) continue;

      total++;
      if (trace.status === 'success') successful++;
      if (trace.status === 'error') error++;

      if (trace.duration) {
        totalDuration += trace.duration;
        maxDuration = Math.max(maxDuration, trace.duration);
        minDuration = Math.min(minDuration, trace.duration);
      }

      const opName = trace.operationName || 'unknown';
      operations.set(opName, (operations.get(opName) || 0) + 1);
    }

    return {
      totalTraces: total,
      successful,
      error,
      averageDuration: total > 0 ? Math.round(totalDuration / total) : 0,
      maxDuration,
      minDuration: minDuration === Infinity ? 0 : minDuration,
      topOperations: Array.from(operations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      activeTraces: this.traceStore.size,
    };
  }

  /**
   * 格式化时长
   * @param {number} durationMs - 时长（毫秒）
   * @returns {string} 格式化后的时长
   */
  formatDuration(durationMs) {
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * 清理敏感数据
   * @param {*} data - 数据
   * @returns {*} 清理后的数据
   */
  sanitizeData(data) {
    if (!data) return data;

    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map((item) => this.sanitizeData(item));
      }

      const result = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (
          [
            'password',
            'token',
            'secret',
            'authorization',
            'creditcard',
          ].includes(lowerKey)
        ) {
          result[key] = '***';
        } else {
          result[key] = this.sanitizeData(value);
        }
      }
      return result;
    }

    return data;
  }
}

module.exports = new TraceService();
