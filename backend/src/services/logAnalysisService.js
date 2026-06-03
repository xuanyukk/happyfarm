/**
 * 文件名：logAnalysisService.js
 * 作者：开发者
 * 日期：2026-05-13
 * 版本：v2.0.0
 * 功能描述：日志分析服务，提供日志查询、统计、分析功能
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本创建
 *   2026-05-13 - v2.0.0 - 更新以支持新的日志分类系统
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logDir = path.join(__dirname, '../../logs');

// 日志类型定义
const LogTypes = {
  SYSTEM: 'system',
  ERROR: 'error',
  ACCESS: 'access',
  BUSINESS: 'business',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  AUDIT: 'audit',
  COMBINED: 'combined',
};

class LogAnalysisService {
  constructor() {
    this.logTypes = LogTypes;
  }

  /**
   * 获取日志文件列表
   * @param {string} logType - 日志类型过滤
   * @returns {Promise<Array>} 日志文件列表
   */
  async getLogFiles(logType = null) {
    if (!fs.existsSync(logDir)) {
      return [];
    }

    const files = fs
      .readdirSync(logDir)
      .filter((file) => file.endsWith('.log') || file.endsWith('.log.gz'));

    // 按类型过滤
    const filteredFiles = logType
      ? files.filter((file) => file.startsWith(logType))
      : files;

    return filteredFiles
      .map((file) => {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);

        // 解析日志类型
        let type = LogTypes.COMBINED;
        Object.values(LogTypes).forEach((t) => {
          if (file.startsWith(t)) {
            type = t;
          }
        });

        return {
          name: file,
          type,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size),
          modified: stats.mtime,
          created: stats.birthtime,
        };
      })
      .sort((a, b) => b.modified - a.modified);
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 文件大小（字节）
   * @returns {string} 格式化后的文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 读取日志文件内容
   * @param {string} fileName - 日志文件名
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Array>} 日志条目列表
   */
  async readLogFile(fileName, filters = {}) {
    const {
      limit = 100,
      level = '',
      logType = '',
      module = '',
      searchTerm = '',
      startDate = '',
      endDate = '',
    } = filters;

    const filePath = path.join(logDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('日志文件不存在');
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const logs = [];
    let lineCount = 0;

    for await (const line of rl) {
      if (lineCount >= limit) break;

      try {
        const logEntry = this.parseLogLine(line);
        if (!logEntry) continue;

        // 级别过滤
        if (level && logEntry.level !== level) continue;

        // 日志类型过滤
        if (logType && logEntry.logType !== logType) continue;

        // 模块过滤
        if (module && logEntry.module !== module) continue;

        // 关键词搜索
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const logStr = JSON.stringify(logEntry).toLowerCase();
          if (!logStr.includes(searchLower)) continue;
        }

        // 日期过滤
        if (startDate && new Date(logEntry.timestamp) < new Date(startDate))
          continue;
        if (endDate && new Date(logEntry.timestamp) > new Date(endDate))
          continue;

        logs.push(logEntry);
        lineCount++;
      } catch (error) {
        // 解析失败，尝试作为普通文本处理
        if (line.trim()) {
          logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: line,
            logType: LogTypes.COMBINED,
            raw: true,
          });
          lineCount++;
        }
      }
    }

    return logs;
  }

  /**
   * 解析日志行
   * @param {string} line - 日志行
   * @returns {Object|null} 解析后的日志对象
   */
  parseLogLine(line) {
    try {
      const log = JSON.parse(line);
      return log;
    } catch (error) {
      // 尝试解析非JSON格式的日志
      const timestampMatch = line.match(
        /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/
      );
      const levelMatch = line.match(/\[(\w+)\]/);

      if (timestampMatch && levelMatch) {
        const level = levelMatch[1].toLowerCase();
        const message = line
          .substring(line.indexOf(levelMatch[0]) + levelMatch[0].length)
          .trim();

        return {
          timestamp: timestampMatch[1],
          level,
          message,
          logType: LogTypes.COMBINED,
        };
      }

      return null;
    }
  }

  /**
   * 获取日志统计信息
   * @param {string} fileName - 日志文件名
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 统计信息
   */
  async getLogStats(fileName, filters = {}) {
    const logs = await this.readLogFile(fileName, { ...filters, limit: 10000 });
    const stats = {
      total: logs.length,
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      byLevel: {},
      byType: {},
      byModule: {},
      byHour: {},
      topErrors: [],
    };

    const errorCounts = {};

    logs.forEach((log) => {
      const level = log.level || 'info';
      const type = log.logType || LogTypes.COMBINED;
      const module = log.module || 'unknown';

      // 级别统计
      stats[level] = (stats[level] || 0) + 1;
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;

      // 类型统计
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // 模块统计
      stats.byModule[module] = (stats.byModule[module] || 0) + 1;

      // 按小时统计
      if (log.timestamp) {
        const hour = new Date(log.timestamp).getHours();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      }

      // 错误统计
      if (level === 'error' && log.message) {
        const key = log.message.substring(0, 100); // 取前100字符作为键
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      }
    });

    // Top 10 错误
    stats.topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return stats;
  }

  /**
   * 获取错误分析报告
   * @param {string} fileName - 日志文件名
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 错误分析报告
   */
  async getErrorAnalysis(fileName, filters = {}) {
    const logs = await this.readLogFile(fileName, {
      ...filters,
      level: 'error',
      limit: 10000,
    });
    const errorAnalysis = {
      totalErrors: logs.length,
      topErrors: [],
      errorPatterns: [],
      byModule: {},
      recentErrors: logs.slice(-20), // 最近20个错误
    };

    const errorCounts = {};

    logs.forEach((log) => {
      const message = log.message || '未知错误';
      const module = log.module || 'unknown';

      errorCounts[message] = (errorCounts[message] || 0) + 1;
      errorAnalysis.byModule[module] =
        (errorAnalysis.byModule[module] || 0) + 1;
    });

    // 排序错误
    errorAnalysis.topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    return errorAnalysis;
  }

  /**
   * 获取性能分析报告
   * @param {string} fileName - 日志文件名
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 性能统计信息
   */
  async getPerformanceStats(fileName, filters = {}) {
    const logs = await this.readLogFile(fileName, {
      ...filters,
      logType: LogTypes.PERFORMANCE,
      limit: 10000,
    });
    const performanceStats = {
      total: logs.length,
      avgDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      slowOperations: [],
      byLabel: {},
    };

    const durations = [];

    logs.forEach((log) => {
      // 尝试从日志中提取性能数据
      const metadata = log.metadata || {};
      const durationStr = metadata.duration || '';
      const label = metadata.label || 'unknown';

      // 解析毫秒数
      const match = durationStr.match(/(\d+)/);
      if (match) {
        const duration = parseInt(match[1], 10);
        if (!isNaN(duration)) {
          durations.push(duration);

          performanceStats.maxDuration = Math.max(
            performanceStats.maxDuration,
            duration
          );
          performanceStats.minDuration = Math.min(
            performanceStats.minDuration,
            duration
          );

          if (duration > 1000) {
            // 超过1秒的慢操作
            performanceStats.slowOperations.push({
              timestamp: log.timestamp,
              label,
              duration: `${duration}ms`,
              metadata,
            });
          }

          if (!performanceStats.byLabel[label]) {
            performanceStats.byLabel[label] = {
              total: 0,
              count: 0,
              max: 0,
              min: Infinity,
            };
          }
          performanceStats.byLabel[label].total += duration;
          performanceStats.byLabel[label].count += 1;
          performanceStats.byLabel[label].max = Math.max(
            performanceStats.byLabel[label].max,
            duration
          );
          performanceStats.byLabel[label].min = Math.min(
            performanceStats.byLabel[label].min,
            duration
          );
        }
      }
    });

    if (durations.length > 0) {
      performanceStats.avgDuration = Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      );
    }

    // 计算每个标签的平均时长
    Object.keys(performanceStats.byLabel).forEach((label) => {
      const data = performanceStats.byLabel[label];
      data.avg = Math.round(data.total / data.count);
    });

    performanceStats.slowOperations = performanceStats.slowOperations.slice(
      0,
      20
    );

    return performanceStats;
  }

  /**
   * 获取访问分析报告
   * @param {string} fileName - 日志文件名
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 访问统计信息
   */
  async getAccessAnalysis(fileName, filters = {}) {
    const logs = await this.readLogFile(fileName, {
      ...filters,
      logType: LogTypes.ACCESS,
      limit: 10000,
    });
    const accessAnalysis = {
      totalRequests: logs.length,
      byMethod: {},
      byStatus: {},
      byEndpoint: {},
      avgDuration: 0,
      slowEndpoints: [],
    };

    const durations = [];
    const endpointDurations = {};

    logs.forEach((log) => {
      const metadata = log.metadata || {};
      const method = metadata.method || 'GET';
      const status = metadata.statusCode || 200;
      const endpoint = metadata.url || '/';

      // 方法统计
      accessAnalysis.byMethod[method] =
        (accessAnalysis.byMethod[method] || 0) + 1;

      // 状态码统计
      accessAnalysis.byStatus[status] =
        (accessAnalysis.byStatus[status] || 0) + 1;

      // 端点统计
      accessAnalysis.byEndpoint[endpoint] =
        (accessAnalysis.byEndpoint[endpoint] || 0) + 1;

      // 时长统计
      const durationStr = metadata.duration || '';
      const match = durationStr.match(/(\d+)/);
      if (match) {
        const duration = parseInt(match[1], 10);
        durations.push(duration);

        if (!endpointDurations[endpoint]) {
          endpointDurations[endpoint] = [];
        }
        endpointDurations[endpoint].push(duration);
      }
    });

    if (durations.length > 0) {
      accessAnalysis.avgDuration = Math.round(
        durations.reduce((a, b) => a + b, 0) / durations.length
      );
    }

    // 计算慢端点
    accessAnalysis.slowEndpoints = Object.entries(endpointDurations)
      .map(([endpoint, times]) => {
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        return { endpoint, avgDuration: avg, count: times.length };
      })
      .filter((e) => e.avgDuration > 500) // 超过500ms的端点
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    return accessAnalysis;
  }

  /**
   * 获取安全分析报告
   * @param {string} fileName - 日志文件名
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 安全统计信息
   */
  async getSecurityAnalysis(fileName, filters = {}) {
    const logs = await this.readLogFile(fileName, {
      ...filters,
      logType: LogTypes.SECURITY,
      limit: 10000,
    });
    const securityAnalysis = {
      totalEvents: logs.length,
      byEvent: {},
      recentEvents: logs.slice(-30), // 最近30个事件
      criticalEvents: logs.filter(
        (log) => log.level === 'error' || log.level === 'warn'
      ),
    };

    logs.forEach((log) => {
      const event = log.metadata?.event || 'unknown';
      securityAnalysis.byEvent[event] =
        (securityAnalysis.byEvent[event] || 0) + 1;
    });

    return securityAnalysis;
  }

  /**
   * 导出日志
   * @param {string} fileName - 日志文件名
   * @param {string} format - 导出格式（json/csv）
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Buffer>} 导出文件内容
   */
  async exportLogs(fileName, format = 'json', filters = {}) {
    const logs = await this.readLogFile(fileName, { ...filters, limit: 10000 });

    if (format === 'json') {
      return Buffer.from(JSON.stringify(logs, null, 2), 'utf8');
    } else if (format === 'csv') {
      const headers = [
        'timestamp',
        'level',
        'logType',
        'module',
        'operator',
        'message',
      ];
      const csvLines = [
        headers.join(','),
        ...logs.map((log) =>
          headers
            .map((h) => `"${(log[h] || '').toString().replace(/"/g, '""')}"`)
            .join(',')
        ),
      ];
      return Buffer.from(csvLines.join('\n'), 'utf8');
    }

    throw new Error('不支持的导出格式');
  }

  /**
   * 获取综合分析报告
   * @param {Object} filters - 过滤条件
   * @returns {Promise<Object>} 综合分析报告
   */
  async getComprehensiveReport(filters = {}) {
    const files = await this.getLogFiles();
    const report = {
      generatedAt: new Date().toISOString(),
      fileCount: files.length,
      statsByType: {},
      totalLogs: 0,
    };

    // 对每种类型的日志进行分析
    for (const type of Object.values(this.logTypes)) {
      const typeFiles = files.filter((f) => f.type === type);
      if (typeFiles.length > 0) {
        const latestFile = typeFiles[0]; // 使用最新的文件
        try {
          const stats = await this.getLogStats(latestFile.name, filters);
          report.statsByType[type] = stats;
          report.totalLogs += stats.total;
        } catch (error) {
          // 静默失败
        }
      }
    }

    return report;
  }
}

module.exports = new LogAnalysisService();
