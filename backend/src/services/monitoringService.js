/**
 * 文件名：monitoringService.js
 * 作者：运维团队
 * 日期：2026-05-18
 * 版本：v1.0.0
 * 功能描述：服务器资源监控服务，提供CPU、内存、磁盘、网络等多维度监控指标
 * 更新记录：
 *   2026-05-18 - v1.0.0 - 初始创建服务器资源监控服务
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

class MonitoringService {
  constructor() {
    this.metrics = {
      cpu: { usage: 0, cores: os.cpus().length },
      memory: { used: 0, total: 0, free: 0, usage: 0 },
      disk: { used: 0, total: 0, free: 0, usage: 0 },
      network: { connections: 0, inbound: 0, outbound: 0 },
      uptime: 0,
      timestamp: null,
    };

    this.alertThresholds = {
      cpu: { warning: 80, critical: 95 },
      memory: { warning: 85, critical: 95 },
      disk: { warning: 80, critical: 95 },
      network: { connections: 1000, bandwidth: 100 },
    };

    this.alertHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * 获取CPU使用率
   */
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = (((total - idle) / total) * 100).toFixed(2);

    return parseFloat(usage);
  }

  /**
   * 获取内存信息
   */
  getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = ((used / total) * 100).toFixed(2);

    return {
      total: this.formatBytes(total),
      used: this.formatBytes(used),
      free: this.formatBytes(free),
      usagePercent: parseFloat(usage),
      rawTotal: total,
      rawUsed: used,
      rawFree: free,
    };
  }

  /**
   * 获取磁盘信息
   */
  getDiskInfo() {
    try {
      const diskUsage = fs.statfsSync('/');
      const total = diskUsage.blocks * diskUsage.blockSize;
      const free = diskUsage.bfree * diskUsage.blockSize;
      const used = total - free;
      const usage = ((used / total) * 100).toFixed(2);

      return {
        total: this.formatBytes(total),
        used: this.formatBytes(used),
        free: this.formatBytes(free),
        usagePercent: parseFloat(usage),
        rawTotal: total,
        rawUsed: used,
        rawFree: free,
      };
    } catch (error) {
      return {
        total: 'N/A',
        used: 'N/A',
        free: 'N/A',
        usagePercent: 0,
        rawTotal: 0,
        rawUsed: 0,
        rawFree: 0,
      };
    }
  }

  /**
   * 获取网络连接数（简化实现）
   */
  getNetworkInfo() {
    return {
      connections: this.estimateConnections(),
      inbound: 0,
      outbound: 0,
    };
  }

  /**
   * 估算网络连接数
   */
  estimateConnections() {
    try {
      const netstat = require('child_process').execSync(
        'netstat -an | find /c "ESTABLISHED"',
        { encoding: 'utf8' }
      );
      return parseInt(netstat.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取系统运行时间
   */
  getUptime() {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    return {
      raw: uptime,
      formatted: `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`,
    };
  }

  /**
   * 获取所有监控指标
   */
  getAllMetrics() {
    const cpuUsage = this.getCPUUsage();
    const memory = this.getMemoryInfo();
    const disk = this.getDiskInfo();
    const network = this.getNetworkInfo();
    const uptime = this.getUptime();

    this.metrics = {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        status: this.getStatus(cpuUsage, this.alertThresholds.cpu),
      },
      memory: {
        ...memory,
        status: this.getStatus(
          memory.usagePercent,
          this.alertThresholds.memory
        ),
      },
      disk: {
        ...disk,
        status: this.getStatus(disk.usagePercent, this.alertThresholds.disk),
      },
      network: {
        ...network,
        status:
          network.connections > this.alertThresholds.network.connections
            ? 'warning'
            : 'normal',
      },
      uptime: uptime,
      timestamp: new Date().toISOString(),
    };

    return this.metrics;
  }

  /**
   * 获取状态级别
   */
  getStatus(value, thresholds) {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'normal';
  }

  /**
   * 检查告警
   */
  checkAlerts() {
    const metrics = this.getAllMetrics();
    const alerts = [];

    // CPU告警
    if (metrics.cpu.usage >= this.alertThresholds.cpu.critical) {
      alerts.push(
        this.createAlert(
          'cpu',
          'critical',
          `CPU使用率过高: ${metrics.cpu.usage}%`
        )
      );
    } else if (metrics.cpu.usage >= this.alertThresholds.cpu.warning) {
      alerts.push(
        this.createAlert(
          'cpu',
          'warning',
          `CPU使用率偏高: ${metrics.cpu.usage}%`
        )
      );
    }

    // 内存告警
    if (metrics.memory.usagePercent >= this.alertThresholds.memory.critical) {
      alerts.push(
        this.createAlert(
          'memory',
          'critical',
          `内存使用率过高: ${metrics.memory.usagePercent}%`
        )
      );
    } else if (
      metrics.memory.usagePercent >= this.alertThresholds.memory.warning
    ) {
      alerts.push(
        this.createAlert(
          'memory',
          'warning',
          `内存使用率偏高: ${metrics.memory.usagePercent}%`
        )
      );
    }

    // 磁盘告警
    if (metrics.disk.usagePercent >= this.alertThresholds.disk.critical) {
      alerts.push(
        this.createAlert(
          'disk',
          'critical',
          `磁盘使用率过高: ${metrics.disk.usagePercent}%`
        )
      );
    } else if (metrics.disk.usagePercent >= this.alertThresholds.disk.warning) {
      alerts.push(
        this.createAlert(
          'disk',
          'warning',
          `磁盘使用率偏高: ${metrics.disk.usagePercent}%`
        )
      );
    }

    // 网络连接告警
    if (
      metrics.network.connections > this.alertThresholds.network.connections
    ) {
      alerts.push(
        this.createAlert(
          'network',
          'warning',
          `网络连接数过多: ${metrics.network.connections}`
        )
      );
    }

    // 更新告警历史
    alerts.forEach((alert) => {
      this.alertHistory.unshift(alert);
    });
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }

    return alerts;
  }

  /**
   * 创建告警对象
   */
  createAlert(type, level, message) {
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      level,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
  }

  /**
   * 获取告警历史
   */
  getAlertHistory() {
    return this.alertHistory;
  }

  /**
   * 确认告警
   */
  acknowledgeAlert(alertId) {
    const alert = this.alertHistory.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
    return alert;
  }

  /**
   * 设置告警阈值
   */
  setAlertThresholds(newThresholds) {
    Object.assign(this.alertThresholds, newThresholds);
    return this.alertThresholds;
  }

  /**
   * 获取当前告警阈值
   */
  getAlertThresholds() {
    return this.alertThresholds;
  }

  /**
   * 格式化字节数
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new MonitoringService();
