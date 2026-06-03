/**
 * 文件名：alertNotificationService.js
 * 作者：运维团队
 * 日期：2026-05-18
 * 版本：v1.0.0
 * 功能描述：多渠道告警通知服务，支持短信、邮件、企业微信、钉钉等通知渠道
 * 更新记录：
 *   2026-05-18 - v1.0.0 - 初始创建多渠道告警通知服务
 */

const axios = require('axios').default;
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class AlertNotificationService {
  constructor() {
    this.channels = {
      console: { enabled: true, priority: ['critical', 'warning', 'info'] },
      email: { enabled: false, priority: ['critical', 'warning'] },
      wechat: { enabled: false, priority: ['critical', 'warning'] },
      dingtalk: { enabled: false, priority: ['critical', 'warning'] },
      sms: { enabled: false, priority: ['critical'] },
    };

    this.emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to: [],
    };

    this.wechatConfig = {
      webhookUrl: process.env.WECHAT_WEBHOOK_URL || '',
      secret: process.env.WECHAT_SECRET || '',
    };

    this.dingtalkConfig = {
      webhookUrl: process.env.DINGTALK_WEBHOOK_URL || '',
      secret: process.env.DINGTALK_SECRET || '',
    };

    this.smsConfig = {
      apiUrl: process.env.SMS_API_URL || '',
      apiKey: process.env.SMS_API_KEY || '',
      templateId: process.env.SMS_TEMPLATE_ID || '',
    };

    this.emailTransporter = null;
    if (this.emailConfig.auth.user && this.emailConfig.auth.pass) {
      this.emailTransporter = nodemailer.createTransport(this.emailConfig);
    }

    this.alertHistory = [];
    this.maxHistorySize = 50;
  }

  /**
   * 发送告警通知
   * @param {Object} alert - 告警信息
   * @param {string} alert.type - 告警类型
   * @param {string} alert.level - 告警级别 (critical, warning, info)
   * @param {string} alert.message - 告警消息
   * @param {string} alert.timestamp - 告警时间
   */
  async sendAlert(alert) {
    const results = [];

    for (const [channelName, channelConfig] of Object.entries(this.channels)) {
      if (!channelConfig.enabled) continue;
      if (!channelConfig.priority.includes(alert.level)) continue;

      try {
        const result = await this.sendToChannel(channelName, alert);
        results.push({ channel: channelName, success: true, result });
      } catch (error) {
        results.push({
          channel: channelName,
          success: false,
          error: error.message,
        });
      }
    }

    // 记录告警历史
    this.alertHistory.unshift({
      ...alert,
      sentAt: new Date().toISOString(),
      channels: results,
    });

    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }

    return results;
  }

  /**
   * 发送到指定渠道
   */
  async sendToChannel(channelName, alert) {
    switch (channelName) {
      case 'console':
        return this.sendToConsole(alert);
      case 'email':
        return this.sendToEmail(alert);
      case 'wechat':
        return this.sendToWechat(alert);
      case 'dingtalk':
        return this.sendToDingtalk(alert);
      case 'sms':
        return this.sendToSms(alert);
      default:
        throw new Error(`Unknown channel: ${channelName}`);
    }
  }

  /**
   * 发送到控制台
   */
  sendToConsole(alert) {
    const levelEmoji =
      {
        critical: '🔥',
        warning: '⚠️',
        info: 'ℹ️',
      }[alert.level] || '📢';

    const message = `
${levelEmoji} [ALERT] ${alert.level.toUpperCase()}
${'='.repeat(60)}
时间: ${new Date(alert.timestamp).toLocaleString('zh-CN')}
类型: ${alert.type}
消息: ${alert.message}
详情: ${JSON.stringify(alert, null, 2)}
${'='.repeat(60)}
    `;

    logger.error(message);
    return { message: 'Console alert sent' };
  }

  /**
   * 发送邮件通知
   */
  async sendToEmail(alert) {
    if (!this.emailTransporter) {
      throw new Error('Email transport not configured');
    }

    if (!this.emailConfig.to || this.emailConfig.to.length === 0) {
      throw new Error('No email recipients configured');
    }

    const levelEmoji =
      {
        critical: '🔥',
        warning: '⚠️',
        info: 'ℹ️',
      }[alert.level] || '📢';

    const mailOptions = {
      from: this.emailConfig.from,
      to: this.emailConfig.to.join(','),
      subject: `${levelEmoji} FarmGame Alert [${alert.level.toUpperCase()}]: ${alert.type}`,
      text: this.formatEmailText(alert),
      html: this.formatEmailHtml(alert),
    };

    const result = await this.emailTransporter.sendMail(mailOptions);
    return { messageId: result.messageId };
  }

  /**
   * 格式化邮件文本
   */
  formatEmailText(alert) {
    return `【开心农场告警通知】

告警级别: ${alert.level.toUpperCase()}
告警类型: ${alert.type}
告警时间: ${new Date(alert.timestamp).toLocaleString('zh-CN')}
告警消息: ${alert.message}

详细信息:
${JSON.stringify(alert, null, 2)}`;
  }

  /**
   * 格式化邮件HTML
   */
  formatEmailHtml(alert) {
    const levelColors = {
      critical: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6',
    };

    return `<!DOCTYPE html>
<html>
<head>
  <title>FarmGame Alert</title>
  <style>
    .alert-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; }
    .alert-header { padding: 10px; border-radius: 6px; margin-bottom: 15px; color: white; }
    .alert-title { font-size: 18px; font-weight: bold; }
    .alert-content { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .alert-row { margin-bottom: 8px; }
    .alert-label { font-weight: 600; color: #6b7280; display: inline-block; width: 100px; }
    .alert-value { color: #1f2937; }
    .alert-desc { background: #f9fafb; padding: 10px; border-radius: 4px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="alert-box">
    <div class="alert-header" style="background-color: ${levelColors[alert.level]};">
      <div class="alert-title">🚨 开心农场告警通知</div>
    </div>
    <div class="alert-content">
      <div class="alert-row"><span class="alert-label">级别:</span><span class="alert-value">${alert.level.toUpperCase()}</span></div>
      <div class="alert-row"><span class="alert-label">类型:</span><span class="alert-value">${alert.type}</span></div>
      <div class="alert-row"><span class="alert-label">时间:</span><span class="alert-value">${new Date(alert.timestamp).toLocaleString('zh-CN')}</span></div>
      <div class="alert-row"><span class="alert-label">消息:</span><span class="alert-value">${alert.message}</span></div>
      <div class="alert-desc"><strong>详细信息:</strong><br>${JSON.stringify(alert, null, 2)}</div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 发送企业微信通知
   */
  async sendToWechat(alert) {
    if (!this.wechatConfig.webhookUrl) {
      throw new Error('WeChat webhook URL not configured');
    }

    const levelEmoji =
      {
        critical: '🔥',
        warning: '⚠️',
        info: 'ℹ️',
      }[alert.level] || '📢';

    const payload = {
      msgtype: 'markdown',
      markdown: {
        content:
          `## ${levelEmoji} 开心农场告警通知\n\n` +
          `**告警级别**: ${alert.level.toUpperCase()}\n\n` +
          `**告警类型**: ${alert.type}\n\n` +
          `**告警时间**: ${new Date(alert.timestamp).toLocaleString('zh-CN')}\n\n` +
          `**告警消息**: ${alert.message}`,
      },
    };

    const response = await axios.post(this.wechatConfig.webhookUrl, payload);
    return { status: response.status, data: response.data };
  }

  /**
   * 发送钉钉通知
   */
  async sendToDingtalk(alert) {
    if (!this.dingtalkConfig.webhookUrl) {
      throw new Error('DingTalk webhook URL not configured');
    }

    const levelEmoji =
      {
        critical: '🔥',
        warning: '⚠️',
        info: 'ℹ️',
      }[alert.level] || '📢';

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: `${levelEmoji} FarmGame Alert`,
        text:
          `## ${levelEmoji} 开心农场告警通知\n\n` +
          `**告警级别**: ${alert.level.toUpperCase()}\n\n` +
          `**告警类型**: ${alert.type}\n\n` +
          `**告警时间**: ${new Date(alert.timestamp).toLocaleString('zh-CN')}\n\n` +
          `**告警消息**: ${alert.message}`,
      },
    };

    const response = await axios.post(this.dingtalkConfig.webhookUrl, payload);
    return { status: response.status, data: response.data };
  }

  /**
   * 发送短信通知
   */
  async sendToSms(alert) {
    if (!this.smsConfig.apiUrl || !this.smsConfig.apiKey) {
      throw new Error('SMS API not configured');
    }

    const levelText =
      {
        critical: '严重',
        warning: '警告',
        info: '信息',
      }[alert.level] || '未知';

    const message = `【开心农场】${levelText}告警: ${alert.type} - ${alert.message}`;

    const payload = {
      apiKey: this.smsConfig.apiKey,
      templateId: this.smsConfig.templateId,
      message,
      phones: this.smsConfig.phones || [],
    };

    const response = await axios.post(this.smsConfig.apiUrl, payload);
    return { status: response.status, data: response.data };
  }

  /**
   * 配置通知渠道
   */
  configureChannel(channelName, config) {
    if (!this.channels[channelName]) {
      throw new Error(`Unknown channel: ${channelName}`);
    }

    Object.assign(this.channels[channelName], config);

    // 更新相关配置
    if (channelName === 'email' && config.transportConfig) {
      Object.assign(this.emailConfig, config.transportConfig);
      this.emailTransporter = nodemailer.createTransport(this.emailConfig);
    } else if (channelName === 'wechat' && config.webhookUrl) {
      this.wechatConfig.webhookUrl = config.webhookUrl;
      if (config.secret) this.wechatConfig.secret = config.secret;
    } else if (channelName === 'dingtalk' && config.webhookUrl) {
      this.dingtalkConfig.webhookUrl = config.webhookUrl;
      if (config.secret) this.dingtalkConfig.secret = config.secret;
    } else if (channelName === 'sms' && config.apiUrl) {
      Object.assign(this.smsConfig, config);
    }

    return this.channels[channelName];
  }

  /**
   * 获取渠道配置
   */
  getChannelConfig(channelName) {
    return this.channels[channelName];
  }

  /**
   * 获取所有渠道状态
   */
  getAllChannels() {
    return Object.entries(this.channels).map(([name, config]) => ({
      name,
      enabled: config.enabled,
      priority: config.priority,
    }));
  }

  /**
   * 获取告警历史
   */
  getAlertHistory() {
    return this.alertHistory;
  }

  /**
   * 设置告警级别优先级
   */
  setPriority(channelName, priorityLevels) {
    if (!this.channels[channelName]) {
      throw new Error(`Unknown channel: ${channelName}`);
    }
    this.channels[channelName].priority = priorityLevels;
    return this.channels[channelName];
  }
}

module.exports = new AlertNotificationService();
