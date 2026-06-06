/**
 * 文件名：rateLimiter.js
 * 作者：开发者
 * 日期：2026-05-20
 * 版本：v1.2.0
 * 功能描述：API接口限流中间件，支持IP和用户维度的灵活限流
 * 更新记录：
 *   2026-05-20 - v1.0.0 - 初始版本创建，实现IP和用户级别限流
 *   2026-06-06 - v1.1.0 - 修复softRateLimiterMiddleware每次请求创建新实例
 *              导致内存/连接泄漏的问题，改为模块级单例复用
 *   2026-06-06 - v1.2.0 - 添加closeRateLimiter()优雅关闭Redis客户端连接
 */

const {
  RateLimiterRedis,
  RateLimiterMemory,
} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const logger = require('../config/logger');

// Redis客户端与限流器实例（模块级单例，避免重复创建）
let redisClient = null;
let rateLimiterRedis = null;
let rateLimiterMemory = null;

// 宽松限流器实例（模块级单例）
let softRateLimiter = null;

/**
 * 初始化限流器（异步等待Redis就绪后决定使用哪种限流器）
 * @returns {Promise<Object>} 限流器实例
 */
async function initRateLimiter() {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    // 等待Redis连接就绪
    await redisClient.connect();
    logger.info('Redis限流器初始化成功');

    // IP维度限流：每分钟60次请求
    const ipLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate-limit:ip',
      points: parseInt(process.env.RATE_LIMIT_IP_POINTS) || 60,
      duration: parseInt(process.env.RATE_LIMIT_IP_DURATION) || 60,
      blockDuration: parseInt(process.env.RATE_LIMIT_IP_BLOCK) || 60,
    });

    // 用户维度限流：每分钟120次请求
    const userLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate-limit:user',
      points: parseInt(process.env.RATE_LIMIT_USER_POINTS) || 120,
      duration: parseInt(process.env.RATE_LIMIT_USER_DURATION) || 60,
      blockDuration: parseInt(process.env.RATE_LIMIT_USER_BLOCK) || 300,
    });

    rateLimiterRedis = { ip: ipLimiter, user: userLimiter };

    // 创建宽松限流器（公共接口用，模块级单例）
    softRateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rate-limit:soft-ip',
      points: (parseInt(process.env.RATE_LIMIT_IP_POINTS) || 60) * 2,
      duration: parseInt(process.env.RATE_LIMIT_IP_DURATION) || 60,
    });

    return rateLimiterRedis;
  } catch (err) {
    logger.warn('Redis限流器初始化失败，使用内存限流器', {
      error: err.message,
    });
    return initMemoryLimiter();
  }
}

// 内存降级限流器
function initMemoryLimiter() {
  rateLimiterMemory = {
    ip: new RateLimiterMemory({
      keyPrefix: 'rate-limit:ip',
      points: parseInt(process.env.RATE_LIMIT_IP_POINTS) || 60,
      duration: parseInt(process.env.RATE_LIMIT_IP_DURATION) || 60,
    }),
    user: new RateLimiterMemory({
      keyPrefix: 'rate-limit:user',
      points: parseInt(process.env.RATE_LIMIT_USER_POINTS) || 120,
      duration: parseInt(process.env.RATE_LIMIT_USER_DURATION) || 60,
    }),
  };

  // 创建宽松限流器（内存版，模块级单例）
  softRateLimiter = new RateLimiterMemory({
    keyPrefix: 'rate-limit:soft-ip',
    points: (parseInt(process.env.RATE_LIMIT_IP_POINTS) || 60) * 2,
    duration: parseInt(process.env.RATE_LIMIT_IP_DURATION) || 60,
  });

  logger.info('内存限流器初始化成功');
  return rateLimiterMemory;
}

// 获取当前限流器
function getRateLimiter() {
  if (rateLimiterRedis) return rateLimiterRedis;
  if (rateLimiterMemory) return rateLimiterMemory;
  return initRateLimiter();
}

// 限流中间件
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const limiter = getRateLimiter();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // IP限流
    await limiter.ip.consume(ip);

    // 如果用户已登录，额外做用户级别限流
    if (req.user && req.user.id) {
      await limiter.user.consume(req.user.id.toString());
    }

    next();
  } catch (err) {
    // 触发限流
    logger.warn('接口请求限流', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      code: 429,
      message: '请求过于频繁，请稍后再试',
      retryAfter: err.msBeforeNext ? Math.ceil(err.msBeforeNext / 1000) : 60,
    });
  }
};

// 宽松限流中间件（用于公共接口，如登录、注册）
// 使用模块级单例，避免每次请求创建新实例导致内存/连接泄漏
const softRateLimiterMiddleware = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // 确保限流器已初始化
    if (!softRateLimiter) {
      await initRateLimiter();
    }

    await softRateLimiter.consume(ip);
    next();
  } catch (err) {
    logger.warn('公共接口限流', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      code: 429,
      message: '请求过于频繁，请稍后再试',
      retryAfter: err.msBeforeNext ? Math.ceil(err.msBeforeNext / 1000) : 60,
    });
  }
};

/**
 * 优雅关闭限流器，释放 Redis 客户端连接
 * @returns {Promise<void>}
 */
const closeRateLimiter = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis限流器客户端已优雅关闭');
    } catch (err) {
      logger.warn('Redis限流器客户端关闭失败', { error: err.message });
      // 强制断开连接
      redisClient.disconnect();
    }
    redisClient = null;
    rateLimiterRedis = null;
  }
  softRateLimiter = null;
  rateLimiterMemory = null;
};

module.exports = {
  rateLimiterMiddleware,
  softRateLimiterMiddleware,
  initRateLimiter,
  closeRateLimiter,
};
