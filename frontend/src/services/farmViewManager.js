/**
 * 文件名：farmViewManager.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：农场视图管理器
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现农场视图管理和按需刷新
 */

import { logger } from './logger';
import { timerManager } from './timerManager';

/**
 * 农场视图类型
 */
const VIEW_TYPES = {
  MY_FARM: 'my_farm',
  FRIEND_FARM: 'friend_farm',
};

/**
 * 农场视图管理器
 * 用于管理当前查看的农场视图，仅刷新当前查看的农场，关闭后清理刷新任务
 */
class FarmViewManager {
  constructor() {
    this.currentView = null; // 当前视图信息 { type, userId, friendId }
    this.viewTimers = new Map(); // 视图ID -> 定时器ID数组
    this.subscribers = new Map(); // eventName -> Set<handlers>
  }

  /**
   * 初始化农场视图管理器
   */
  init() {
    logger.info('FarmViewManager: 初始化农场视图管理器');
  }

  /**
   * 进入我的农场
   */
  enterMyFarm() {
    // 如果已有视图，先离开
    if (this.currentView) {
      this.leaveCurrentView();
    }

    const viewId = VIEW_TYPES.MY_FARM;
    this.currentView = {
      type: VIEW_TYPES.MY_FARM,
      viewId,
      enterTime: Date.now(),
    };

    logger.info('FarmViewManager: 进入我的农场');
    this.notify('view_enter', { view: this.currentView });
  }

  /**
   * 进入好友农场
   * @param {string} friendId 好友ID
   * @param {string} [friendName] 好友名称
   */
  enterFriendFarm(friendId, friendName = '') {
    // 如果已有视图，先离开
    if (this.currentView) {
      this.leaveCurrentView();
    }

    const viewId = `${VIEW_TYPES.FRIEND_FARM}_${friendId}`;
    this.currentView = {
      type: VIEW_TYPES.FRIEND_FARM,
      viewId,
      friendId,
      friendName,
      enterTime: Date.now(),
    };

    logger.info('FarmViewManager: 进入好友农场', { friendId, friendName });
    this.notify('view_enter', { view: this.currentView });
  }

  /**
   * 离开当前视图
   */
  leaveCurrentView() {
    if (!this.currentView) {
      return;
    }

    const view = this.currentView;
    logger.info('FarmViewManager: 离开当前视图', { viewId: view.viewId });

    // 清理该视图的所有定时器
    this.cleanupViewTimers(view.viewId);

    // 通知离开
    this.notify('view_leave', { view });

    // 清空当前视图
    this.currentView = null;
  }

  /**
   * 获取当前视图
   * @returns {Object|null} 当前视图信息
   */
  getCurrentView() {
    return this.currentView;
  }

  /**
   * 检查是否在我的农场
   * @returns {boolean} 是否在我的农场
   */
  isInMyFarm() {
    return this.currentView?.type === VIEW_TYPES.MY_FARM;
  }

  /**
   * 检查是否在好友农场
   * @param {string} [friendId] 好友ID，可选
   * @returns {boolean} 是否在好友农场
   */
  isInFriendFarm(friendId) {
    if (!this.currentView || this.currentView.type !== VIEW_TYPES.FRIEND_FARM) {
      return false;
    }
    if (friendId) {
      return this.currentView.friendId === friendId;
    }
    return true;
  }

  /**
   * 为当前视图添加定时器
   * @param {Function} callback 回调函数
   * @param {number} interval 间隔（毫秒）
   * @param {string} [timerId] 定时器ID，可选
   * @returns {string} 定时器ID
   */
  addTimer(callback, interval, timerId) {
    if (!this.currentView) {
      logger.warn('FarmViewManager: 没有当前视图，无法添加定时器');
      return null;
    }

    const viewId = this.currentView.viewId;
    const id =
      timerId ||
      `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 使用timerManager创建定时器
    const timerKey = timerManager.createTimer(callback, interval, {
      autoStart: true,
    });

    // 记录定时器
    if (!this.viewTimers.has(viewId)) {
      this.viewTimers.set(viewId, new Map());
    }
    this.viewTimers.get(viewId).set(id, timerKey);

    logger.debug('FarmViewManager: 添加视图定时器', { viewId, id });
    return id;
  }

  /**
   * 移除定时器
   * @param {string} timerId 定时器ID
   */
  removeTimer(timerId) {
    if (!this.currentView) {
      return;
    }

    const viewId = this.currentView.viewId;
    if (!this.viewTimers.has(viewId)) {
      return;
    }

    const viewTimers = this.viewTimers.get(viewId);
    const timerKey = viewTimers.get(timerId);

    if (timerKey) {
      timerManager.clearTimer(timerKey);
      viewTimers.delete(timerId);
      logger.debug('FarmViewManager: 移除视图定时器', { viewId, timerId });
    }
  }

  /**
   * 清理视图的所有定时器
   * @param {string} viewId 视图ID
   */
  cleanupViewTimers(viewId) {
    if (!this.viewTimers.has(viewId)) {
      return;
    }

    const viewTimers = this.viewTimers.get(viewId);

    // 清理所有定时器
    for (const timerKey of viewTimers.values()) {
      timerManager.clearTimer(timerKey);
    }

    viewTimers.clear();
    this.viewTimers.delete(viewId);

    logger.info('FarmViewManager: 清理视图定时器', { viewId });
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
          logger.error('FarmViewManager: 通知订阅者失败', {
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
      currentView: this.currentView,
      viewCount: this.viewTimers.size,
      timersByView: {},
    };

    for (const [viewId, timers] of this.viewTimers.entries()) {
      status.timersByView[viewId] = timers.size;
    }

    return status;
  }

  /**
   * 获取视图类型枚举
   * @returns {Object} 视图类型枚举
   */
  getViewTypes() {
    return VIEW_TYPES;
  }

  /**
   * 销毁管理器
   */
  destroy() {
    // 离开当前视图
    this.leaveCurrentView();

    // 清理所有视图的定时器
    for (const viewId of this.viewTimers.keys()) {
      this.cleanupViewTimers(viewId);
    }

    this.subscribers.clear();
    logger.info('FarmViewManager: 管理器已销毁');
  }
}

// 创建单例实例
export const farmViewManager = new FarmViewManager();
export default farmViewManager;
