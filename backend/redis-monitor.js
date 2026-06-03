/**
 * 文件名：redis-monitor.js
 * 作者：开发团队
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：Redis监控告警服务
 */

const redis = require('redis');
const logger = require('./src/config/logger');

/**
 * @typedef {Object} RedisMetrics
 * @property {number} hitRate - 缓存命中率
 * @property {number} totalKeys - 键总数
 * @property {number} usedMemory - 已用内存(MB)
 * @property {number} connectedClients - 连接客户端数
 * @property {number} instantaneousOpsPerSec - 每秒操作数
 */

class RedisMonitor {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.metrics = {
      hits: 0,
      misses: 0
    };
    this.alerts = [];
    
    // 默认告警阈值
    this.thresholds = {
      hitRate: 0.7,        // 命中率低于70%告警
      usedMemoryMB: 512,   // 内存超过512MB告警
      totalKeys: 10000,    // 键数超过10000告警
      opsPerSecond: 1000   // 每秒操作超过1000告警
    };
  }

  /**
   * 连接Redis
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      await this.client.connect();
      logger.info('✅ Redis监控器已连接');
    } catch (error) {
      logger.error('❌ Redis监控连接失败', error);
    }
  }

  /**
   * 收集Redis指标
   * @returns {Promise<RedisMetrics>}
   */
  async collectMetrics() {
    try {
      const info = await this.client.info();
      const stats = this.parseInfo(info);
      
      const dbsize = await this.client.dbSize();
      stats.totalKeys = dbsize;
      
      logger.debug('📊 Redis指标已收集', stats);
      return stats;
    } catch (error) {
      logger.error('❌ 收集Redis指标失败', error);
      throw error;
    }
  }

  /**
   * 解析INFO命令结果
   * @param {string} infoRaw - INFO原始结果
   * @returns {Object}
   */
  parseInfo(infoRaw) {
    const info = {};
    const lines = infoRaw.split('\r\n');
    
    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          info[key.trim()] = value.trim();
        }
      }
    }
    
    // 计算命中率
    const hits = parseInt(info.keyspace_hits || '0');
    const misses = parseInt(info.keyspace_misses || '0');
    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;
    
    return {
      hitRate,
      totalKeys: 0,
      usedMemoryMB: parseInt(info.used_memory_rss_human?.match(/\d+/)?.[0] || '0'),
      connectedClients: parseInt(info.connected_clients || '0'),
      instantaneousOpsPerSec: parseInt(info.instantaneous_ops_per_sec || '0'),
      keyspaceHits: hits,
      keyspaceMisses: misses
    };
  }

  /**
   * 检查告警
   * @param {RedisMetrics} metrics - Redis指标
   * @returns {string[]} 告警列表
   */
  checkAlerts(metrics) {
    const alerts = [];
    
    if (metrics.hitRate < this.thresholds.hitRate) {
      alerts.push(`⚠️ 缓存命中率低: ${(metrics.hitRate * 100).toFixed(1)}% (阈值: ${this.thresholds.hitRate * 100}%)`);
    }
    
    if (metrics.usedMemoryMB > this.thresholds.usedMemoryMB) {
      alerts.push(`⚠️ 内存使用高: ${metrics.usedMemoryMB}MB (阈值: ${this.thresholds.usedMemoryMB}MB)`);
    }
    
    if (metrics.totalKeys > this.thresholds.totalKeys) {
      alerts.push(`⚠️ 键数过多: ${metrics.totalKeys} (阈值: ${this.thresholds.totalKeys})`);
    }
    
    if (metrics.instantaneousOpsPerSec > this.thresholds.opsPerSecond) {
      alerts.push(`⚠️ 每秒操作过高: ${metrics.instantaneousOpsPerSec} (阈值: ${this.thresholds.opsPerSecond})`);
    }
    
    if (alerts.length > 0) {
      alerts.forEach(alert => logger.warn(alert));
      this.alerts = alerts;
    }
    
    return alerts;
  }

  /**
   * 记录缓存命中
   * @returns {void}
   */
  recordHit() {
    this.metrics.hits++;
  }

  /**
   * 记录缓存未命中
   * @returns {void}
   */
  recordMiss() {
    this.metrics.misses++;
  }

  /**
   * 运行监控检查
   * @returns {Promise<string[]>}
   */
  async check() {
    const metrics = await this.collectMetrics();
    return this.checkAlerts(metrics);
  }

  /**
   * 获取统计报告
   * @returns {Promise<Object>}
   */
  async getReport() {
    const metrics = await this.collectMetrics();
    return {
      ...metrics,
      currentAlerts: this.alerts,
      applicationMetrics: {
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        total: this.metrics.hits + this.misses,
        hitRate: (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100 || 0).toFixed(1) + '%'
      },
      thresholds: this.thresholds
    };
  }

  /**
   * 关闭监控
   * @returns {Promise<void>}
   */
  async disconnect() {
    await this.client.quit();
  }
}

let monitor = null;

/**
 * 获取监控单例
 * @returns {RedisMonitor}
 */
function getMonitor() {
  if (!monitor) {
    monitor = new RedisMonitor();
  }
  return monitor;
}

module.exports = {
  RedisMonitor,
  getMonitor
};
