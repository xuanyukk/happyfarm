/**
 * 文件名：frontend/src/utils/request.js
 * 作者：AI助手
 * 日期：2026-04-26
 * 版本：v2.1.0
 * 功能描述：统一请求工具类——基于axios封装，含Token自动刷新
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 初始创建
 *   2026-05-28 - v2.1.0 - 改用storage封装代替原生localStorage、统一错误处理
 */

import axios from 'axios';
import { usePlayerStore } from '@/stores/player';
import router from '@/router';
import { storage } from './localStorage';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    const token = storage.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = storage.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
            { refreshToken }
          );
          const { accessToken } = response.data;
          storage.set('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return request(originalRequest);
        }
      } catch (refreshError) {
        const playerStore = usePlayerStore();
        playerStore.logout();
        router.push('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default request;
