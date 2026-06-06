/**
 * 文件名：distributedLock.js
 * 作者：开发者
 * 日期：2026-06-06
 * 版本：v1.0.0
 * 功能描述：基于 Redis 的分布式锁工具，使用 SET NX + Lua 脚本实现安全的锁获取和释放
 * 更新记录：
 *   2026-06-06 - v1.0.0 - 初始版本，实现 Redis 分布式锁
 */

const Redis = require('ioredis');
const logger = require('../config/logger');

// 默认锁配置
const DEFAULT_CONFIG = {
  // 默认锁超时时间（秒），防止死锁
  ttlSeconds: 30,
  // 获取锁失败时的重试间隔（毫秒）
  retryDelayMs: 100,
  // 最大重试次数
  maxRetries: 10,
};

// Redis 客户端（复用现有连接）
let redisClient = null;

/**
 * 初始化分布式锁的 Redis 连接
 * @param {Redis} client - ioredis 客户端实例
 */
const initLock = (client) => {
  redisClient = client;
};

/**
 * 获取 Redis 客户端
 * @returns {Redis|null}
 */
const getRedis = () => {
  if (redisClient) return redisClient;
  // 尝试从缓存服务获取
  try {
    const cacheService = require('./cacheService');
    redisClient = cacheService.getRedis();
    return redisClient;
  } catch {
    return null;
  }
};

/**
 * 释放锁的 Lua 脚本（原子操作：仅当 token 匹配时才删除）
 */
const UNLOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/**
 * 获取分布式锁
 * @param {string} resourceKey - 锁的资源标识（如 "land:unlock:player123"）
 * @param {Object} options - 可选配置
 * @param {number} options.ttlSeconds - 锁超时时间（秒），默认 30
 * @param {number} options.retryDelayMs - 重试间隔（毫秒），默认 100
 * @param {number} options.maxRetries - 最大重试次数，默认 10
 * @returns {Promise<string|null>} 锁令牌（用于释放锁），获取失败返回 null
 */
const acquireLock = async (resourceKey, options = {}) => {
  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis 不可用，跳过分布式锁获取', { resourceKey });
    return null;
  }

  const config = { ...DEFAULT_CONFIG, ...options };
  const lockKey = `lock:${resourceKey}`;
  // 使用随机令牌，确保只有持有者能释放锁
  const token = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    // SET NX EX：仅在键不存在时设置，并设置过期时间
    const result = await redis.set(lockKey, token, 'NX', 'EX', config.ttlSeconds);

    if (result === 'OK') {
      logger.debug('分布式锁获取成功', { resourceKey, attempt });
      return token;
    }

    // 等待后重试
    if (attempt < config.maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, config.retryDelayMs));
    }
  }

  logger.warn('分布式锁获取失败（超过最大重试次数）', {
    resourceKey,
    maxRetries: config.maxRetries,
  });
  return null;
};

/**
 * 释放分布式锁（原子操作）
 * @param {string} resourceKey - 锁的资源标识
 * @param {string} token - 获取锁时返回的令牌
 * @returns {Promise<boolean>} 是否成功释放
 */
const releaseLock = async (resourceKey, token) => {
  if (!token) return false;

  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis 不可用，跳过分布式锁释放', { resourceKey });
    return false;
  }

  const lockKey = `lock:${resourceKey}`;

  try {
    // 使用 Lua 脚本确保原子性：仅当 token 匹配时才删除
    const result = await redis.eval(UNLOCK_SCRIPT, 1, lockKey, token);
    const released = result === 1;

    if (released) {
      logger.debug('分布式锁释放成功', { resourceKey });
    } else {
      logger.debug('分布式锁释放失败（令牌不匹配或已过期）', { resourceKey });
    }

    return released;
  } catch (err) {
    logger.error('分布式锁释放异常', {
      resourceKey,
      error: err.message,
    });
    return false;
  }
};

/**
 * 使用分布式锁执行操作（自动获取和释放）
 * @param {string} resourceKey - 锁的资源标识
 * @param {Function} fn - 要执行的操作函数
 * @param {Object} options - 锁配置选项
 * @returns {Promise<any>} 操作函数的返回值
 * @throws {Error} 获取锁失败或操作执行失败时抛出异常
 */
const withLock = async (resourceKey, fn, options = {}) => {
  const token = await acquireLock(resourceKey, options);

  if (!token) {
    throw new Error(`获取分布式锁失败: ${resourceKey}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(resourceKey, token);
  }
};

module.exports = {
  initLock,
  acquireLock,
  releaseLock,
  withLock,
};