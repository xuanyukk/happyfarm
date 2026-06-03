/**
 * 文件名：authMiddleware.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v1.2.0
 * 功能描述：JWT认证中间件，验证用户登录状态，集成Redis缓存
 * 更新记录：
 *   2026-03-18 - v1.0.0 - JWT认证中间件，验证用户登录状态
 *   2026-03-22 - v1.1.0 - 统一文件头注释格式
 *   2026-05-01 - v1.2.0 - 添加Redis缓存机制，减少数据库查询
 */
// JWT认证中间件
const jwt = require('jsonwebtoken');
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

// 缓存用户信息
const cacheUserInfo = async (userId, userData) => {
  try {
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
    logger.debug('JWT令牌验证成功', { userId: decoded.userId, ip: req.ip });

    const userId = decoded.userId;
    const cacheKey = `user:info:${userId}`;
    let user = null;

    // 先尝试从缓存获取用户信息
    try {
      const cachedUser = await cacheService.get(cacheKey);
      if (cachedUser) {
        user = cachedUser;
        logger.debug('用户信息从缓存获取成功', { userId });
      }
    } catch (cacheError) {
      logger.warn('缓存读取失败，从数据库查询', { error: cacheError.message });
    }

    // 缓存未命中，从数据库查询
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

      // 缓存用户信息
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
