/**
 * 文件名：logger.js
 * 作者：开发者
 * 日期：2026-05-15
 * 版本：v2.1.0
 * 功能描述：完整的前端日志服务
 * 更新记录：
 *   2026-05-13 - v2.0.0 - 完整重构，支持多类型日志、分级存储、错误上报
 *   2026-05-15 - v2.1.0 - 实现远程日志上报功能，支持单条和批量上报
 */

// 日志类型定义
const LogTypes = {
  SYSTEM: 'system',
  ERROR: 'error',
  ACCESS: 'access',
  BUSINESS: 'business',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  USER_ACTION: 'user_action',
};

// 日志级别定义
const LogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

// 模块名称定义
const Modules = {
  APP: 'app',
  AUTH: 'auth',
  USER: 'user',
  FARM: 'farm',
  MARKET: 'market',
  EVENT: 'event',
  API: 'api',
  WEBSOCKET: 'websocket',
  COMPONENT: 'component',
  ROUTER: 'router',
};

class Logger {
  constructor() {
    this.logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
    this.levels = LogLevels;
    this.logTypes = LogTypes;
    this.modules = Modules;
    this.enableConsole = import.meta.env.VITE_ENABLE_LOG_CONSOLE !== 'false';
    this.enableRemoteReport = import.meta.env.VITE_ENABLE_LOG_REPORT === 'true';

    // 远程上报配置
    this.apiEndpoint =
      import.meta.env.VITE_LOG_REPORT_ENDPOINT || '/api/client-logs';
    this.batchApiEndpoint =
      import.meta.env.VITE_LOG_BATCH_REPORT_ENDPOINT ||
      '/api/client-logs/batch';
    this.reportInterval =
      parseInt(import.meta.env.VITE_LOG_REPORT_INTERVAL) || 30000; // 30秒

    // 内存日志缓存（用于问题诊断）
    this.logBuffer = [];
    this.maxBufferSize = 500;

    // 待上报队列
    this.pendingLogs = [];
    this.maxPendingLogs = 100;

    // 定时上报计时器
    this.reportTimer = null;

    // 当前用户信息
    this.currentUser = null;

    // 启动定时上报
    this.startPeriodicReport();

    // 从localStorage恢复日志
    this.loadLogsFromStorage();
  }

  /**
   * 设置当前用户
   * @param {Object} user - 用户信息
   */
  setUser(user) {
    this.currentUser = user;
  }

  /**
   * 检查是否应该记录该级别的日志
   * @param {string} level - 日志级别
   * @returns {boolean}
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.logLevel];
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} logType - 日志类型
   * @param {string} module - 模块名称
   * @returns {Object} 格式化后的日志对象
   */
  formatLog(
    level,
    message,
    meta = {},
    logType = LogTypes.SYSTEM,
    module = Modules.APP
  ) {
    const timestamp = new Date().toISOString();

    return {
      timestamp,
      level,
      message,
      logType,
      module,
      operator: this.currentUser?.username || 'anonymous',
      userId: this.currentUser?.id,
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata: meta,
    };
  }

  /**
   * 添加日志到缓冲区
   * @param {Object} log - 日志对象
   */
  addToBuffer(log) {
    this.logBuffer.push(log);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // 移除最旧的日志
    }
  }

  /**
   * 获取缓冲区内的日志
   * @param {Object} filters - 过滤条件
   * @returns {Array}
   */
  getBufferedLogs(filters = {}) {
    let logs = [...this.logBuffer];

    if (filters.level) {
      logs = logs.filter((log) => log.level === filters.level);
    }

    if (filters.logType) {
      logs = logs.filter((log) => log.logType === filters.logType);
    }

    if (filters.module) {
      logs = logs.filter((log) => log.module === filters.module);
    }

    return logs;
  }

  /**
   * 清空日志缓冲区
   */
  clearBuffer() {
    this.logBuffer = [];
  }

  /**
   * 从localStorage加载日志
   */
  loadLogsFromStorage() {
    try {
      const savedLogs = localStorage.getItem('client_logs_pending');
      if (savedLogs) {
        this.pendingLogs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.warn('加载本地日志失败:', error);
    }
  }

  /**
   * 保存日志到localStorage
   */
  saveLogsToStorage() {
    try {
      localStorage.setItem(
        'client_logs_pending',
        JSON.stringify(this.pendingLogs.slice(-this.maxPendingLogs))
      );
    } catch (error) {
      console.warn('保存日志失败:', error);
    }
  }

  /**
   * 添加日志到待上报队列
   * @param {Object} log - 日志对象
   */
  addToPending(log) {
    this.pendingLogs.push(log);
    if (this.pendingLogs.length > this.maxPendingLogs) {
      this.pendingLogs.shift();
    }
    this.saveLogsToStorage();
  }

  /**
   * 启动定时上报
   */
  startPeriodicReport() {
    if (this.reportTimer) return;

    this.reportTimer = setInterval(() => {
      this.flushReports();
    }, this.reportInterval);
  }

  /**
   * 停止定时上报
   */
  stopPeriodicReport() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }

  /**
   * 上报单条日志到服务器
   * @param {Object} log - 日志对象
   */
  async reportLog(log) {
    if (!this.enableRemoteReport) return;

    // 添加到待上报队列
    this.addToPending(log);

    // 立即尝试上报
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0',
        },
        body: JSON.stringify(log),
      });

      // 上报成功，从队列中移除
      const index = this.pendingLogs.indexOf(log);
      if (index > -1) {
        this.pendingLogs.splice(index, 1);
        this.saveLogsToStorage();
      }
    } catch (error) {
      // 静默失败，保留在队列中等待下次上报
      console.debug('日志上报失败，已加入待上报队列');
    }
  }

  /**
   * 基础日志记录方法
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} logType - 日志类型
   * @param {string} module - 模块名称
   */
  log(
    level,
    message,
    meta = {},
    logType = LogTypes.SYSTEM,
    module = Modules.APP
  ) {
    if (!this.shouldLog(level)) return;

    const logObj = this.formatLog(level, message, meta, logType, module);

    // 添加到缓冲区
    this.addToBuffer(logObj);

    // 控制台输出
    if (this.enableConsole) {
      this.printToConsole(level, logObj);
    }

    // 错误和警告自动上报
    if (level === 'error' || (level === 'warn' && this.enableRemoteReport)) {
      this.reportLog(logObj);
    }
  }

  /**
   * 打印日志到控制台
   * @param {string} level - 日志级别
   * @param {Object} logObj - 日志对象
   */
  printToConsole(level, logObj) {
    const {
      timestamp,
      level: logLevel,
      message,
      logType,
      module,
      metadata,
    } = logObj;
    const metaStr =
      Object.keys(metadata || {}).length > 0
        ? ` | ${JSON.stringify(metadata)}`
        : '';
    const prefix = `[${timestamp}] [${logLevel.toUpperCase()}] [${logType}] [${module}]`;

    switch (level) {
      case 'error':
        console.error(`${prefix} ❌ ${message}${metaStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}${metaStr}`);
        break;
      case 'info':
        console.info(`${prefix} ✅ ${message}${metaStr}`);
        break;
      case 'debug':
        console.debug(`${prefix} 🔧 ${message}${metaStr}`);
        break;
      default:
        console.log(`${prefix} ${message}${metaStr}`);
    }
  }

  /**
   * Debug级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} logType - 日志类型
   * @param {string} module - 模块名称
   */
  debug(message, meta = {}, logType = LogTypes.SYSTEM, module = Modules.APP) {
    this.log('debug', message, meta, logType, module);
  }

  /**
   * Info级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} logType - 日志类型
   * @param {string} module - 模块名称
   */
  info(message, meta = {}, logType = LogTypes.SYSTEM, module = Modules.APP) {
    this.log('info', message, meta, logType, module);
  }

  /**
   * Warn级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} logType - 日志类型
   * @param {string} module - 模块名称
   */
  warn(message, meta = {}, logType = LogTypes.SYSTEM, module = Modules.APP) {
    this.log('warn', message, meta, logType, module);
  }

  /**
   * Error级别日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   * @param {string} logType - 日志类型
   * @param {string} module - 模块名称
   */
  error(message, meta = {}, logType = LogTypes.ERROR, module = Modules.APP) {
    // 如果传入了Error对象，提取堆栈信息
    if (meta.error instanceof Error) {
      meta.stack = meta.error.stack;
      meta.errorMessage = meta.error.message;
    }

    this.log('error', message, meta, logType, module);
  }

  /**
   * 记录用户操作
   * @param {string} action - 操作类型
   * @param {Object} data - 操作数据
   * @param {string} module - 模块名称
   */
  userAction(action, data = {}, module = Modules.USER) {
    this.info('用户操作', { action, data }, LogTypes.USER_ACTION, module);
  }

  /**
   * 记录API请求
   * @param {string} method - 请求方法
   * @param {string} url - 请求URL
   * @param {Object} data - 请求数据
   */
  apiRequest(method, url, data = {}) {
    this.debug('API请求', { method, url, data }, LogTypes.ACCESS, Modules.API);
  }

  /**
   * 记录API响应
   * @param {string} method - 请求方法
   * @param {string} url - 请求URL
   * @param {number} status - 状态码
   * @param {number} duration - 耗时(ms)
   */
  apiResponse(method, url, status, duration) {
    this.debug(
      'API响应',
      { method, url, status, duration: `${duration}ms` },
      LogTypes.ACCESS,
      Modules.API
    );
  }

  /**
   * 记录性能数据
   * @param {string} label - 性能标签
   * @param {number} duration - 耗时(ms)
   * @param {Object} meta - 其他元数据
   */
  performance(label, duration, meta = {}) {
    this.info(
      '性能数据',
      { label, duration: `${duration}ms`, ...meta },
      LogTypes.PERFORMANCE,
      Modules.APP
    );
  }

  /**
   * 记录业务操作
   * @param {string} action - 操作类型
   * @param {Object} data - 操作数据
   * @param {string} module - 模块名称
   */
  business(action, data = {}, module = Modules.APP) {
    this.info('业务操作', { action, data }, LogTypes.BUSINESS, module);
  }

  /**
   * 记录安全事件
   * @param {string} event - 安全事件
   * @param {Object} data - 事件数据
   */
  security(event, data = {}) {
    this.warn('安全事件', { event, ...data }, LogTypes.SECURITY, Modules.AUTH);
  }

  /**
   * 批量错误上报
   */
  async flushReports() {
    if (this.pendingLogs.length === 0 || !this.enableRemoteReport) return;

    const logsToReport = [...this.pendingLogs];

    try {
      const response = await fetch(this.batchApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0',
        },
        body: JSON.stringify({ logs: logsToReport }),
      });

      if (response.ok) {
        // 上报成功，清空队列
        this.pendingLogs = [];
        this.saveLogsToStorage();
        console.debug(`成功批量上报 ${logsToReport.length} 条日志`);
      }
    } catch (error) {
      // 静默失败，保留在队列中等待下次上报
      console.debug('批量日志上报失败，将在下次重试');
    }
  }

  /**
   * 导出日志（用于用户反馈）
   * @returns {string} JSON格式的日志
   */
  exportLogs() {
    const logs = this.getBufferedLogs();
    return JSON.stringify(
      {
        exportTime: new Date().toISOString(),
        user: this.currentUser
          ? { id: this.currentUser.id, username: this.currentUser.username }
          : null,
        userAgent: navigator.userAgent,
        url: window.location.href,
        logs: logs,
      },
      null,
      2
    );
  }

  /**
   * 下载日志文件
   */
  downloadLogs() {
    const content = this.exportLogs();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 创建单例实例
const logger = new Logger();

// 暴露常量
logger.LogTypes = LogTypes;
logger.LogLevels = LogLevels;
logger.Modules = Modules;

// 全局错误监听
window.addEventListener('error', (event) => {
  logger.error(
    '全局错误',
    {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    },
    LogTypes.ERROR,
    Modules.APP
  );
});

// Promise拒绝监听
window.addEventListener('unhandledrejection', (event) => {
  logger.error(
    '未处理的Promise拒绝',
    {
      reason: event.reason?.toString() || 'Unknown reason',
      stack: event.reason?.stack,
    },
    LogTypes.ERROR,
    Modules.APP
  );
});

// 页面卸载前批量上报
window.addEventListener('beforeunload', () => {
  logger.flushReports();
});

export default logger;
export { logger };
