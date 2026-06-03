/**
 * 文件名：backend/src/config/index.js
 * 作者：AI助手
 * 日期：2026-04-26
 * 版本：v2.0.0
 * 功能描述：集中配置管理
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 创建集中配置管理
 */

const dotenv = require('dotenv');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3001,
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
      connectionTimeout:
        parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 2000,
      statementTimeout:
        parseInt(process.env.DB_POOL_STATEMENT_TIMEOUT) || 30000,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiry: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL,
    enabled: process.env.REDIS_ENABLED === 'true',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
  security: {
    twoFactorEnabled: process.env.TWO_FACTOR_ENABLED === 'true',
    csrfEnabled: process.env.CSRF_ENABLED === 'true',
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    interval: process.env.BACKUP_INTERVAL || '0 2 * * *',
    directory: process.env.BACKUP_DIRECTORY || './backups',
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    interval: parseInt(process.env.MONITORING_INTERVAL) || 60000,
  },
};

const validateConfig = () => {
  // 测试环境下跳过强制环境变量检查
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`缺少必需的环境变量: ${missing.join(', ')}`);
  }
};

module.exports = {
  config,
  validateConfig,
};
