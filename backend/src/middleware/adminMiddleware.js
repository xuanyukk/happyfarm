/**
 * 文件名：adminMiddleware.js
 * 作者：SOLO
 * 日期：2026-06-03
 * 版本：v1.0.0
 * 功能描述：管理员权限验证中间件，验证当前用户是否为管理员
 */

const logger = require('../config/logger');

/**
 * 管理员权限中间件
 * 检查 req.user 是否存在且 is_admin 为 true
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - 下一个中间件
 */
exports.adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      logger.warn('adminMiddleware: 未认证用户尝试访问管理接口', {
        ip: req.ip,
        url: req.originalUrl,
      });
      return res.status(401).json({ success: false, message: '未认证，请先登录' });
    }

    if (!req.user.is_admin) {
      logger.warn('adminMiddleware: 非管理员用户尝试访问管理接口', {
        userId: req.user.id,
        username: req.user.username,
        ip: req.ip,
        url: req.originalUrl,
      });
      return res.status(403).json({ success: false, message: '权限不足，需要管理员权限' });
    }

    next();
  } catch (error) {
    logger.error('adminMiddleware: 权限验证异常', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip,
    });
    res.status(500).json({ success: false, message: '权限验证失败' });
  }
};
