/**
 * 文件名：networkMonitor.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：网络状态检测服务
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现网络状态检测功能
 */

import { logger } from './logger';

/**
 * 网络状态检测服务
 * 用于检测网络连接状态、网络质量，并在网络状态变化时通知订阅者
 */
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isMonitoring = false;
    this.connectionQuality = 'unknown'; // unknown, excellent, good, poor, offline
    this.downlink = null;
    this.rtt = null;
    this.effectiveType = null;
    this.subscribers = new Map(); // eventName -> Set<handlers>
    this.qualityCheckInterval = null;
    this.qualityCheckIntervalMs = 30000; // 30秒检查一次网络质量
  }

  /**
   * 初始化网络状态监测
   */
  init() {
    if (this.isMonitoring) {
      logger.warn('NetworkMonitor: 网络监测已在运行中');
      return;
    }

    logger.info('NetworkMonitor: 初始化网络状态监测');
    this.isMonitoring = true;

    // 监听在线/离线事件
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // 监听网络质量变化（如果可用）
    if ('connection' in navigator) {
      navigator.connection.addEventListener(
        'change',
        this.handleConnectionChange.bind(this)
      );
      this.updateConnectionInfo();
    }

    // 初始检测
    this.checkNetworkQuality();

    // 启动定期网络质量检测
    this.startQualityCheck();

    logger.info(
      `NetworkMonitor: 初始化完成，当前状态: ${this.isOnline ? '在线' : '离线'}`
    );
  }

  /**
   * 停止网络状态监测
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }

    logger.info('NetworkMonitor: 停止网络状态监测');

    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));

    if ('connection' in navigator) {
      navigator.connection.removeEventListener(
        'change',
        this.handleConnectionChange.bind(this)
      );
    }

    this.stopQualityCheck();
    this.isMonitoring = false;
  }

  /**
   * 处理网络上线事件
   */
  handleOnline() {
    logger.info('NetworkMonitor: 网络已连接');
    this.isOnline = true;
    this.notify('online');
    this.checkNetworkQuality();
  }

  /**
   * 处理网络离线事件
   */
  handleOffline() {
    logger.warn('NetworkMonitor: 网络已断开');
    this.isOnline = false;
    this.connectionQuality = 'offline';
    this.notify('offline');
    this.notify('quality_change', { quality: 'offline' });
  }

  /**
   * 处理网络连接变化事件
   */
  handleConnectionChange() {
    logger.debug('NetworkMonitor: 网络连接状态变化');
    this.updateConnectionInfo();
    this.checkNetworkQuality();
  }

  /**
   * 更新网络连接信息
   */
  updateConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      this.downlink = conn.downlink;
      this.rtt = conn.rtt;
      this.effectiveType = conn.effectiveType;
      logger.debug('NetworkMonitor: 网络连接信息更新', {
        downlink: this.downlink,
        rtt: this.rtt,
        effectiveType: this.effectiveType,
      });
    }
  }

  /**
   * 检测网络质量
   */
  checkNetworkQuality() {
    if (!this.isOnline) {
      this.connectionQuality = 'offline';
      return;
    }

    let quality = 'unknown';

    if ('connection' in navigator) {
      const conn = navigator.connection;

      // 根据 effectiveType 判断
      if (conn.effectiveType === '4g') {
        quality = 'excellent';
      } else if (conn.effectiveType === '3g') {
        quality = 'good';
      } else if (
        conn.effectiveType === '2g' ||
        conn.effectiveType === 'slow-2g'
      ) {
        quality = 'poor';
      }

      // 根据 rtt 和 downlink 调整
      if (conn.rtt !== null && conn.downlink !== null) {
        if (conn.rtt < 100 && conn.downlink > 10) {
          quality = 'excellent';
        } else if (conn.rtt < 300 && conn.downlink > 2) {
          quality = 'good';
        } else if (conn.rtt > 1000 || conn.downlink < 0.5) {
          quality = 'poor';
        }
      }
    }

    const oldQuality = this.connectionQuality;
    this.connectionQuality = quality;

    if (oldQuality !== quality) {
      logger.info(`NetworkMonitor: 网络质量变化: ${oldQuality} -> ${quality}`);
      this.notify('quality_change', {
        oldQuality,
        newQuality: quality,
        downlink: this.downlink,
        rtt: this.rtt,
        effectiveType: this.effectiveType,
      });
    }
  }

  /**
   * 启动定期网络质量检测
   */
  startQualityCheck() {
    if (this.qualityCheckInterval) {
      return;
    }

    this.qualityCheckInterval = setInterval(() => {
      this.checkNetworkQuality();
    }, this.qualityCheckIntervalMs);
  }

  /**
   * 停止定期网络质量检测
   */
  stopQualityCheck() {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }
  }

  /**
   * 订阅网络事件
   * @param {string} eventName 事件名称（online, offline, quality_change）
   * @param {Function} handler 处理函数
   */
  on(eventName, handler) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    this.subscribers.get(eventName).add(handler);
  }

  /**
   * 取消订阅网络事件
   * @param {string} eventName 事件名称
   * @param {Function} handler 处理函数
   */
  off(eventName, handler) {
    if (this.subscribers.has(eventName)) {
      this.subscribers.get(eventName).delete(handler);
    }
  }

  /**
   * 通知订阅者
   * @param {string} eventName 事件名称
   * @param {any} data 事件数据
   */
  notify(eventName, data) {
    if (this.subscribers.has(eventName)) {
      this.subscribers.get(eventName).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          logger.error('NetworkMonitor: 通知订阅者失败', {
            eventName,
            error: error.message,
          });
        }
      });
    }
  }

  /**
   * 获取网络状态
   * @returns {Object} 网络状态信息
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionQuality: this.connectionQuality,
      downlink: this.downlink,
      rtt: this.rtt,
      effectiveType: this.effectiveType,
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * 检查是否在线
   * @returns {boolean} 是否在线
   */
  isOnline() {
    return this.isOnline;
  }

  /**
   * 检查网络质量是否良好
   * @returns {boolean} 是否良好
   */
  isGoodQuality() {
    return (
      this.connectionQuality === 'excellent' ||
      this.connectionQuality === 'good'
    );
  }

  /**
   * 检查网络质量是否较差
   * @returns {boolean} 是否较差
   */
  isPoorQuality() {
    return (
      this.connectionQuality === 'poor' || this.connectionQuality === 'offline'
    );
  }
}

// 创建单例实例
export const networkMonitor = new NetworkMonitor();
export default networkMonitor;
