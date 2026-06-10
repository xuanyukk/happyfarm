/**
 * 文件名：toast.js
 * 作者：开发者
 * 日期：2026-05-05
 * 版本：v1.1.0
 * 功能描述：Toast通知状态管理 - 提供成功、错误、警告、提示四种类型的通知展示
 * 更新记录：
 *   2026-05-05 - v1.0.0 - 初始版本创建
 *   2026-06-08 - v1.1.0 - 启用MAX_TOASTS限制防止堆积，使用DEFAULT_DURATION常量
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

let toastId = 0;

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;
const QUICK_DURATION = 2000;

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);

  const addToast = (options) => {
    // 超出上限时移除最早的 toast
    while (toasts.value.length >= MAX_TOASTS) {
      toasts.value.shift();
    }

    const toast = {
      id: ++toastId,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      duration: options.duration || DEFAULT_DURATION,
    };

    toasts.value.push(toast);

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    }

    return toast;
  };

  const removeToast = (id) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearToasts = () => {
    toasts.value = [];
  };

  const success = (message, title = '成功') => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: QUICK_DURATION,
    });
  };

  const error = (message, title = '错误') => {
    return addToast({ type: 'error', title, message });
  };

  const warning = (message, title = '警告') => {
    return addToast({ type: 'warning', title, message });
  };

  const info = (message, title = '提示') => {
    return addToast({ type: 'info', title, message });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
});