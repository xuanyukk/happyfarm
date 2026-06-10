/**
 * 文件名：authService.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v1.3.0
 * 功能描述：认证服务——注册、登录、Token刷新、密码重置
 * 更新记录：
 *   2026-03-18 - v1.2.0 - 初始版本
 *   2026-03-22 - v1.2.1 - 统一文件头注释格式
 *   2026-06-08 - v1.3.0 - 统一使用storage包装器替代原生localStorage，
 *                         添加旧Token自动迁移逻辑，消除存储层不一致
 */

import axios from 'axios';
import { storage } from '../utils/localStorage';
import logger from './logger';
import wsService from './websocketService';

const API_URL = '/api';

let isRefreshing = false;
let refreshSubscribers = [];

// --------------- Token 迁移 ---------------

/** 旧格式 localStorage key 列表 */
const LEGACY_KEYS = ['accessToken', 'refreshToken', 'user'];

/**
 * 将旧格式 Token 从原生 localStorage 迁移到 storage 包装器
 * 仅在首次检测到旧数据时执行一次
 */
const migrateLegacyTokens = () => {
  if (storage.get('_token_migrated')) return;

  let migrated = false;
  for (const key of LEGACY_KEYS) {
    const legacyValue = localStorage.getItem(key);
    if (legacyValue && !storage.get(key)) {
      try {
        storage.set(key, key === 'user' ? JSON.parse(legacyValue) : legacyValue);
        localStorage.removeItem(key);
        migrated = true;
      } catch {
        // 解析失败则保留原始存储
        storage.set(key, legacyValue);
        localStorage.removeItem(key);
        migrated = true;
      }
    }
  }

  storage.set('_token_migrated', true);
  if (migrated) {
    logger.info('旧格式Token已迁移到统一storage');
  }
};

// 应用启动时自动执行迁移
migrateLegacyTokens();

// --------------- API 实例 ---------------

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** 不带拦截器的axios实例，用于Token刷新请求避免死循环 */
const refreshApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --------------- Token 管理 ---------------

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.forEach((cb) => cb(accessToken));
  refreshSubscribers = [];
};

export const getAccessToken = () => storage.get('accessToken');
const getRefreshToken = () => storage.get('refreshToken');

const saveTokens = (accessToken, refreshToken, user) => {
  storage.set('accessToken', accessToken);
  storage.set('refreshToken', refreshToken);
  if (user) {
    storage.set('user', user);
  }
};

const clearTokens = () => {
  storage.remove('accessToken');
  storage.remove('refreshToken');
  storage.remove('user');
};

export const removeAuthTokens = clearTokens;

// --------------- 请求/响应拦截器 ---------------

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
        const currentRefreshToken = getRefreshToken();
        if (!currentRefreshToken) {
          throw new Error('没有刷新令牌');
        }
        const res = await refreshApi.post('/auth/refresh', {
          refreshToken: currentRefreshToken,
        });
        const { accessToken, refreshToken } = res.data;
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

// --------------- 公开 API ---------------

export const register = async (userData) => {
  logger.info('开始注册', { username: userData.username });
  try {
    const res = await api.post('/auth/register', userData);
    const { accessToken, refreshToken, user } = res.data;
    saveTokens(accessToken, refreshToken, user);
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

export const login = async (userData) => {
  logger.info('开始登录', { identifier: userData.identifier });
  try {
    const res = await api.post('/auth/login', userData);
    const { accessToken, refreshToken, user } = res.data;
    saveTokens(accessToken, refreshToken, user);
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

export const logout = async () => {
  logger.userAction('退出登录');
  try {
    const currentRefreshToken = getRefreshToken();
    if (currentRefreshToken) {
      await api.post('/auth/logout', { refreshToken: currentRefreshToken });
    }
  } catch (error) {
    logger.warn('退出登录API调用失败', { error: error.message });
  } finally {
    clearTokens();
  }
};

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

export const manualRefreshToken = async () => {
  logger.debug('手动刷新令牌');
  try {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('没有刷新令牌');
    }
    const res = await refreshApi.post('/auth/refresh', {
      refreshToken: currentRefreshToken,
    });
    const { accessToken, refreshToken } = res.data;
    saveTokens(accessToken, refreshToken);
    logger.info('手动刷新令牌成功');
    return { accessToken, refreshToken };
  } catch (error) {
    logger.warn('手动刷新令牌失败', { error: error.message });
    throw error;
  }
};

export const isLoggedIn = () => {
  return !!getAccessToken();
};

export const getLocalUser = () => {
  const user = storage.get('user');
  return user || null;
};

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