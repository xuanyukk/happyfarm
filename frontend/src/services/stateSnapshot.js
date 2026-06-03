/**
 * 文件名：stateSnapshot.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：状态快照缓存服务
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现状态快照缓存功能
 */

import { logger } from './logger';

/**
 * 状态快照缓存服务
 * 用于缓存农场状态数据，离开界面时保存，返回时直接展示并静默同步最新数据
 */
class StateSnapshot {
  constructor() {
    this.STORAGE_KEY = 'happy_farm_state_snapshot';
    this.CACHE_DURATION = 5 * 60 * 1000; // 缓存有效期：5分钟
    this.snapshot = null;
    this.lastSyncTime = 0;
  }

  /**
   * 保存状态快照
   * @param {Object} data 要缓存的数据
   * @param {string} [dataType='farm'] 数据类型
   * @returns {boolean} 是否保存成功
   */
  save(data, dataType = 'farm') {
    try {
      const snapshotData = {
        data,
        dataType,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(snapshotData));
      this.snapshot = snapshotData;
      this.lastSyncTime = Date.now();

      logger.info(`StateSnapshot: ${dataType} 状态快照已保存`);
      return true;
    } catch (error) {
      logger.error('StateSnapshot: 保存状态快照失败', error);
      return false;
    }
  }

  /**
   * 加载状态快照
   * @param {string} [dataType='farm'] 数据类型
   * @returns {Object|null} 缓存的数据，如果不存在或已过期则返回null
   */
  load(dataType = 'farm') {
    try {
      // 先检查内存中的快照
      if (this.snapshot && this.snapshot.dataType === dataType) {
        if (!this.isExpired(this.snapshot.timestamp)) {
          logger.info(`StateSnapshot: 从内存加载 ${dataType} 状态快照`);
          return this.snapshot.data;
        }
      }

      // 从localStorage加载
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        logger.info('StateSnapshot: 没有找到状态快照');
        return null;
      }

      const snapshotData = JSON.parse(stored);

      // 检查数据类型
      if (snapshotData.dataType !== dataType) {
        logger.info(
          `StateSnapshot: 数据类型不匹配，期望 ${dataType}，实际 ${snapshotData.dataType}`
        );
        return null;
      }

      // 检查是否过期
      if (this.isExpired(snapshotData.timestamp)) {
        logger.info('StateSnapshot: 状态快照已过期');
        this.clear();
        return null;
      }

      // 更新内存快照
      this.snapshot = snapshotData;

      logger.info(`StateSnapshot: 从存储加载 ${dataType} 状态快照`);
      return snapshotData.data;
    } catch (error) {
      logger.error('StateSnapshot: 加载状态快照失败', error);
      return null;
    }
  }

  /**
   * 检查快照是否已过期
   * @param {number} timestamp 快照时间戳
   * @returns {boolean} 是否已过期
   */
  isExpired(timestamp) {
    return Date.now() - timestamp > this.CACHE_DURATION;
  }

  /**
   * 检查是否有有效的快照
   * @param {string} [dataType='farm'] 数据类型
   * @returns {boolean} 是否有有效的快照
   */
  hasValidSnapshot(dataType = 'farm') {
    const data = this.load(dataType);
    return data !== null;
  }

  /**
   * 获取快照信息
   * @returns {Object|null} 快照信息
   */
  getSnapshotInfo() {
    if (!this.snapshot) {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }
      try {
        this.snapshot = JSON.parse(stored);
      } catch (error) {
        logger.error('StateSnapshot: 解析快照信息失败', error);
        return null;
      }
    }

    return {
      dataType: this.snapshot.dataType,
      timestamp: this.snapshot.timestamp,
      version: this.snapshot.version,
      isExpired: this.isExpired(this.snapshot.timestamp),
      age: Date.now() - this.snapshot.timestamp,
    };
  }

  /**
   * 清除状态快照
   */
  clear() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.snapshot = null;
      logger.info('StateSnapshot: 状态快照已清除');
    } catch (error) {
      logger.error('StateSnapshot: 清除状态快照失败', error);
    }
  }

  /**
   * 设置缓存有效期
   * @param {number} duration 有效期（毫秒）
   */
  setCacheDuration(duration) {
    this.CACHE_DURATION = duration;
    logger.info(`StateSnapshot: 缓存有效期已设置为 ${duration} 毫秒`);
  }

  /**
   * 保存农场完整状态
   * @param {Object} farmState 农场状态
   */
  saveFarmState(farmState) {
    return this.save(farmState, 'farm');
  }

  /**
   * 加载农场完整状态
   * @returns {Object|null} 农场状态
   */
  loadFarmState() {
    return this.load('farm');
  }

  /**
   * 保存玩家状态
   * @param {Object} playerState 玩家状态
   */
  savePlayerState(playerState) {
    return this.save(playerState, 'player');
  }

  /**
   * 加载玩家状态
   * @returns {Object|null} 玩家状态
   */
  loadPlayerState() {
    return this.load('player');
  }
}

// 创建单例实例
export const stateSnapshot = new StateSnapshot();
export default stateSnapshot;
