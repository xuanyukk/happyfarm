/**
 * 文件名：incrementalService.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：四层核心刷新架构 - 智能增量轮询服务
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建
 */

import { logger } from './logger.js';
import { api } from './api.js';

class IncrementalService {
  constructor() {
    this.pollInterval = null;
    this.pollIntervalMs = 15000;
    this.idleIntervalMs = 30000;
    this.isPolling = false;
    this.isIdle = false;
    this.isBackground = false;
    this.lastActivityTime = Date.now();
    this.idleThreshold = 30000;
    this.callbacks = [];

    this.setupVisibilityListener();
    this.setupActivityListener();

    logger.info('IncrementalService 初始化完成');
  }

  setupVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isBackground = document.hidden;
        if (this.isBackground) {
          logger.info('页面进入后台，暂停增量轮询');
          this.stopPolling();
        } else {
          logger.info('页面回到前台，恢复增量轮询');
          this.startPolling();
          this.fetchIncremental(Date.now() - 60000);
        }
      });
    }
  }

  setupActivityListener() {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
    ];

    if (typeof document !== 'undefined') {
      activityEvents.forEach((event) => {
        document.addEventListener(
          event,
          () => {
            this.lastActivityTime = Date.now();
            if (this.isIdle) {
              this.isIdle = false;
              logger.info('检测到用户活动，恢复正常轮询频率');
              this.restartPolling();
            }
          },
          { passive: true }
        );
      });
    }
  }

  checkIdleStatus() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    if (timeSinceLastActivity > this.idleThreshold && !this.isIdle) {
      this.isIdle = true;
      logger.info('用户闲置超过30秒，降低轮询频率');
      this.restartPolling();
    }
  }

  async fetchIncremental(lastSyncTime) {
    try {
      logger.debug(
        '请求增量数据，上次同步时间:',
        new Date(lastSyncTime).toISOString()
      );

      const response = await api.get('/farm/incremental', {
        params: { lastSyncTime },
      });

      if (response.data && response.data.success) {
        const result = response.data.data;

        if (result.hasChanges) {
          logger.info(`收到增量数据，${result.lands?.length || 0} 个地块变化`);
          this.notifyCallbacks(result);
        } else {
          logger.debug('无增量数据变化');
        }

        return result;
      }

      return { hasChanges: false, lands: [] };
    } catch (error) {
      logger.error('增量数据请求失败:', error);
      throw error;
    }
  }

  startPolling() {
    if (this.isPolling || this.isBackground) {
      return;
    }

    this.isPolling = true;
    const interval = this.isIdle ? this.idleIntervalMs : this.pollIntervalMs;

    logger.info(`启动增量轮询，间隔 ${interval / 1000} 秒`);

    this.pollInterval = setInterval(async () => {
      this.checkIdleStatus();

      if (this.isBackground) {
        return;
      }

      try {
        await this.fetchIncremental(Date.now() - interval);
      } catch (error) {
        logger.error('增量轮询失败:', error);
      }
    }, interval);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    logger.info('停止增量轮询');
  }

  restartPolling() {
    this.stopPolling();
    this.startPolling();
  }

  onIncrementalUpdate(callback) {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }

  offIncrementalUpdate(callback) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback);
  }

  notifyCallbacks(data) {
    this.callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        logger.error('执行增量更新回调失败:', error);
      }
    });
  }

  setPollInterval(ms) {
    this.pollIntervalMs = ms;
    if (this.isPolling && !this.isIdle) {
      this.restartPolling();
    }
    logger.info(`设置正常轮询间隔: ${ms / 1000} 秒`);
  }

  setIdleInterval(ms) {
    this.idleIntervalMs = ms;
    if (this.isPolling && this.isIdle) {
      this.restartPolling();
    }
    logger.info(`设置闲置轮询间隔: ${ms / 1000} 秒`);
  }

  setIdleThreshold(ms) {
    this.idleThreshold = ms;
    logger.info(`设置闲置阈值: ${ms / 1000} 秒`);
  }

  destroy() {
    this.stopPolling();
    this.callbacks = [];
    logger.info('IncrementalService 已销毁');
  }
}

const incrementalService = new IncrementalService();

export default incrementalService;
