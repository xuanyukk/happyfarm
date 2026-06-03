/** * 文件名：CropInfoModal.vue * 作者：开发者 * 日期：2026-03-24 * 版本：v1.0.0
* 功能描述：作物信息弹窗组件，显示作物详细信息和剩余时间 */

<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ cropInfo?.crop_name || '作物信息' }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="modal-body">
        <div v-if="cropInfo" class="crop-details">
          <img
            v-if="cropInfo.crop_id"
            :src="getCropStageImage(cropInfo.crop_id, 5)"
            :alt="cropInfo.crop_name"
            class="crop-icon-image"
            @error="(e) => (e.target.style.display = 'none')"
          />
          <div v-else class="crop-emoji">{{ cropInfo.crop_emoji }}</div>

          <div class="info-grid">
            <div class="info-item">
              <span class="label">作物等级：</span>
              <span class="value">{{ cropInfo.crop_level }}级</span>
            </div>

            <div class="info-item">
              <span class="label">作物类型：</span>
              <span class="value">{{
                getCropTypeText(cropInfo.crop_type)
              }}</span>
            </div>

            <div class="info-item">
              <span class="label">生长周期：</span>
              <span class="value">{{ cropInfo.growth_cycle }}分钟</span>
            </div>

            <div class="info-item">
              <span class="label">基础产量：</span>
              <span class="value">{{ cropInfo.base_yield }}个</span>
            </div>

            <div class="info-item">
              <span class="label">出售价格：</span>
              <span class="value">{{ cropInfo.sell_price }}币/个</span>
            </div>
          </div>

          <div v-if="remainingTime !== null" class="countdown">
            <div class="countdown-label">距离成熟还有：</div>
            <div class="countdown-time">
              {{ formatRemainingTime(remainingTime) }}
            </div>
          </div>

          <div v-if="landQuality" class="land-quality">
            <div class="quality-label">地块品质：</div>
            <div class="quality-value">{{ getQualityText(landQuality) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getCropStageImage } from '../utils/imagePaths';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  cropInfo: {
    type: Object,
    default: null,
  },
  harvestTime: {
    type: String,
    default: null,
  },
  landQuality: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['close']);

const remainingTime = computed(() => {
  if (!props.harvestTime) return null;
  const harvestDate = new Date(props.harvestTime);
  const now = new Date();
  const diff = harvestDate - now;
  return diff > 0 ? diff : 0;
});

const handleClose = () => {
  emit('close');
};

const getCropTypeText = (type) => {
  const types = {
    basic: '基础作物',
    economic: '经济作物',
    rare: '稀有作物',
    top: '顶级作物',
  };
  return types[type] || type;
};

const getQualityText = (quality) => {
  const qualities = {
    1: '普通',
    2: '良好',
    3: '优质',
    4: '精良',
    5: '极品',
    6: '传说',
    7: '神话',
    8: '至尊',
  };
  return qualities[quality] || quality;
};

const formatRemainingTime = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.crop-details {
  text-align: center;
}

.crop-icon-image {
  width: 96px;
  height: 96px;
  object-fit: contain;
  image-rendering: auto;
  margin-bottom: 20px;
}

.crop-emoji {
  font-size: 64px;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.label {
  color: #6b7280;
  font-size: 14px;
}

.value {
  color: #1f2937;
  font-weight: 500;
  font-size: 14px;
}

.countdown,
.land-quality {
  margin-top: 20px;
  padding: 15px;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.land-quality {
  background: #dbeafe;
  border-left-color: #3b82f6;
}

.countdown-label,
.quality-label {
  color: #92400e;
  font-size: 14px;
  margin-bottom: 8px;
}

.quality-label {
  color: #1e40af;
}

.countdown-time,
.quality-value {
  color: #d97706;
  font-size: 24px;
  font-weight: bold;
}

.quality-value {
  color: #2563eb;
}
</style>
