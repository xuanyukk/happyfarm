/**
 * 文件名：businessMetricsController.js
 * 作者：运维团队
 * 日期：2026-05-18
 * 版本：v1.0.0
 * 功能描述：业务指标监控API控制器，提供业务指标查询、分析和告警管理接口
 * 更新记录：
 *   2026-05-18 - v1.0.0 - 初始创建业务指标监控控制器
 */

const businessMetricsService = require('../services/businessMetricsService');
const alertNotificationService = require('../services/alertNotificationService');
const logger = require('../config/logger');

class BusinessMetricsController {
  /**
   * 获取所有业务指标
   */
  async getAllMetrics(req, res) {
    try {
      const metrics = businessMetricsService.getAllMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('获取业务指标失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取交易成功率指标
   */
  async getTransactionSuccessRates(req, res) {
    try {
      const metrics = businessMetricsService.getTransactionSuccessRates();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('获取交易成功率失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取用户活跃度指标
   */
  async getUserActivityMetrics(req, res) {
    try {
      const metrics = businessMetricsService.getUserActivityMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('获取用户活跃度失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取游戏业务指标
   */
  async getGameActivityMetrics(req, res) {
    try {
      const metrics = businessMetricsService.getGameActivityMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('获取游戏业务指标失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(req, res) {
    try {
      const metrics = businessMetricsService.getPerformanceMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('获取性能指标失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取历史数据
   */
  async getMetricsHistory(req, res) {
    try {
      const { startTime, endTime, limit } = req.query;
      const history = await businessMetricsService.getMetricsHistory(
        startTime || new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime || new Date(),
        parseInt(limit) || 100
      );
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('获取历史指标失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取多维度数据分析
   */
  async getMultiDimensionAnalysis(req, res) {
    try {
      const analysis = businessMetricsService.getMultiDimensionAnalysis();
      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('获取多维度分析失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 趋势预测
   */
  async predictTrends(req, res) {
    try {
      const { metricName, futureMinutes } = req.query;
      const prediction = businessMetricsService.predictTrends(
        metricName || 'loginSuccessRate',
        parseInt(futureMinutes) || 60
      );
      res.status(200).json({
        success: true,
        data: prediction,
      });
    } catch (error) {
      logger.error('趋势预测失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取告警阈值
   */
  async getAlertThresholds(req, res) {
    try {
      const thresholds = businessMetricsService.getAlertThresholds();
      res.status(200).json({
        success: true,
        data: thresholds,
      });
    } catch (error) {
      logger.error('获取告警阈值失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 更新告警阈值
   */
  async updateAlertThresholds(req, res) {
    try {
      const thresholds = req.body;
      await businessMetricsService.updateAlertThresholds(thresholds);
      res.status(200).json({
        success: true,
        message: '告警阈值已更新',
        data: businessMetricsService.getAlertThresholds(),
      });
    } catch (error) {
      logger.error('更新告警阈值失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 检查告警
   */
  async checkAlerts(req, res) {
    try {
      const alerts = await businessMetricsService.checkAlerts();

      if (alerts.length > 0) {
        // 发送告警通知
        for (const alert of alerts) {
          await alertNotificationService.sendAlert(
            alert.type,
            alert.metric,
            alert.value,
            alert.threshold,
            alert.message
          );
        }
      }

      res.status(200).json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      logger.error('检查告警失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 记录业务事件（用于测试和手动触发）
   */
  async recordEvent(req, res) {
    try {
      const { eventType, success } = req.body;

      switch (eventType) {
        case 'login':
          await businessMetricsService.recordLogin(success !== false);
          break;
        case 'payment':
          await businessMetricsService.recordPayment(success !== false);
          break;
        case 'dataSave':
          await businessMetricsService.recordDataSave(success !== false);
          break;
        case 'cropHarvest':
          await businessMetricsService.recordCropHarvest();
          break;
        case 'shopVisit':
          await businessMetricsService.recordShopVisit();
          break;
        case 'logout':
          await businessMetricsService.recordLogout();
          break;
        default:
          return res.status(400).json({
            success: false,
            error: '未知的事件类型',
          });
      }

      res.status(200).json({
        success: true,
        message: '事件已记录',
        data: businessMetricsService.getAllMetrics(),
      });
    } catch (error) {
      logger.error('记录事件失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 注册自定义指标
   */
  async registerCustomMetric(req, res) {
    try {
      const { metricName, config } = req.body;
      const metric = await businessMetricsService.registerCustomMetric(
        metricName,
        config
      );
      res.status(200).json({
        success: true,
        message: '自定义指标已注册',
        data: metric,
      });
    } catch (error) {
      logger.error('注册自定义指标失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 更新自定义指标
   */
  async updateCustomMetric(req, res) {
    try {
      const { metricName, value } = req.body;
      await businessMetricsService.updateCustomMetric(metricName, value);
      res.status(200).json({
        success: true,
        message: '自定义指标已更新',
        data: businessMetricsService.customMetrics,
      });
    } catch (error) {
      logger.error('更新自定义指标失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 重置指标
   */
  async resetMetrics(req, res) {
    try {
      await businessMetricsService.resetMetrics();
      res.status(200).json({
        success: true,
        message: '业务指标已重置',
      });
    } catch (error) {
      logger.error('重置指标失败', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new BusinessMetricsController();
