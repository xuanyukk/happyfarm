/**
 * 文件名：rbacService.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.1.0
 * 功能描述：RBAC权限管理服务层，包含角色、权限、用户角色分配等功能
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 *   2026-05-01 - v1.1.0 - 修复SQL错误，添加缓存支持
 */

const pool = require('../config/db');
const logger = require('../config/logger');
const cacheService = require('./cacheService');

/**
 * RBAC权限管理服务类
 */
class RBACService {
  /**
   * 获取角色列表
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 角色列表和分页信息
   */
  async getRoleList(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.name) {
      conditions.push(`ar.name ILIKE $${paramIndex}`);
      params.push(`%${filters.name}%`);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`ar.is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total FROM admin_role ar ${whereClause}
    `;

    const dataQuery = `
      SELECT 
        ar.*,
        COALESCE(ur.user_count, 0) as user_count,
        COALESCE(rp.permission_count, 0) as permission_count
      FROM admin_role ar
      LEFT JOIN (
        SELECT role_id, COUNT(*) as user_count FROM user_role WHERE is_active = TRUE GROUP BY role_id
      ) ur ON ur.role_id = ar.id
      LEFT JOIN (
        SELECT role_id, COUNT(*) as permission_count FROM role_permission GROUP BY role_id
      ) rp ON rp.role_id = ar.id
      ${whereClause}
      GROUP BY ar.id, ur.user_count, rp.permission_count
      ORDER BY ar.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      return {
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize),
      };
    } catch (error) {
      logger.error('获取角色列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取角色详情
   * @param {number} roleId - 角色ID
   * @returns {Promise<Object>} 角色详情
   */
  async getRoleDetail(roleId) {
    const query = `
      SELECT 
        ar.*,
        json_agg(DISTINCT ap) as permissions,
        json_agg(DISTINCT su) as users
      FROM admin_role ar
      LEFT JOIN role_permission rp ON rp.role_id = ar.id
      LEFT JOIN admin_permission ap ON ap.id = rp.permission_id
      LEFT JOIN user_role ur ON ur.role_id = ar.id AND ur.is_active = TRUE
      LEFT JOIN sys_user su ON su.id = ur.user_id
      WHERE ar.id = $1
      GROUP BY ar.id
    `;

    try {
      const result = await pool.query(query, [roleId]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      logger.error('获取角色详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建新角色
   * @param {Object} roleData - 角色数据
   * @param {number} operatorId - 操作人ID
   * @param {string} operatorUsername - 操作人用户名
   * @returns {Promise<Object>} 创建的角色
   */
  async createRole(roleData, operatorId, operatorUsername) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO admin_role 
        (name, description, is_system, parent_id, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await client.query(query, [
        roleData.name,
        roleData.description,
        roleData.isSystem || false,
        roleData.parentId || null,
        roleData.isActive !== false,
        operatorId,
      ]);

      const newRole = result.rows[0];

      await this._logPermissionAudit(client, {
        operatorId,
        operatorUsername,
        operationType: 'CREATE',
        targetType: 'ROLE',
        targetId: newRole.id,
        oldValue: null,
        newValue: newRole,
        reason: roleData.reason || '创建角色',
      });

      await client.query('COMMIT');

      return newRole;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('创建角色失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新角色
   * @param {number} roleId - 角色ID
   * @param {Object} roleData - 角色数据
   * @param {number} operatorId - 操作人ID
   * @param {string} operatorUsername - 操作人用户名
   * @returns {Promise<Object>} 更新后的角色
   */
  async updateRole(roleId, roleData, operatorId, operatorUsername) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const oldQuery = 'SELECT * FROM admin_role WHERE id = $1';
      const oldResult = await client.query(oldQuery, [roleId]);

      if (oldResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('角色不存在');
      }

      const oldRole = oldResult.rows[0];

      const query = `
        UPDATE admin_role 
        SET name = $1, description = $2, parent_id = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;

      const result = await client.query(query, [
        roleData.name,
        roleData.description,
        roleData.parentId || null,
        roleData.isActive !== false,
        roleId,
      ]);

      const updatedRole = result.rows[0];

      await this._logPermissionAudit(client, {
        operatorId,
        operatorUsername,
        operationType: 'UPDATE',
        targetType: 'ROLE',
        targetId: roleId,
        oldValue: oldRole,
        newValue: updatedRole,
        reason: roleData.reason || '更新角色',
      });

      await client.query('COMMIT');

      return updatedRole;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新角色失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除角色
   * @param {number} roleId - 角色ID
   * @param {number} operatorId - 操作人ID
   * @param {string} operatorUsername - 操作人用户名
   * @param {string} reason - 删除原因
   * @returns {Promise<void>}
   */
  async deleteRole(roleId, operatorId, operatorUsername, reason) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const oldQuery = 'SELECT * FROM admin_role WHERE id = $1';
      const oldResult = await client.query(oldQuery, [roleId]);

      if (oldResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('角色不存在');
      }

      const oldRole = oldResult.rows[0];

      if (oldRole.is_system) {
        await client.query('ROLLBACK');
        throw new Error('系统内置角色无法删除');
      }

      await this._logPermissionAudit(client, {
        operatorId,
        operatorUsername,
        operationType: 'DELETE',
        targetType: 'ROLE',
        targetId: roleId,
        oldValue: oldRole,
        newValue: null,
        reason: reason || '删除角色',
      });

      await client.query('DELETE FROM admin_role WHERE id = $1', [roleId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('删除角色失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 分配角色权限
   * @param {number} roleId - 角色ID
   * @param {Array<number>} permissionIds - 权限ID列表
   * @param {number} operatorId - 操作人ID
   * @param {string} operatorUsername - 操作人用户名
   * @returns {Promise<void>}
   */
  async assignRolePermissions(
    roleId,
    permissionIds,
    operatorId,
    operatorUsername
  ) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const oldPermissions = await client.query(
        'SELECT permission_id FROM role_permission WHERE role_id = $1',
        [roleId]
      );

      await client.query('DELETE FROM role_permission WHERE role_id = $1', [
        roleId,
      ]);

      for (const permissionId of permissionIds) {
        await client.query(
          'INSERT INTO role_permission (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [roleId, permissionId]
        );
      }

      await this._logPermissionAudit(client, {
        operatorId,
        operatorUsername,
        operationType: 'ASSIGN',
        targetType: 'ROLE_PERMISSION',
        targetId: roleId,
        oldValue: {
          permissions: oldPermissions.rows.map((r) => r.permission_id),
        },
        newValue: { permissions: permissionIds },
        reason: '分配角色权限',
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('分配角色权限失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取权限树形结构
   * @returns {Promise<Array>} 权限树
   */
  async getPermissionTree() {
    const query = `
      SELECT * FROM admin_permission WHERE is_active = TRUE ORDER BY module, sort_order
    `;

    try {
      const result = await pool.query(query);
      const permissions = result.rows;
      return this._buildPermissionTree(permissions);
    } catch (error) {
      logger.error('获取权限树失败:', error);
      throw error;
    }
  }

  /**
   * 创建新权限
   * @param {Object} permissionData - 权限数据
   * @returns {Promise<Object>} 创建的权限
   */
  async createPermission(permissionData) {
    const query = `
      INSERT INTO admin_permission 
      (code, name, description, module, level, is_system, parent_id, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        permissionData.code,
        permissionData.name,
        permissionData.description,
        permissionData.module,
        permissionData.level || 'function',
        permissionData.isSystem || false,
        permissionData.parentId || null,
        permissionData.sortOrder || 0,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('创建权限失败:', error);
      throw error;
    }
  }

  /**
   * 更新权限
   * @param {number} permissionId - 权限ID
   * @param {Object} permissionData - 权限数据
   * @returns {Promise<Object>} 更新后的权限
   */
  async updatePermission(permissionId, permissionData) {
    const query = `
      UPDATE admin_permission 
      SET code = $1, name = $2, description = $3, module = $4, level = $5, 
          parent_id = $6, sort_order = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        permissionData.code,
        permissionData.name,
        permissionData.description,
        permissionData.module,
        permissionData.level,
        permissionData.parentId || null,
        permissionData.sortOrder || 0,
        permissionId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('权限不存在');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('更新权限失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户角色
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 用户角色列表
   */
  async getUserRoles(userId) {
    const query = `
      SELECT ar.*, ur.is_active
      FROM admin_role ar
      INNER JOIN user_role ur ON ur.role_id = ar.id
      WHERE ur.user_id = $1
      ORDER BY ar.created_at DESC
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('获取用户角色失败:', error);
      throw error;
    }
  }

  /**
   * 分配用户角色
   * @param {number} userId - 用户ID
   * @param {Array<number>} roleIds - 角色ID列表
   * @param {number} operatorId - 操作人ID
   * @param {string} operatorUsername - 操作人用户名
   * @returns {Promise<void>}
   */
  async assignUserRoles(userId, roleIds, operatorId, operatorUsername) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const oldRoles = await client.query(
        'SELECT role_id FROM user_role WHERE user_id = $1',
        [userId]
      );

      await client.query('DELETE FROM user_role WHERE user_id = $1', [userId]);

      for (const roleId of roleIds) {
        await client.query(
          'INSERT INTO user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, roleId]
        );
      }

      await this._logPermissionAudit(client, {
        operatorId,
        operatorUsername,
        operationType: 'ASSIGN',
        targetType: 'USER_ROLE',
        targetId: userId,
        oldValue: { roles: oldRoles.rows.map((r) => r.role_id) },
        newValue: { roles: roleIds },
        reason: '分配用户角色',
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('分配用户角色失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 检查用户是否拥有指定权限
   * @param {number} userId - 用户ID
   * @param {string} permissionCode - 权限代码
   * @returns {Promise<boolean>}
   */
  async checkUserPermission(userId, permissionCode) {
    const query = `
      SELECT EXISTS(
        SELECT 1
        FROM sys_user su
        INNER JOIN user_role ur ON ur.user_id = su.id AND ur.is_active = TRUE
        INNER JOIN role_permission rp ON rp.role_id = ur.role_id
        INNER JOIN admin_permission ap ON ap.id = rp.permission_id AND ap.is_active = TRUE
        WHERE su.id = $1 AND ap.code = $2
      )
    `;

    try {
      const result = await pool.query(query, [userId, permissionCode]);
      return result.rows[0].exists;
    } catch (error) {
      logger.error('检查用户权限失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户所有权限
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 用户权限列表
   */
  async getUserPermissions(userId) {
    const query = `
      SELECT DISTINCT ap.*
      FROM sys_user su
      INNER JOIN user_role ur ON ur.user_id = su.id AND ur.is_active = TRUE
      INNER JOIN role_permission rp ON rp.role_id = ur.role_id
      INNER JOIN admin_permission ap ON ap.id = rp.permission_id AND ap.is_active = TRUE
      WHERE su.id = $1
      ORDER BY ap.module, ap.sort_order
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('获取用户权限失败:', error);
      throw error;
    }
  }

  /**
   * 获取权限审计日志
   * @param {Object} filters - 筛选条件
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Object>} 审计日志列表
   */
  async getPermissionAuditLogs(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.operatorId) {
      conditions.push(`operator_id = $${paramIndex}`);
      params.push(filters.operatorId);
      paramIndex++;
    }

    if (filters.operationType) {
      conditions.push(`operation_type = $${paramIndex}`);
      params.push(filters.operationType);
      paramIndex++;
    }

    if (filters.targetType) {
      conditions.push(`target_type = $${paramIndex}`);
      params.push(filters.targetType);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total FROM permission_audit_log ${whereClause}
    `;

    const dataQuery = `
      SELECT * FROM permission_audit_log
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(pageSize, offset);

    try {
      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, params.slice(0, -2)),
        pool.query(dataQuery, params),
      ]);

      return {
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
        page,
        pageSize,
        totalPages: Math.ceil(countResult.rows[0].total / pageSize),
      };
    } catch (error) {
      logger.error('获取权限审计日志失败:', error);
      throw error;
    }
  }

  /**
   * 批量检查用户权限
   * @param {number} userId - 用户ID
   * @param {Array<string>} permissionCodes - 权限代码列表
   * @returns {Promise<Object>} 权限检查结果
   */
  async checkUserPermissions(userId, permissionCodes) {
    const results = {};
    for (const code of permissionCodes) {
      results[code] = await this.checkUserPermission(userId, code);
    }
    return results;
  }

  /**
   * 检查用户是否拥有任意一个权限
   * @param {number} userId - 用户ID
   * @param {Array<string>} permissionCodes - 权限代码列表
   * @returns {Promise<boolean>}
   */
  async checkAnyPermission(userId, permissionCodes) {
    for (const code of permissionCodes) {
      if (await this.checkUserPermission(userId, code)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查用户是否拥有所有权限
   * @param {number} userId - 用户ID
   * @param {Array<string>} permissionCodes - 权限代码列表
   * @returns {Promise<boolean>}
   */
  async checkAllPermissions(userId, permissionCodes) {
    for (const code of permissionCodes) {
      if (!(await this.checkUserPermission(userId, code))) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取用户权限（带缓存）
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 用户权限列表
   */
  async getUserPermissionsCached(userId) {
    const cacheKey = `rbac:permissions:${userId}`;
    return await cacheService.wrap(
      cacheKey,
      async () => {
        return await this.getUserPermissions(userId);
      },
      cacheService.TTL.MEDIUM
    );
  }

  /**
   * 清除用户权限缓存
   * @param {number} userId - 用户ID
   */
  async invalidateUserPermissionCache(userId) {
    await cacheService.del(`rbac:permissions:${userId}`);
    logger.debug('用户权限缓存已清除', { userId });
  }

  /**
   * 构建权限树形结构
   * @param {Array} permissions - 权限列表
   * @returns {Array} 权限树
   * @private
   */
  _buildPermissionTree(permissions) {
    const tree = [];
    const map = new Map();

    permissions.forEach((permission) => {
      map.set(permission.id, {
        ...permission,
        children: [],
      });
    });

    permissions.forEach((permission) => {
      if (permission.parentId) {
        const parent = map.get(permission.parentId);
        if (parent) {
          parent.children.push(map.get(permission.id));
        }
      } else {
        tree.push(map.get(permission.id));
      }
    });

    return tree;
  }

  /**
   * 记录权限审计日志
   * @param {Object} client - 数据库客户端
   * @param {Object} auditData - 审计数据
   * @private
   */
  async _logPermissionAudit(client, auditData) {
    const query = `
      INSERT INTO permission_audit_log 
      (operator_id, operator_username, operation_type, target_type, target_id, old_value, new_value, reason, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    await client.query(query, [
      auditData.operatorId,
      auditData.operatorUsername,
      auditData.operationType,
      auditData.targetType,
      auditData.targetId,
      auditData.oldValue,
      auditData.newValue,
      auditData.reason,
      auditData.ipAddress || '127.0.0.1',
    ]);
  }
}

module.exports = new RBACService();
