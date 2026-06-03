/** * 文件名：LandCell.vue * 作者：开发者 * 日期：2026-03-28 * 版本：v2.1.0 *
功能描述：土地格子组件 - 显示单个地块状态和交互 * 更新记录： * 2026-03-28 -
v1.0.0 - 初始创建，土地格子功能 * 2026-05-28 - v2.0.0 - 添加资源管理和视觉优化 *
2026-05-28 - v2.0.1 - 修复HTML实体编码问题 * 2026-05-30 - v2.1.0 -
添加产量预估显示、道具效果增强、解锁条件标准化 */
<template>
  <div class="land-cell" :class="cellClass" @click="handleCellClick">
    <div v-if="!land.is_unlocked" class="locked-overlay">
      <span class="lock-icon">🔒</span>
      <span class="unlock-condition">{{ unlockConditionText }}</span>
    </div>
    <div v-else class="land-content">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner-small"></div>
      </div>
      <div v-if="land.crop_id" class="crop-info">
        <div class="crop-display">
          <img
            :src="cropStageDisplay.image"
            :alt="cropStageDisplay.name"
            class="crop-image"
            @error="onCropImageError"
          />
        </div>
        <div class="crop-name">{{ land.crop_name }}</div>
        <div v-if="!isMatured" class="stage-name">
          {{ cropStageDisplay.name }}
        </div>
        <div v-if="!isMatured" class="progress-bar">
          <div
            class="progress-fill"
            :style="{
              width: growthProgress + '%',
              background: `linear-gradient(90deg, ${cropStageDisplay.color}, ${cropStageDisplay.color}dd)`,
            }"
          ></div>
        </div>
        <div v-if="!isMatured" class="time-left">{{ timeLeft }}</div>
        <div
          v-if="land.min_yield !== undefined && land.max_yield !== undefined"
          class="crop-yield"
        >
          <span
            class="yield-text"
            :title="'基础产量: ' + (land.base_yield || 0)"
          >
            {{ land.min_yield || 0 }}-{{ land.max_yield || 0 }}个
          </span>
        </div>
        <div v-else class="matured-badge">✨ 可收获! ✨</div>
      </div>
      <div v-else class="empty-land">
        <span class="empty-icon">🌱</span>
        <span>空地</span>
      </div>
    </div>
    <div
      v-if="land.is_unlocked"
      class="quality-badge"
      :class="qualityClass"
      :title="land.quality_name"
      @click.stop="handleQualityClick"
    >
      {{ land.quality_name }}
    </div>
    <div
      v-if="land.is_unlocked && land.star_level"
      class="star-badge"
      :class="'star-' + land.star_level"
      :title="starDisplayText"
      @click.stop="handleStarClick"
    >
      {{ '★'.repeat(land.star_level) }}{{ '☆'.repeat(5 - land.star_level) }}
    </div>
    <div v-if="hasItemBoost" class="item-boost-indicator">
      <span
        v-if="land.yield_boost > 1.0"
        class="boost-icon boost-yield"
        :title="yieldBoostTooltip"
      >
        📈{{ Math.round((land.yield_boost - 1) * 100) }}%
        <span v-if="land.yield_boost_remaining" class="boost-time">
          {{ formatBoostTime(land.yield_boost_remaining) }}</span
        >
      </span>
      <span
        v-if="land.speed_boost > 1.0"
        class="boost-icon boost-speed"
        :title="speedBoostTooltip"
      >
        ⚡{{ Math.round((land.speed_boost - 1) * 100) }}%
        <span v-if="land.speed_boost_remaining" class="boost-time">
          {{ formatBoostTime(land.speed_boost_remaining) }}</span
        >
      </span>
      <span
        v-if="land.lucky_seed_active"
        class="boost-icon boost-lucky"
        title="幸运种子：收获时50%几率双倍"
        >🍀</span
      >
      <span
        v-if="land.exp_potion_active"
        class="boost-icon boost-exp"
        title="经验药水：收获时双倍经验"
        >🧪</span
      >
    </div>
    <button
      v-if="land.is_unlocked"
      class="use-item-quick-btn"
      title="使用道具"
      @click.stop="handleUseItem"
    >
      🎒
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getCropStageDisplay } from '../utils/resourceManager';
import { getCropStageImage, getFallbackImage } from '../utils/imagePaths';

const props = defineProps({
  land: { type: Object, required: true },
  growthProgress: { type: Number, default: 0 },
  isMatured: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(['click', 'quality-click', 'star-click', 'use-item']);

const cropStageDisplay = computed(() => {
  if (!props.land.crop_id)
    return { name: '', color: '#90EE90', emoji: '🌱', stage: 1, image: '' };
  const display = getCropStageDisplay(props.land.crop_id, props.growthProgress);
  return {
    ...display,
    image: getCropStageImage(props.land.crop_id, display.stage),
  };
});

const onCropImageError = (event) => {
  event.target.src = getFallbackImage('crop');
};

const formatBoostTime = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
};

const unlockConditionText = computed(() => {
  const parts = [];
  if (props.land.unlock_player_level) {
    parts.push(`玩家${props.land.unlock_player_level}级`);
  }
  if (props.land.unlock_farm_level) {
    parts.push(`农场${props.land.unlock_farm_level}级`);
  }
  if (props.land.unlock_world_level) {
    parts.push(`世界${props.land.unlock_world_level}级`);
  }
  if (props.land.unlock_cost) {
    parts.push(`💰${props.land.unlock_cost}`);
  }
  return parts.length > 0
    ? parts.join(' / ')
    : `${props.land.unlock_cost || ''}`;
});

const yieldBoostTooltip = computed(() => {
  const pct = Math.round((props.land.yield_boost - 1) * 100);
  let tip = `产量加成: ${pct}%`;
  if (props.land.yield_boost_remaining) {
    tip += ` 剩余: ${formatBoostTime(props.land.yield_boost_remaining)}`;
  }
  return tip;
});

const speedBoostTooltip = computed(() => {
  const pct = Math.round((props.land.speed_boost - 1) * 100);
  let tip = `速度加成: ${pct}%`;
  if (props.land.speed_boost_remaining) {
    tip += ` 剩余: ${formatBoostTime(props.land.speed_boost_remaining)}`;
  }
  return tip;
});

const qualityColors = {
  1: '#9E9E9E',
  2: '#CD7F32',
  3: '#71797E',
  4: '#FFD700',
  5: '#50C878',
  6: '#B9F2FF',
  7: '#8B0000',
  8: '#9400D3',
};

const qualityClass = computed(
  () => `quality-${props.land.current_quality || 1}`
);

const cellClass = computed(() => ({
  locked: !props.land.is_unlocked,
  matured: props.isMatured,
  wilted: isWilted.value,
  'wilt-warning': isWiltWarning.value,
  'has-crop': props.land.crop_id,
  [`quality-${props.land.current_quality || 1}`]: props.land.is_unlocked,
}));

const hasItemBoost = computed(() => {
  return (
    props.land.yield_boost > 1.0 ||
    props.land.speed_boost > 1.0 ||
    props.land.lucky_seed_active ||
    props.land.exp_potion_active
  );
});

const timeLeft = computed(() => {
  if (!props.land.harvest_time) return '';
  const now = new Date();
  const harvestTime = new Date(props.land.harvest_time);
  const diff = harvestTime - now;
  if (diff <= 0) {
    const overdueMs = Math.abs(diff);
    const overdueHours = Math.floor(overdueMs / 3600000);
    const overdueMinutes = Math.floor((overdueMs % 3600000) / 60000);
    if (overdueHours >= 48) {
      return '已枯萎';
    }
    if (overdueHours >= 24) {
      return `枯萎预警：${overdueHours}小时${overdueMinutes}分`;
    }
    return '';
  }
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}小时${minutes}分${seconds}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
});

const isOverdue = computed(() => {
  if (!props.land.harvest_time) return false;
  const now = new Date();
  const harvestTime = new Date(props.land.harvest_time);
  return now > harvestTime;
});

const isWilted = computed(() => {
  if (!props.land.harvest_time) return false;
  const now = new Date();
  const harvestTime = new Date(props.land.harvest_time);
  const overdueHours = (now - harvestTime) / 3600000;
  return overdueHours >= 48;
});

const isWiltWarning = computed(() => {
  if (!props.land.harvest_time) return false;
  const now = new Date();
  const harvestTime = new Date(props.land.harvest_time);
  const overdueHours = (now - harvestTime) / 3600000;
  return overdueHours >= 24 && overdueHours < 48;
});

const handleCellClick = () => {
  emit('click', props.land);
};

const handleQualityClick = () => {
  emit('quality-click', props.land);
};

const handleStarClick = () => {
  emit('star-click', props.land);
};

const handleUseItem = () => {
  emit('use-item', props.land);
};

const starDisplayText = computed(() => {
  if (!props.land.star_level) return '一星';
  return `${props.land.star_level}星`;
});
</script>

<style scoped>
.land-cell {
  width: 90px;
  height: 90px;
  border: 2px solid #8b4513;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  background: #8b4513;
  transition: all 0.2s;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 9px;
  z-index: 20;
}

.loading-spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.land-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.land-cell.locked {
  background: #555;
  cursor: not-allowed;
}

.land-cell.matured {
  border-color: #ffd700;
  box-shadow: 0 0 10px #ffd700;
}

.land-cell.wilt-warning {
  border-color: #ff4444;
  box-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
  animation: wilt-pulse 1s infinite;
}

.land-cell.wilted {
  border-color: #8b0000;
  background: #4a1a1a;
  box-shadow: 0 0 6px rgba(139, 0, 0, 0.6);
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes wilt-pulse {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(255, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 16px rgba(255, 68, 68, 0.7);
  }
}

.land-cell.quality-1 {
  border-color: #9e9e9e;
}
.land-cell.quality-2 {
  border-color: #cd7f32;
}
.land-cell.quality-3 {
  border-color: #71797e;
}
.land-cell.quality-4 {
  border-color: #ffd700;
}
.land-cell.quality-5 {
  border-color: #50c878;
}
.land-cell.quality-6 {
  border-color: #b9f2ff;
}
.land-cell.quality-7 {
  border-color: #8b0000;
}
.land-cell.quality-8 {
  border-color: #9400d3;
}

.locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 9px;
}

.lock-icon {
  font-size: 30px;
}

.unlock-condition {
  font-size: 11px;
  color: #ffd700;
  margin-top: 3px;
  text-align: center;
  line-height: 1.3;
  padding: 0 2px;
}

.unlock-cost {
  font-size: 15px;
  color: #ffd700;
  margin-top: 3px;
}

.land-content {
  position: absolute;
  inset: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #654321;
  border-radius: 6px;
}

.crop-info {
  text-align: center;
  padding: 4px;
}

.crop-display {
  margin-bottom: 2px;
}

.crop-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: auto;
}

.stage-name {
  font-size: 11px;
  color: #ddd;
  margin-bottom: 4px;
}

.crop-name {
  font-size: 13px;
  color: #90ee90;
  margin-bottom: 4px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #32cd32, #90ee90);
  transition: width 0.3s;
}

.time-left {
  font-size: 12px;
  color: #ffd700;
}

.matured-badge {
  font-size: 14px;
  color: #ffd700;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.crop-yield {
  font-size: 11px;
  color: #87ceeb;
  margin-top: 2px;
}

.yield-text {
  cursor: help;
  border-bottom: 1px dotted #87ceeb;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.empty-land {
  font-size: 13px;
  color: #a0522d;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.empty-icon {
  font-size: 20px;
}

.quality-badge {
  position: absolute;
  top: -12px;
  right: -6px;
  font-size: 11px;
  padding: 1.5px 6px;
  background: #4caf50;
  color: white;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  z-index: 10;
}

.quality-badge:hover {
  transform: scale(1.1);
}

.quality-badge.quality-1 {
  background: #9e9e9e;
}
.quality-badge.quality-2 {
  background: #cd7f32;
}
.quality-badge.quality-3 {
  background: #71797e;
}
.quality-badge.quality-4 {
  background: #ffd700;
  color: #333;
}
.quality-badge.quality-5 {
  background: #50c878;
}
.quality-badge.quality-6 {
  background: #b9f2ff;
  color: #333;
}
.quality-badge.quality-7 {
  background: #8b0000;
}
.quality-badge.quality-8 {
  background: #9400d3;
}

.star-badge {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffd700;
  border-radius: 8px;
  cursor: pointer;
  z-index: 10;
  white-space: nowrap;
  letter-spacing: 1px;
}

.star-badge:hover {
  transform: translateX(-50%) scale(1.15);
  background: rgba(0, 0, 0, 0.8);
}

.star-badge.star-5 {
  color: #ff6b00;
  text-shadow: 0 0 4px rgba(255, 107, 0, 0.6);
}

.item-boost-indicator {
  position: absolute;
  bottom: -8px;
  left: -3px;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.boost-icon {
  font-size: 12px;
  padding: 1px 4px;
  border-radius: 8px;
  animation: sparkle 1s infinite;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

.boost-yield {
  background: rgba(76, 175, 80, 0.7);
  color: #fff;
}

.boost-speed {
  background: rgba(33, 150, 243, 0.7);
  color: #fff;
}

.boost-lucky {
  background: rgba(255, 152, 0, 0.7);
  color: #fff;
}

.boost-exp {
  background: rgba(156, 39, 176, 0.7);
  color: #fff;
}

.boost-time {
  font-size: 10px;
  opacity: 0.9;
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.use-item-quick-btn {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  padding: 0;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 5;
}

.use-item-quick-btn:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
  transform: scale(1.15);
}
</style>
