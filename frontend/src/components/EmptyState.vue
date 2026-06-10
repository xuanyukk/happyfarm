/**
 * 文件名：EmptyState.vue
 * 作者：开发者
 * 日期：2026-06-09
 * 版本：v1.0.0
 * 功能描述：统一空状态组件——当列表/数据为空时展示友好提示，
 *          支持自定义类型图片、提示文字和操作按钮
 * 更新记录：
 *   2026-06-09 - v1.0.0 - 初始创建
 */
<template>
  <div class="empty-state">
    <img
      :src="emptyImage"
      :alt="message"
      class="empty-state__image"
      @error="handleImageError"
    />
    <p class="empty-state__message">{{ message }}</p>
    <button
      v-if="actionText"
      class="empty-state__action"
      @click="handleAction"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<script setup>
/**
 * 文件名：EmptyState.vue（脚本部分）
 * 功能描述：空状态组件逻辑
 */
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getEmptyStateImage } from '../utils/imagePaths';

const props = defineProps({
  /** 空状态类型，映射到对应的空状态图片 */
  type: {
    type: String,
    default: 'default',
    validator: (val) => [
      'players', 'logs', 'events', 'items', 'seeds', 'crops', 'default',
    ].includes(val),
  },
  /** 提示文字 */
  message: {
    type: String,
    default: '暂无数据',
  },
  /** 操作按钮文字 */
  actionText: {
    type: String,
    default: '',
  },
  /** 操作按钮跳转路由 */
  actionRoute: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['action']);

const router = useRouter();

/** 计算空状态图片路径 */
const emptyImage = computed(function () {
  return getEmptyStateImage(props.type);
});

/** 图片加载失败时使用占位文本 */
function handleImageError(event) {
  event.target.style.display = 'none';
}

/** 处理操作按钮点击 */
function handleAction() {
  if (props.actionRoute) {
    router.push(props.actionRoute);
  }
  emit('action');
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  min-height: 180px;
}

.empty-state__image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  opacity: 0.6;
  margin-bottom: 1.25rem;
  transition: opacity var(--transition-normal);
}

.empty-state__image:hover {
  opacity: 0.8;
}

.empty-state__message {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  line-height: 1.5;
  max-width: 280px;
}

.empty-state__action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  color: var(--text-on-dark);
  background: var(--primary-500);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast),
    transform var(--transition-fast);
  font-family: inherit;
}

.empty-state__action:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
}

.empty-state__action:active {
  transform: translateY(0);
}

/* 响应式 */
@media (max-width: 480px) {
  .empty-state {
    padding: 2rem 1rem;
    min-height: 140px;
  }

  .empty-state__image {
    width: 90px;
    height: 90px;
  }

  .empty-state__message {
    font-size: 0.85rem;
  }
}
</style>