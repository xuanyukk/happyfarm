/** * 文件名：ToastContainer.vue * 作者：开发者 * 日期：2026-05-05 *
版本：v1.0.0 * 功能描述：Toast通知容器组件 -
优雅的通知展示系统，支持成功/错误/警告/提示四种类型 * 更新记录： * 2026-05-05 -
v1.0.0 - 初始版本创建 */

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
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  min-width: 320px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  background: #f0fdf4;
  border-left: 4px solid #22c55e;
}

.toast-error {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.toast-warning {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
}

.toast-info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.toast-content {
  flex: 1;
}

.toast-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.toast-message {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
}

.toast-close {
  background: none;
  border: none;
  padding: 0 0 0 12px;
  font-size: 18px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
}

.toast-close:hover {
  color: #111827;
}
</style>
