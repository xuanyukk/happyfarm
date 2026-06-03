/**
 * 文件名：performanceController.js
 * 作者：开发者
 * 日期：2026-05-05
 * 版本：v1.1.0
 * 功能描述：性能监控控制器 - API响应时间监控端点
 * 更新记录：
 *   2026-05-05 - v1.0.0 - 初始版本创建
 *   2026-05-07 - v1.1.0 - 添加性能告警、趋势分析、缓存统计等功能
 */

const {
  getResponseTimeStats,
  resetResponseTimeStats,
  getSlowestRoutes,
  getMostRequestedRoutes,
  getPerformanceTrend,
  clearAlerts,
  setAlertThresholds,
} = require('../middleware/responseTime');
const pool = require('../config/db');

/**
 * 获取性能统计概览
 */
exports.getPerformanceStats = async function (req, res) {
  try {
    const stats = getResponseTimeStats();

    // 获取数据库缓存统计
    let cacheStats = null;
    if (pool.cache) {
      cacheStats = pool.cache.getStats();
    }

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        cacheStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取性能统计失败',
    });
  }
};

/**
 * 获取最慢的路由
 */
exports.getSlowestRoutes = async function (req, res) {
  try {
    const { limit = 10 } = req.query;
    const routes = getSlowestRoutes(parseInt(limit));
    res.status(200).json({
      success: true,
      data: routes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取最慢路由失败',
    });
  }
};

/**
 * 获取最常请求的路由
 */
exports.getMostRequestedRoutes = async function (req, res) {
  try {
    const { limit = 10 } = req.query;
    const routes = getMostRequestedRoutes(parseInt(limit));
    res.status(200).json({
      success: true,
      data: routes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取最常请求路由失败',
    });
  }
};

/**
 * 重置性能统计
 */
exports.resetPerformanceStats = async function (req, res) {
  try {
    resetResponseTimeStats();

    // 同时清空数据库缓存
    if (pool.cache) {
      pool.cache.clear();
    }

    res.status(200).json({
      success: true,
      message: '性能统计已重置',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '重置性能统计失败',
    });
  }
};

/**
 * 获取性能趋势
 */
exports.getPerformanceTrend = async function (req, res) {
  try {
    const trend = getPerformanceTrend();
    res.status(200).json({
      success: true,
      data: trend,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取性能趋势失败',
    });
  }
};

/**
 * 清除当前告警
 */
exports.clearAlerts = async function (req, res) {
  try {
    clearAlerts();
    res.status(200).json({
      success: true,
      message: '告警已清除',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清除告警失败',
    });
  }
};

/**
 * 更新告警阈值配置
 */
exports.updateAlertThresholds = async function (req, res) {
  try {
    const { slowRequestRate, avgResponseTime, errorRate } = req.body;
    const newThresholds = {};

    if (slowRequestRate !== undefined)
      newThresholds.slowRequestRate = slowRequestRate;
    if (avgResponseTime !== undefined)
      newThresholds.avgResponseTime = avgResponseTime;
    if (errorRate !== undefined) newThresholds.errorRate = errorRate;

    setAlertThresholds(newThresholds);

    res.status(200).json({
      success: true,
      message: '告警阈值已更新',
      data: newThresholds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新告警阈值失败',
    });
  }
};

/**
 * 清空查询缓存
 */
exports.clearQueryCache = async function (req, res) {
  try {
    if (pool.cache) {
      pool.cache.clear();
      res.status(200).json({
        success: true,
        message: '查询缓存已清空',
      });
    } else {
      res.status(404).json({
        success: false,
        message: '查询缓存功能未启用',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '清空查询缓存失败',
    });
  }
};
