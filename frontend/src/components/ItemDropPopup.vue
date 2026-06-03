/** * 文件名：ItemDropPopup.vue * 作者：SOLO * 日期：2026-05-31 * 版本：v1.0.0 *
功能描述：道具掉落弹窗组件 - 收获时显示掉落道具的弹出通知 * 更新记录： *
2026-05-31 - v1.0.0 - 初始创建 */

<template>
  <transition-group name="drop-popup" tag="div" class="drop-popup-container">
    <div
      v-for="popup in visiblePopups"
      :key="popup.id"
      class="drop-popup-card"
      :class="getRarityClass(popup.rarity)"
    >
      <div class="popup-header">
        <span class="popup-glow"></span>
        <span class="popup-icon">{{ popup.icon || '🎁' }}</span>
        <span class="popup-title">获得道具！</span>
        <button class="popup-close" @click="dismiss(popup.id)">✕</button>
      </div>
      <div class="popup-body">
        <div class="popup-item-row">
          <span class="popup-item-icon">{{ popup.icon || '🎁' }}</span>
          <div class="popup-item-info">
            <span class="popup-item-name">{{ popup.itemName }}</span>
            <span class="popup-item-count">x{{ popup.count }}</span>
          </div>
        </div>
        <div class="popup-source">
          <span class="source-label">获取途径：</span>
          <span class="source-value">{{ popup.source }}</span>
        </div>
        <div v-if="popup.cropName" class="popup-detail">
          从 <strong>{{ popup.cropName }}</strong> 地块
          {{ popup.landNum }} 收获时掉落
        </div>
      </div>
      <div class="popup-progress">
        <div
          class="popup-progress-bar"
          :style="{ animationDuration: popup.duration + 'ms' }"
        ></div>
      </div>
    </div>
  </transition-group>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps({
  drops: { type: Array, default: () => [] },
  duration: { type: Number, default: 4000 },
});

const emit = defineEmits(['dismissed']);

const visiblePopups = ref([]);
let popupIdCounter = 0;
const timers = new Map();

const getRarityClass = (rarity) => {
  const map = {
    common: 'rarity-common',
    uncommon: 'rarity-uncommon',
    rare: 'rarity-rare',
    epic: 'rarity-epic',
    legendary: 'rarity-legendary',
  };
  return map[rarity] || 'rarity-common';
};

const addPopup = (drop) => {
  const id = ++popupIdCounter;
  const popup = {
    id,
    itemName: drop.itemName || '道具',
    count: drop.count || 1,
    source: drop.source || '收获掉落',
    cropName: drop.cropName || '',
    landNum: drop.landNum || '',
    icon: drop.icon || '🎁',
    rarity: drop.rarity || 'common',
    duration: props.duration,
  };
  visiblePopups.value.push(popup);

  const timer = setTimeout(() => {
    dismiss(id);
  }, props.duration);
  timers.set(id, timer);

  return id;
};

const dismiss = (id) => {
  const index = visiblePopups.value.findIndex((p) => p.id === id);
  if (index !== -1) {
    visiblePopups.value.splice(index, 1);
  }
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
};

watch(
  () => props.drops,
  (newDrops) => {
    if (newDrops && newDrops.length > 0) {
      newDrops.forEach((drop) => {
        addPopup(drop);
      });
    }
  },
  { deep: true }
);

onUnmounted(() => {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
});

defineExpose({ addPopup, dismiss });
</script>

<style scoped>
.drop-popup-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 2500;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 340px;
}

.drop-popup-card {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(20, 20, 40, 0.95),
    rgba(30, 30, 60, 0.95)
  );
  border-radius: 14px;
  padding: 0;
  overflow: hidden;
  pointer-events: auto;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  backdrop-filter: blur(20px);
}

.popup-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  position: relative;
  overflow: hidden;
}

.popup-glow {
  position: absolute;
  top: -50%;
  left: -20%;
  width: 140%;
  height: 200%;
  background: radial-gradient(
    ellipse at center,
    var(--glow-color, rgba(255, 215, 0, 0.08)) 0%,
    transparent 70%
  );
  animation: glow-shift 3s ease-in-out infinite;
}

.rarity-common {
  --glow-color: rgba(150, 150, 150, 0.08);
  --border-color: rgba(150, 150, 150, 0.3);
}

.rarity-uncommon {
  --glow-color: rgba(76, 175, 80, 0.1);
  --border-color: rgba(76, 175, 80, 0.4);
}

.rarity-rare {
  --glow-color: rgba(33, 150, 243, 0.12);
  --border-color: rgba(33, 150, 243, 0.5);
}

.rarity-epic {
  --glow-color: rgba(156, 39, 176, 0.15);
  --border-color: rgba(156, 39, 176, 0.5);
}

.rarity-legendary {
  --glow-color: rgba(255, 152, 0, 0.18);
  --border-color: rgba(255, 152, 0, 0.6);
}

.rarity-legendary .drop-popup-card {
  box-shadow:
    0 8px 32px rgba(255, 152, 0, 0.3),
    0 0 0 1px rgba(255, 152, 0, 0.2) inset;
}

.popup-icon {
  font-size: 24px;
  animation: icon-bounce 0.6s ease-out;
}

.popup-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffd700;
  flex: 1;
}

.popup-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}

.popup-close:hover {
  color: rgba(255, 255, 255, 0.8);
}

.popup-body {
  padding: 4px 16px 14px;
}

.popup-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.popup-item-icon {
  font-size: 32px;
  animation: icon-bounce 0.6s ease-out;
}

.popup-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.popup-item-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.popup-item-count {
  font-size: 20px;
  font-weight: 700;
  color: #ffd700;
}

.popup-source {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.source-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.source-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

.popup-detail {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.popup-detail strong {
  color: rgba(255, 255, 255, 0.65);
}

.popup-progress {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
}

.popup-progress-bar {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--border-color, rgba(255, 215, 0, 0.4)),
    var(--border-color, rgba(255, 215, 0, 0.8))
  );
  animation: progress-shrink linear forwards;
  transform-origin: left;
  width: 100%;
}

.drop-popup-enter-active {
  animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.drop-popup-leave-active {
  animation: slide-out 0.3s ease-in;
  position: absolute;
}

.drop-popup-move {
  transition: transform 0.3s ease;
}

@keyframes slide-in {
  0% {
    opacity: 0;
    transform: translateX(100px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slide-out {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(80px) scale(0.85);
  }
}

@keyframes progress-shrink {
  0% {
    width: 100%;
  }
  100% {
    width: 0%;
  }
}

@keyframes icon-bounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes glow-shift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translate(10px, 5px) scale(1.1);
    opacity: 1;
  }
}
</style>
