/**
 * 文件名：permission.js
 * 作者：Trae AI
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：RBAC权限控制指令
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始版本创建
 */

import { useRbacStore } from '../stores/rbac';

/**
 * 权限控制指令 - 单个权限
 * 使用方式: v-permission="'sys:user:view'"
 */
export const permission = {
  mounted(el, binding) {
    const { value } = binding;
    const rbacStore = useRbacStore();

    if (value && typeof value === 'string') {
      const hasPermission = rbacStore.hasPermission(value);
      if (!hasPermission) {
        el.parentNode?.removeChild(el);
      }
    }
  },
};

/**
 * 权限控制指令 - 任一权限
 * 使用方式: v-permission-any="['sys:user:view', 'sys:user:create']"
 */
export const permissionAny = {
  mounted(el, binding) {
    const { value } = binding;
    const rbacStore = useRbacStore();

    if (value && Array.isArray(value) && value.length > 0) {
      const hasPermission = rbacStore.hasAnyPermission(value);
      if (!hasPermission) {
        el.parentNode?.removeChild(el);
      }
    }
  },
};

/**
 * 权限控制指令 - 所有权限
 * 使用方式: v-permission-all="['sys:user:view', 'sys:user:create']"
 */
export const permissionAll = {
  mounted(el, binding) {
    const { value } = binding;
    const rbacStore = useRbacStore();

    if (value && Array.isArray(value) && value.length > 0) {
      const hasPermission = rbacStore.hasAllPermissions(value);
      if (!hasPermission) {
        el.parentNode?.removeChild(el);
      }
    }
  },
};

export default {
  permission,
  permissionAny,
  permissionAll,
};
