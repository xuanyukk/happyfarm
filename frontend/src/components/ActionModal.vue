/** * 文件名：ActionModal.vue * 作者：开发者 * 日期：2026-03-28 * 版本：v1.0.0 *
功能描述：通用弹窗组件 - 可自定义标题和内容的模态框 * 更新记录： * 2026-03-28 -
v1.0.0 - 初始创建，通用弹窗功能 */

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`modal-title-${title}`"
      @click.self="close"
      @keydown.escape="close"
    >
      <div class="modal-content glass">
        <div class="modal-header">
          <h3 :id="`modal-title-${title}`">{{ title }}</h3>
          <button class="close-btn" aria-label="关闭" @click="close">&times;</button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: String,
});

const emit = defineEmits(['update:modelValue']);

const show = ref(props.modelValue);

watch(
  () => props.modelValue,
  (val) => {
    show.value = val;
    if (val) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

watch(show, (val) => {
  emit('update:modelValue', val);
  if (!val) {
    document.body.style.overflow = '';
  }
});

const close = () => {
  show.value = false;
};

const handleKeydown = (e) => {
  if (e.key === 'Escape' && show.value) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  min-width: 300px;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--glass-border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  line-height: 1;
  transition: color var(--transition-fast);
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

/* 弹窗过渡动画 */
.modal-enter-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal-content {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-leave-active .modal-content {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
}
.modal-enter-from .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}
.modal-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
