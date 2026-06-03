/** * 文件名：InfiniteScroll.vue * 作者：开发者 * 日期：2026-03-28 *
版本：v1.0.0 * 功能描述：无限滚动组件 - 滚动到底部自动加载更多数据 * 更新记录：
* 2026-03-28 - v1.0.0 - 初始创建，无限滚动功能 */

<template>
  <div
    ref="containerRef"
    class="infinite-scroll-container"
    @scroll="handleScroll"
    @wheel="handleWheel"
  >
    <slot></slot>
    <div v-if="hasMore && isLoading" class="loading-more">
      <div class="spinner"></div>
      <span>{{ loadingText }}</span>
    </div>
    <div v-else-if="!hasMore" class="no-more">{{ noMoreText }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  hasMore: { type: Boolean, default: true },
  isLoading: { type: Boolean, default: false },
  threshold: { type: Number, default: 200 },
  debounceTime: { type: Number, default: 300 },
  loadingText: { type: String, default: '加载更多...' },
  noMoreText: { type: String, default: '已加载全部' },
});

const emit = defineEmits(['loadMore']);

const containerRef = ref(null);
const debounceTimer = ref(null);

const handleScroll = () => {
  if (props.isLoading || !props.hasMore) return;

  const container = containerRef.value;
  if (!container) return;

  const { scrollTop, clientHeight, scrollHeight } = container;
  const nearBottom = scrollHeight - scrollTop - clientHeight < props.threshold;

  if (nearBottom) {
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
    }

    debounceTimer.value = setTimeout(() => {
      emit('loadMore');
    }, props.debounceTime);
  }
};

// 处理滚轮事件，提供更好的用户体验
const handleWheel = (e) => {
  // 可以在这里添加自定义的滚轮逻辑
};

// 手动触发加载更多
const triggerLoad = () => {
  emit('loadMore');
};

// 滚动到底部
const scrollToBottom = () => {
  const container = containerRef.value;
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
};

// 滚动到顶部
const scrollToTop = () => {
  const container = containerRef.value;
  if (container) {
    container.scrollTop = 0;
  }
};

onUnmounted(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }
});

defineExpose({
  triggerLoad,
  scrollToBottom,
  scrollToTop,
  containerRef,
});
</script>

<style scoped>
.infinite-scroll-container {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.loading-more,
.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
  gap: 8px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
