/**
 * 文件名：auth.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：认证状态管理
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  logout as logoutService,
  getLocalUser,
  isLoggedIn as checkIsLoggedIn,
} from '../services/authService';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(getLocalUser());
  const isLoggedIn = ref(checkIsLoggedIn());

  const setUser = (userData) => {
    user.value = userData;
    isLoggedIn.value = !!userData;
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error('退出登录失败', error);
    } finally {
      user.value = null;
      isLoggedIn.value = false;
    }
  };

  const refreshUser = () => {
    user.value = getLocalUser();
    isLoggedIn.value = checkIsLoggedIn();
  };

  return {
    user,
    isLoggedIn,
    setUser,
    logout,
    refreshUser,
  };
});
