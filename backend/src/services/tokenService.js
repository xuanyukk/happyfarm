/**
 * 文件名：tokenService.js
 * 作者：开发者
 * 日期：2026-05-20
 * 版本：v1.0.0
 * 功能描述：JWT令牌管理服务，支持access_token和refresh_token双机制
 * 更新记录：
 *   2026-05-20 - v1.0.0 - 初始版本创建，实现令牌生成、刷新、验证
 */

const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const logger = require('../config/logger');

// JWT配置
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  'happy-farm-access-secret-key-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  'happy-farm-refresh-secret-key-change-in-production';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m'; // 15分钟
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d'; // 7天

// Redis客户端
let redisClient = null;

// 初始化Redis连接
function initRedis() {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      enableReadyCheck: true,
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis连接失败，令牌黑名单功能受限', { error: err.message });
    });

    redisClient.on('ready', () => {
      logger.info('Redis令牌服务初始化成功');
    });

    return redisClient;
  } catch (err) {
    logger.warn('Redis客户端初始化失败', { error: err.message });
    return null;
  }
}

// 生成access_token
function generateAccessToken(payload) {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
    },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES }
  );
}

// 生成refresh_token
function generateRefreshToken(payload) {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES }
  );
}

// 生成完整的令牌对
function generateTokenPair(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: jwt.decode(accessToken).exp - Math.floor(Date.now() / 1000),
  };
}

// 验证access_token
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (err) {
    logger.debug('Access token验证失败', { error: err.message });
    throw err;
  }
}

// 验证refresh_token
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    logger.debug('Refresh token验证失败', { error: err.message });
    throw err;
  }
}

// 将令牌加入黑名单
async function addToBlacklist(token, type = 'access') {
  try {
    const redis = initRedis();
    if (!redis) {
      logger.warn('Redis不可用，跳过黑名单操作');
      return false;
    }

    const decoded = jwt.decode(token);
    if (!decoded) return false;

    // 计算剩余过期时间
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn <= 0) return true; // 已过期

    const key = `token:blacklist:${type}:${decoded.jti || token.substring(0, 32)}`;
    await redis.setex(key, expiresIn, '1');

    logger.debug('令牌加入黑名单', { type, userId: decoded.id });
    return true;
  } catch (err) {
    logger.warn('令牌黑名单操作失败', { error: err.message });
    return false;
  }
}

// 检查令牌是否在黑名单
async function isBlacklisted(token, type = 'access') {
  try {
    const redis = initRedis();
    if (!redis) return false; // Redis不可用时放行

    const decoded = jwt.decode(token);
    if (!decoded) return false;

    const key = `token:blacklist:${type}:${decoded.jti || token.substring(0, 32)}`;
    const result = await redis.get(key);
    return result === '1';
  } catch (err) {
    logger.warn('检查令牌黑名单失败', { error: err.message });
    return false;
  }
}

// 刷新令牌
async function refreshTokens(refreshToken) {
  try {
    // 验证refresh_token
    const decoded = verifyRefreshToken(refreshToken);

    // 检查是否在黑名单
    const blacklisted = await isBlacklisted(refreshToken, 'refresh');
    if (blacklisted) {
      throw new Error('Refresh token已失效');
    }

    // 将旧的refresh_token加入黑名单
    await addToBlacklist(refreshToken, 'refresh');

    // 生成新的令牌对
    return generateTokenPair({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    });
  } catch (err) {
    logger.warn('刷新令牌失败', { error: err.message });
    throw err;
  }
}

// 用户登出，注销所有令牌
async function logout(userId, accessToken, refreshToken) {
  try {
    // 将两个令牌都加入黑名单
    await Promise.all([
      addToBlacklist(accessToken, 'access'),
      refreshToken
        ? addToBlacklist(refreshToken, 'refresh')
        : Promise.resolve(),
    ]);

    logger.info('用户登出成功', { userId });
    return true;
  } catch (err) {
    logger.warn('用户登出操作失败', { error: err.message });
    return false;
  }
}

module.exports = {
  generateTokenPair,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokens,
  addToBlacklist,
  isBlacklisted,
  logout,
};
