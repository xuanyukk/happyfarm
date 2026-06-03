/** * 文件名：ActionModal.vue * 作者：开发者 * 日期：2026-03-28 * 版本：v1.0.0 *
功能描述：通用弹窗组件 - 可自定义标题和内容的模态框 * 更新记录： * 2026-03-28 -
v1.0.0 - 初始创建，通用弹窗功能 */

<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

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
  }
);

watch(show, (val) => {
  emit('update:modelValue', val);
});

const close = () => {
  show.value = false;
};
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
  background: white;
  border-radius: 12px;
  min-width: 300px;
  max-width: 500px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}
</style>
