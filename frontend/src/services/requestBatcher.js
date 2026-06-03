/**
 * 文件名：requestBatcher.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：请求合并去重服务
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现请求合并去重功能
 */

import { logger } from './logger';

/**
 * 请求合并去重服务
 * 用于合并短时间内的连续操作，去重相同请求，优化网络请求效率
 */
class RequestBatcher {
  constructor() {
    this.pendingRequests = new Map(); // key -> { timer, requests, resolver }
    this.batchWindow = 500; // 批处理窗口，毫秒
    this.defaultMaxBatchSize = 10; // 默认最大批量大小
  }

  /**
   * 添加请求到批处理队列
   * @param {string} key 请求唯一标识
   * @param {Function} executeFn 执行函数
   * @param {Object} [options] 配置选项
   * @param {number} [options.maxBatchSize] 最大批量大小
   * @param {number} [options.batchWindow] 批处理窗口（毫秒）
   * @returns {Promise<any>} 请求结果
   */
  async batch(key, executeFn, options = {}) {
    const maxBatchSize = options.maxBatchSize || this.defaultMaxBatchSize;
    const batchWindow = options.batchWindow || this.batchWindow;

    return new Promise((resolve, reject) => {
      // 如果已存在相同key的批处理，添加到现有队列
      if (this.pendingRequests.has(key)) {
        const batch = this.pendingRequests.get(key);
        batch.requests.push({ executeFn, resolve, reject });

        // 如果达到最大批量大小，立即执行
        if (batch.requests.length >= maxBatchSize) {
          this.executeBatch(key);
        }
        return;
      }

      // 创建新的批处理
      const batch = {
        requests: [{ executeFn, resolve, reject }],
        timer: setTimeout(() => {
          this.executeBatch(key);
        }, batchWindow),
      };

      this.pendingRequests.set(key, batch);
      logger.debug('RequestBatcher: 创建新批处理', { key, batchWindow });
    });
  }

  /**
   * 执行批处理
   * @param {string} key 批处理标识
   */
  async executeBatch(key) {
    if (!this.pendingRequests.has(key)) {
      return;
    }

    const batch = this.pendingRequests.get(key);
    this.pendingRequests.delete(key);

    // 清除定时器
    if (batch.timer) {
      clearTimeout(batch.timer);
    }

    logger.debug('RequestBatcher: 执行批处理', {
      key,
      count: batch.requests.length,
    });

    try {
      // 去重相同的请求
      const uniqueRequests = this.deduplicateRequests(batch.requests);

      // 执行所有请求
      for (const req of uniqueRequests) {
        try {
          const result = await req.executeFn();
          // 找到所有匹配的请求并resolve
          batch.requests
            .filter((r) => this.isSameRequest(r, req))
            .forEach((r) => r.resolve(result));
        } catch (error) {
          // 找到所有匹配的请求并reject
          batch.requests
            .filter((r) => this.isSameRequest(r, req))
            .forEach((r) => r.reject(error));
        }
      }
    } catch (error) {
      logger.error('RequestBatcher: 批处理执行失败', {
        key,
        error: error.message,
      });
      // 如果整体失败，reject所有请求
      batch.requests.forEach((req) => req.reject(error));
    }
  }

  /**
   * 去重请求
   * @param {Array} requests 请求列表
   * @returns {Array} 去重后的请求列表
   */
  deduplicateRequests(requests) {
    const seen = new Set();
    const unique = [];

    for (const req of requests) {
      const key = this.getRequestKey(req);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(req);
      }
    }

    return unique;
  }

  /**
   * 获取请求的唯一标识
   * @param {Object} req 请求对象
   * @returns {string} 唯一标识
   */
  getRequestKey(req) {
    // 使用函数的toString作为key（简化版本）
    // 实际使用时可以根据具体参数生成更精确的key
    return req.executeFn.toString();
  }

  /**
   * 判断两个请求是否相同
   * @param {Object} req1 请求1
   * @param {Object} req2 请求2
   * @returns {boolean} 是否相同
   */
  isSameRequest(req1, req2) {
    return this.getRequestKey(req1) === this.getRequestKey(req2);
  }

  /**
   * 取消特定批处理
   * @param {string} key 批处理标识
   */
  cancel(key) {
    if (this.pendingRequests.has(key)) {
      const batch = this.pendingRequests.get(key);
      if (batch.timer) {
        clearTimeout(batch.timer);
      }
      // reject所有等待的请求
      batch.requests.forEach((req) => {
        req.reject(new Error('Request cancelled'));
      });
      this.pendingRequests.delete(key);
      logger.info('RequestBatcher: 批处理已取消', { key });
    }
  }

  /**
   * 取消所有批处理
   */
  cancelAll() {
    const keys = Array.from(this.pendingRequests.keys());
    keys.forEach((key) => this.cancel(key));
    logger.info('RequestBatcher: 所有批处理已取消');
  }

  /**
   * 获取批处理状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    const status = {
      pendingBatches: this.pendingRequests.size,
      batches: {},
    };

    this.pendingRequests.forEach((batch, key) => {
      status.batches[key] = {
        requestCount: batch.requests.length,
      };
    });

    return status;
  }

  /**
   * 设置默认批处理窗口
   * @param {number} windowMs 窗口大小（毫秒）
   */
  setBatchWindow(windowMs) {
    this.batchWindow = windowMs;
    logger.info(`RequestBatcher: 默认批处理窗口已设置为 ${windowMs}ms`);
  }

  /**
   * 设置默认最大批量大小
   * @param {number} size 最大批量大小
   */
  setMaxBatchSize(size) {
    this.defaultMaxBatchSize = size;
    logger.info(`RequestBatcher: 默认最大批量大小已设置为 ${size}`);
  }
}

// 创建单例实例
export const requestBatcher = new RequestBatcher();
export default requestBatcher;
