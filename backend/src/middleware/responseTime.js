/**
 * 文件名：responseTime.js
 * 作者：开发者
 * 日期：2026-05-05
 * 版本：v1.1.0
 * 功能描述：API响应时间监控中间件，包含性能阈值告警
 * 更新记录：
 *   2026-05-05 - v1.0.0 - 初始版本创建
 *   2026-05-07 - v1.1.0 - 添加性能阈值告警、性能趋势分析、告警历史记录
 */

const logger = require('../config/logger');

const slowThresholds = {
  info: 100, // 100ms 以下
  warn: 500, // 500ms 警告
  error: 2000, // 2000ms 以上错误
};

// 性能告警阈值配置
const alertThresholds = {
  slowRequestRate: 10, // 慢请求率超过10%时告警
  avgResponseTime: 500, // 平均响应时间超过500ms时告警
  errorRate: 5, // 错误率超过5%时告警
};

const responseTimeStats = {
  totalRequests: 0,
  totalTime: 0,
  slowRequests: 0,
  errorRequests: 0,
  requestsByRoute: {},
  startTime: Date.now(),
  alerts: [],
  alertHistory: [],
};

// 告警历史记录限制
const MAX_ALERT_HISTORY = 100;

// 告警冷却时间（避免告警轰炸）
const ALERT_COOLDOWN = 60000; // 60秒
let lastAlertTime = {};

// 检查是否需要发送告警
function shouldSendAlert(alertType) {
  const now = Date.now();
  const lastTime = lastAlertTime[alertType] || 0;
  if (now - lastTime < ALERT_COOLDOWN) {
    return false;
  }
  lastAlertTime[alertType] = now;
  return true;
}

// 记录告警
function recordAlert(type, message, details) {
  const alert = {
    type,
    message,
    details,
    timestamp: Date.now(),
    timestampISO: new Date().toISOString(),
  };

  responseTimeStats.alerts.push(alert);
  responseTimeStats.alertHistory.push(alert);

  // 限制告警历史大小
  if (responseTimeStats.alertHistory.length > MAX_ALERT_HISTORY) {
    responseTimeStats.alertHistory.shift();
  }

  // 只保留最近10条活跃告警
  if (responseTimeStats.alerts.length > 10) {
    responseTimeStats.alerts.shift();
  }

  // 记录到日志
  logger.warn(`[性能告警] ${type}: ${message}`, details);
}

// 性能检查函数
function checkPerformanceAlerts() {
  const stats = responseTimeStats;

  // 检查慢请求率
  if (stats.totalRequests > 10) {
    // 至少有10个请求才开始检查
    const slowRequestRate =
      stats.totalRequests > 0
        ? (stats.slowRequests / stats.totalRequests) * 100
        : 0;

    if (
      slowRequestRate > alertThresholds.slowRequestRate &&
      shouldSendAlert('slowRequestRate')
    ) {
      recordAlert('slowRequestRate', '慢请求率超过阈值', {
        slowRequestRate: slowRequestRate.toFixed(2) + '%',
        threshold: alertThresholds.slowRequestRate + '%',
        slowRequests: stats.slowRequests,
        totalRequests: stats.totalRequests,
      });
    }

    // 检查平均响应时间
    const avgResponseTime =
      stats.totalRequests > 0 ? stats.totalTime / stats.totalRequests : 0;

    if (
      avgResponseTime > alertThresholds.avgResponseTime &&
      shouldSendAlert('avgResponseTime')
    ) {
      recordAlert('avgResponseTime', '平均响应时间超过阈值', {
        avgResponseTime: Math.round(avgResponseTime) + 'ms',
        threshold: alertThresholds.avgResponseTime + 'ms',
        totalRequests: stats.totalRequests,
      });
    }

    // 检查错误率
    const errorRate =
      stats.totalRequests > 0
        ? (stats.errorRequests / stats.totalRequests) * 100
        : 0;

    if (errorRate > alertThresholds.errorRate && shouldSendAlert('errorRate')) {
      recordAlert('errorRate', '错误率超过阈值', {
        errorRate: errorRate.toFixed(2) + '%',
        threshold: alertThresholds.errorRate + '%',
        errorRequests: stats.errorRequests,
        totalRequests: stats.totalRequests,
      });
    }
  }
}

const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  // 记录响应结束
  const onFinish = () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // 更新统计
    responseTimeStats.totalRequests++;
    responseTimeStats.totalTime += duration;

    // 统计错误请求
    if (statusCode >= 400) {
      responseTimeStats.errorRequests++;
    }

    if (!responseTimeStats.requestsByRoute[originalUrl]) {
      responseTimeStats.requestsByRoute[originalUrl] = {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        errorCount: 0,
      };
    }
    const routeStats = responseTimeStats.requestsByRoute[originalUrl];
    routeStats.count++;
    routeStats.totalTime += duration;
    routeStats.minTime = Math.min(routeStats.minTime, duration);
    routeStats.maxTime = Math.max(routeStats.maxTime, duration);
    if (statusCode >= 400) {
      routeStats.errorCount++;
    }

    // 记录日志，按响应时间级别
    let logLevel = 'info';
    if (duration >= slowThresholds.error) {
      logLevel = 'error';
      responseTimeStats.slowRequests++;
    } else if (duration >= slowThresholds.warn) {
      logLevel = 'warn';
      responseTimeStats.slowRequests++;
    }

    logger[logLevel](`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
      method,
      url: originalUrl,
      statusCode,
      duration,
    });

    // 检查性能告警（每10个请求检查一次）
    if (responseTimeStats.totalRequests % 10 === 0) {
      checkPerformanceAlerts();
    }
  };

  res.on('finish', onFinish);
  res.on('close', onFinish);

  next();
};

const getResponseTimeStats = () => {
  // 计算各个路由的平均时间
  const routesWithStats = {};
  for (const route in responseTimeStats.requestsByRoute) {
    const stats = responseTimeStats.requestsByRoute[route];
    routesWithStats[route] = {
      ...stats,
      averageTime:
        stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0,
      errorRate:
        stats.count > 0
          ? ((stats.errorCount / stats.count) * 100).toFixed(2) + '%'
          : '0%',
    };
  }

  const stats = {
    totalRequests: responseTimeStats.totalRequests,
    totalTime: responseTimeStats.totalTime,
    averageTime:
      responseTimeStats.totalRequests > 0
        ? Math.round(
            responseTimeStats.totalTime / responseTimeStats.totalRequests
          )
        : 0,
    slowRequests: responseTimeStats.slowRequests,
    errorRequests: responseTimeStats.errorRequests,
    slowRequestRate:
      responseTimeStats.totalRequests > 0
        ? (
            (responseTimeStats.slowRequests / responseTimeStats.totalRequests) *
            100
          ).toFixed(2) + '%'
        : '0%',
    errorRate:
      responseTimeStats.totalRequests > 0
        ? (
            (responseTimeStats.errorRequests /
              responseTimeStats.totalRequests) *
            100
          ).toFixed(2) + '%'
        : '0%',
    uptime: Date.now() - responseTimeStats.startTime,
    requestsByRoute: routesWithStats,
    slowThresholds: slowThresholds,
    alertThresholds: alertThresholds,
    currentAlerts: responseTimeStats.alerts,
    alertHistory: responseTimeStats.alertHistory,
  };

  return stats;
};

const resetResponseTimeStats = () => {
  responseTimeStats.totalRequests = 0;
  responseTimeStats.totalTime = 0;
  responseTimeStats.slowRequests = 0;
  responseTimeStats.errorRequests = 0;
  responseTimeStats.requestsByRoute = {};
  responseTimeStats.startTime = Date.now();
  responseTimeStats.alerts = [];
  lastAlertTime = {};
};

const getSlowestRoutes = (limit = 10) => {
  const routes = Object.entries(responseTimeStats.requestsByRoute)
    .map(([route, stats]) => ({
      route,
      ...stats,
      averageTime:
        stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0,
    }))
    .sort((a, b) => b.averageTime - a.averageTime)
    .slice(0, limit);
  return routes;
};

const getMostRequestedRoutes = (limit = 10) => {
  const routes = Object.entries(responseTimeStats.requestsByRoute)
    .map(([route, stats]) => ({
      route,
      ...stats,
      averageTime:
        stats.count > 0 ? Math.round(stats.totalTime / stats.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return routes;
};

// 获取性能趋势（简单实现）
const getPerformanceTrend = () => {
  const stats = getResponseTimeStats();
  return {
    currentAverageTime: stats.averageTime,
    slowRequestRate: stats.slowRequestRate,
    errorRate: stats.errorRate,
    totalRequests: stats.totalRequests,
    uptime: stats.uptime,
  };
};

// 清除告警
const clearAlerts = () => {
  responseTimeStats.alerts = [];
};

// 配置告警阈值
const setAlertThresholds = (newThresholds) => {
  Object.assign(alertThresholds, newThresholds);
  logger.info('告警阈值已更新', { newThresholds });
};

module.exports = {
  responseTimeMiddleware,
  getResponseTimeStats,
  resetResponseTimeStats,
  getSlowestRoutes,
  getMostRequestedRoutes,
  getPerformanceTrend,
  clearAlerts,
  setAlertThresholds,
};
