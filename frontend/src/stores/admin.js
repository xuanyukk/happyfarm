/**
 * 文件名：admin.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：后台管理状态管理
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始版本创建
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';
import { usePlayerStore } from './player';

export const useAdminStore = defineStore('admin', () => {
  const isAdminAuthenticated = ref(false);
  const adminUser = ref(null);

  const isAdmin = computed(() => {
    return adminUser.value?.is_admin || false;
  });

  async function checkAdminStatus() {
    try {
      const response = await api.get('/player/info');
      if (response.data.success && response.data.data) {
        adminUser.value = response.data.data;
        isAdminAuthenticated.value = adminUser.value.is_admin;
      }
    } catch (error) {
      console.error('检查管理员状态失败', error);
      isAdminAuthenticated.value = false;
      adminUser.value = null;
    }
  }

  async function loginAdmin(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        await checkAdminStatus();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('管理员登录失败', error);
      return {
        success: false,
        message: error.response?.data?.message || '登录失败',
      };
    }
  }

  function logoutAdmin() {
    isAdminAuthenticated.value = false;
    adminUser.value = null;
    localStorage.removeItem('token');
    // 同步清除 playerStore 中的管理员状态
    try {
      const playerStore = usePlayerStore();
      if (playerStore.playerData) {
        playerStore.playerData.is_admin = false;
      }
    } catch (e) {
      // playerStore 可能尚未初始化，忽略错误
    }
  }

  return {
    isAdminAuthenticated,
    adminUser,
    isAdmin,
    checkAdminStatus,
    loginAdmin,
    logoutAdmin,
  };
});
