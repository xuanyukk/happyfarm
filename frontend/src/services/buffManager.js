/**
 * 文件名：buffManager.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：BUFF效果管理器
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现BUFF效果管理和合并刷新
 */

import { logger } from './logger';
import { timeSyncService } from './timeSync';

/**
 * BUFF类型枚举
 */
const BUFF_TYPES = {
  FERTILIZER: 'fertilizer',
  SPEED_UP: 'speed_up',
  YIELD_BOOST: 'yield_boost',
  QUALITY_BOOST: 'quality_boost',
  DOUBLE_HARVEST: 'double_harvest',
};

/**
 * BUFF效果管理器
 * 用于管理施肥、加速等BUFF效果，多个BUFF应用时合并刷新，避免重复请求
 */
class BuffManager {
  constructor() {
    this.activeBuffs = new Map(); // landNum -> Map<buffId, buffData>
    this.pendingRefreshes = new Set(); // 需要刷新的地块
    this.refreshTimer = null;
    this.refreshDelay = 300; // 刷新延迟（毫秒），用于合并多个BUFF应用
    this.subscribers = new Map(); // eventName -> Set<handlers>
  }

  /**
   * 初始化BUFF管理器
   */
  init() {
    logger.info('BuffManager: 初始化BUFF效果管理器');
  }

  /**
   * 应用BUFF到地块
   * @param {number} landNum 地块编号
   * @param {Object} buff BUFF数据
   * @param {string} buff.id BUFF唯一标识
   * @param {string} buff.type BUFF类型
   * @param {string} buff.name BUFF名称
   * @param {number} buff.value BUFF值
   * @param {number} buff.duration 持续时间（毫秒）
   * @param {number} [buff.startTime] 开始时间（毫秒），默认当前时间
   * @returns {string} BUFF ID
   */
  applyBuff(landNum, buff) {
    const buffId =
      buff.id ||
      `${buff.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = buff.startTime || timeSyncService.now();
    const endTime = startTime + buff.duration;

    const buffData = {
      id: buffId,
      type: buff.type,
      name: buff.name,
      value: buff.value,
      startTime,
      endTime,
      duration: buff.duration,
    };

    // 确保地块有BUFF Map
    if (!this.activeBuffs.has(landNum)) {
      this.activeBuffs.set(landNum, new Map());
    }

    // 添加BUFF
    this.activeBuffs.get(landNum).set(buffId, buffData);

    logger.info('BuffManager: 应用BUFF', { landNum, buffId, type: buff.type });

    // 通知BUFF应用
    this.notify('buff_applied', { landNum, buff: buffData });

    // 标记地块需要刷新
    this.scheduleRefresh(landNum);

    return buffId;
  }

  /**
   * 移除地块的BUFF
   * @param {number} landNum 地块编号
   * @param {string} buffId BUFF ID
   * @returns {boolean} 是否成功移除
   */
  removeBuff(landNum, buffId) {
    if (!this.activeBuffs.has(landNum)) {
      return false;
    }

    const landBuffs = this.activeBuffs.get(landNum);
    const buff = landBuffs.get(buffId);

    if (!buff) {
      return false;
    }

    landBuffs.delete(buffId);

    // 如果地块没有BUFF了，清理Map
    if (landBuffs.size === 0) {
      this.activeBuffs.delete(landNum);
    }

    logger.info('BuffManager: 移除BUFF', { landNum, buffId });

    // 通知BUFF移除
    this.notify('buff_removed', { landNum, buffId, buff });

    // 标记地块需要刷新
    this.scheduleRefresh(landNum);

    return true;
  }

  /**
   * 获取地块的所有活跃BUFF
   * @param {number} landNum 地块编号
   * @returns {Array} BUFF列表
   */
  getActiveBuffs(landNum) {
    if (!this.activeBuffs.has(landNum)) {
      return [];
    }

    // 先清理过期的BUFF
    this.cleanupExpiredBuffs(landNum);

    const landBuffs = this.activeBuffs.get(landNum);
    return Array.from(landBuffs.values());
  }

  /**
   * 获取地块特定类型的活跃BUFF
   * @param {number} landNum 地块编号
   * @param {string} buffType BUFF类型
   * @returns {Array} BUFF列表
   */
  getBuffsByType(landNum, buffType) {
    const activeBuffs = this.getActiveBuffs(landNum);
    return activeBuffs.filter((buff) => buff.type === buffType);
  }

  /**
   * 计算地块的总BUFF效果值
   * @param {number} landNum 地块编号
   * @param {string} buffType BUFF类型
   * @returns {number} 总效果值
   */
  getTotalBuffValue(landNum, buffType) {
    const buffs = this.getBuffsByType(landNum, buffType);
    return buffs.reduce((total, buff) => total + buff.value, 0);
  }

  /**
   * 检查地块是否有特定类型的BUFF
   * @param {number} landNum 地块编号
   * @param {string} buffType BUFF类型
   * @returns {boolean} 是否有该类型的BUFF
   */
  hasBuffType(landNum, buffType) {
    return this.getBuffsByType(landNum, buffType).length > 0;
  }

  /**
   * 清理过期的BUFF
   * @param {number} [landNum] 地块编号，可选，不传则清理所有
   */
  cleanupExpiredBuffs(landNum) {
    const now = timeSyncService.now();
    const landsToCheck = landNum
      ? [landNum]
      : Array.from(this.activeBuffs.keys());

    for (const ln of landsToCheck) {
      if (!this.activeBuffs.has(ln)) {
        continue;
      }

      const landBuffs = this.activeBuffs.get(ln);
      const expiredBuffIds = [];

      // 找出过期的BUFF
      for (const [buffId, buff] of landBuffs.entries()) {
        if (now >= buff.endTime) {
          expiredBuffIds.push(buffId);
        }
      }

      // 移除过期的BUFF
      for (const buffId of expiredBuffIds) {
        const buff = landBuffs.get(buffId);
        landBuffs.delete(buffId);
        logger.info('BuffManager: BUFF已过期', { landNum: ln, buffId });
        this.notify('buff_expired', { landNum: ln, buffId, buff });
      }

      // 如果地块没有BUFF了，清理Map
      if (landBuffs.size === 0) {
        this.activeBuffs.delete(ln);
      }

      // 如果有过期的BUFF，标记刷新
      if (expiredBuffIds.length > 0) {
        this.scheduleRefresh(ln);
      }
    }
  }

  /**
   * 安排地块刷新（延迟刷新，用于合并多个BUFF）
   * @param {number} landNum 地块编号
   */
  scheduleRefresh(landNum) {
    this.pendingRefreshes.add(landNum);

    // 如果已有定时器，不需要重复设置
    if (this.refreshTimer) {
      return;
    }

    // 设置延迟刷新
    this.refreshTimer = setTimeout(() => {
      this.executePendingRefreshes();
    }, this.refreshDelay);
  }

  /**
   * 执行待处理的刷新
   */
  executePendingRefreshes() {
    if (this.pendingRefreshes.size === 0) {
      return;
    }

    const landsToRefresh = Array.from(this.pendingRefreshes);
    this.pendingRefreshes.clear();
    this.refreshTimer = null;

    logger.info('BuffManager: 执行批量刷新', {
      landCount: landsToRefresh.length,
    });

    // 通知批量刷新
    this.notify('batch_refresh', { lands: landsToRefresh });
  }

  /**
   * 取消待处理的刷新
   */
  cancelPendingRefreshes() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.pendingRefreshes.clear();
    logger.info('BuffManager: 取消待处理的刷新');
  }

  /**
   * 订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} handler 处理函数
   */
  on(eventName, handler) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    this.subscribers.get(eventName).add(handler);
  }

  /**
   * 取消订阅事件
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
          logger.error('BuffManager: 通知订阅者失败', {
            eventName,
            error: error.message,
          });
        }
      });
    }
  }

  /**
   * 获取管理器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    const status = {
      activeLandCount: this.activeBuffs.size,
      totalBuffCount: 0,
      pendingRefreshCount: this.pendingRefreshes.size,
      buffsByLand: {},
    };

    for (const [landNum, landBuffs] of this.activeBuffs.entries()) {
      status.totalBuffCount += landBuffs.size;
      status.buffsByLand[landNum] = Array.from(landBuffs.values());
    }

    return status;
  }

  /**
   * 获取BUFF类型枚举
   * @returns {Object} BUFF类型枚举
   */
  getBuffTypes() {
    return BUFF_TYPES;
  }

  /**
   * 清除所有BUFF
   */
  clearAll() {
    this.cancelPendingRefreshes();
    this.activeBuffs.clear();
    logger.info('BuffManager: 清除所有BUFF');
    this.notify('all_cleared');
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.cancelPendingRefreshes();
    this.activeBuffs.clear();
    this.subscribers.clear();
    logger.info('BuffManager: 管理器已销毁');
  }
}

// 创建单例实例
export const buffManager = new BuffManager();
export default buffManager;
