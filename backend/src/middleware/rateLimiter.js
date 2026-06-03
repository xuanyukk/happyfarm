/**
 * 文件名：rateLimiter.js
 * 作者：开发者
 * 日期：2026-05-20
 * 版本：v1.0.0
 * 功能描述：API接口限流中间件，支持IP和用户维度的灵活限流
 * 更新记录：
 *   2026-05-20 - v1.0.0 - 初始版本创建，实现IP和用户级别限流
 */

const {
  RateLimiterRedis,
  RateLimiterMemory,
} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const logger = require('../config/logger');

// Redis客户端配置
let rateLimiterRedis = null;
let rateLimiterMemory = null;

// 初始化限流器
function initRateLimiter() {
  try {
    // 尝试使用Redis
    const redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      enableReadyCheck: true,
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis连接失败，降级到内存限流器', { error: err.message });
      initMemoryLimiter();
    });

    redisClient.on('ready', () => {
      logger.info('Redis限流器初始化成功');
    });

    // IP维度限流：每分钟60次请求
    rateLimiterRedis = {
      ip: new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rate-limit:ip',
        points: parseInt(process.env.RATE_LIMIT_IP_POINTS) || 60, // 60次
        duration: parseInt(process.env.RATE_LIMIT_IP_DURATION) || 60, // 60秒
        blockDuration: parseInt(process.env.RATE_LIMIT_IP_BLOCK) || 60, // 超过后封禁60秒
      }),
      // 用户维度限流：每分钟120次请求
      user: new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rate-limit:user',
        points: parseInt(process.env.RATE_LIMIT_USER_POINTS) || 120, // 120次
        duration: parseInt(process.env.RATE_LIMIT_USER_DURATION) || 60, // 60秒
        blockDuration: parseInt(process.env.RATE_LIMIT_USER_BLOCK) || 300, // 超过后封禁5分钟
      }),
    };

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
const softRateLimiterMiddleware = async (req, res, next) => {
  try {
    const limiter = getRateLimiter();
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    // 公共接口：IP限制翻倍
    const ipLimiter = rateLimiterRedis
      ? new RateLimiterRedis({
          storeClient: rateLimiterRedis.ip.storeClient,
          keyPrefix: 'rate-limit:soft-ip',
          points: (parseInt(process.env.RATE_LIMIT_IP_POINTS) || 60) * 2,
          duration: parseInt(process.env.RATE_LIMIT_IP_DURATION) || 60,
        })
      : new RateLimiterMemory({
          keyPrefix: 'rate-limit:soft-ip',
          points: (parseInt(process.env.RATE_LIMIT_IP_POINTS) || 60) * 2,
          duration: parseInt(process.env.RATE_LIMIT_IP_DURATION) || 60,
        });

    await ipLimiter.consume(ip);
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

module.exports = {
  rateLimiterMiddleware,
  softRateLimiterMiddleware,
  initRateLimiter,
};
