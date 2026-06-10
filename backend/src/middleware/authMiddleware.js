/**
 * 文件名：authMiddleware.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v1.4.0
 * 功能描述：JWT认证中间件，验证用户登录状态，集成 L1 内存缓存 + L2 Redis 缓存
 * 更新记录：
 *   2026-03-18 - v1.0.0 - JWT认证中间件，验证用户登录状态
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-05-01 - v1.2.0 - 添加Redis缓存机制，减少数据库查询
 *   2026-06-05 - v1.3.0 - 添加 L1 内存缓存层，减少 Redis 网络开销
 *   2026-06-06 - v1.4.0 - L1缓存使用lru-cache限制内存上限，防止内存泄漏
 */
// JWT认证中间件
const jwt = require('jsonwebtoken');
const { LRUCache } = require('lru-cache');
const pool = require('../config/db');
const dotenv = require('dotenv');
const logger = require('../config/logger');
const cacheService = require('../services/cacheService');

// 加载环境变量
dotenv.config({
  debug: process.env.NODE_ENV === 'development',
});

// 用户信息缓存TTL（秒）
const USER_CACHE_TTL = 3600;
// L1 内存缓存 TTL（秒），比 Redis 短以减少不一致窗口
const L1_CACHE_TTL = 60 * 1000; // 60秒，单位毫秒
// L1 缓存最大条目数，防止内存泄漏
const L1_CACHE_MAX_SIZE = 5000;

// L1 内存缓存：使用 LRU 策略存储用户信息，限制内存上限
const l1Cache = new LRUCache({
  max: L1_CACHE_MAX_SIZE,
  ttl: L1_CACHE_TTL,
  updateAgeOnGet: true,
});

/**
 * 从 L1 内存缓存获取用户信息
 * @param {number} userId - 用户ID
 * @returns {Object|null} 用户信息或 null
 */
const getL1Cache = (userId) => {
  return l1Cache.get(userId) || null;
};

/**
 * 设置 L1 内存缓存
 * @param {number} userId - 用户ID
 * @param {Object} userData - 用户信息
 */
const setL1Cache = (userId, userData) => {
  l1Cache.set(userId, userData);
};

/**
 * 清除 L1 内存缓存
 * @param {number} userId - 用户ID
 */
const clearL1Cache = (userId) => {
  l1Cache.delete(userId);
};

// 缓存用户信息
const cacheUserInfo = async (userId, userData) => {
  try {
    // 同时写入 L1 内存缓存和 L2 Redis 缓存
    setL1Cache(userId, userData);
    const cacheKey = `user:info:${userId}`;
    await cacheService.set(cacheKey, userData, USER_CACHE_TTL);
    logger.debug('用户信息已缓存', { userId });
  } catch (error) {
    logger.warn('用户信息缓存失败', { error: error.message });
  }
};

// 清除用户缓存（例如用户信息更新时调用）
const clearUserCache = async (userId) => {
  try {
    // 清除 L1 内存缓存
    clearL1Cache(userId);
    // 清除 L2 Redis 缓存
    const cacheKey = `user:info:${userId}`;
    await cacheService.del(cacheKey);
    logger.debug('用户缓存已清除', { userId });
  } catch (error) {
    logger.warn('用户缓存清除失败', { error: error.message });
  }
};

// 验证JWT令牌，保护需要登录的接口
const authMiddleware = async (req, res, next) => {
  try {
    logger.debug('JWT认证开始', { url: req.originalUrl, ip: req.ip });

    // 从请求头获取Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('JWT认证失败：缺少Token', {
        url: req.originalUrl,
        ip: req.ip,
      });
      return res.status(401).json({ message: '未授权：缺少Token' });
    }
    const token = authHeader.split(' ')[1];

    // 验证Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // B1-1修复：验证token类型，拒绝refresh_token通过认证中间件
    if (decoded.type && decoded.type !== 'access') {
      logger.warn('JWT认证失败：Token类型错误（非access_token）', {
        tokenType: decoded.type,
        url: req.originalUrl,
        ip: req.ip,
      });
      return res.status(401).json({ message: '无效Token类型：请使用访问令牌' });
    }
    logger.debug('JWT令牌验证成功', { userId: decoded.userId, ip: req.ip });

    const userId = decoded.userId;
    const cacheKey = `user:info:${userId}`;
    let user = null;

    // L1: 先尝试从内存缓存获取用户信息
    user = getL1Cache(userId);
    if (user) {
      logger.debug('用户信息从 L1 内存缓存命中', { userId });
    }

    // L2: L1 未命中，尝试从 Redis 缓存获取
    if (!user) {
      try {
        const cachedUser = await cacheService.get(cacheKey);
        if (cachedUser) {
          user = cachedUser;
          // 回填 L1 缓存
          setL1Cache(userId, user);
          logger.debug('用户信息从 Redis 缓存获取成功', { userId });
        }
      } catch (cacheError) {
        logger.warn('Redis 缓存读取失败，从数据库查询', { error: cacheError.message });
      }
    }

    // L3: 缓存未命中，从数据库查询
    if (!user) {
      const query =
        'SELECT id, username, email, phone, is_active, is_admin FROM sys_user WHERE id = $1';
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        logger.warn('JWT认证失败：用户不存在', {
          userId,
          ip: req.ip,
        });
        return res.status(401).json({ message: '用户不存在' });
      }

      user = result.rows[0];

      // 缓存用户信息到 L1 和 L2
      await cacheUserInfo(userId, user);
    }

    if (!user.is_active) {
      logger.warn('JWT认证失败：账号已被禁用', {
        userId: user.id,
        username: user.username,
        ip: req.ip,
      });
      return res.status(403).json({ message: '账号已被禁用' });
    }

    logger.debug('JWT认证成功', {
      userId: user.id,
      username: user.username,
      ip: req.ip,
    });
    req.user = user; // 挂载用户信息到请求对象
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      logger.warn('JWT认证失败：无效Token', {
        error: err.message,
        url: req.originalUrl,
        ip: req.ip,
      });
      return res.status(401).json({ message: '无效Token' });
    }
    if (err.name === 'TokenExpiredError') {
      logger.warn('JWT认证失败：Token已过期', {
        error: err.message,
        url: req.originalUrl,
        ip: req.ip,
      });
      return res.status(401).json({ message: 'Token已过期' });
    }
    logger.error('JWT认证失败：服务器错误', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      ip: req.ip,
    });
    return res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  authMiddleware,
  clearUserCache,
  cacheUserInfo,
};
