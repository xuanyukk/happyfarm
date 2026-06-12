/**
 * 文件名：frontend/src/utils/request.js
 * 作者：AI助手
 * 日期：2026-04-26
 * 版本：v2.4.0
 * 功能描述：统一请求工具类——基于axios封装，含Token自动刷新和请求取消机制
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 初始创建
 *   2026-05-28 - v2.1.0 - 改用storage封装代替原生localStorage、统一错误处理
 *   2026-06-05 - v2.2.0 - 添加 AbortController 请求取消机制，防止页面切换时内存泄漏
 *   2026-06-09 - v2.3.0 - Token刷新增加isRefreshing队列保护，防止并发401重复刷新
 *   2026-06-11 - v2.4.0 - 修复环境变量名：VITE_API_BASE_URL → VITE_API_URL，与.env配置一致
 */

import axios from 'axios';
import { usePlayerStore } from '@/stores/player';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { storage } from './localStorage';

// 请求取消管理器：存储进行中的请求，路由切换时批量取消
const pendingRequests = new Map();

// Token刷新队列保护：防止多个并发401同时触发刷新
let isRefreshing = false;
let refreshSubscribers = [];

/**
 * 订阅Token刷新完成事件
 * @param {Function} cb - 回调函数，接收新的accessToken
 */
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

/**
 * 通知所有订阅者Token已刷新
 * @param {string} accessToken - 新的访问令牌
 */
const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = [];
};

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
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
      // 如果已有刷新在进行中，将当前请求加入等待队列
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = storage.get('refreshToken');
        if (!refreshToken) {
          throw new Error('没有刷新令牌');
        }
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        storage.set('accessToken', accessToken);
        if (newRefreshToken) {
          storage.set('refreshToken', newRefreshToken);
        }
        onTokenRefreshed(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return request(originalRequest);
      } catch (refreshError) {
        const authStore = useAuthStore();
        const playerStore = usePlayerStore();
        authStore.logout();
        playerStore.clearPlayer();
        router.push('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default request;