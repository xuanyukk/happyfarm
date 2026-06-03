/**
 * 文件名：redis.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v1.1.0
 * 功能描述：Redis配置和连接管理
 * 更新记录：
 *   2026-03-18 - v1.0.0 - Redis配置和连接管理
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 */

const Redis = require('ioredis');
const logger = require('./logger');
require('dotenv').config();

const redisEnabled = process.env.REDIS_ENABLED === 'true';

let redisClient = null;

const createRedisClient = () => {
  if (!redisEnabled) {
    logger.info('Redis未启用，使用内存缓存');
    return null;
  }

  try {
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    client.on('connect', () => {
      logger.info('Redis连接成功');
    });

    client.on('error', (err) => {
      logger.error('Redis连接错误', { error: err.message });
    });

    client.on('close', () => {
      logger.warn('Redis连接已关闭');
    });

    return client;
  } catch (error) {
    logger.error('Redis客户端创建失败', { error: error.message });
    return null;
  }
};

redisClient = createRedisClient();

module.exports = redisClient;
