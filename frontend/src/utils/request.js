/**
 * 文件名：frontend/src/utils/request.js
 * 作者：AI助手
 * 日期：2026-04-26
 * 版本：v2.2.0
 * 功能描述：统一请求工具类——基于axios封装，含Token自动刷新和请求取消机制
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 初始创建
 *   2026-05-28 - v2.1.0 - 改用storage封装代替原生localStorage、统一错误处理
 *   2026-06-05 - v2.2.0 - 添加 AbortController 请求取消机制，防止页面切换时内存泄漏
 */

import axios from 'axios';
import { usePlayerStore } from '@/stores/player';
import router from '@/router';
import { storage } from './localStorage';

// 请求取消管理器：存储进行中的请求，路由切换时批量取消
const pendingRequests = new Map();

/**
 * 生成请求唯一标识
 * @param {Object} config - axios 请求配置
 * @returns {string} 请求标识
 */
const getRequestKey = (config) => {
  return `${config.method}:${config.url}`;
};

/**
 * 添加请求到待处理队列
 * @param {Object} config - axios 请求配置
 */
const addPendingRequest = (config) => {
  const key = getRequestKey(config);
  if (pendingRequests.has(key)) {
    // 如果已有相同请求，取消前一个
    pendingRequests.get(key).abort();
  }
  const controller = new AbortController();
  config.signal = controller.signal;
  pendingRequests.set(key, controller);
};

/**
 * 移除请求从待处理队列
 * @param {Object} config - axios 请求配置
 */
const removePendingRequest = (config) => {
  const key = getRequestKey(config);
  pendingRequests.delete(key);
};

/**
 * 取消所有进行中的请求（用于路由切换时）
 */
export const cancelAllRequests = () => {
  pendingRequests.forEach((controller) => {
    controller.abort();
  });
  pendingRequests.clear();
};

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

request.interceptors.request.use(
  (config) => {
    // 添加请求到取消队列
    addPendingRequest(config);
    const token = storage.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response) => {
    // 请求完成，从队列中移除
    removePendingRequest(response.config);
    return response;
  },
  async (error) => {
    // 请求完成（含失败），从队列中移除
    if (error.config) {
      removePendingRequest(error.config);
    }
    // 如果是取消请求导致的错误，不触发重试
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
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