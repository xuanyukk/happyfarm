/**
 * 文件名：growthStageManager.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：生长阶段管理器
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现生长阶段管理和动画模拟
 */

import { logger } from './logger';
import { timeSyncService } from './timeSync';
import { growthCalculator } from './growthCalculator';

/**
 * 生长阶段定义
 */
const GROWTH_STAGES = {
  SEED: 'seed',
  SPROUT: 'sprout',
  GROWING: 'growing',
  MATURE: 'mature',
};

/**
 * 生长阶段管理器
 * 用于管理作物生长阶段，实现生长动画模拟和多阶段分段刷新
 */
class GrowthStageManager {
  constructor() {
    this.stages = new Map(); // landNum -> { currentStage, lastUpdateTime, stageTransitionTimes }
    this.subscribers = new Map(); // eventName -> Set<handlers>
    this.animationFrameId = null;
    this.isAnimating = false;
  }

  /**
   * 初始化生长阶段管理器
   */
  init() {
    logger.info('GrowthStageManager: 初始化生长阶段管理器');
    this.startAnimationLoop();
  }

  /**
   * 注册地块生长阶段
   * @param {number} landNum 地块编号
   * @param {Object} options 选项
   * @param {string} options.plantedTime 种植时间
   * @param {number} options.growthCycle 生长周期（毫秒）
   */
  registerLand(landNum, { plantedTime, growthCycle }) {
    const plantedTimeMs = new Date(plantedTime).getTime();

    // 计算各阶段切换时间点
    const stageTransitionTimes = this.calculateStageTransitionTimes(
      plantedTimeMs,
      growthCycle
    );

    // 确定当前阶段
    const currentStage = this.determineCurrentStage(stageTransitionTimes);

    this.stages.set(landNum, {
      currentStage,
      lastUpdateTime: timeSyncService.now(),
      stageTransitionTimes,
      plantedTime: plantedTimeMs,
      growthCycle,
    });

    logger.debug('GrowthStageManager: 注册地块生长阶段', {
      landNum,
      currentStage,
    });

    this.notify('stage_registered', { landNum, stage: currentStage });
  }

  /**
   * 计算各阶段切换时间点
   * @param {number} plantedTime 种植时间（毫秒）
   * @param {number} growthCycle 生长周期（毫秒）
   * @returns {Object} 各阶段切换时间点
   */
  calculateStageTransitionTimes(plantedTime, growthCycle) {
    return {
      [GROWTH_STAGES.SEED]: plantedTime,
      [GROWTH_STAGES.SPROUT]: plantedTime + growthCycle * 0.25, // 25%
      [GROWTH_STAGES.GROWING]: plantedTime + growthCycle * 0.75, // 75%
      [GROWTH_STAGES.MATURE]: plantedTime + growthCycle, // 100%
    };
  }

  /**
   * 确定当前生长阶段
   * @param {Object} stageTransitionTimes 阶段切换时间点
   * @returns {string} 当前阶段
   */
  determineCurrentStage(stageTransitionTimes) {
    const now = timeSyncService.now();

    if (now >= stageTransitionTimes[GROWTH_STAGES.MATURE]) {
      return GROWTH_STAGES.MATURE;
    } else if (now >= stageTransitionTimes[GROWTH_STAGES.GROWING]) {
      return GROWTH_STAGES.GROWING;
    } else if (now >= stageTransitionTimes[GROWTH_STAGES.SPROUT]) {
      return GROWTH_STAGES.SPROUT;
    } else {
      return GROWTH_STAGES.SEED;
    }
  }

  /**
   * 获取地块当前生长阶段
   * @param {number} landNum 地块编号
   * @returns {string|null} 当前阶段
   */
  getStage(landNum) {
    const stageData = this.stages.get(landNum);
    return stageData ? stageData.currentStage : null;
  }

  /**
   * 获取地块生长进度（0-1）
   * @param {number} landNum 地块编号
   * @returns {number|null} 生长进度
   */
  getProgress(landNum) {
    const stageData = this.stages.get(landNum);
    if (!stageData) {
      return null;
    }

    const now = timeSyncService.now();
    const elapsed = now - stageData.plantedTime;
    return Math.min(1, Math.max(0, elapsed / stageData.growthCycle));
  }

  /**
   * 获取阶段内进度（0-1）
   * @param {number} landNum 地块编号
   * @returns {number|null} 阶段内进度
   */
  getStageProgress(landNum) {
    const stageData = this.stages.get(landNum);
    if (!stageData) {
      return null;
    }

    const now = timeSyncService.now();
    const currentStage = stageData.currentStage;
    const transitionTimes = stageData.stageTransitionTimes;

    const stages = [
      GROWTH_STAGES.SEED,
      GROWTH_STAGES.SPROUT,
      GROWTH_STAGES.GROWING,
      GROWTH_STAGES.MATURE,
    ];
    const currentIndex = stages.indexOf(currentStage);

    if (currentIndex === -1 || currentIndex >= stages.length - 1) {
      return 1;
    }

    const currentStart = transitionTimes[currentStage];
    const nextStage = stages[currentIndex + 1];
    const nextStart = transitionTimes[nextStage];

    const total = nextStart - currentStart;
    const elapsed = now - currentStart;

    return Math.min(1, Math.max(0, elapsed / total));
  }

  /**
   * 检查是否需要刷新（阶段切换时）
   * @param {number} landNum 地块编号
   * @returns {boolean} 是否需要刷新
   */
  needsRefresh(landNum) {
    const stageData = this.stages.get(landNum);
    if (!stageData) {
      return false;
    }

    const newStage = this.determineCurrentStage(stageData.stageTransitionTimes);
    return newStage !== stageData.currentStage;
  }

  /**
   * 更新地块生长阶段
   * @param {number} landNum 地块编号
   * @returns {boolean} 是否发生了阶段切换
   */
  updateStage(landNum) {
    const stageData = this.stages.get(landNum);
    if (!stageData) {
      return false;
    }

    const oldStage = stageData.currentStage;
    const newStage = this.determineCurrentStage(stageData.stageTransitionTimes);

    if (oldStage !== newStage) {
      stageData.currentStage = newStage;
      stageData.lastUpdateTime = timeSyncService.now();

      logger.info('GrowthStageManager: 地块生长阶段变化', {
        landNum,
        oldStage,
        newStage,
      });

      this.notify('stage_changed', {
        landNum,
        oldStage,
        newStage,
      });

      return true;
    }

    return false;
  }

  /**
   * 启动动画循环
   */
  startAnimationLoop() {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    logger.info('GrowthStageManager: 启动生长动画循环');

    const animate = () => {
      // 更新所有地块的生长阶段
      this.stages.forEach((_, landNum) => {
        this.updateStage(landNum);
      });

      // 通知动画帧
      this.notify('animation_frame', { timestamp: timeSyncService.now() });

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * 停止动画循环
   */
  stopAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
    logger.info('GrowthStageManager: 停止生长动画循环');
  }

  /**
   * 清除地块生长阶段
   * @param {number} landNum 地块编号
   */
  clearLand(landNum) {
    this.stages.delete(landNum);
    this.notify('stage_cleared', { landNum });
    logger.debug('GrowthStageManager: 清除地块生长阶段', { landNum });
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
          logger.error('GrowthStageManager: 通知订阅者失败', {
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
    return {
      registeredLands: this.stages.size,
      isAnimating: this.isAnimating,
      stages: Array.from(this.stages.entries()).map(([landNum, data]) => ({
        landNum,
        stage: data.currentStage,
      })),
    };
  }

  /**
   * 获取生长阶段枚举
   * @returns {Object} 生长阶段枚举
   */
  getGrowthStages() {
    return GROWTH_STAGES;
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.stopAnimationLoop();
    this.stages.clear();
    this.subscribers.clear();
    logger.info('GrowthStageManager: 管理器已销毁');
  }
}

// 创建单例实例
export const growthStageManager = new GrowthStageManager();
export default growthStageManager;
