/**
 * 文件名：LoadingOverlay.vue
 * 作者：开发者
 * 日期：2026-05-22
 * 版本：v3.0.0
 * 功能描述：初始化加载覆盖层组件，显示加载进度和详情
 * 更新记录：
 * 2026-05-22 - v2.11.0 - 从Home.vue中拆分出独立组件
 * 2026-06-10 - v3.0.0 - 色系重构：靛蓝渐变→深绿大地渐变、金色旋转器+进度条、🌾emoji→PNG、z-index体系化
 */

<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">
          <span class="loading-title">
            <img
              class="loading-icon-img"
              :src="getUICommonImage('icon_wheat')"
              alt="农场"
              @error="(e) => (e.target.style.display = 'none')"
            />
            正在初始化农场
          </span>
          <span class="loading-detail">{{ detail }}</span>
        </div>
        <div class="loading-bar">
          <div class="loading-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { getUICommonImage } from '../utils/imagePaths';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
  detail: {
    type: String,
    default: '正在加载...',
  },
});
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(44, 77, 55, 0.95),
    rgba(31, 56, 39, 0.95)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-loading);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 48px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.loading-spinner {
  width: 64px;
  height: 64px;
  border: 4px solid rgba(255, 252, 245, 0.2);
  border-top-color: var(--gold-500);
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.loading-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.loading-detail {
  font-size: 14px;
  color: var(--text-secondary);
}

.loading-bar {
  width: 300px;
  height: 8px;
  background: rgba(255, 252, 245, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.loading-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-500), var(--gold-400));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
