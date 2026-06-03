/**
 * 文件名：monitoringController.js
 * 作者：运维团队
 * 日期：2026-05-18
 * 版本：v1.0.0
 * 功能描述：监控告警API控制器，提供监控指标查询和告警管理接口
 * 更新记录：
 *   2026-05-18 - v1.0.0 - 初始创建监控告警控制器
 */

const monitoringService = require('../services/monitoringService');
const alertNotificationService = require('../services/alertNotificationService');

class MonitoringController {
  /**
   * 获取所有监控指标
   */
  async getMetrics(req, res) {
    try {
      const metrics = monitoringService.getAllMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取CPU指标
   */
  async getCpuMetrics(req, res) {
    try {
      const metrics = monitoringService.getAllMetrics();
      res.status(200).json({
        success: true,
        data: metrics.cpu,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取内存指标
   */
  async getMemoryMetrics(req, res) {
    try {
      const metrics = monitoringService.getAllMetrics();
      res.status(200).json({
        success: true,
        data: metrics.memory,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取磁盘指标
   */
  async getDiskMetrics(req, res) {
    try {
      const metrics = monitoringService.getAllMetrics();
      res.status(200).json({
        success: true,
        data: metrics.disk,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取网络指标
   */
  async getNetworkMetrics(req, res) {
    try {
      const metrics = monitoringService.getAllMetrics();
      res.status(200).json({
        success: true,
        data: metrics.network,
      });
    } catch (error) {
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
      const alerts = monitoringService.checkAlerts();
      res.status(200).json({
        success: true,
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取告警历史
   */
  async getAlertHistory(req, res) {
    try {
      const history = monitoringService.getAlertHistory();
      res.status(200).json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 确认告警
   */
  async acknowledgeAlert(req, res) {
    try {
      const { alertId } = req.params;
      const alert = monitoringService.acknowledgeAlert(alertId);

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
      }

      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取告警阈值配置
   */
  async getAlertThresholds(req, res) {
    try {
      const thresholds = monitoringService.getAlertThresholds();
      res.status(200).json({
        success: true,
        data: thresholds,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 设置告警阈值
   */
  async setAlertThresholds(req, res) {
    try {
      const newThresholds = req.body;
      const thresholds = monitoringService.setAlertThresholds(newThresholds);
      res.status(200).json({
        success: true,
        data: thresholds,
        message: '告警阈值已更新',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取通知渠道配置
   */
  async getNotificationChannels(req, res) {
    try {
      const channels = alertNotificationService.getAllChannels();
      res.status(200).json({
        success: true,
        data: channels,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 配置通知渠道
   */
  async configureNotificationChannel(req, res) {
    try {
      const { channelName } = req.params;
      const config = req.body;
      const result = alertNotificationService.configureChannel(
        channelName,
        config
      );
      res.status(200).json({
        success: true,
        data: result,
        message: `渠道 ${channelName} 已配置`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 发送测试告警
   */
  async sendTestAlert(req, res) {
    try {
      const {
        level = 'info',
        message = '测试告警消息',
        type = 'test',
      } = req.body;
      const alert = {
        id: `test-alert-${Date.now()}`,
        type,
        level,
        message,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };

      const results = await alertNotificationService.sendAlert(alert);
      res.status(200).json({
        success: true,
        data: results,
        message: '测试告警已发送',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * 获取通知历史
   */
  async getNotificationHistory(req, res) {
    try {
      const history = alertNotificationService.getAlertHistory();
      res.status(200).json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new MonitoringController();
