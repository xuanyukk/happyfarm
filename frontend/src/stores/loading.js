/**
 * 文件名：loading.js
 * 作者：开发者
 * 日期：2026-05-05
 * 版本：v1.0.0
 * 功能描述：全局加载状态管理 - 提供优雅的加载状态、消息更新和进度追踪
 * 更新记录：
 *   2026-05-05 - v1.0.0 - 初始版本创建
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useLoadingStore = defineStore('loading', () => {
  // 全局加载状态
  const isGlobalLoading = ref(false);
  // 全局加载消息
  const loadingMessage = ref('加载中...');
  // 加载进度（0-100）
  const loadingProgress = ref(0);
  // 是否显示进度条
  const showProgressBar = ref(false);

  // 开始全局加载
  const startLoading = (message = '加载中...', showProgress = false) => {
    isGlobalLoading.value = true;
    loadingMessage.value = message;
    loadingProgress.value = 0;
    showProgressBar.value = showProgress;
  };

  // 更新加载消息
  const updateLoadingMessage = (message) => {
    loadingMessage.value = message;
  };

  // 更新加载进度
  const updateLoadingProgress = (progress) => {
    loadingProgress.value = Math.max(0, Math.min(100, progress));
  };

  // 结束全局加载
  const stopLoading = () => {
    isGlobalLoading.value = false;
    loadingMessage.value = '加载中...';
    loadingProgress.value = 0;
    showProgressBar.value = false;
  };

  // 辅助函数：带加载状态的异步操作
  const withLoading = async (asyncFn, options = {}) => {
    const {
      message = '加载中...',
      showProgress = false,
      onError = null,
    } = options;

    try {
      startLoading(message, showProgress);
      const result = await asyncFn();
      return result;
    } catch (error) {
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      stopLoading();
    }
  };

  return {
    // 状态
    isGlobalLoading,
    loadingMessage,
    loadingProgress,
    showProgressBar,

    // 操作
    startLoading,
    updateLoadingMessage,
    updateLoadingProgress,
    stopLoading,
    withLoading,
  };
});
