/**
 * 文件名：csrfMiddleware.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v2.0.0
 * 功能描述：CSRF防护中间件，使用原生crypto实现，替代已弃用的csurf库
 * 更新记录：
 *   2026-03-18 - v1.0.0 - 初始版本，使用csurf库
 *   2026-06-06 - v2.0.0 - 迁移弃用的csurf库，改用原生crypto实现CSRF防护
 */

const crypto = require('crypto');
const logger = require('../config/logger');

// CSRF Token 有效期（24小时）
const CSRF_TOKEN_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * 生成 CSRF Token
 * @returns {string} Base64编码的随机Token
 */
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};

/**
 * 生成签名（防止Token被篡改）
 * @param {string} token - CSRF Token
 * @returns {string} HMAC签名
 */
const signToken = (token) => {
  const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CSRF签名密钥未配置，请设置CSRF_SECRET或JWT_SECRET环境变量');
  }
  return crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('base64url');
};

/**
 * 验证签名
 * @param {string} token - CSRF Token
 * @param {string} signature - HMAC签名
 * @returns {boolean} 签名是否有效
 */
const verifyTokenSignature = (token, signature) => {
  const expected = signToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
};

/**
 * CSRF防护中间件
 * 验证请求头中的 X-CSRF-Token 与 Cookie 中的 csrf_token 是否一致
 */
const csrfProtection = (req, res, next) => {
  // 跳过安全请求方法（GET/HEAD/OPTIONS）
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    // 从 Cookie 中获取 CSRF Token
    const cookieToken = req.cookies?.csrf_token;
    // 从请求头中获取 CSRF Token
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken) {
      logger.warn('CSRF防护：缺少Token', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });
      return res.status(403).json({ message: 'CSRF令牌缺失' });
    }

    // 解析 Cookie 中的 Token 和签名
    const [token, signature] = cookieToken.split('.');
    if (!token || !signature) {
      return res.status(403).json({ message: 'CSRF令牌格式无效' });
    }

    // 验证签名，防止Token被篡改
    if (!verifyTokenSignature(token, signature)) {
      logger.warn('CSRF防护：Token签名验证失败', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });
      return res.status(403).json({ message: 'CSRF令牌无效' });
    }

    // 验证请求头中的Token与Cookie中的Token一致
    if (!crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(token)
    )) {
      logger.warn('CSRF防护：Token不匹配', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
      });
      return res.status(403).json({ message: 'CSRF令牌无效' });
    }

    next();
  } catch (err) {
    logger.error('CSRF防护：服务器错误', {
      error: err.message,
      method: req.method,
      url: req.originalUrl,
    });
    return res.status(500).json({ message: 'CSRF验证失败' });
  }
};

/**
 * 设置 CSRF Token 的中间件
 * 首次请求时生成并设置Cookie
 */
const getCsrfToken = (req, res, next) => {
  // 如果已有有效的CSRF Token，跳过
  if (req.cookies?.csrf_token) {
    // 检查Token是否过期（通过签名验证即可）
    const [token, signature] = req.cookies.csrf_token.split('.');
    if (token && signature && verifyTokenSignature(token, signature)) {
      // 设置请求头，方便前端获取
      res.setHeader('X-CSRF-Token', token);
      return next();
    }
  }

  // 生成新的CSRF Token
  const token = generateCsrfToken();
  const signature = signToken(token);
  const signedToken = `${token}.${signature}`;

  // 设置Cookie
  res.cookie('csrf_token', signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_MAX_AGE,
  });

  // 设置响应头，方便前端读取
  res.setHeader('X-CSRF-Token', token);

  next();
};

/**
 * CSRF错误处理中间件（保留原接口兼容性）
 */
const csrfErrorHandler = (err, req, res, next) => {
  // 现在由 csrfProtection 直接处理错误，此中间件作为兜底
  logger.error('CSRF处理未捕获错误', {
    error: err.message,
    method: req.method,
    url: req.originalUrl,
  });
  res.status(403).json({ message: 'CSRF令牌无效' });
};

module.exports = {
  csrfProtection,
  getCsrfToken,
  csrfErrorHandler,
};
