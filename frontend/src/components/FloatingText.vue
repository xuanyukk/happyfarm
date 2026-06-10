/**
 * 文件名：FloatingText.vue
 * 作者：SOLO
 * 日期：2026-05-30
 * 版本：v1.0.0
 * 功能描述：浮动飘字组件 - 显示经验/金币获取的飘字动画
 */
<template>
  <transition name="float-fade" appear>
    <div
      class="floating-text"
      :class="type"
      :style="{ left: x + 'px', top: y + 'px' }"
    >
      <span class="float-icon">{{ type === 'exp' ? '⭐' : '💰' }}</span>
      <span class="float-value">{{ text }}</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  text: { type: String, required: true },
  type: { type: String, default: 'exp' },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const visible = ref(true);

const emit = defineEmits(['complete']);

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    emit('complete');
  }, 1500);
});
</script>

<style scoped>
.floating-text {
  position: fixed;
  pointer-events: none;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
  animation: float-up 1.5s ease-out forwards;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.floating-text.exp {
  color: #4caf50;
}

.floating-text.gold {
  color: #ffd700;
}

.float-icon {
  font-size: 18px;
}

.float-value {
  font-size: 20px;
}

.float-fade-enter-active {
  animation: float-up 1.5s ease-out forwards;
}

.float-fade-leave-active {
  transition: opacity 0.3s;
}

.float-fade-leave-to {
  opacity: 0;
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  20% {
    opacity: 1;
    transform: translateY(-10px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
}
</style>
