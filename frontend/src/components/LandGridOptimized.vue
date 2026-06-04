/** * 文件名：LandGridOptimized.vue * 作者：开发者 * 日期：2026-03-28 *
版本：v1.1.0 * 功能描述：优化版土地网格 - 支持多种渲染模式的高性能组件 *
更新记录： * 2026-03-28 - v1.0.0 - 初始创建，优化版土地网格功能 * 2026-06-04 -
v1.1.0 - 统一三种渲染模式（传统/分页/虚拟）的网格布局样式 */

<template>
  <div class="land-grid-optimized">
    <!-- 模式1：分页加载模式（推荐用于50-200个地块） -->
    <InfiniteScroll
      v-if="mode === 'infinite'"
      ref="infiniteScrollRef"
      :has-more="hasMore"
      :is-loading="isLoadingMore"
      :threshold="200"
      @load-more="handleLoadMore"
    >
      <div class="lands-grid">
        <slot
          v-for="(land, index) in visibleLands"
          :key="getLandKey(land, index)"
          name="land-item"
          :land="land"
          :index="index"
        ></slot>
      </div>
    </InfiniteScroll>

    <!-- 模式2：虚拟滚动模式（推荐用于200+个地块） -->
    <VirtualScroll
      v-else-if="mode === 'virtual'"
      ref="virtualScrollRef"
      :items="lands"
      :item-height="itemHeight"
      :buffer-size="bufferSize"
      :key-field="keyField"
      @visible="handleVisible"
    >
      <template #default="{ item: land, index }">
        <slot name="land-item" :land="land" :index="index"></slot>
      </template>
    </VirtualScroll>

    <!-- 模式3：传统模式（默认，用于少量地块） -->
    <div v-else class="lands-grid">
      <slot
        v-for="(land, index) in lands"
        :key="getLandKey(land, index)"
        name="land-item"
        :land="land"
        :index="index"
      ></slot>
    </div>

    <!-- 按钮方式加载更多（可选） -->
    <div
      v-if="mode === 'infinite' && showLoadMoreButton && hasMore"
      class="load-more-button-container"
    >
      <button
        class="load-more-button"
        :disabled="isLoadingMore"
        @click="handleLoadMore"
      >
        <span v-if="isLoadingMore">加载中...</span>
        <span v-else>加载更多 ({{ remainingCount }})</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import InfiniteScroll from './InfiniteScroll.vue';
import VirtualScroll from './VirtualScroll.vue';

const props = defineProps({
  lands: { type: Array, required: true },
  mode: { type: String, default: 'infinite' }, // 'infinite' | 'virtual' | 'traditional'
  initialVisible: { type: Number, default: 20 },
  pageSize: { type: Number, default: 20 },
  itemHeight: { type: Number, default: 180 },
  bufferSize: { type: Number, default: 5 },
  keyField: { type: String, default: 'land_num' },
  showLoadMoreButton: { type: Boolean, default: false },
});

const emit = defineEmits(['loadMore', 'visible']);

const visibleCount = ref(props.initialVisible);
const isLoadingMore = ref(false);
const infiniteScrollRef = ref(null);
const virtualScrollRef = ref(null);

const visibleLands = computed(() => {
  if (props.mode !== 'infinite') return props.lands;
  return props.lands.slice(0, visibleCount.value);
});

const hasMore = computed(() => {
  if (props.mode !== 'infinite') return false;
  return visibleCount.value < props.lands.length;
});

const remainingCount = computed(() => {
  return Math.max(0, props.lands.length - visibleCount.value);
});

const getLandKey = (land, index) => {
  if (props.keyField && land[props.keyField] !== undefined) {
    return land[props.keyField];
  }
  return index;
};

const handleLoadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return;

  isLoadingMore.value = true;
  emit('loadMore', {
    currentCount: visibleCount.value,
    loadCount: props.pageSize,
  });

  // 模拟加载延迟
  await new Promise((resolve) => setTimeout(resolve, 300));

  visibleCount.value = Math.min(
    visibleCount.value + props.pageSize,
    props.lands.length
  );
  isLoadingMore.value = false;
};

const handleVisible = (event) => {
  emit('visible', event);
};

const scrollToLand = (landNum, align = 'start') => {
  const index = props.lands.findIndex((l) => l.land_num === landNum);
  if (index !== -1) {
    if (props.mode === 'virtual' && virtualScrollRef.value) {
      virtualScrollRef.value.scrollToIndex(index, align);
    } else if (props.mode === 'infinite' && infiniteScrollRef.value) {
      // 对于无限滚动，先确保加载到该index
      if (index >= visibleCount.value) {
        visibleCount.value = Math.min(
          index + props.pageSize,
          props.lands.length
        );
      }
      nextTick(() => {
        if (infiniteScrollRef.value && infiniteScrollRef.value.containerRef) {
          infiniteScrollRef.value.containerRef.scrollTop =
            index * props.itemHeight;
        }
      });
    }
  }
};

const scrollToTop = () => {
  if (props.mode === 'virtual' && virtualScrollRef.value) {
    virtualScrollRef.value.scrollToTop();
  } else if (props.mode === 'infinite' && infiniteScrollRef.value) {
    infiniteScrollRef.value.scrollToTop();
  }
};

const scrollToBottom = () => {
  if (props.mode === 'virtual' && virtualScrollRef.value) {
    virtualScrollRef.value.scrollToBottom();
  } else if (props.mode === 'infinite' && infiniteScrollRef.value) {
    infiniteScrollRef.value.scrollToBottom();
  }
};

const reset = () => {
  visibleCount.value = props.initialVisible;
};

// 当lands变化时重置
watch(
  () => props.lands,
  () => {
    reset();
  },
  { deep: true }
);

defineExpose({
  scrollToLand,
  scrollToTop,
  scrollToBottom,
  reset,
  visibleCount,
  infiniteScrollRef,
  virtualScrollRef,
});
</script>

<style scoped>
.land-grid-optimized {
  width: 100%;
  height: 100%;
}

/* 传统模式和分页模式的网格布局 - 与传统 LandGrid 样式完全一致 */
.lands-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 12px;
  padding: 30px;
  max-width: 1050px;
  margin: 0 auto;
}

/* 虚拟滚动模式的内层网格布局 - 与传统 LandGrid 样式完全一致 */
:deep(.virtual-scroll-inner) {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 12px;
  padding: 30px;
  max-width: 1050px;
  margin: 0 auto;
}

.load-more-button-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.load-more-button {
  padding: 12px 32px;
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.load-more-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
