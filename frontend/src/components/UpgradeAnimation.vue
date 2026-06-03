/** * 文件名：UpgradeAnimation.vue * 作者：开发者 * 日期：2026-03-28 *
版本：v1.0.0 * 功能描述：升级动画组件 - 显示品质升级的动画效果 * 更新记录： *
2026-03-28 - v1.0.0 - 初始创建 */

<template>
  <transition name="upgrade">
    <div v-if="visible" class="upgrade-animation" :style="positionStyle">
      <div class="upgrade-content">
        <div class="quality-icon" :class="`quality-${newQuality}`">
          {{ qualityName }}
        </div>
        <div class="upgrade-arrow">⬆️</div>
        <div class="upgrade-message">品质提升!</div>
      </div>
      <div class="stars">
        <div v-for="i in 6" :key="i" class="star" :style="getStarStyle(i)">
          ⭐
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
  newQuality: { type: Number, required: true },
  qualityName: { type: String, default: '品质升级' },
});

const emit = defineEmits(['complete']);

const visible = ref(true);

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));

const getStarStyle = (index) => {
  const angle = (index * 60 * Math.PI) / 180;
  const distance = 60 + Math.random() * 40;
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    opacity: 0,
    transition: `all 1s ease-out ${index * 0.1}s`,
  };
};

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    setTimeout(() => {
      emit('complete');
    }, 300);
  }, 1800);
});
</script>

<style scoped>
.upgrade-animation {
  position: fixed;
  width: 150px;
  height: 150px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
}

.upgrade-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.quality-icon {
  display: inline-block;
  font-size: 24px;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 15px;
  color: white;
  margin-bottom: 10px;
  animation: qualityBounce 0.5s ease-out;
}

.quality-1 {
  background: #9e9e9e;
}
.quality-2 {
  background: #cd7f32;
}
.quality-3 {
  background: #71797e;
}
.quality-4 {
  background: #ffd700;
  color: #333;
}
.quality-5 {
  background: #50c878;
}
.quality-6 {
  background: #b9f2ff;
  color: #333;
}
.quality-7 {
  background: #8b0000;
}
.quality-8 {
  background: #9400d3;
}

.upgrade-arrow {
  font-size: 30px;
  animation: arrowPulse 0.5s ease-in-out infinite;
  margin: 5px 0;
}

.upgrade-message {
  font-size: 18px;
  font-weight: bold;
  color: #4caf50;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  animation: messageSlide 0.4s ease-out 0.5s backwards;
}

.stars {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.star {
  position: absolute;
  font-size: 24px;
}

.upgrade-enter-active {
  animation: upgradeAppear 0.4s ease-out;
}

.upgrade-leave-active {
  animation: upgradeDisappear 0.3s ease-in;
}

@keyframes qualityBounce {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

@keyframes arrowPulse {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes messageSlide {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes upgradeAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes upgradeDisappear {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.stars .star {
  opacity: 1;
}
</style>
