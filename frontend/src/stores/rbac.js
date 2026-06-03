/**
 * 文件名：rbac.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：RBAC权限管理状态管理
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useRbacStore = defineStore('rbac', () => {
  // 状态
  const roles = ref([]);
  const permissions = ref([]);
  const permissionTree = ref([]);
  const userRoles = ref({});
  const auditLogs = ref([]);
  const loading = ref(false);
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // 计算属性
  const hasPermission = (permissionCode) => {
    if (!permissions.value || permissions.value.length === 0) {
      return false;
    }
    return permissions.value.some((p) => p.code === permissionCode);
  };

  const hasAnyPermission = (permissionCodes) => {
    if (!permissions.value || permissions.value.length === 0) {
      return false;
    }
    return permissionCodes.some((code) =>
      permissions.value.some((p) => p.code === code)
    );
  };

  const hasAllPermissions = (permissionCodes) => {
    if (!permissions.value || permissions.value.length === 0) {
      return false;
    }
    return permissionCodes.every((code) =>
      permissions.value.some((p) => p.code === code)
    );
  };

  // 方法
  async function fetchRoles(params = {}) {
    try {
      loading.value = true;
      const response = await api.get('/admin/rbac/roles', { params });
      if (response.data.success) {
        roles.value = response.data.data.data;
        pagination.value = {
          page: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
        };
      }
    } catch (error) {
      console.error('获取角色列表失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoleDetail(roleId) {
    try {
      loading.value = true;
      const response = await api.get(`/admin/rbac/roles/${roleId}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('获取角色详情失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function createRole(roleData) {
    try {
      loading.value = true;
      const response = await api.post('/admin/rbac/roles', roleData);
      if (response.data.success) {
        await fetchRoles();
        return response.data.data;
      }
    } catch (error) {
      console.error('创建角色失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updateRole(roleId, roleData) {
    try {
      loading.value = true;
      const response = await api.put(`/admin/rbac/roles/${roleId}`, roleData);
      if (response.data.success) {
        await fetchRoles();
        return response.data.data;
      }
    } catch (error) {
      console.error('更新角色失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function deleteRole(roleId, reason) {
    try {
      loading.value = true;
      await api.delete(`/admin/rbac/roles/${roleId}`, { data: { reason } });
      await fetchRoles();
    } catch (error) {
      console.error('删除角色失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function assignRolePermissions(roleId, permissionIds) {
    try {
      loading.value = true;
      await api.post(`/admin/rbac/roles/${roleId}/permissions`, {
        permissionIds,
      });
    } catch (error) {
      console.error('分配角色权限失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPermissionTree() {
    try {
      loading.value = true;
      const response = await api.get('/admin/rbac/permissions');
      if (response.data.success) {
        permissionTree.value = response.data.data;
      }
    } catch (error) {
      console.error('获取权限树失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function createPermission(permissionData) {
    try {
      loading.value = true;
      const response = await api.post(
        '/admin/rbac/permissions',
        permissionData
      );
      if (response.data.success) {
        await fetchPermissionTree();
        return response.data.data;
      }
    } catch (error) {
      console.error('创建权限失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function updatePermission(permissionId, permissionData) {
    try {
      loading.value = true;
      const response = await api.put(
        `/admin/rbac/permissions/${permissionId}`,
        permissionData
      );
      if (response.data.success) {
        await fetchPermissionTree();
        return response.data.data;
      }
    } catch (error) {
      console.error('更新权限失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUserRoles(userId) {
    try {
      loading.value = true;
      const response = await api.get(`/admin/rbac/users/${userId}/roles`);
      if (response.data.success) {
        userRoles.value[userId] = response.data.data;
        return response.data.data;
      }
    } catch (error) {
      console.error('获取用户角色失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function assignUserRoles(userId, roleIds) {
    try {
      loading.value = true;
      await api.post(`/admin/rbac/users/${userId}/roles`, { roleIds });
      if (userRoles.value[userId]) {
        userRoles.value[userId] = roles.value.filter((r) =>
          roleIds.includes(r.id)
        );
      }
    } catch (error) {
      console.error('分配用户角色失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUserPermissions() {
    try {
      loading.value = true;
      const response = await api.get('/admin/rbac/my/permissions');
      if (response.data.success) {
        permissions.value = response.data.data;
      }
    } catch (error) {
      console.error('获取当前用户权限失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAuditLogs(params = {}) {
    try {
      loading.value = true;
      const response = await api.get('/admin/rbac/audit-logs', { params });
      if (response.data.success) {
        auditLogs.value = response.data.data.data;
        pagination.value = {
          page: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
        };
      }
    } catch (error) {
      console.error('获取审计日志失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  function resetPagination() {
    pagination.value = {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    };
  }

  return {
    roles,
    permissions,
    permissionTree,
    userRoles,
    auditLogs,
    loading,
    pagination,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    fetchRoles,
    fetchRoleDetail,
    createRole,
    updateRole,
    deleteRole,
    assignRolePermissions,
    fetchPermissionTree,
    createPermission,
    updatePermission,
    fetchUserRoles,
    assignUserRoles,
    fetchCurrentUserPermissions,
    fetchAuditLogs,
    resetPagination,
  };
});
