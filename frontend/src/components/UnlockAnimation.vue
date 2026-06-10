/**
 * 文件名：UnlockAnimation.vue
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：解锁动画组件 - 显示地块解锁的动画效果
 * 更新记录：
 * 2026-03-28 - v1.0.0 - 初始创建
 */

<template>
  <transition name="unlock">
    <div v-if="visible" class="unlock-animation" :style="positionStyle">
      <div class="unlock-icon">
        <div class="lock-break">
          <div class="lock-part top">🔒</div>
          <div class="lock-part bottom">🔒</div>
        </div>
        <div class="unlock-badge">
          <span class="unlock-text">已解锁!</span>
        </div>
      </div>
      <div class="sparkles">
        <div
          v-for="i in 12"
          :key="i"
          class="sparkle"
          :style="getSparkleStyle(i)"
        >
          ✨
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
});

const emit = defineEmits(['complete']);

const visible = ref(true);

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));

const getSparkleStyle = (index) => {
  const angle = (index * 30 * Math.PI) / 180;
  const distance = 50 + Math.random() * 30;
  return {
    transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
    opacity: 0,
    transition: `all 0.8s ease-out ${index * 0.05}s`,
  };
};

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
    setTimeout(() => {
      emit('complete');
    }, 300);
  }, 1500);
});
</script>

<style scoped>
.unlock-animation {
  position: fixed;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1000;
}

.unlock-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.lock-break {
  position: relative;
  animation: lockBreaking 0.6s ease-out;
}

.lock-part {
  position: absolute;
  font-size: 50px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.lock-part.top {
  animation: lockTopFly 0.6s ease-out 0.3s forwards;
}

.lock-part.bottom {
  animation: lockBottomFly 0.6s ease-out 0.3s forwards;
}

.unlock-badge {
  margin-top: 60px;
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  padding: 8px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
  animation: badgePop 0.4s ease-out 0.8s backwards;
}

.unlock-text {
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.sparkle {
  position: absolute;
  font-size: 20px;
}

.unlock-enter-active {
  animation: unlockAppear 0.4s ease-out;
}

.unlock-leave-active {
  animation: unlockDisappear 0.3s ease-in;
}

@keyframes lockBreaking {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes lockTopFly {
  0% {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
  100% {
    transform: translate(-80%, -100%);
    opacity: 0;
  }
}

@keyframes lockBottomFly {
  0% {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
  100% {
    transform: translate(-20%, 0%);
    opacity: 0;
  }
}

@keyframes badgePop {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes unlockAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes unlockDisappear {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.sparkles .sparkle {
  opacity: 1;
}
</style>
