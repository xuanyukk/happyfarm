/**
 * 文件名：metricsCollector.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.1.0
 * 功能描述：四层核心刷新架构 - 性能监控器
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建
 *   2026-03-29 - v1.1.0 - 添加时间同步指标记录
 */

import { logger } from './logger.js';

class MetricsCollector {
  constructor() {
    this.layerMetrics = new Map();
    this.startTime = Date.now();
    this.maxHistorySize = 1000;
    this.timeSyncMetrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      syncHistory: [],
      lastSyncOffset: 0,
      lastSyncTime: null,
    };
    logger.info('MetricsCollector 初始化完成');
  }

  recordRefresh(layerName, success, duration) {
    if (!this.layerMetrics.has(layerName)) {
      this.initLayerMetrics(layerName);
    }

    const metrics = this.layerMetrics.get(layerName);
    const now = Date.now();

    metrics.totalRefreshes++;
    if (success) {
      metrics.successfulRefreshes++;
    } else {
      metrics.failedRefreshes++;
    }

    metrics.refreshTimes.push(duration);
    if (metrics.refreshTimes.length > this.maxHistorySize) {
      metrics.refreshTimes.shift();
    }

    if (metrics.refreshTimes.length > 0) {
      const total = metrics.refreshTimes.reduce((sum, t) => sum + t, 0);
      metrics.averageRefreshTime = total / metrics.refreshTimes.length;
      metrics.maxRefreshTime = Math.max(...metrics.refreshTimes);
      metrics.minRefreshTime = Math.min(...metrics.refreshTimes);
    }

    metrics.lastRefreshTime = now;

    if (success) {
      logger.debug(`[${layerName}] 刷新成功，耗时 ${duration.toFixed(2)}ms`);
    } else {
      logger.warn(`[${layerName}] 刷新失败，耗时 ${duration.toFixed(2)}ms`);
    }
  }

  recordNetworkRequest(layerName) {
    if (!this.layerMetrics.has(layerName)) {
      this.initLayerMetrics(layerName);
    }

    const metrics = this.layerMetrics.get(layerName);
    metrics.networkRequests++;
  }

  recordMemoryUsage(layerName, memoryUsage) {
    if (!this.layerMetrics.has(layerName)) {
      this.initLayerMetrics(layerName);
    }

    const metrics = this.layerMetrics.get(layerName);
    metrics.memoryUsage = memoryUsage;
  }

  recordTimeSync({ success, offset, networkDelay, error }) {
    this.timeSyncMetrics.totalSyncs++;

    if (success) {
      this.timeSyncMetrics.successfulSyncs++;
      this.timeSyncMetrics.lastSyncOffset = offset;
      this.timeSyncMetrics.lastSyncTime = Date.now();

      this.timeSyncMetrics.syncHistory.push({
        time: Date.now(),
        success: true,
        offset,
        networkDelay,
      });

      if (this.timeSyncMetrics.syncHistory.length > this.maxHistorySize) {
        this.timeSyncMetrics.syncHistory.shift();
      }

      logger.info(
        `TimeSync: 同步成功，偏移量 ${offset}ms，网络延迟 ${networkDelay}ms`
      );
    } else {
      this.timeSyncMetrics.failedSyncs++;

      this.timeSyncMetrics.syncHistory.push({
        time: Date.now(),
        success: false,
        error,
      });

      if (this.timeSyncMetrics.syncHistory.length > this.maxHistorySize) {
        this.timeSyncMetrics.syncHistory.shift();
      }

      logger.warn(`TimeSync: 同步失败，错误: ${error}`);
    }
  }

  initLayerMetrics(layerName) {
    this.layerMetrics.set(layerName, {
      layerName,
      totalRefreshes: 0,
      successfulRefreshes: 0,
      failedRefreshes: 0,
      refreshTimes: [],
      averageRefreshTime: 0,
      maxRefreshTime: 0,
      minRefreshTime: 0,
      networkRequests: 0,
      memoryUsage: 0,
      firstRefreshTime: Date.now(),
      lastRefreshTime: null,
    });
  }

  getMetrics(layerName) {
    if (layerName) {
      return this.formatMetrics(this.layerMetrics.get(layerName));
    }

    const allMetrics = [];
    for (const metrics of this.layerMetrics.values()) {
      allMetrics.push(this.formatMetrics(metrics));
    }
    return allMetrics;
  }

  formatMetrics(metrics) {
    if (!metrics) {
      return null;
    }

    const successRate =
      metrics.totalRefreshes > 0
        ? (
            (metrics.successfulRefreshes / metrics.totalRefreshes) *
            100
          ).toFixed(2)
        : 0;

    return {
      layerName: metrics.layerName,
      totalRefreshes: metrics.totalRefreshes,
      successfulRefreshes: metrics.successfulRefreshes,
      failedRefreshes: metrics.failedRefreshes,
      successRate: `${successRate}%`,
      averageRefreshTime: metrics.averageRefreshTime.toFixed(2),
      maxRefreshTime: metrics.maxRefreshTime.toFixed(2),
      minRefreshTime: metrics.minRefreshTime.toFixed(2),
      networkRequests: metrics.networkRequests,
      memoryUsage: metrics.memoryUsage,
      uptime: Date.now() - metrics.firstRefreshTime,
      timestamp: Date.now(),
    };
  }

  getAggregatedMetrics() {
    const allMetrics = this.getMetrics();
    if (allMetrics.length === 0) {
      return null;
    }

    const aggregated = {
      totalRefreshes: 0,
      successfulRefreshes: 0,
      failedRefreshes: 0,
      totalNetworkRequests: 0,
      totalMemoryUsage: 0,
      averageRefreshTime: 0,
      overallSuccessRate: 0,
      layers: allMetrics.length,
      timestamp: Date.now(),
    };

    let totalTime = 0;
    let count = 0;

    for (const metrics of allMetrics) {
      aggregated.totalRefreshes += metrics.totalRefreshes;
      aggregated.successfulRefreshes += metrics.successfulRefreshes;
      aggregated.failedRefreshes += metrics.failedRefreshes;
      aggregated.totalNetworkRequests += metrics.networkRequests;
      aggregated.totalMemoryUsage += metrics.memoryUsage;

      if (metrics.averageRefreshTime > 0) {
        totalTime += parseFloat(metrics.averageRefreshTime);
        count++;
      }
    }

    if (count > 0) {
      aggregated.averageRefreshTime = (totalTime / count).toFixed(2);
    }

    if (aggregated.totalRefreshes > 0) {
      aggregated.overallSuccessRate =
        (
          (aggregated.successfulRefreshes / aggregated.totalRefreshes) *
          100
        ).toFixed(2) + '%';
    }

    return aggregated;
  }

  resetMetrics() {
    this.layerMetrics.clear();
    this.startTime = Date.now();
    logger.info('MetricsCollector 指标已重置');
  }

  exportReport() {
    const timeSyncSuccessRate =
      this.timeSyncMetrics.totalSyncs > 0
        ? (
            (this.timeSyncMetrics.successfulSyncs /
              this.timeSyncMetrics.totalSyncs) *
            100
          ).toFixed(2)
        : 0;

    const report = {
      reportVersion: '1.1.0',
      generatedAt: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      aggregated: this.getAggregatedMetrics(),
      layers: this.getMetrics(),
      timeSync: {
        totalSyncs: this.timeSyncMetrics.totalSyncs,
        successfulSyncs: this.timeSyncMetrics.successfulSyncs,
        failedSyncs: this.timeSyncMetrics.failedSyncs,
        successRate: `${timeSyncSuccessRate}%`,
        lastSyncOffset: this.timeSyncMetrics.lastSyncOffset,
        lastSyncTime: this.timeSyncMetrics.lastSyncTime,
        recentHistory: this.timeSyncMetrics.syncHistory.slice(-20),
      },
      targets: {
        refreshDelay: '< 100ms',
        successRate: '> 99%',
        networkReduction: '80%+',
        renderTime: '< 50ms',
        memoryUsage: '< 50MB',
        timerAccuracy: '±1秒',
      },
    };

    logger.info('MetricsCollector 导出性能报告');
    return report;
  }

  checkTargets() {
    const aggregated = this.getAggregatedMetrics();
    if (!aggregated) {
      return null;
    }

    const checks = {
      refreshDelay: {
        target: '< 100ms',
        actual: `${aggregated.averageRefreshTime}ms`,
        passed: parseFloat(aggregated.averageRefreshTime) < 100,
      },
      successRate: {
        target: '> 99%',
        actual: aggregated.overallSuccessRate,
        passed: parseFloat(aggregated.overallSuccessRate) > 99,
      },
    };

    return checks;
  }
}

const metricsCollector = new MetricsCollector();

export default metricsCollector;
