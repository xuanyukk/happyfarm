/**
 * 文件名：api.js
 * 作者：开发者
 * 日期：2026-03-20
 * 版本：v1.2.0
 * 功能描述：统一API请求封装
 * 更新记录：
 *   2026-03-20 - v1.2.0 - 统一API请求封装
 *   2026-03-22 - v1.2.1 - 统一文件头注释格式
 */

import axios from 'axios';
import { getAccessToken, removeAuthTokens } from './authService';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeAuthTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
