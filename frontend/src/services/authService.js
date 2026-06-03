/**
 * 文件名：authService.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v1.2.0
 * 功能描述：认证服务，处理用户注册、登录、JWT刷新、密码重置等功能
 * 更新记录：
 *   2026-03-18 - v1.2.0 - 认证服务，处理用户注册、登录、JWT刷新、密码重置等功能
 *   2026-03-22 - v1.2.1 - 统一文件头注释格式
 */

import axios from 'axios';
import logger from './logger';
import wsService from './websocketService';

const API_URL = '/api';

let isRefreshing = false;
let refreshSubscribers = [];

// 创建API实例
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 订阅刷新令牌的回调
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// 通知所有订阅者刷新令牌完成
const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.forEach((callback) => callback(accessToken));
  refreshSubscribers = [];
};

// 从本地存储获取令牌
export const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

// 保存令牌到本地存储
const saveTokens = (accessToken, refreshToken, user) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// 清除本地存储的令牌
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// 清除本地存储的令牌（别名，用于api.js）
export const removeAuthTokens = clearTokens;

// 刷新令牌
const refreshTokens = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('没有刷新令牌');
  }

  const response = await axios.post(`${API_URL}/auth/refresh`, {
    refreshToken,
  });
  return response.data;
};

// 请求拦截器：添加Token和日志
api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    logger.apiRequest(config.method, config.url, config.data);
    config._startTime = Date.now();
    return config;
  },
  (error) => {
    logger.error('请求失败', { error: error.message });
    return Promise.reject(error);
  }
);

// 响应拦截器：处理401错误和刷新令牌
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config._startTime;
    logger.apiResponse(
      response.config.method,
      response.config.url,
      response.status,
      duration
    );
    return response;
  },
  async (error) => {
    const duration = Date.now() - (error.config?._startTime || Date.now());
    const originalRequest = error.config;

    logger.error('响应错误', {
      method: error.config?.method,
      url: error.config?.url,
      status: error.response?.status,
      error: error.message,
      duration: `${duration}ms`,
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新令牌，将请求加入订阅队列
        return new Promise((resolve) => {
          subscribeTokenRefresh((accessToken) => {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { accessToken, refreshToken } = await refreshTokens();
        saveTokens(accessToken, refreshToken);
        onTokenRefreshed(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        logger.info('令牌刷新成功');
        return api(originalRequest);
      } catch (refreshError) {
        logger.warn('令牌刷新失败，需要重新登录', {
          error: refreshError.message,
        });
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// 注册
export const register = async (userData) => {
  logger.info('开始注册', { username: userData.username });
  try {
    const res = await api.post('/auth/register', userData);
    const { accessToken, refreshToken, user } = res.data;
    saveTokens(accessToken, refreshToken, user);
    // 初始化WebSocket连接
    logger.info('初始化WebSocket连接');
    wsService.init(accessToken);
    logger.info('注册成功', { username: userData.username });
    logger.userAction('注册成功', { username: user?.username });
    return res.data;
  } catch (error) {
    logger.warn('注册失败', {
      username: userData.username,
      error: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// 登录
export const login = async (userData) => {
  logger.info('开始登录', { identifier: userData.identifier });
  try {
    const res = await api.post('/auth/login', userData);
    const { accessToken, refreshToken, user } = res.data;
    saveTokens(accessToken, refreshToken, user);
    // 初始化WebSocket连接
    logger.info('初始化WebSocket连接');
    wsService.init(accessToken);
    logger.info('登录成功', { identifier: userData.identifier });
    logger.userAction('登录成功', { username: user?.username });
    return res.data;
  } catch (error) {
    logger.warn('登录失败', {
      identifier: userData.identifier,
      error: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// 退出登录
export const logout = async () => {
  logger.userAction('退出登录');
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
  } catch (error) {
    logger.warn('退出登录API调用失败', { error: error.message });
  } finally {
    clearTokens();
  }
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  logger.debug('获取当前用户信息');
  try {
    const res = await api.get('/auth/me');
    return res;
  } catch (error) {
    logger.warn('获取用户信息失败', {
      error: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// 手动刷新令牌
export const manualRefreshToken = async () => {
  logger.debug('手动刷新令牌');
  try {
    const { accessToken, refreshToken } = await refreshTokens();
    saveTokens(accessToken, refreshToken);
    logger.info('手动刷新令牌成功');
    return { accessToken, refreshToken };
  } catch (error) {
    logger.warn('手动刷新令牌失败', { error: error.message });
    throw error;
  }
};

// 检查是否已登录
export const isLoggedIn = () => {
  return !!getAccessToken();
};

// 获取当前用户信息（从本地存储）
export const getLocalUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// 请求重置密码
export const requestPasswordReset = async (email) => {
  logger.info('请求重置密码', { email });
  try {
    const res = await api.post('/auth/password-reset/request', { email });
    logger.info('请求重置密码成功', { email });
    return res.data;
  } catch (error) {
    logger.warn('请求重置密码失败', {
      email,
      error: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// 验证重置令牌
export const verifyResetToken = async (token) => {
  logger.debug('验证重置令牌');
  try {
    const res = await api.get(`/auth/password-reset/verify/${token}`);
    logger.info('验证重置令牌成功');
    return res.data;
  } catch (error) {
    logger.warn('验证重置令牌失败', {
      error: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// 重置密码
export const resetPassword = async (token, password) => {
  logger.info('重置密码');
  try {
    const res = await api.post('/auth/password-reset/reset', {
      token,
      password,
    });
    logger.info('重置密码成功');
    return res.data;
  } catch (error) {
    logger.warn('重置密码失败', {
      error: error.response?.data?.message || error.message,
    });
    throw error;
  }
};
