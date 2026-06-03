/**
 * 文件名：rbacController.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：RBAC权限管理控制器，处理角色、权限、用户角色分配等API
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

const { body, validationResult, query } = require('express-validator');
const rbacService = require('../services/rbacService');
const logger = require('../config/logger');

/**
 * 获取角色列表
 */
exports.getRoleList = async function (req, res) {
  try {
    const { page = 1, pageSize = 20, name, isActive } = req.query;

    const result = await rbacService.getRoleList(
      {
        name,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取角色列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取角色详情
 */
exports.getRoleDetail = async function (req, res) {
  try {
    const { roleId } = req.params;
    const role = await rbacService.getRoleDetail(parseInt(roleId));

    if (!role) {
      return res.status(404).json({ success: false, message: '角色不存在' });
    }

    res.status(200).json({ success: true, data: role });
  } catch (error) {
    logger.error('获取角色详情失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 创建角色
 */
exports.createRole = [
  body('name').notEmpty().withMessage('角色名称不能为空'),
  body('description').optional(),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const role = await rbacService.createRole(
        req.body,
        req.user.id,
        req.user.username
      );

      res
        .status(201)
        .json({ success: true, data: role, message: '角色创建成功' });
    } catch (error) {
      logger.error('创建角色失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 更新角色
 */
exports.updateRole = [
  body('name').notEmpty().withMessage('角色名称不能为空'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { roleId } = req.params;
      const role = await rbacService.updateRole(
        parseInt(roleId),
        req.body,
        req.user.id,
        req.user.username
      );

      res
        .status(200)
        .json({ success: true, data: role, message: '角色更新成功' });
    } catch (error) {
      logger.error('更新角色失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 删除角色
 */
exports.deleteRole = async function (req, res) {
  try {
    const { roleId } = req.params;
    const { reason } = req.body;

    await rbacService.deleteRole(
      parseInt(roleId),
      req.user.id,
      req.user.username,
      reason
    );

    res.status(200).json({ success: true, message: '角色删除成功' });
  } catch (error) {
    logger.error('删除角色失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 分配角色权限
 */
exports.assignRolePermissions = [
  body('permissionIds').isArray({ min: 0 }).withMessage('权限ID列表格式不正确'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { roleId } = req.params;
      const { permissionIds } = req.body;

      await rbacService.assignRolePermissions(
        parseInt(roleId),
        permissionIds,
        req.user.id,
        req.user.username
      );

      res.status(200).json({ success: true, message: '权限分配成功' });
    } catch (error) {
      logger.error('分配角色权限失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 获取权限树
 */
exports.getPermissionTree = async function (req, res) {
  try {
    const tree = await rbacService.getPermissionTree();
    res.status(200).json({ success: true, data: tree });
  } catch (error) {
    logger.error('获取权限树失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 创建权限
 */
exports.createPermission = [
  body('code').notEmpty().withMessage('权限代码不能为空'),
  body('name').notEmpty().withMessage('权限名称不能为空'),
  body('module').notEmpty().withMessage('所属模块不能为空'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const permission = await rbacService.createPermission(req.body);
      res
        .status(201)
        .json({ success: true, data: permission, message: '权限创建成功' });
    } catch (error) {
      logger.error('创建权限失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 更新权限
 */
exports.updatePermission = [
  body('code').notEmpty().withMessage('权限代码不能为空'),
  body('name').notEmpty().withMessage('权限名称不能为空'),
  body('module').notEmpty().withMessage('所属模块不能为空'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { permissionId } = req.params;
      const permission = await rbacService.updatePermission(
        parseInt(permissionId),
        req.body
      );
      res
        .status(200)
        .json({ success: true, data: permission, message: '权限更新成功' });
    } catch (error) {
      logger.error('更新权限失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 获取用户角色
 */
exports.getUserRoles = async function (req, res) {
  try {
    const { userId } = req.params;
    const roles = await rbacService.getUserRoles(parseInt(userId));
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    logger.error('获取用户角色失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 分配用户角色
 */
exports.assignUserRoles = [
  body('roleIds').isArray({ min: 0 }).withMessage('角色ID列表格式不正确'),
  async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { userId } = req.params;
      const { roleIds } = req.body;

      await rbacService.assignUserRoles(
        parseInt(userId),
        roleIds,
        req.user.id,
        req.user.username
      );

      res.status(200).json({ success: true, message: '用户角色分配成功' });
    } catch (error) {
      logger.error('分配用户角色失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 获取当前用户权限
 */
exports.getCurrentUserPermissions = async function (req, res) {
  try {
    const permissions = await rbacService.getUserPermissions(req.user.id);
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    logger.error('获取当前用户权限失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取权限审计日志
 */
exports.getPermissionAuditLogs = async function (req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      operatorId,
      operationType,
      targetType,
    } = req.query;

    const result = await rbacService.getPermissionAuditLogs(
      {
        operatorId: operatorId ? parseInt(operatorId) : undefined,
        operationType,
        targetType,
      },
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取权限审计日志失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
