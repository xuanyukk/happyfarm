/**
 * 文件名：timeSync.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：服务器时间同步服务，用于同步和校准本地时间与服务器时间
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现时间同步功能
 */

import api from './api';
import { logger } from './logger';
import metricsCollector from './metricsCollector';

/**
 * 服务器时间同步服务类
 * 用于同步和校准本地时间与服务器时间，确保倒计时和成熟时间计算准确
 */
class TimeSyncService {
  constructor() {
    this.serverTimeOffset = 0; // 服务器时间与本地时间的偏移量（毫秒）
    this.lastSyncTime = 0; // 上次同步时间戳
    this.syncInterval = 5 * 60 * 1000; // 同步间隔：5分钟
    this.isSyncing = false; // 是否正在同步
    this.syncTimer = null; // 自动同步定时器
  }

  /**
   * 初始化时间同步服务
   */
  init() {
    logger.info('TimeSyncService: 初始化时间同步服务');

    // 立即同步一次
    this.syncServerTime();

    // 启动自动同步定时器
    this.startAutoSync();
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncServerTime();
    }, this.syncInterval);

    logger.info(
      `TimeSyncService: 自动同步已启动，间隔 ${this.syncInterval / 1000} 秒`
    );
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      logger.info('TimeSyncService: 自动同步已停止');
    }
  }

  /**
   * 同步服务器时间
   * @returns {Promise<boolean>} 同步是否成功
   */
  async syncServerTime() {
    if (this.isSyncing) {
      logger.warn('TimeSyncService: 正在同步中，跳过本次同步');
      return false;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      logger.info('TimeSyncService: 开始同步服务器时间');

      // 请求服务器时间
      const response = await api.get('/api/time');

      const endTime = Date.now();
      const networkDelay = (endTime - startTime) / 2;
      const serverTime = response.data.serverTime + networkDelay;

      // 计算时间偏移量
      this.serverTimeOffset = serverTime - Date.now();
      this.lastSyncTime = Date.now();

      logger.info(
        `TimeSyncService: 时间同步成功，偏移量: ${this.serverTimeOffset}ms`
      );

      // 记录性能指标
      metricsCollector.recordTimeSync({
        success: true,
        offset: this.serverTimeOffset,
        networkDelay,
      });

      return true;
    } catch (error) {
      logger.error('TimeSyncService: 时间同步失败', error);

      // 记录性能指标
      metricsCollector.recordTimeSync({
        success: false,
        error: error.message,
      });

      // 如果是第一次同步失败，使用本地时间
      if (this.lastSyncTime === 0) {
        logger.warn('TimeSyncService: 首次同步失败，使用本地时间');
        this.serverTimeOffset = 0;
      }

      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 获取校准后的当前服务器时间
   * @returns {number} 服务器时间戳（毫秒）
   */
  now() {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * 获取校准后的当前服务器时间（秒级）
   * @returns {number} 服务器时间戳（秒）
   */
  nowSeconds() {
    return Math.floor(this.now() / 1000);
  }

  /**
   * 格式化服务器时间
   * @param {string} format 格式字符串，支持 YYYY-MM-DD HH:mm:ss
   * @returns {string} 格式化后的时间字符串
   */
  format(format = 'YYYY-MM-DD HH:mm:ss') {
    const date = new Date(this.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 计算两个时间点的差值
   * @param {number} targetTime 目标时间戳（毫秒）
   * @returns {number} 时间差（毫秒），正数表示目标时间在未来，负数表示已过
   */
  diff(targetTime) {
    return targetTime - this.now();
  }

  /**
   * 检查目标时间是否已到达
   * @param {number} targetTime 目标时间戳（毫秒）
   * @returns {boolean} 是否已到达
   */
  isReached(targetTime) {
    return this.diff(targetTime) <= 0;
  }

  /**
   * 获取时间同步状态
   * @returns {object} 状态信息
   */
  getStatus() {
    return {
      isSynced: this.lastSyncTime > 0,
      lastSyncTime: this.lastSyncTime,
      serverTimeOffset: this.serverTimeOffset,
      now: this.now(),
    };
  }

  /**
   * 销毁服务，清理资源
   */
  destroy() {
    this.stopAutoSync();
    logger.info('TimeSyncService: 服务已销毁');
  }
}

// 创建单例实例
export const timeSyncService = new TimeSyncService();
export default timeSyncService;
