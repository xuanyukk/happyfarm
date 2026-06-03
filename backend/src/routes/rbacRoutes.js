/**
 * 文件名：rbacRoutes.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：RBAC权限管理路由配置
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const rbacController = require('../controllers/rbacController');
const { authMiddleware } = require('../middleware/authMiddleware');

const {
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  assignRolePermissions,
  getPermissionTree,
  createPermission,
  updatePermission,
  getUserRoles,
  assignUserRoles,
  getCurrentUserPermissions,
  getPermissionAuditLogs,
} = rbacController;

// 应用认证中间件
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: RBAC权限管理
 *   description: 角色权限精细化管理相关API
 */

// 角色管理
router.get('/roles', getRoleList);
router.get('/roles/:roleId', getRoleDetail);
router.post('/roles', createRole);
router.put('/roles/:roleId', updateRole);
router.delete('/roles/:roleId', deleteRole);
router.post('/roles/:roleId/permissions', assignRolePermissions);

// 权限管理
router.get('/permissions', getPermissionTree);
router.post('/permissions', createPermission);
router.put('/permissions/:permissionId', updatePermission);

// 用户角色管理
router.get('/users/:userId/roles', getUserRoles);
router.post('/users/:userId/roles', assignUserRoles);

// 当前用户权限
router.get('/my/permissions', getCurrentUserPermissions);

// 审计日志
router.get('/audit-logs', getPermissionAuditLogs);

module.exports = router;
