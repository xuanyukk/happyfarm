/**
 * 文件名：ItemUseAnimation.vue
 * 作者：SOLO
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：道具使用动画组件 - 显示道具使用时的粒子特效和飘字效果
 * 更新记录：
 * 2026-05-31 - v1.0.0 - 初始创建
 */

<template>
  <transition name="item-use" appear>
    <div v-if="visible" class="item-use-animation" :style="positionStyle">
      <div class="item-core">
        <span class="item-icon">{{ itemIcon }}</span>
      </div>
      <div class="sparkle-ring">
        <div
          v-for="i in 8"
          :key="i"
          class="sparkle-particle"
          :style="getSparkleStyle(i)"
        ></div>
      </div>
      <div class="ripple-effect">
        <div v-for="i in 3" :key="i" class="ripple-ring"></div>
      </div>
      <div class="item-name-text">{{ itemName }}</div>
      <div v-if="boostText" class="upgrade-text">{{ boostText }}</div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  itemName: { type: String, default: '' },
  itemIcon: { type: String, default: '✨' },
  boostText: { type: String, default: '' },
});

const emit = defineEmits(['complete']);

const visible = ref(true);

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));

const getSparkleStyle = (index) => {
  const angle = (index * 45 * Math.PI) / 180;
  const distance = 50 + Math.random() * 20;
  const size = 4 + Math.random() * 6;
  const delay = index * 0.05;
  const colors = [
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
  ];
  return {
    '--angle': `${angle}rad`,
    '--distance': `${distance}px`,
    '--size': `${size}px`,
    '--delay': `${delay}s`,
    '--color': colors[Math.max(0, Math.min(index, colors.length - 1))],
  };
};

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    setTimeout(() => {
      emit('complete');
    }, 400);
  }, 1800);
});
</script>

<style scoped>
.item-use-animation {
  position: fixed;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2000;
}

.item-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.3),
    rgba(255, 215, 0, 0.05)
  );
  border-radius: 50%;
  animation: core-pulse 1.8s ease-out forwards;
}

.item-icon {
  font-size: 32px;
  animation: icon-spin 1.8s ease-out forwards;
}

.sparkle-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.sparkle-particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--color);
  border-radius: 50%;
  box-shadow:
    0 0 6px var(--color),
    0 0 12px var(--color);
  animation: sparkle-burst 1.5s ease-out var(--delay) forwards;
  opacity: 0;
}

.ripple-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ripple-ring {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  animation: ripple-expand 1.2s ease-out forwards;
  opacity: 0;
}

.ripple-ring:nth-child(1) {
  animation-delay: 0s;
}

.ripple-ring:nth-child(2) {
  animation-delay: 0.15s;
}

.ripple-ring:nth-child(3) {
  animation-delay: 0.3s;
}

.item-name-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 20px);
  white-space: nowrap;
  font-size: 16px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  animation: name-float 1.8s ease-out forwards;
  opacity: 0;
}

.upgrade-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 45px);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: #4ecdc4;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  animation: name-float 1.8s ease-out 0.3s forwards;
  opacity: 0;
}

.item-use-enter-active {
  animation: appear 0.3s ease-out;
}

.item-use-leave-active {
  animation: disappear 0.4s ease-in;
}

@keyframes core-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  30% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

@keyframes icon-spin {
  0% {
    transform: rotate(0deg) scale(0);
  }
  30% {
    transform: rotate(180deg) scale(1.3);
  }
  60% {
    transform: rotate(360deg) scale(0.9);
  }
  100% {
    transform: rotate(540deg) scale(0.5);
    opacity: 0;
  }
}

@keyframes sparkle-burst {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  50% {
    transform: translate(
        calc(cos(var(--angle)) * var(--distance)),
        calc(sin(var(--angle)) * var(--distance))
      )
      scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(
        calc(cos(var(--angle)) * var(--distance) * 1.5),
        calc(sin(var(--angle)) * var(--distance) * 1.5)
      )
      scale(0);
    opacity: 0;
  }
}

@keyframes ripple-expand {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

@keyframes name-float {
  0% {
    opacity: 0;
    transform: translate(-50%, 30px);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, 10px);
  }
  80% {
    opacity: 0.6;
    transform: translate(-50%, -20px);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50px);
  }
}

@keyframes appear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes disappear {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
