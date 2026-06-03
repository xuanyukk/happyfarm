/**
 * 文件名：permissionMiddleware.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：RBAC权限验证中间件，检查用户是否拥有指定权限
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

const rbacService = require('../services/rbacService');
const logger = require('../config/logger');

/**
 * 检查用户是否拥有指定权限
 * @param {string} permissionCode - 权限代码
 * @returns {Function} 中间件函数
 */
exports.checkPermission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: '未认证' });
      }

      // 超级管理员拥有所有权限
      if (req.user.is_admin) {
        logger.debug('超级管理员跳过权限检查', {
          userId: req.user.id,
          username: req.user.username,
          permission: permissionCode,
          ip: req.ip,
        });
        return next();
      }

      // 检查用户权限
      const hasPermission = await rbacService.checkUserPermission(
        req.user.id,
        permissionCode
      );

      if (!hasPermission) {
        logger.warn('用户权限不足', {
          userId: req.user.id,
          username: req.user.username,
          permission: permissionCode,
          url: req.originalUrl,
          ip: req.ip,
        });
        return res.status(403).json({
          success: false,
          message: `缺少权限: ${permissionCode}`,
        });
      }

      logger.debug('权限验证通过', {
        userId: req.user.id,
        username: req.user.username,
        permission: permissionCode,
        ip: req.ip,
      });

      next();
    } catch (error) {
      logger.error('权限验证失败', {
        error: error.message,
        userId: req.user?.id,
        permission: permissionCode,
        ip: req.ip,
      });
      res.status(500).json({ success: false, message: '权限验证失败' });
    }
  };
};

/**
 * 检查用户是否拥有任一权限
 * @param {Array<string>} permissionCodes - 权限代码列表
 * @returns {Function} 中间件函数
 */
exports.checkAnyPermission = (permissionCodes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: '未认证' });
      }

      // 超级管理员拥有所有权限
      if (req.user.is_admin) {
        return next();
      }

      for (const permissionCode of permissionCodes) {
        const hasPermission = await rbacService.checkUserPermission(
          req.user.id,
          permissionCode
        );
        if (hasPermission) {
          return next();
        }
      }

      logger.warn('用户权限不足', {
        userId: req.user.id,
        username: req.user.username,
        permissions: permissionCodes,
        url: req.originalUrl,
        ip: req.ip,
      });

      res.status(403).json({
        success: false,
        message: `缺少任一权限: ${permissionCodes.join(', ')}`,
      });
    } catch (error) {
      logger.error('权限验证失败', {
        error: error.message,
        userId: req.user?.id,
        permissions: permissionCodes,
        ip: req.ip,
      });
      res.status(500).json({ success: false, message: '权限验证失败' });
    }
  };
};

/**
 * 检查用户是否拥有所有权限
 * @param {Array<string>} permissionCodes - 权限代码列表
 * @returns {Function} 中间件函数
 */
exports.checkAllPermissions = (permissionCodes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: '未认证' });
      }

      // 超级管理员拥有所有权限
      if (req.user.is_admin) {
        return next();
      }

      for (const permissionCode of permissionCodes) {
        const hasPermission = await rbacService.checkUserPermission(
          req.user.id,
          permissionCode
        );
        if (!hasPermission) {
          logger.warn('用户权限不足', {
            userId: req.user.id,
            username: req.user.username,
            missingPermission: permissionCode,
            url: req.originalUrl,
            ip: req.ip,
          });
          return res.status(403).json({
            success: false,
            message: `缺少权限: ${permissionCode}`,
          });
        }
      }

      next();
    } catch (error) {
      logger.error('权限验证失败', {
        error: error.message,
        userId: req.user?.id,
        permissions: permissionCodes,
        ip: req.ip,
      });
      res.status(500).json({ success: false, message: '权限验证失败' });
    }
  };
};
