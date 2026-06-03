/** * 文件名：SkeletonLoader.vue * 作者：开发者 * 日期：2026-05-07 *
版本：v1.0.0 * 功能描述：骨架屏加载组件 - 提供优雅的加载状态体验 * 更新记录： *
2026-05-07 - v1.0.0 - 初始创建，提供多种骨架屏样式 */

<template>
  <div class="skeleton-loader" :class="{ 'skeleton-animated': animated }">
    <!-- 卡片骨架屏 -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    </div>

    <!-- 列表骨架屏 -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="n in count" :key="n" class="skeleton-list-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
    </div>

    <!-- 表格骨架屏 -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="n in columns" :key="n" class="skeleton-cell"></div>
      </div>
      <div v-for="row in rows" :key="row" class="skeleton-table-row">
        <div v-for="n in columns" :key="n" class="skeleton-cell"></div>
      </div>
    </div>

    <!-- 页面骨架屏 -->
    <div v-else-if="type === 'page'" class="skeleton-page">
      <div class="skeleton-page-header">
        <div class="skeleton-title"></div>
        <div class="skeleton-text short"></div>
      </div>
      <div class="skeleton-page-content">
        <div v-for="n in 3" :key="n" class="skeleton-card-small">
          <div class="skeleton-image-small"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义骨架屏 -->
    <div v-else class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  /**
   * 骨架屏类型
   * @type {string}
   * @default 'card'
   */
  type: {
    type: String,
    default: 'card',
    validator: (value) =>
      ['card', 'list', 'table', 'page', 'custom'].includes(value),
  },

  /**
   * 列表项数量
   * @type {number}
   * @default 3
   */
  count: {
    type: Number,
    default: 3,
  },

  /**
   * 表格列数
   * @type {number}
   * @default 4
   */
  columns: {
    type: Number,
    default: 4,
  },

  /**
   * 表格行数
   * @type {number}
   * @default 3
   */
  rows: {
    type: Number,
    default: 3,
  },

  /**
   * 是否显示动画
   * @type {boolean}
   * @default true
   */
  animated: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

.skeleton-animated
  :where(
    .skeleton-image,
    .skeleton-title,
    .skeleton-text,
    .skeleton-avatar,
    .skeleton-cell
  ) {
  background: linear-gradient(
    90deg,
    var(--glass-bg) 25%,
    rgba(255, 255, 255, 0.15) 50%,
    var(--glass-bg) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 卡片骨架屏 */
.skeleton-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-lg);
  padding: 20px;
  border: 1px solid var(--glass-border);
}

.skeleton-image {
  width: 100%;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
}

.skeleton-image-small {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
}

.skeleton-title {
  width: 60%;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-text {
  width: 100%;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-text.short {
  width: 40%;
}

/* 列表骨架屏 */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--glass-border);
}

.skeleton-avatar {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
}

.skeleton-list-content .skeleton-title {
  width: 40%;
  margin-bottom: 8px;
}

.skeleton-list-content .skeleton-text {
  width: 70%;
}

/* 表格骨架屏 */
.skeleton-table {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--glass-border);
  overflow: hidden;
}

.skeleton-table-header,
.skeleton-table-row {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-bottom: 1px solid var(--glass-border);
}

.skeleton-table-row:last-child {
  border-bottom: none;
}

.skeleton-cell {
  flex: 1;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

/* 页面骨架屏 */
.skeleton-page {
  padding: 20px;
}

.skeleton-page-header {
  margin-bottom: 32px;
}

.skeleton-page-header .skeleton-title {
  width: 30%;
  height: 32px;
  margin-bottom: 16px;
}

.skeleton-page-header .skeleton-text {
  width: 50%;
}

.skeleton-page-content {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.skeleton-card-small {
  flex: 1;
  min-width: 280px;
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--glass-border);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .skeleton-card {
    padding: 16px;
  }

  .skeleton-image {
    height: 150px;
  }

  .skeleton-list-item {
    padding: 12px;
  }

  .skeleton-avatar {
    width: 40px;
    height: 40px;
  }

  .skeleton-table-header,
  .skeleton-table-row {
    padding: 12px;
    gap: 8px;
  }

  .skeleton-page {
    padding: 16px;
  }

  .skeleton-page-header .skeleton-title {
    width: 60%;
  }

  .skeleton-page-header .skeleton-text {
    width: 80%;
  }

  .skeleton-card-small {
    min-width: 100%;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .skeleton-animated
    :where(
      .skeleton-image,
      .skeleton-title,
      .skeleton-text,
      .skeleton-avatar,
      .skeleton-cell
    ) {
    animation: none;
    background: rgba(255, 255, 255, 0.1);
  }
}
</style>
