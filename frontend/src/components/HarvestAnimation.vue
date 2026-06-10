/**
 * 文件名：HarvestAnimation.vue
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：收获动画组件 - 显示作物收获的动画效果
 * 更新记录：
 * 2026-03-28 - v1.0.0 - 初始创建
 */

<template>
  <transition name="harvest">
    <div v-if="visible" class="harvest-animation" :style="positionStyle">
      <div class="crop-icons">
        <div
          v-for="i in 5"
          :key="i"
          class="crop-icon"
          :style="getCropIconStyle(i)"
        >
          🥕
        </div>
      </div>
      <div v-if="showCoins" class="coin-burst">
        <div v-for="i in 8" :key="i" class="coin" :style="getCoinStyle(i)">
          💰
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  showCoins: { type: Boolean, default: true },
});

const emit = defineEmits(['complete']);

const visible = ref(true);

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));

const getCropIconStyle = (index) => {
  const angle = (index * 72 * Math.PI) / 180;
  const distance = 40;
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    opacity: 0,
    transition: `all 0.5s ease-out ${index * 0.1}s`,
  };
};

const getCoinStyle = (index) => {
  const angle = (index * 45 * Math.PI) / 180;
  const distance = 60 + Math.random() * 30;
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    opacity: 0,
    transition: `all 0.6s ease-out ${index * 0.08}s`,
  };
};

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    setTimeout(() => {
      emit('complete');
    }, 300);
  }, 1200);
});
</script>

<style scoped>
.harvest-animation {
  position: fixed;
  width: 150px;
  height: 150px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
}

.crop-icons,
.coin-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crop-icon,
.coin {
  position: absolute;
  font-size: 28px;
}

.harvest-enter-active {
  animation: harvestAppear 0.3s ease-out;
}

.harvest-leave-active {
  animation: harvestDisappear 0.3s ease-in;
}

@keyframes harvestAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes harvestDisappear {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.crop-icons .crop-icon {
  opacity: 1;
}

.coin-burst .coin {
  opacity: 1;
}
</style>
