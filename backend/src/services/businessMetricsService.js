/**
 * 文件名：businessMetricsService.js
 * 作者：运维团队
 * 日期：2026-05-18
 * 版本：v1.0.0
 * 功能描述：业务指标监控服务，提供关键业务指标的实时采集、处理、存储、分析功能
 * 更新记录：
 *   2026-05-18 - v1.0.0 - 初始创建业务指标监控服务
 */

const db = require('../config/db');
const logger = require('../config/logger');
const redisClient = require('../config/redis');

class BusinessMetricsService {
  constructor() {
    this.redis = redisClient;

    this.metrics = {
      // 交易成功率指标
      transactionSuccess: {
        login: { total: 0, success: 0, rate: 100 },
        payment: { total: 0, success: 0, rate: 100 },
        dataSave: { total: 0, success: 0, rate: 100 },
      },
      // 用户活跃度指标
      userActivity: {
        onlineUsers: 0,
        dailyActiveUsers: 0,
        peakOnlineUsers: 0,
        lastPeakTimestamp: null,
      },
      // 游戏业务指标
      gameActivity: {
        activePlayers: 0,
        cropHarvestCount: 0,
        transactionCount: 0,
        shopVisits: 0,
      },
      // 性能指标
      performance: {
        avgResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
      },
      timestamp: null,
    };

    this.metricsHistory = [];
    this.maxHistorySize = 1000;
    this.customMetrics = {};

    this.alertThresholds = {
      loginSuccessRate: { warning: 99, critical: 95 },
      paymentSuccessRate: { warning: 98, critical: 95 },
      dataSaveSuccessRate: { warning: 99.5, critical: 98 },
      onlineUsers: { warning: 100, critical: 0 },
      dauDropRate: { warning: 30, critical: 50 },
      peakCapacityRate: { warning: 80, critical: 95 },
    };

    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    try {
      await this.loadMetricsFromStorage();
      logger.info('业务指标监控服务初始化成功');
    } catch (error) {
      logger.error('业务指标监控服务初始化失败', { error: error.message });
    }
  }

  /**
   * 记录登录事件
   */
  async recordLogin(success = true) {
    this.metrics.transactionSuccess.login.total++;
    if (success) {
      this.metrics.transactionSuccess.login.success++;
    }
    this.metrics.transactionSuccess.login.rate = (
      (this.metrics.transactionSuccess.login.success /
        this.metrics.transactionSuccess.login.total) *
      100
    ).toFixed(2);

    this.metrics.userActivity.onlineUsers++;
    if (
      this.metrics.userActivity.onlineUsers >
      this.metrics.userActivity.peakOnlineUsers
    ) {
      this.metrics.userActivity.peakOnlineUsers =
        this.metrics.userActivity.onlineUsers;
      this.metrics.userActivity.lastPeakTimestamp = new Date().toISOString();
    }

    await this.saveMetrics();
    await this.checkAlerts();
  }

  /**
   * 记录用户登出
   */
  async recordLogout() {
    if (this.metrics.userActivity.onlineUsers > 0) {
      this.metrics.userActivity.onlineUsers--;
    }
    await this.saveMetrics();
  }

  /**
   * 记录支付事件
   */
  async recordPayment(success = true) {
    this.metrics.transactionSuccess.payment.total++;
    if (success) {
      this.metrics.transactionSuccess.payment.success++;
    }
    this.metrics.transactionSuccess.payment.rate = (
      (this.metrics.transactionSuccess.payment.success /
        this.metrics.transactionSuccess.payment.total) *
      100
    ).toFixed(2);

    this.metrics.gameActivity.transactionCount++;
    await this.saveMetrics();
    await this.checkAlerts();
  }

  /**
   * 记录数据保存事件
   */
  async recordDataSave(success = true) {
    this.metrics.transactionSuccess.dataSave.total++;
    if (success) {
      this.metrics.transactionSuccess.dataSave.success++;
    }
    this.metrics.transactionSuccess.dataSave.rate = (
      (this.metrics.transactionSuccess.dataSave.success /
        this.metrics.transactionSuccess.dataSave.total) *
      100
    ).toFixed(2);

    await this.saveMetrics();
    await this.checkAlerts();
  }

  /**
   * 记录作物收获
   */
  async recordCropHarvest() {
    this.metrics.gameActivity.cropHarvestCount++;
    await this.saveMetrics();
  }

  /**
   * 记录商店访问
   */
  async recordShopVisit() {
    this.metrics.gameActivity.shopVisits++;
    await this.saveMetrics();
  }

  /**
   * 记录活跃玩家
   */
  async recordActivePlayer() {
    this.metrics.gameActivity.activePlayers++;
    await this.saveMetrics();
  }

  /**
   * 记录响应时间
   */
  async recordResponseTime(ms) {
    const currentAvg = this.metrics.performance.avgResponseTime;
    this.metrics.performance.avgResponseTime = (
      currentAvg * 0.9 +
      ms * 0.1
    ).toFixed(2);
    await this.saveMetrics();
  }

  /**
   * 记录请求
   */
  async recordRequest(isError = false) {
    this.metrics.performance.requestsPerSecond++;
    if (isError) {
      const totalRequests =
        this.metrics.transactionSuccess.login.total +
        this.metrics.transactionSuccess.payment.total +
        this.metrics.transactionSuccess.dataSave.total;
      const errorCount =
        this.metrics.transactionSuccess.login.total -
        this.metrics.transactionSuccess.login.success +
        (this.metrics.transactionSuccess.payment.total -
          this.metrics.transactionSuccess.payment.success) +
        (this.metrics.transactionSuccess.dataSave.total -
          this.metrics.transactionSuccess.dataSave.success);
      this.metrics.performance.errorRate = (
        (errorCount / (totalRequests || 1)) *
        100
      ).toFixed(2);
    }
    await this.saveMetrics();
  }

  /**
   * 获取所有业务指标
   */
  getAllMetrics() {
    this.metrics.timestamp = new Date().toISOString();
    return this.metrics;
  }

  /**
   * 获取交易成功率指标
   */
  getTransactionSuccessRates() {
    return {
      ...this.metrics.transactionSuccess,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取用户活跃度指标
   */
  getUserActivityMetrics() {
    return {
      ...this.metrics.userActivity,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取游戏业务指标
   */
  getGameActivityMetrics() {
    return {
      ...this.metrics.gameActivity,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return {
      ...this.metrics.performance,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取历史数据
   */
  async getMetricsHistory(startTime, endTime, limit = 100) {
    const history = this.metricsHistory
      .filter((m) => {
        const ts = new Date(m.timestamp);
        return ts >= new Date(startTime) && ts <= new Date(endTime);
      })
      .slice(-limit);

    return history;
  }

  /**
   * 自定义指标配置
   */
  async registerCustomMetric(metricName, config) {
    this.customMetrics[metricName] = {
      ...config,
      value: 0,
      history: [],
    };

    logger.info('注册自定义指标', { metricName, config });
    return this.customMetrics[metricName];
  }

  /**
   * 更新自定义指标值
   */
  async updateCustomMetric(metricName, value) {
    if (this.customMetrics[metricName]) {
      this.customMetrics[metricName].value = value;
      this.customMetrics[metricName].history.push({
        value,
        timestamp: new Date().toISOString(),
      });

      if (this.customMetrics[metricName].history.length > 100) {
        this.customMetrics[metricName].history.shift();
      }
    }

    await this.saveMetrics();
  }

  /**
   * 检查告警
   */
  async checkAlerts() {
    const alerts = [];

    // 登录成功率告警
    if (
      parseFloat(this.metrics.transactionSuccess.login.rate) <
      this.alertThresholds.loginSuccessRate.critical
    ) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'loginSuccessRate',
        value: this.metrics.transactionSuccess.login.rate,
        threshold: this.alertThresholds.loginSuccessRate.critical,
        message: '登录成功率严重下降',
      });
    } else if (
      parseFloat(this.metrics.transactionSuccess.login.rate) <
      this.alertThresholds.loginSuccessRate.warning
    ) {
      alerts.push({
        type: 'WARNING',
        metric: 'loginSuccessRate',
        value: this.metrics.transactionSuccess.login.rate,
        threshold: this.alertThresholds.loginSuccessRate.warning,
        message: '登录成功率下降',
      });
    }

    // 支付成功率告警
    if (
      parseFloat(this.metrics.transactionSuccess.payment.rate) <
      this.alertThresholds.paymentSuccessRate.critical
    ) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'paymentSuccessRate',
        value: this.metrics.transactionSuccess.payment.rate,
        threshold: this.alertThresholds.paymentSuccessRate.critical,
        message: '支付成功率严重下降',
      });
    } else if (
      parseFloat(this.metrics.transactionSuccess.payment.rate) <
      this.alertThresholds.paymentSuccessRate.warning
    ) {
      alerts.push({
        type: 'WARNING',
        metric: 'paymentSuccessRate',
        value: this.metrics.transactionSuccess.payment.rate,
        threshold: this.alertThresholds.paymentSuccessRate.warning,
        message: '支付成功率下降',
      });
    }

    // 在线用户异常告警
    if (
      this.metrics.userActivity.onlineUsers <
      this.alertThresholds.onlineUsers.critical
    ) {
      alerts.push({
        type: 'WARNING',
        metric: 'onlineUsers',
        value: this.metrics.userActivity.onlineUsers,
        threshold: this.alertThresholds.onlineUsers.warning,
        message: '在线用户数异常低',
      });
    }

    // 峰值容量告警
    const capacityThreshold = 1000; // 假设容量阈值
    const capacityRate =
      (this.metrics.userActivity.peakOnlineUsers / capacityThreshold) * 100;
    if (capacityRate > this.alertThresholds.peakCapacityRate.critical) {
      alerts.push({
        type: 'CRITICAL',
        metric: 'peakCapacityRate',
        value: capacityRate.toFixed(2),
        threshold: this.alertThresholds.peakCapacityRate.critical,
        message: '在线用户数接近容量上限',
      });
    } else if (capacityRate > this.alertThresholds.peakCapacityRate.warning) {
      alerts.push({
        type: 'WARNING',
        metric: 'peakCapacityRate',
        value: capacityRate.toFixed(2),
        threshold: this.alertThresholds.peakCapacityRate.warning,
        message: '在线用户数较高',
      });
    }

    return alerts;
  }

  /**
   * 更新告警阈值
   */
  async updateAlertThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    await this.saveMetrics();
    logger.info('告警阈值已更新', { thresholds });
  }

  /**
   * 获取告警阈值
   */
  getAlertThresholds() {
    return this.alertThresholds;
  }

  /**
   * 保存指标到存储
   */
  async saveMetrics() {
    try {
      const metricsData = {
        ...this.metrics,
        timestamp: new Date().toISOString(),
      };

      this.metricsHistory.push(metricsData);
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      if (this.redis) {
        await this.redis.set(
          'business:metrics:current',
          JSON.stringify(metricsData)
        );
        await this.redis.set(
          'business:metrics:history',
          JSON.stringify(this.metricsHistory.slice(-100))
        );
      }

      logger.debug('业务指标已保存');
    } catch (error) {
      logger.error('保存业务指标失败', { error: error.message });
    }
  }

  /**
   * 从存储加载指标
   */
  async loadMetricsFromStorage() {
    try {
      if (this.redis) {
        const currentMetrics = await this.redis.get('business:metrics:current');
        const metricsHistory = await this.redis.get('business:metrics:history');

        if (currentMetrics) {
          const parsed = JSON.parse(currentMetrics);
          // 保留当前的实时指标，只加载历史数据
          this.metrics.timestamp = parsed.timestamp;
        }

        if (metricsHistory) {
          this.metricsHistory = JSON.parse(metricsHistory);
        }
      }

      logger.info('业务指标已从存储加载');
    } catch (error) {
      logger.warn('加载业务指标失败，使用默认值', { error: error.message });
    }
  }

  /**
   * 重置指标（用于新的一天/时间段）
   */
  async resetMetrics() {
    this.metrics.transactionSuccess = {
      login: { total: 0, success: 0, rate: 100 },
      payment: { total: 0, success: 0, rate: 100 },
      dataSave: { total: 0, success: 0, rate: 100 },
    };

    this.metrics.gameActivity = {
      activePlayers: 0,
      cropHarvestCount: 0,
      transactionCount: 0,
      shopVisits: 0,
    };

    this.metrics.performance = {
      avgResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 0,
    };

    this.metrics.userActivity.dailyActiveUsers = 0;
    this.metrics.userActivity.peakOnlineUsers = 0;

    await this.saveMetrics();
    logger.info('业务指标已重置');
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取多维度数据分析
   */
  getMultiDimensionAnalysis() {
    return {
      overview: this.getAllMetrics(),
      transactionAnalysis: this.getTransactionSuccessRates(),
      userAnalysis: this.getUserActivityMetrics(),
      gameAnalysis: this.getGameActivityMetrics(),
      performanceAnalysis: this.getPerformanceMetrics(),
      customMetrics: this.customMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 趋势预测
   */
  predictTrends(metricName, futureMinutes = 60) {
    const history = this.metricsHistory.slice(-30);
    if (history.length < 5) {
      return { prediction: null, confidence: 0, message: '历史数据不足' };
    }

    // 简单的线性回归预测
    const values = history.map((h, i) => {
      let val = 0;
      if (metricName.includes('login'))
        val = parseFloat(h.transactionSuccess?.login?.rate || 0);
      else if (metricName.includes('payment'))
        val = parseFloat(h.transactionSuccess?.payment?.rate || 0);
      else if (metricName.includes('online'))
        val = h.userActivity?.onlineUsers || 0;
      return { x: i, y: val };
    });

    const n = values.length;
    const sumX = values.reduce((sum, v) => sum + v.x, 0);
    const sumY = values.reduce((sum, v) => sum + v.y, 0);
    const sumXY = values.reduce((sum, v) => sum + v.x * v.y, 0);
    const sumX2 = values.reduce((sum, v) => sum + v.x * v.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const prediction = slope * (n + futureMinutes) + intercept;
    const confidence = Math.min(90, 100 - n * 2);

    return {
      metricName,
      prediction: prediction.toFixed(2),
      trend: slope > 0 ? '上升' : slope < 0 ? '下降' : '稳定',
      confidence: confidence,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new BusinessMetricsService();
