// 文件名：csrfMiddleware.js
// 作者：开发者
// 日期：2026-03-18
// 版本：v1.0.0
// 功能描述：CSRF防护中间件

const csrf = require('csurf');
const logger = require('../config/logger');

// CSRF防护配置
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24小时
  },
});

// 获取CSRF Token的中间件
const getCsrfToken = (req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });
  next();
};

// CSRF错误处理
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  logger.warn('CSRF令牌验证失败', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(403).json({ message: 'CSRF令牌无效' });
};

module.exports = {
  csrfProtection,
  getCsrfToken,
  csrfErrorHandler,
};
