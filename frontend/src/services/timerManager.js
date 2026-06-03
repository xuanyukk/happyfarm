/**
 * 文件名：timerManager.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：四层核心刷新架构 - 精准定时器管理器
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建
 */

import { logger } from './logger.js';

class TimerManager {
  constructor() {
    this.timers = new Map();
    this.isActive = true;
    logger.info('TimerManager 初始化完成');
  }

  createTimer(landId, cropData, onMature) {
    if (this.timers.has(landId)) {
      logger.warn(`地块 ${landId} 已存在定时器，先取消旧定时器`);
      this.cancelTimer(landId);
    }

    const { plantedAt, harvestAt, cropId, cropName } = cropData;
    const now = Date.now();
    const harvestTime = new Date(harvestAt).getTime();
    const remainingMs = Math.max(0, harvestTime - now);

    const timerInfo = {
      landId,
      cropId,
      cropName,
      plantedAt: new Date(plantedAt),
      harvestAt: new Date(harvestAt),
      timerId: null,
      onMature,
      createdAt: now,
    };

    if (remainingMs > 0) {
      timerInfo.timerId = setTimeout(() => {
        this.handleMature(landId);
      }, remainingMs);

      logger.info(
        `创建地块 ${landId} 定时器，剩余 ${Math.ceil(remainingMs / 1000)} 秒成熟`
      );
    } else {
      logger.warn(`地块 ${landId} 已成熟，立即触发成熟事件`);
      setTimeout(() => this.handleMature(landId), 0);
    }

    this.timers.set(landId, timerInfo);
    return timerInfo;
  }

  handleMature(landId) {
    const timerInfo = this.timers.get(landId);
    if (!timerInfo) {
      logger.warn(`地块 ${landId} 定时器不存在`);
      return;
    }

    logger.info(`地块 ${landId} 作物 ${timerInfo.cropName} 成熟`);

    if (timerInfo.onMature && typeof timerInfo.onMature === 'function') {
      try {
        timerInfo.onMature(landId, timerInfo);
      } catch (error) {
        logger.error(`执行地块 ${landId} 成熟回调失败:`, error);
      }
    }

    this.timers.delete(landId);
  }

  updateTimer(landId, newHarvestAt) {
    const timerInfo = this.timers.get(landId);
    if (!timerInfo) {
      logger.warn(`地块 ${landId} 定时器不存在，无法更新`);
      return;
    }

    if (timerInfo.timerId) {
      clearTimeout(timerInfo.timerId);
    }

    const now = Date.now();
    const harvestTime = new Date(newHarvestAt).getTime();
    const remainingMs = Math.max(0, harvestTime - now);

    timerInfo.harvestAt = new Date(newHarvestAt);

    if (remainingMs > 0) {
      timerInfo.timerId = setTimeout(() => {
        this.handleMature(landId);
      }, remainingMs);
      logger.info(
        `更新地块 ${landId} 定时器，剩余 ${Math.ceil(remainingMs / 1000)} 秒成熟`
      );
    } else {
      logger.warn(`地块 ${landId} 更新后已成熟，立即触发成熟事件`);
      setTimeout(() => this.handleMature(landId), 0);
    }
  }

  cancelTimer(landId) {
    const timerInfo = this.timers.get(landId);
    if (!timerInfo) {
      return;
    }

    if (timerInfo.timerId) {
      clearTimeout(timerInfo.timerId);
      logger.info(`取消地块 ${landId} 定时器`);
    }

    this.timers.delete(landId);
  }

  cancelAllTimers() {
    const count = this.timers.size;
    for (const [landId, timerInfo] of this.timers) {
      if (timerInfo.timerId) {
        clearTimeout(timerInfo.timerId);
      }
    }
    this.timers.clear();
    logger.info(`取消所有定时器，共 ${count} 个`);
  }

  getTimerStatus(landId) {
    const timerInfo = this.timers.get(landId);
    if (!timerInfo) {
      return null;
    }

    const now = Date.now();
    const harvestTime = timerInfo.harvestAt.getTime();
    const remainingMs = Math.max(0, harvestTime - now);
    const totalMs = harvestTime - timerInfo.plantedAt.getTime();
    const progress =
      totalMs > 0
        ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100))
        : 0;

    return {
      landId,
      cropId: timerInfo.cropId,
      cropName: timerInfo.cropName,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      progress: Math.round(progress * 10) / 10,
      isActive: true,
      plantedAt: timerInfo.plantedAt,
      harvestAt: timerInfo.harvestAt,
    };
  }

  getAllTimerStatuses() {
    const statuses = [];
    for (const landId of this.timers.keys()) {
      const status = this.getTimerStatus(landId);
      if (status) {
        statuses.push(status);
      }
    }
    return statuses;
  }

  getActiveTimerCount() {
    return this.timers.size;
  }

  pause() {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;
    logger.info('TimerManager 已暂停');
  }

  resume() {
    if (this.isActive) {
      return;
    }
    this.isActive = true;
    logger.info('TimerManager 已恢复');
  }

  destroy() {
    this.cancelAllTimers();
    logger.info('TimerManager 已销毁');
  }
}

const timerManager = new TimerManager();

export default timerManager;
