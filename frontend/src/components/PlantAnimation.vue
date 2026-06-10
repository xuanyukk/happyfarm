/**
 * 文件名：PlantAnimation.vue
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.1
 * 功能描述：种植动画组件 - 显示作物种植的动画效果
 * 更新记录：
 * 2026-03-28 - v1.0.0 - 初始创建
 * 2026-03-28 - v1.0.1 - 移除未使用的onUnmounted导入，保持代码整洁
 */

<template>
  <transition name="plant">
    <div v-if="visible" class="plant-animation" :style="positionStyle">
      <div class="seed">
        <div class="seed-icon">🌱</div>
      </div>
      <div class="particles">
        <div
          v-for="i in 8"
          :key="i"
          class="particle"
          :style="getParticleStyle(i)"
        ></div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const emit = defineEmits(['complete']);

const visible = ref(true);

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));

const getParticleStyle = (index) => {
  const angle = (index * 45 * Math.PI) / 180;
  const distance = 30 + Math.random() * 20;
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    opacity: 0,
    transition: `all 0.6s ease-out ${index * 0.05}s`,
  };
};

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    setTimeout(() => {
      emit('complete');
    }, 300);
  }, 800);
});
</script>

<style scoped>
.plant-animation {
  position: fixed;
  width: 100px;
  height: 100px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
}

.seed {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: seedDrop 0.5s ease-in;
}

.seed-icon {
  font-size: 40px;
  animation: seedBounce 0.3s ease-out 0.5s;
}

.particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #8b4513;
  border-radius: 50%;
}

.plant-enter-active {
  animation: plantAppear 0.3s ease-out;
}

.plant-leave-active {
  animation: plantDisappear 0.3s ease-in;
}

@keyframes seedDrop {
  0% {
    transform: translate(-50%, -100px);
    opacity: 0;
  }
  100% {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
}

@keyframes seedBounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

@keyframes plantAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes plantDisappear {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.particles .particle {
  opacity: 1;
}
</style>
