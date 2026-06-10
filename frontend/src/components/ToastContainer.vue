/**
 * 文件名：ToastContainer.vue
 * 作者：开发者
 * 日期：2026-05-05
 * 版本：v1.1.0
 * 功能描述：Toast通知容器组件 - 优雅的通知展示系统，支持成功/错误/警告/提示四种类型
 * 更新记录：
 * 2026-05-05 - v1.0.0 - 初始版本创建
 * 2026-06-10 - v1.1.0 - Tailwind gray色系→大地色系：玻璃拟态背景、CSS变量文字色、z-index体系化
 */

<template>
  <Teleport to="body">
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', 'toast-' + toast.type]"
      >
        <div class="toast-content">
          <h4 class="toast-title">{{ toast.title }}</h4>
          <p v-if="toast.message" class="toast-message">{{ toast.message }}</p>
        </div>

        <button class="toast-close" @click="removeToast(toast.id)">×</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../stores/toast';
import { storeToRefs } from 'pinia';

const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);

const removeToast = (id) => {
  toastStore.removeToast(id);
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  min-width: 320px;
  padding: 16px 20px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  background: rgba(74, 124, 89, 0.12);
  border-left: 4px solid var(--success-500);
}

.toast-error {
  background: rgba(220, 38, 38, 0.08);
  border-left: 4px solid var(--error-500);
}

.toast-warning {
  background: rgba(212, 160, 23, 0.12);
  border-left: 4px solid var(--warning-500);
}

.toast-info {
  background: rgba(91, 164, 207, 0.12);
  border-left: 4px solid var(--sky-500);
}

.toast-content {
  flex: 1;
}

.toast-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.toast-message {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.toast-close {
  background: none;
  border: none;
  padding: 0 0 0 12px;
  font-size: 18px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.toast-close:hover {
  color: var(--text-primary);
}
</style>
