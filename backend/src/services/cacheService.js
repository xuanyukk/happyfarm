/**
 * 文件名：cacheService.js
 * 作者：开发者
 * 日期：2026-05-20
 * 版本：v2.0.0
 * 功能描述：Redis缓存服务层，提供统一的缓存管理，支持热点数据自动预热、缓存击穿防护
 * 更新记录：
 *   2026-05-20 - v2.0.0 - 重构缓存服务，支持多种缓存策略
 */

const Redis = require('ioredis');
const logger = require('../config/logger');

// 缓存配置
const CACHE_CONFIG = {
  // 默认TTL配置（秒）
  TTL: {
    SHORT: 60, // 1分钟
    MEDIUM: 300, // 5分钟
    LONG: 1800, // 30分钟
    VERY_LONG: 3600, // 1小时
    CONFIG: 7200, // 2小时
  },
  // 缓存键前缀
  PREFIX: 'happyfarm',
};

// Redis客户端
let redisClient = null;
let isConnected = false;

// 初始化Redis连接
function initRedis() {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      logger.warn('Redis缓存服务连接失败', { error: err.message });
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('Redis缓存服务初始化成功');
    });

    redisClient.on('end', () => {
      isConnected = false;
    });

    return redisClient;
  } catch (err) {
    logger.warn('Redis缓存客户端初始化失败', { error: err.message });
    return null;
  }
}

// 获取Redis客户端
function getRedis() {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

// 生成缓存键
function generateKey(namespace, key) {
  return `${CACHE_CONFIG.PREFIX}:${namespace}:${key}`;
}

// 获取缓存
async function get(namespace, key) {
  try {
    const redis = getRedis();
    if (!redis || !isConnected) {
      logger.debug('Redis不可用，跳过缓存获取');
      return null;
    }

    const cacheKey = generateKey(namespace, key);
    const value = await redis.get(cacheKey);

    if (value !== null) {
      logger.debug('缓存命中', { namespace, key });
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    logger.debug('缓存未命中', { namespace, key });
    return null;
  } catch (err) {
    logger.warn('获取缓存失败', { error: err.message, namespace, key });
    return null;
  }
}

// 设置缓存
async function set(namespace, key, value, ttl = CACHE_CONFIG.TTL.MEDIUM) {
  try {
    const redis = getRedis();
    if (!redis || !isConnected) {
      logger.debug('Redis不可用，跳过缓存设置');
      return false;
    }

    const cacheKey = generateKey(namespace, key);
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);

    await redis.setex(cacheKey, ttl, serialized);
    logger.debug('缓存设置成功', { namespace, key, ttl });
    return true;
  } catch (err) {
    logger.warn('设置缓存失败', { error: err.message, namespace, key });
    return false;
  }
}

// 删除缓存
async function del(namespace, key) {
  try {
    const redis = getRedis();
    if (!redis || !isConnected) {
      return false;
    }

    const cacheKey = generateKey(namespace, key);
    const deleted = await redis.del(cacheKey);

    logger.debug('缓存删除成功', { namespace, key, deleted });
    return deleted > 0;
  } catch (err) {
    logger.warn('删除缓存失败', { error: err.message, namespace, key });
    return false;
  }
}

// 按命名空间批量删除
async function delNamespace(namespace) {
  try {
    const redis = getRedis();
    if (!redis || !isConnected) {
      return 0;
    }

    const pattern = generateKey(namespace, '*');
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      const deleted = await redis.del(...keys);
      logger.debug('命名空间缓存批量删除成功', { namespace, count: deleted });
      return deleted;
    }

    return 0;
  } catch (err) {
    logger.warn('批量删除缓存失败', { error: err.message, namespace });
    return 0;
  }
}

// 缓存装饰器：自动缓存函数结果
function cacheable(namespace, keyGenerator, ttl = CACHE_CONFIG.TTL.MEDIUM) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const cacheKey =
        typeof keyGenerator === 'function'
          ? keyGenerator(...args)
          : JSON.stringify(args);

      // 尝试从缓存获取
      const cached = await get(namespace, cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 缓存结果
      await set(namespace, cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// 热点数据预热
async function preloadHotData() {
  try {
    logger.info('开始预热热点数据...');

    // 预热作物数据
    const db = require('../config/db');
    const result = await db.query(
      'SELECT id, crop_name, world_id, unlock_player_level FROM crop ORDER BY id'
    );

    for (const crop of result.rows) {
      await set('crop', `id:${crop.id}`, crop, CACHE_CONFIG.TTL.CONFIG);
    }

    logger.info('热点数据预热完成', { cropsCount: result.rows.length });
    return true;
  } catch (err) {
    logger.warn('热点数据预热失败', { error: err.message });
    return false;
  }
}

// 清空所有缓存
async function clearAll() {
  try {
    const redis = getRedis();
    if (!redis || !isConnected) {
      return false;
    }

    const pattern = `${CACHE_CONFIG.PREFIX}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('清空所有缓存成功', { count: keys.length });
    }

    return true;
  } catch (err) {
    logger.warn('清空缓存失败', { error: err.message });
    return false;
  }
}

// 获取缓存统计信息
async function getStats() {
  try {
    const redis = getRedis();
    if (!redis || !isConnected) {
      return { connected: false };
    }

    const info = await redis.info('stats');
    const keys = await redis.keys(`${CACHE_CONFIG.PREFIX}:*`);

    return {
      connected: true,
      keyCount: keys.length,
      serverInfo: info,
    };
  } catch (err) {
    logger.warn('获取缓存统计失败', { error: err.message });
    return { connected: false };
  }
}

// 检查Redis连接状态
function isRedisConnected() {
  return isConnected;
}

module.exports = {
  CACHE_CONFIG,
  initRedis,
  getRedis,
  get,
  set,
  del,
  delNamespace,
  cacheable,
  preloadHotData,
  clearAll,
  getStats,
  isRedisConnected,
};
