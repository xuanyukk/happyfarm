/**
 * 文件名：logger.js
 * 作者：开发者
 * 日期：2026-05-13
 * 版本：v4.0.0
 * 功能描述：完整的日志系统配置（支持多类型日志、分级存储、归档、告警、采样、脱敏）
 * 更新记录：
 *   2026-03-22 - v1.1.1 - 修复控制台日志输出格式，确保时间戳显示
 *   2026-03-27 - v2.0.0 - 全面优化日志格式，提高可读性，添加错误原因解释和故障排除建议
 *   2026-03-27 - v2.1.0 - 添加按大小和日期的日志轮转功能
 *   2026-05-13 - v3.0.0 - 完整重构，支持多类型日志、分级存储、归档、告警机制
 *   2026-05-15 - v4.0.0 - 添加日志采样、完整脱敏、多种告警渠道、更多错误解释
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

// 创建日志目录
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志告警事件发射器
class LogAlertEmitter extends EventEmitter {}
const logAlertEmitter = new LogAlertEmitter();

// 日志级别配置
const logLevel = process.env.LOG_LEVEL || 'info';

// ==================== 日志类型定义 ====================

const LogTypes = {
  SYSTEM: 'system',
  ERROR: 'error',
  ACCESS: 'access',
  BUSINESS: 'business',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  AUDIT: 'audit',
};

// ==================== 日志级别定义 ====================

const LogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
};

// ==================== 模块名称定义 ====================

const Modules = {
  SERVER: 'server',
  DATABASE: 'database',
  AUTH: 'auth',
  PLAYER: 'player',
  FARM: 'farm',
  CROP: 'crop',
  SHOP: 'shop',
  CACHE: 'cache',
  API: 'api',
  WEBSOCKET: 'websocket',
  ADMIN: 'admin',
  GAME_EVENT: 'game_event',
  LOG_ANALYSIS: 'log_analysis',
  BACKUP: 'backup',
};

// ==================== 错误原因解释映射 ====================

const errorExplanations = {
  'SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string': {
    explanation: '数据库密码格式错误，密码必须是字符串格式',
    possibleCauses: [
      '数据库密码配置错误',
      '环境变量中的密码格式不正确',
      '密码包含特殊字符导致解析错误',
    ],
    solution: '检查.env文件中的数据库密码配置，确保密码是正确的字符串格式',
  },
  'relation "users" does not exist': {
    explanation: '数据库表不存在',
    possibleCauses: [
      '数据库初始化未完成',
      '表名拼写错误',
      '数据库连接到了错误的数据库',
    ],
    solution: '运行数据库初始化脚本，确保所有表都已创建',
  },
  player不存在: {
    explanation: '请求的玩家数据不存在',
    possibleCauses: ['玩家ID错误', '玩家数据未初始化', '数据库查询失败'],
    solution: '检查玩家ID是否正确，确保玩家数据已初始化',
  },
  'Cannot read properties of null': {
    explanation: '尝试访问不存在的对象属性',
    possibleCauses: ['数据查询返回空结果', '对象未正确初始化', '代码逻辑错误'],
    solution: '检查相关代码逻辑，确保对象在使用前已正确初始化',
  },
  'Cannot read properties of undefined': {
    explanation: '尝试访问未定义对象的属性',
    possibleCauses: [
      '变量未初始化',
      'API返回数据结构变化',
      '代码中缺少null检查',
    ],
    solution: '在访问属性前检查对象是否存在，添加null/undefined检查',
  },
  'column "change_type" does not exist': {
    explanation: '数据库表列不存在',
    possibleCauses: ['表结构未更新', 'SQL语句错误', '数据库迁移未完成'],
    solution: '运行数据库迁移脚本，更新表结构',
  },
  'Connection terminated due to connection timeout': {
    explanation: '数据库连接超时',
    possibleCauses: [
      '数据库服务未运行',
      '网络连接问题',
      '数据库连接池配置不当',
    ],
    solution:
      '检查数据库服务是否运行，网络连接是否正常，调整数据库连接超时设置',
  },
  农场币不足: {
    explanation: '玩家农场币数量不足',
    possibleCauses: ['玩家余额不足', '操作所需费用计算错误'],
    solution: '赚取更多农场币后再尝试操作',
  },
  玩家等级不足: {
    explanation: '玩家等级未达到操作要求',
    possibleCauses: ['玩家等级过低', '等级要求设置过高'],
    solution: '提升玩家等级后再尝试操作',
  },
  'duplicate key value violates unique constraint': {
    explanation: '数据库唯一约束冲突',
    possibleCauses: ['重复的唯一键值', '并发操作导致的冲突'],
    solution: '检查操作是否重复，确保唯一键值的唯一性',
  },
  ENOTFOUND: {
    explanation: '文件或目录未找到',
    possibleCauses: ['文件路径错误', '文件已被删除', '文件权限问题'],
    solution: '检查文件路径是否正确，确认文件是否存在',
  },
  ECONNREFUSED: {
    explanation: '连接被拒绝',
    possibleCauses: ['目标服务未运行', '端口配置错误', '防火墙阻止'],
    solution: '检查目标服务是否运行，端口配置是否正确',
  },
  EADDRINUSE: {
    explanation: '端口已被占用',
    possibleCauses: ['服务已在运行', '端口配置重复', '端口被其他程序占用'],
    solution: '检查端口是否已被其他程序占用，修改端口配置或关闭占用端口的程序',
  },
  400: {
    explanation: '请求参数错误',
    possibleCauses: ['请求参数格式错误', '缺少必填参数', '参数值超出范围'],
    solution: '检查请求参数是否符合API文档要求',
  },
  401: {
    explanation: '未授权访问',
    possibleCauses: ['未登录', 'token过期', 'token无效'],
    solution: '请重新登录获取有效token',
  },
  403: {
    explanation: '无权限访问',
    possibleCauses: ['用户权限不足', '角色权限配置错误', '资源访问受限'],
    solution: '检查用户权限配置，联系管理员',
  },
  404: {
    explanation: '资源未找到',
    possibleCauses: ['URL错误', '资源已被删除', 'API路由错误'],
    solution: '检查URL是否正确，确认资源是否存在',
  },
  409: {
    explanation: '资源冲突',
    possibleCauses: ['并发操作冲突', '数据状态错误', '数据版本不匹配'],
    solution: '检查操作是否重复，检查数据状态',
  },
  422: {
    explanation: '请求参数验证失败',
    possibleCauses: ['数据格式不正确', '必填字段缺失', '数据验证规则未通过'],
    solution: '检查请求数据格式和验证规则',
  },
  429: {
    explanation: '请求过于频繁',
    possibleCauses: ['超过API限流', '爬虫攻击', '短时间内过多请求'],
    solution: '降低请求频率，稍后重试',
  },
  500: {
    explanation: '服务器内部错误',
    possibleCauses: ['代码异常', '数据库错误', '第三方服务异常'],
    solution: '查看服务器日志获取详细错误信息',
  },
  502: {
    explanation: '网关错误',
    possibleCauses: ['上游服务异常', '网关配置错误', '网络连接问题'],
    solution: '检查上游服务状态和网关配置',
  },
  503: {
    explanation: '服务不可用',
    possibleCauses: ['服务重启中', '服务过载', '维护中'],
    solution: '等待服务恢复，稍后重试',
  },
  504: {
    explanation: '网关超时',
    possibleCauses: ['上游服务响应超时', '网络延迟过高', '服务处理时间过长'],
    solution: '稍后重试，检查上游服务状态',
  },
  'JWT expired': {
    explanation: 'JWT令牌已过期',
    possibleCauses: ['登录时间过长', 'token有效期过短'],
    solution: '重新登录获取新的token',
  },
  'JWT invalid': {
    explanation: 'JWT令牌无效',
    possibleCauses: ['token被篡改', 'token格式错误', '签名验证失败'],
    solution: '重新登录获取有效的token',
  },
  'JWT malformed': {
    explanation: 'JWT令牌格式错误',
    possibleCauses: ['token格式不正确', 'token被截断', 'token编码错误'],
    solution: '重新登录获取正确格式的token',
  },
  'Validation failed': {
    explanation: '数据验证失败',
    possibleCauses: ['输入数据不符合要求', '必填项缺失', '数据格式错误'],
    solution: '检查输入数据格式和必填项',
  },
  'invalid input syntax': {
    explanation: '数据库输入格式错误',
    possibleCauses: ['数据类型不匹配', '格式不符合要求', '特殊字符问题'],
    solution: '检查输入数据类型和格式是否符合要求',
  },
  'null value in column violates not-null constraint': {
    explanation: '非空字段不能为null',
    possibleCauses: ['必填字段缺失', '数据完整性约束违反', '数据验证不完整'],
    solution: '检查所有必填字段是否已正确提供',
  },
  'foreign key constraint violation': {
    explanation: '外键约束违反',
    possibleCauses: [
      '引用的记录不存在',
      '先删除子记录再删除父记录',
      '数据完整性问题',
    ],
    solution: '确保引用的记录存在，或先处理关联记录',
  },
  'deadlock detected': {
    explanation: '数据库死锁',
    possibleCauses: ['并发事务冲突', '事务处理顺序不当', '锁等待超时'],
    solution: '检查事务处理顺序，优化事务处理逻辑',
  },
  'query returned no data': {
    explanation: '查询无数据返回',
    possibleCauses: ['查询条件不匹配', '数据不存在', '查询参数错误'],
    solution: '检查查询条件和参数是否正确',
  },
  'too many connections': {
    explanation: '数据库连接数过多',
    possibleCauses: ['连接池配置过小', '并发访问过高', '连接未正确释放'],
    solution: '检查数据库连接配置，优化连接池大小',
  },
  'disk full': {
    explanation: '磁盘空间不足',
    possibleCauses: ['日志文件过大', '数据库文件过多', '磁盘空间耗尽'],
    solution: '清理磁盘空间，压缩旧日志文件',
  },
  'out of memory': {
    explanation: '内存不足',
    possibleCauses: ['数据量过大', '内存泄漏', '配置不合理'],
    solution: '优化内存使用，增加内存或调整配置',
  },
  'permission denied': {
    explanation: '权限不足',
    possibleCauses: ['数据库用户权限不足', '文件系统权限不足', '操作受限'],
    solution: '检查相关权限配置，提升必要权限',
  },
};

// ==================== 告警配置 ====================

const AlertConfig = {
  errorThreshold: 5, // 错误阈值，连续5个错误触发告警
  errorWindowMs: 60000, // 1分钟窗口
  warningThreshold: 10, // 警告阈值
  enableAlerts: process.env.ENABLE_LOG_ALERTS !== 'false',
  alertChannels: process.env.LOG_ALERT_CHANNELS
    ? process.env.LOG_ALERT_CHANNELS.split(',')
    : ['console'], // 可扩展：console, email, webhook, slack, wechat等

  // 邮件配置
  email: {
    enabled: process.env.LOG_ALERT_EMAIL_ENABLED === 'true',
    from: process.env.LOG_ALERT_EMAIL_FROM || 'alerts@farmgame.com',
    to: process.env.LOG_ALERT_EMAIL_TO || 'admin@farmgame.com',
    subjectPrefix: '[FarmGame Alert]',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
  },

  // Webhook配置（如Slack、企业微信、钉钉等）
  webhook: {
    enabled: process.env.LOG_ALERT_WEBHOOK_ENABLED === 'true',
    url: process.env.LOG_ALERT_WEBHOOK_URL || '',
    timeout: 10000,
  },

  // 告警级别配置
  levels: {
    critical: ['error', 'critical'],
    warning: ['warn'],
    info: ['info'],
  },
};

// 告警状态追踪
const alertState = {
  errorCount: 0,
  warningCount: 0,
  lastResetTime: Date.now(),
  alertedErrors: new Set(),
};

// ==================== 日志采样配置 ====================
const SamplingConfig = {
  // 采样率：0-1之间的值，0表示不采样，1表示全部记录
  defaultSampleRate: parseFloat(process.env.LOG_DEFAULT_SAMPLE_RATE) || 1.0,

  // 按日志类型配置采样率
  sampleRates: {
    // 错误和警告必须全部记录
    error: 1.0,
    warn: 1.0,
    // 访问日志采样率，降低磁盘I/O
    access: parseFloat(process.env.LOG_ACCESS_SAMPLE_RATE) || 0.5,
    // 业务日志默认全部记录
    business: 1.0,
    // 安全日志必须全部记录
    security: 1.0,
    // 性能日志采样
    performance: parseFloat(process.env.LOG_PERF_SAMPLE_RATE) || 0.5,
    // 审计日志必须全部记录
    audit: 1.0,
    // 系统日志默认全部记录
    system: 1.0,
  },

  // 始终记录的场景
  alwaysSample: {
    // 错误和警告始终记录
    errorLevels: ['error', 'warn'],
    // 包含特定关键词的请求
    keywords: ['login', 'register', 'payment', 'error', 'exception'],
    // 特定的路径
    paths: ['/api/auth', '/api/payment', '/api/admin'],
  },

  // 采样计数
  counters: {},
};

/**
 * 判断是否应该采样记录这条日志
 * @param {string} level - 日志级别
 * @param {string} logType - 日志类型
 * @param {Object} meta - 元数据
 * @returns {boolean} 是否应该记录
 */
function shouldSample(level, logType = LogTypes.SYSTEM, meta = {}) {
  // 错误和警告始终记录
  if (SamplingConfig.alwaysSample.errorLevels.includes(level)) {
    return true;
  }

  // 安全和审计日志始终记录
  if ([LogTypes.SECURITY, LogTypes.AUDIT].includes(logType)) {
    return true;
  }

  // 检查关键词
  if (meta.message) {
    const message = meta.message.toLowerCase();
    if (
      SamplingConfig.alwaysSample.keywords.some((keyword) =>
        message.includes(keyword)
      )
    ) {
      return true;
    }
  }

  // 检查路径
  if (meta.url || meta.path) {
    const path = (meta.url || meta.path).toLowerCase();
    if (
      SamplingConfig.alwaysSample.paths.some((p) =>
        path.includes(p.toLowerCase())
      )
    ) {
      return true;
    }
  }

  // 获取采样率
  const sampleRate =
    SamplingConfig.sampleRates[logType] || SamplingConfig.defaultSampleRate;

  // 如果采样率为1，全部记录
  if (sampleRate >= 1.0) {
    return true;
  }

  // 如果采样率为0，不记录
  if (sampleRate <= 0) {
    return false;
  }

  // 初始化计数器
  if (!SamplingConfig.counters[logType]) {
    SamplingConfig.counters[logType] = 0;
  }

  // 递增计数器
  SamplingConfig.counters[logType]++;

  // 简单的采样算法：根据采样率随机决定
  return Math.random() < sampleRate;
}

/**
 * 获取当前采样统计信息
 * @returns {Object} 采样统计
 */
function getSamplingStats() {
  const stats = {
    sampleRates: { ...SamplingConfig.sampleRates },
    counters: { ...SamplingConfig.counters },
    timestamp: new Date().toISOString(),
  };
  return stats;
}

// ==================== 格式化函数 ====================

/**
 * 获取错误解释
 * @param {string} errorMessage - 错误消息
 * @returns {Object} 错误解释
 */
function getErrorExplanation(errorMessage) {
  for (const [key, explanation] of Object.entries(errorExplanations)) {
    if (errorMessage && errorMessage.includes(key)) {
      return explanation;
    }
  }
  return {
    explanation: '未知错误',
    possibleCauses: ['系统异常', '代码错误', '外部服务问题'],
    solution: '联系技术人员进行排查',
  };
}

/**
 * 格式化错误信息
 * @param {*} error - 错误对象
 * @returns {Object} 格式化后的错误信息
 */
function formatError(error) {
  if (!error) return {};

  const errorMessage =
    typeof error === 'string' ? error : error.message || JSON.stringify(error);
  const explanation = getErrorExplanation(errorMessage);

  return {
    message: errorMessage,
    explanation: explanation.explanation,
    possibleCauses: explanation.possibleCauses,
    solution: explanation.solution,
    stack: error.stack,
  };
}

/**
 * 生成请求ID
 * @returns {string} 请求ID
 */
function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 脱敏敏感信息
 * @param {string} value - 原始值
 * @param {string} type - 信息类型
 * @returns {string} 脱敏后的值
 */
function maskSensitiveInfo(value, type = 'default') {
  if (!value || typeof value !== 'string') return value;

  switch (type) {
    case 'phone':
      // 手机号脱敏：138****1234
      return value.length >= 11
        ? `${value.slice(0, 3)}****${value.slice(-4)}`
        : '****';
    case 'email':
      // 邮箱脱敏：a****@example.com
      const atIndex = value.indexOf('@');
      return atIndex > 1
        ? `${value.charAt(0)}****${value.slice(atIndex)}`
        : '****@example.com';
    case 'idCard':
      // 身份证脱敏：110***********1234
      return value.length >= 18
        ? `${value.slice(0, 3)}***********${value.slice(-4)}`
        : '**************';
    case 'password':
    case 'token':
    case 'secret':
      return '********';
    case 'name':
      // 姓名脱敏：张*
      return value.length >= 2 ? `${value.charAt(0)}*` : '*';
    case 'address':
      // 地址脱敏：保留前3个字符
      return value.length >= 3 ? `${value.slice(0, 3)}****` : '****';
    case 'creditCard':
      // 银行卡脱敏：6222************1234
      return value.length >= 16
        ? `${value.slice(0, 4)}************${value.slice(-4)}`
        : '****';
    default:
      // 通用脱敏：保留前2后2
      return value.length >= 4
        ? `${value.slice(0, 2)}**${value.slice(-2)}`
        : '**';
  }
}

/**
 * 深度脱敏处理对象
 * @param {Object} obj - 要脱敏的对象
 * @returns {Object} 脱敏后的对象
 */
function deepMaskSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => deepMaskSensitiveData(item));
  }

  const result = { ...obj };

  // 敏感字段列表
  const sensitiveFields = [
    'password',
    'pwd',
    'token',
    'authToken',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'appKey',
    'appSecret',
    'privateKey',
    'publicKey',
    'phone',
    'mobile',
    'tel',
    'telephone',
    'email',
    'mail',
    'idCard',
    'idNumber',
    'identityCard',
    'socialSecurity',
    'name',
    'realName',
    'username',
    'account',
    'address',
    'location',
    'postalAddress',
    'creditCard',
    'cardNumber',
    'bankAccount',
    'cvn',
    'cvv',
    'expiry',
    'dob',
    'dateOfBirth',
    'birthday',
    'ssn',
    'socialSecurityNumber',
    'taxId',
    'nationalId',
    'passportNumber',
  ];

  for (const [key, value] of Object.entries(result)) {
    const lowerKey = key.toLowerCase();

    // 检查是否是敏感字段
    for (const sensitiveField of sensitiveFields) {
      if (lowerKey.includes(sensitiveField.toLowerCase())) {
        if (typeof value === 'string') {
          // 自动检测类型
          let type = 'default';
          if (
            sensitiveField.includes('phone') ||
            sensitiveField.includes('mobile')
          )
            type = 'phone';
          else if (
            sensitiveField.includes('email') ||
            sensitiveField.includes('mail')
          )
            type = 'email';
          else if (
            sensitiveField.includes('idcard') ||
            sensitiveField.includes('identity')
          )
            type = 'idCard';
          else if (
            sensitiveField.includes('password') ||
            sensitiveField.includes('token') ||
            sensitiveField.includes('secret')
          )
            type = 'password';
          else if (sensitiveField.includes('name')) type = 'name';
          else if (sensitiveField.includes('address')) type = 'address';
          else if (
            sensitiveField.includes('card') ||
            sensitiveField.includes('account')
          )
            type = 'creditCard';

          result[key] = maskSensitiveInfo(value, type);
        }
        break;
      }
    }

    // 递归处理嵌套对象
    if (typeof value === 'object' && value !== null) {
      result[key] = deepMaskSensitiveData(value);
    }
  }

  return result;
}

/**
 * 格式化日志元数据
 * @param {Object} meta - 元数据
 * @returns {Object} 格式化后的元数据
 */
function formatMetadata(meta = {}) {
  const formatted = {
    ...meta,
    requestId: meta.requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };

  // 深度脱敏敏感信息
  return deepMaskSensitiveData(formatted);
}

// ==================== 告警检查 ====================

/**
 * 检查是否需要告警
 * @param {string} level - 日志级别
 * @param {Object} meta - 元数据
 */
function checkAlert(level, meta) {
  if (!AlertConfig.enableAlerts) return;

  const now = Date.now();

  // 重置计数（每1分钟）
  if (now - alertState.lastResetTime > AlertConfig.errorWindowMs) {
    alertState.errorCount = 0;
    alertState.warningCount = 0;
    alertState.lastResetTime = now;
    alertState.alertedErrors.clear();
  }

  if (level === 'error') {
    alertState.errorCount++;

    // 检查错误阈值
    if (alertState.errorCount >= AlertConfig.errorThreshold) {
      const errorKey = `${level}-${Math.floor(now / 60000)}`;
      if (!alertState.alertedErrors.has(errorKey)) {
        alertState.alertedErrors.add(errorKey);
        emitLogAlert({
          type: 'high_error_rate',
          level: 'critical',
          errorCount: alertState.errorCount,
          message: '短期内大量错误发生',
          timestamp: new Date().toISOString(),
        });
      }
    }
  } else if (level === 'warn') {
    alertState.warningCount++;
  }
}

/**
 * 发送日志告警到所有配置的渠道
 * @param {Object} alert - 告警信息
 */
function emitLogAlert(alert) {
  logAlertEmitter.emit('alert', alert);

  // 根据配置的渠道发送告警
  for (const channel of AlertConfig.alertChannels) {
    try {
      switch (channel.toLowerCase()) {
        case 'console':
          sendConsoleAlert(alert);
          break;
        case 'email':
          sendEmailAlert(alert);
          break;
        case 'webhook':
          sendWebhookAlert(alert);
          break;
        case 'slack':
          sendSlackAlert(alert);
          break;
        case 'wechat':
          sendWechatAlert(alert);
          break;
        default:
          // 未知渠道，仅记录到控制台
          console.warn(`[LOG ALERT] Unknown alert channel: ${channel}`);
          sendConsoleAlert(alert);
      }
    } catch (error) {
      console.error(`[LOG ALERT] Failed to send alert to ${channel}:`, error);
    }
  }
}

/**
 * 发送控制台告警
 * @param {Object} alert - 告警信息
 */
function sendConsoleAlert(alert) {
  const levelEmoji =
    {
      critical: '🚨',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    }[alert.level] || '📢';

  console.error(`
${levelEmoji} [LOG ALERT] ${alert.level.toUpperCase()}
${'='.repeat(50)}
时间: ${new Date(alert.timestamp).toLocaleString('zh-CN')}
类型: ${alert.type}
消息: ${alert.message}
错误数量: ${alert.errorCount || '-'}
详情: ${JSON.stringify(alert, null, 2)}
${'='.repeat(50)}
  `);
}

/**
 * 发送邮件告警
 * @param {Object} alert - 告警信息
 */
async function sendEmailAlert(alert) {
  if (!AlertConfig.email.enabled) {
    return;
  }

  if (!AlertConfig.email.smtp.host || !AlertConfig.email.smtp.auth.user) {
    console.warn('[LOG ALERT] Email alert not configured, skipping');
    return;
  }

  // 邮件告警逻辑（需要实际安装nodemailer库）
  try {
    // 这里只是占位符，实际使用需要安装nodemailer
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport(AlertConfig.email.smtp);
    // await transporter.sendMail({
    //   from: AlertConfig.email.from,
    //   to: AlertConfig.email.to,
    //   subject: `${AlertConfig.email.subjectPrefix} ${alert.level.toUpperCase()}: ${alert.type}`,
    //   text: `时间: ${new Date(alert.timestamp).toLocaleString('zh-CN')}\n\n消息: ${alert.message}\n\n详情: ${JSON.stringify(alert, null, 2)}`,
    //   html: `<h3>🚨 FarmGame Alert: ${alert.type}</h3>
    //   <p><strong>级别:</strong> ${alert.level}</p>
    //   <p><strong>时间:</strong> ${new Date(alert.timestamp).toLocaleString('zh-CN')}</p>
    //   <p><strong>消息:</strong> ${alert.message}</p>
    //   <pre>${JSON.stringify(alert, null, 2)}</pre>`
    // });

    console.warn(
      '[LOG ALERT] Email alert is placeholder, install nodemailer to use'
    );
  } catch (error) {
    console.error('[LOG ALERT] Failed to send email alert:', error);
  }
}

/**
 * 发送Webhook告警（通用）
 * @param {Object} alert - 告警信息
 */
async function sendWebhookAlert(alert) {
  if (!AlertConfig.webhook.enabled || !AlertConfig.webhook.url) {
    return;
  }

  try {
    // 这里只是占位符，实际使用需要发送HTTP请求
    // const axios = require('axios');
    // await axios.post(AlertConfig.webhook.url, alert, {
    //   timeout: AlertConfig.webhook.timeout,
    //   headers: { 'Content-Type': 'application/json' }
    // });

    console.warn(
      '[LOG ALERT] Webhook alert is placeholder, install axios to use'
    );
  } catch (error) {
    console.error('[LOG ALERT] Failed to send webhook alert:', error);
  }
}

/**
 * 发送Slack告警
 * @param {Object} alert - 告警信息
 */
async function sendSlackAlert(alert) {
  // Slack告警的特定格式化
  const slackAlert = {
    ...alert,
    slackFormat: {
      attachments: [
        {
          color:
            alert.level === 'critical'
              ? '#FF0000'
              : alert.level === 'error'
                ? '#FF6B6B'
                : '#FFA500',
          title: `🚨 FarmGame Alert: ${alert.type}`,
          fields: [
            { title: 'Level', value: alert.level, short: true },
            {
              title: 'Time',
              value: new Date(alert.timestamp).toLocaleString('zh-CN'),
              short: true,
            },
            { title: 'Message', value: alert.message, short: false },
          ],
        },
      ],
    },
  };

  // 复用webhook发送
  return sendWebhookAlert(slackAlert);
}

/**
 * 发送企业微信告警
 * @param {Object} alert - 告警信息
 */
async function sendWechatAlert(alert) {
  // 企业微信告警的特定格式化
  const wechatAlert = {
    ...alert,
    wechatFormat: {
      msgtype: 'markdown',
      markdown: {
        content: `## 🚨 FarmGame Alert\n**级别:** ${alert.level}\n**类型:** ${alert.type}\n**时间:** ${new Date(alert.timestamp).toLocaleString('zh-CN')}\n**消息:** ${alert.message}`,
      },
    },
  };

  // 复用webhook发送
  return sendWebhookAlert(wechatAlert);
}

// ==================== 日志格式化器 ====================

// 控制台输出格式化器（带颜色和时间戳）
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let logMeta = '';

    if (metadata && Object.keys(metadata).length > 0) {
      // 处理错误信息
      if (metadata.error) {
        const errorInfo = formatError(metadata.error);
        logMeta = `\n  📝 错误信息: ${errorInfo.message}\n  🔍 原因解释: ${errorInfo.explanation}\n  ⚠️  可能原因: ${errorInfo.possibleCauses.join('; ')}\n  ✅ 解决方案: ${errorInfo.solution}`;
      } else {
        // 处理其他元数据
        const safeMeta = { ...metadata };
        delete safeMeta.logType;
        delete safeMeta.module;
        if (Object.keys(safeMeta).length > 0) {
          logMeta = ` | ${JSON.stringify(safeMeta)}`;
        }
      }
    }

    // 添加模块信息
    const moduleInfo = metadata.module ? `[${metadata.module}] ` : '';

    // 添加状态图标
    let statusIcon = '';
    switch (level) {
      case 'error':
        statusIcon = '❌ ';
        break;
      case 'warn':
        statusIcon = '⚠️ ';
        break;
      case 'info':
        statusIcon = '✅ ';
        break;
      case 'debug':
        statusIcon = '🔧 ';
        break;
    }

    return `[${timestamp}] [${level}] ${statusIcon}${moduleInfo}${message}${logMeta}`;
  })
);

// 文件输出格式化器（JSON格式，带完整信息）
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const logData = {
      timestamp,
      level,
      message,
      status: level === 'error' ? '异常' : level === 'warn' ? '注意' : '正常',
      logType: metadata.logType || LogTypes.SYSTEM,
      module: metadata.module || Modules.SERVER,
      operator: metadata.operator || 'system',
      requestId: metadata.requestId,
    };

    // 处理错误信息
    if (metadata && metadata.error) {
      const errorInfo = formatError(metadata.error);
      logData.error = {
        message: errorInfo.message,
        explanation: errorInfo.explanation,
        possibleCauses: errorInfo.possibleCauses,
        solution: errorInfo.solution,
      };
      if (errorInfo.stack) {
        logData.error.stack = errorInfo.stack;
      }
      delete metadata.error;
    }

    // 处理其他元数据
    if (metadata && Object.keys(metadata).length > 0) {
      const { logType, module, operator, requestId, ...otherMeta } = metadata;
      if (Object.keys(otherMeta).length > 0) {
        logData.metadata = otherMeta;
      }
    }

    return JSON.stringify(logData);
  })
);

// ==================== 日志轮转传输配置 ====================

function createRotateTransport(
  logType,
  level,
  maxSize,
  maxFiles,
  datePattern = 'YYYY-MM-DD'
) {
  return new DailyRotateFile({
    filename: path.join(logDir, `${logType}-%DATE%.log`),
    level,
    maxSize,
    maxFiles,
    tailable: true,
    zippedArchive: true,
    datePattern,
    utc: true,
    auditFile: path.join(logDir, `audit-${logType}-rotate.json`),
  });
}

// ==================== 创建日志记录器 ====================

const createLogger = () => {
  const logger = winston.createLogger({
    levels: LogLevels,
    level: logLevel,
    format: fileFormat,
    exitOnError: false,
    transports: [
      // 控制台输出
      new winston.transports.Console({
        format: consoleFormat,
      }),
      // 错误日志
      createRotateTransport('error', 'error', '5m', '30d'),
      // 系统日志
      createRotateTransport('system', 'info', '10m', '30d'),
      // 访问日志
      createRotateTransport('access', 'info', '15m', '60d'),
      // 业务日志
      createRotateTransport('business', 'info', '10m', '90d'),
      // 安全日志
      createRotateTransport('security', 'warn', '5m', '90d'),
      // 性能日志
      createRotateTransport('performance', 'info', '10m', '30d'),
      // 审计日志
      createRotateTransport('audit', 'info', '10m', '180d'),
      // 综合日志（所有级别）
      createRotateTransport('combined', 'debug', '20m', '30d'),
    ],
  });

  return logger;
};

const logger = createLogger();

// ==================== 增强的日志方法 ====================

/**
 * 创建特定类型的日志记录器
 * @param {string} logType - 日志类型
 * @param {string} module - 模块名称
 * @returns {Object} 类型化日志记录器
 */
function createTypedLogger(logType, module = Modules.SERVER) {
  return {
    debug: (message, meta = {}) => {
      if (shouldSample('debug', logType, { ...meta, message })) {
        logger.debug(message, formatMetadata({ ...meta, logType, module }));
      }
    },
    info: (message, meta = {}) => {
      if (shouldSample('info', logType, { ...meta, message })) {
        logger.info(message, formatMetadata({ ...meta, logType, module }));
      }
    },
    warn: (message, meta = {}) => {
      // 警告始终记录
      const formattedMeta = formatMetadata({ ...meta, logType, module });
      logger.warn(message, formattedMeta);
      checkAlert('warn', formattedMeta);
    },
    error: (message, meta = {}) => {
      // 错误始终记录
      const formattedMeta = formatMetadata({ ...meta, logType, module });
      logger.error(message, formattedMeta);
      checkAlert('error', formattedMeta);
    },
  };
}

// 预创建各类日志记录器
const systemLogger = createTypedLogger(LogTypes.SYSTEM, Modules.SERVER);
const errorLogger = createTypedLogger(LogTypes.ERROR, Modules.SERVER);
const accessLogger = createTypedLogger(LogTypes.ACCESS, Modules.API);
const businessLogger = createTypedLogger(LogTypes.BUSINESS, Modules.SERVER);
const securityLogger = createTypedLogger(LogTypes.SECURITY, Modules.AUTH);
const performanceLogger = createTypedLogger(
  LogTypes.PERFORMANCE,
  Modules.SERVER
);
const auditLogger = createTypedLogger(LogTypes.AUDIT, Modules.ADMIN);

// ==================== 便捷方法 ====================

/**
 * 记录访问日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {number} duration - 请求耗时
 */
function logAccess(req, res, duration) {
  accessLogger.info('API访问', {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    operator: req.user?.username || 'anonymous',
    userId: req.user?.id,
  });
}

/**
 * 记录业务操作
 * @param {string} action - 操作类型
 * @param {Object} data - 操作数据
 * @param {Object} user - 操作用户
 */
function logBusiness(action, data = {}, user = {}) {
  businessLogger.info('业务操作', {
    action,
    data,
    operator: user.username || 'system',
    userId: user.id,
  });
}

/**
 * 记录安全事件
 * @param {string} event - 安全事件
 * @param {Object} data - 事件数据
 */
function logSecurity(event, data = {}) {
  securityLogger.warn('安全事件', {
    event,
    ...data,
  });
}

/**
 * 记录性能数据
 * @param {string} label - 性能标签
 * @param {number} duration - 耗时
 * @param {Object} meta - 其他元数据
 */
function logPerformance(label, duration, meta = {}) {
  performanceLogger.info('性能数据', {
    label,
    duration: `${duration}ms`,
    ...meta,
  });
}

/**
 * 记录审计操作
 * @param {Object} auditData - 审计数据
 */
function logAudit(auditData) {
  auditLogger.info('审计操作', auditData);
}

// ==================== 归档管理 ====================

const ArchiveManager = {
  /**
   * 归档旧日志
   * @param {number} days - 归档多少天前的日志
   */
  async archiveOldLogs(days = 7) {
    systemLogger.info('开始归档旧日志', { days });
    // 归档逻辑可通过 winston-daily-rotate-file 自动处理
    systemLogger.info('旧日志归档完成');
  },

  /**
   * 清理过期日志
   * @param {number} days - 保留多少天的日志
   */
  async cleanOldLogs(days = 90) {
    systemLogger.info('开始清理过期日志', { days });
    // 清理逻辑可通过 winston-daily-rotate-file 的 maxFiles 配置处理
    systemLogger.info('过期日志清理完成');
  },
};

// ==================== 导出 ====================

// 默认导出（主日志记录器）
module.exports = logger;

// 命名导出（为了向后兼容和更灵活的使用）
module.exports.logger = logger;
module.exports.systemLogger = systemLogger;
module.exports.errorLogger = errorLogger;
module.exports.accessLogger = accessLogger;
module.exports.businessLogger = businessLogger;
module.exports.securityLogger = securityLogger;
module.exports.performanceLogger = performanceLogger;
module.exports.auditLogger = auditLogger;
module.exports.createTypedLogger = createTypedLogger;
module.exports.logAccess = logAccess;
module.exports.logBusiness = logBusiness;
module.exports.logSecurity = logSecurity;
module.exports.logPerformance = logPerformance;
module.exports.logAudit = logAudit;
module.exports.LogTypes = LogTypes;
module.exports.LogLevels = LogLevels;
module.exports.Modules = Modules;
module.exports.logAlertEmitter = logAlertEmitter;
module.exports.AlertConfig = AlertConfig;
module.exports.ArchiveManager = ArchiveManager;
module.exports.generateRequestId = generateRequestId;
module.exports.formatMetadata = formatMetadata;
module.exports.shouldSample = shouldSample;
module.exports.getSamplingStats = getSamplingStats;
module.exports.maskSensitiveInfo = maskSensitiveInfo;
module.exports.deepMaskSensitiveData = deepMaskSensitiveData;
module.exports.SamplingConfig = SamplingConfig;
