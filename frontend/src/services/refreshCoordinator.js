/**
 * 文件名：refreshCoordinator.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：四层核心刷新架构 - 刷新协调器
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建
 */

import { logger } from './logger.js';
import timerManager from './timerManager.js';
import metricsCollector from './metricsCollector.js';

class RefreshCoordinator {
  constructor() {
    this.layers = new Map();
    this.currentLayer = 'event';
    this.isInitialized = false;
    this.lastSyncTime = 0;
    this.retryAttempts = new Map();
    this.maxRetryAttempts = 5;

    logger.info('RefreshCoordinator 初始化完成');
  }

  registerLayer(layerName, layer) {
    this.layers.set(layerName, {
      name: layerName,
      instance: layer,
      isActive: true,
      priority: this.getLayerPriority(layerName),
    });
    logger.info(`注册刷新层: ${layerName}`);
  }

  getLayerPriority(layerName) {
    const priorities = {
      websocket: 1,
      incremental: 2,
      timer: 3,
      event: 4,
    };
    return priorities[layerName] || 99;
  }

  async initialize() {
    if (this.isInitialized) {
      logger.warn('RefreshCoordinator 已经初始化过了');
      return;
    }

    logger.info('RefreshCoordinator 开始初始化');

    this.lastSyncTime = Date.now();
    this.isInitialized = true;

    logger.info('RefreshCoordinator 初始化成功');
  }

  async triggerEventRefresh(eventType, data) {
    const startTime = Date.now();
    let success = false;

    try {
      logger.debug(`触发事件刷新: ${eventType}`, data);

      const eventLayer = this.layers.get('event');
      if (eventLayer && eventLayer.isActive && eventLayer.instance) {
        if (typeof eventLayer.instance.handleEvent === 'function') {
          await eventLayer.instance.handleEvent(eventType, data);
          success = true;
        }
      }

      if (!success) {
        logger.warn('事件层不可用，使用基础刷新');
      }

      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('event', success, duration);

      return success;
    } catch (error) {
      logger.error('事件刷新失败:', error);
      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('event', false, duration);
      this.handleLayerFailure('event');
      return false;
    }
  }

  createCropTimer(landId, cropData, onMature) {
    const startTime = Date.now();
    let success = false;

    try {
      logger.debug(`创建作物定时器: 地块 ${landId}`);

      timerManager.createTimer(landId, cropData, (matureLandId, timerInfo) => {
        this.handleCropMature(matureLandId, timerInfo, onMature);
      });

      success = true;

      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('timer', success, duration);

      return true;
    } catch (error) {
      logger.error('创建作物定时器失败:', error);
      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('timer', false, duration);
      this.handleLayerFailure('timer');
      return false;
    }
  }

  handleCropMature(landId, timerInfo, onMature) {
    logger.info(`作物成熟: 地块 ${landId}, 作物 ${timerInfo.cropName}`);

    if (onMature && typeof onMature === 'function') {
      try {
        onMature(landId, timerInfo);
      } catch (error) {
        logger.error('执行成熟回调失败:', error);
      }
    }

    this.triggerIncrementalRefresh();
  }

  async triggerIncrementalRefresh() {
    const startTime = Date.now();
    let success = false;

    try {
      logger.debug('触发增量刷新');

      const incrementalLayer = this.layers.get('incremental');
      if (
        incrementalLayer &&
        incrementalLayer.isActive &&
        incrementalLayer.instance
      ) {
        if (typeof incrementalLayer.instance.fetchIncremental === 'function') {
          const result = await incrementalLayer.instance.fetchIncremental(
            this.lastSyncTime
          );
          this.lastSyncTime = Date.now();

          if (result && result.hasChanges) {
            logger.info(
              `增量刷新完成，有 ${result.lands?.length || 0} 个地块变化`
            );
          } else {
            logger.debug('增量刷新完成，无变化');
          }

          success = true;
        }
      }

      if (!success) {
        logger.warn('增量层不可用');
      }

      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('incremental', success, duration);
      metricsCollector.recordNetworkRequest('incremental');

      return success;
    } catch (error) {
      logger.error('增量刷新失败:', error);
      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('incremental', false, duration);
      this.handleLayerFailure('incremental');
      return false;
    }
  }

  async handleWebSocketMessage(message) {
    const startTime = Date.now();
    let success = false;

    try {
      logger.debug('收到WebSocket消息:', message.type);

      const wsLayer = this.layers.get('websocket');
      if (wsLayer && wsLayer.isActive && wsLayer.instance) {
        if (typeof wsLayer.instance.handleMessage === 'function') {
          await wsLayer.instance.handleMessage(message);
          success = true;
        }
      }

      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('websocket', success, duration);

      return success;
    } catch (error) {
      logger.error('WebSocket消息处理失败:', error);
      const duration = Date.now() - startTime;
      metricsCollector.recordRefresh('websocket', false, duration);
      this.handleLayerFailure('websocket');
      return false;
    }
  }

  handleLayerFailure(layerName) {
    const attempts = (this.retryAttempts.get(layerName) || 0) + 1;
    this.retryAttempts.set(layerName, attempts);

    logger.warn(
      `层 ${layerName} 失败，重试次数: ${attempts}/${this.maxRetryAttempts}`
    );

    if (attempts >= this.maxRetryAttempts) {
      logger.error(
        `层 ${layerName} 连续失败 ${this.maxRetryAttempts} 次，触发降级`
      );
      this.degradeLayer(layerName);
    } else {
      const delay = Math.pow(2, attempts) * 1000;
      logger.info(`${delay}ms 后重试层 ${layerName}`);

      setTimeout(() => {
        this.retryLayer(layerName);
      }, delay);
    }
  }

  degradeLayer(failedLayerName) {
    const layer = this.layers.get(failedLayerName);
    if (layer) {
      layer.isActive = false;
      logger.warn(`停用层: ${failedLayerName}`);
    }

    const sortedLayers = Array.from(this.layers.values())
      .filter((l) => l.isActive)
      .sort((a, b) => a.priority - b.priority);

    if (sortedLayers.length > 0) {
      this.currentLayer = sortedLayers[0].name;
      logger.info(`切换到层: ${this.currentLayer}`);
    } else {
      logger.error('所有层都已失效，回退到基础刷新');
      this.currentLayer = 'event';
    }
  }

  retryLayer(layerName) {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.isActive = true;
      this.retryAttempts.set(layerName, 0);
      logger.info(`恢复层: ${layerName}`);
    }
  }

  getTimerStatus(landId) {
    return timerManager.getTimerStatus(landId);
  }

  getAllTimerStatuses() {
    return timerManager.getAllTimerStatuses();
  }

  cancelTimer(landId) {
    timerManager.cancelTimer(landId);
  }

  cancelAllTimers() {
    timerManager.cancelAllTimers();
  }

  pause() {
    logger.info('RefreshCoordinator 暂停');
    timerManager.pause();
  }

  resume() {
    logger.info('RefreshCoordinator 恢复');
    timerManager.resume();
  }

  getPerformanceReport() {
    return metricsCollector.exportReport();
  }

  resetMetrics() {
    metricsCollector.resetMetrics();
  }

  destroy() {
    logger.info('RefreshCoordinator 销毁');
    timerManager.destroy();
    this.layers.clear();
    this.isInitialized = false;
  }
}

const refreshCoordinator = new RefreshCoordinator();

export default refreshCoordinator;
