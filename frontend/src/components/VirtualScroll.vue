/**
 * 文件名：VirtualScroll.vue
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.1.0
 * 功能描述：虚拟滚动组件 - 高性能渲染大量列表项
 * 更新记录：
 * 2026-03-28 - v1.0.0 - 初始创建，虚拟滚动功能
 * 2026-06-04 - v1.1.0 - 添加内容内层容器，统一网格布局样式支持
 */

<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    @scroll="handleScroll"
  >
    <div class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }">
      <div
        class="virtual-scroll-content"
        :style="{ transform: `translateY(${offset}px)` }"
      >
        <div class="virtual-scroll-inner">
          <slot
            v-for="(item, index) in visibleItems"
            :key="getItemKey(item, index)"
            :item="item"
            :index="index"
          ></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  itemHeight: { type: Number, default: 180 },
  bufferSize: { type: Number, default: 5 },
  keyField: { type: String, default: null },
});

const emit = defineEmits(['visible']);

const containerRef = ref(null);
const startIndex = ref(0);
const endIndex = ref(0);
const itemHeights = ref({}); // 存储动态高度
const positions = ref([]); // 存储每个item的位置

const visibleCount = computed(() => {
  if (!containerRef.value) return 10;
  const containerHeight = containerRef.value.clientHeight;
  return Math.ceil(containerHeight / props.itemHeight) + props.bufferSize * 2;
});

const totalHeight = computed(() => {
  if (positions.value.length === props.items.length) {
    return positions.value.reduce(
      (acc, p) => acc + (p.height || props.itemHeight),
      0
    );
  }
  return props.items.length * props.itemHeight;
});

const offset = computed(() => {
  if (
    positions.value.length === props.items.length &&
    positions.value[startIndex.value]
  ) {
    return positions.value[startIndex.value].top;
  }
  return startIndex.value * props.itemHeight;
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1);
});

const getItemKey = (item, index) => {
  if (props.keyField && item[props.keyField] !== undefined) {
    return item[props.keyField];
  }
  return index;
};

const initPositions = () => {
  const newPositions = [];
  let currentTop = 0;

  for (let i = 0; i < props.items.length; i++) {
    const height = itemHeights.value[i] || props.itemHeight;
    newPositions.push({
      index: i,
      top: currentTop,
      height: height,
    });
    currentTop += height;
  }

  positions.value = newPositions;
};

const getStartIndex = (scrollTop) => {
  if (positions.value.length === props.items.length) {
    // 使用动态高度计算
    for (let i = 0; i < positions.value.length; i++) {
      const pos = positions.value[i];
      if (pos.top + pos.height > scrollTop) {
        return Math.max(0, i - props.bufferSize);
      }
    }
    return Math.max(0, props.items.length - visibleCount.value);
  }

  // 使用固定高度计算
  return Math.max(
    0,
    Math.floor(scrollTop / props.itemHeight) - props.bufferSize
  );
};

const getEndIndex = (startIdx, containerHeight) => {
  let idx = startIdx;
  let accumulatedHeight = 0;

  if (positions.value.length === props.items.length) {
    while (idx < props.items.length && accumulatedHeight < containerHeight) {
      accumulatedHeight += positions.value[idx].height;
      idx++;
    }
  } else {
    const visibleItemsCount = Math.ceil(containerHeight / props.itemHeight);
    idx = startIdx + visibleItemsCount + props.bufferSize * 2;
  }

  return Math.min(props.items.length - 1, idx);
};

const handleScroll = () => {
  const container = containerRef.value;
  if (!container) return;

  const scrollTop = container.scrollTop;
  const containerHeight = container.clientHeight;

  const newStart = getStartIndex(scrollTop);
  const newEnd = getEndIndex(newStart, containerHeight);

  startIndex.value = newStart;
  endIndex.value = newEnd;

  emit('visible', {
    start: startIndex.value,
    end: endIndex.value,
    items: visibleItems.value,
  });
};

// 更新item高度
const updateItemHeight = (index, height) => {
  if (itemHeights.value[index] === height) return;

  itemHeights.value[index] = height;
  initPositions();
  // 重新计算可见范围
  if (containerRef.value) {
    handleScroll();
  }
};

// 滚动到指定item
const scrollToIndex = (index, align = 'start') => {
  const container = containerRef.value;
  if (!container || index < 0 || index >= props.items.length) return;

  let targetTop;
  if (positions.value.length === props.items.length && positions.value[index]) {
    targetTop = positions.value[index].top;
  } else {
    targetTop = index * props.itemHeight;
  }

  if (align === 'center') {
    targetTop -= container.clientHeight / 2 - props.itemHeight / 2;
  } else if (align === 'end') {
    targetTop -= container.clientHeight - props.itemHeight;
  }

  container.scrollTop = Math.max(0, targetTop);
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

onMounted(() => {
  initPositions();
  nextTick(() => {
    handleScroll();
  });
});

onUnmounted(() => {
  // 清理
});

watch(
  () => props.items,
  () => {
    initPositions();
    handleScroll();
  },
  { deep: true }
);

defineExpose({
  scrollToIndex,
  scrollToBottom,
  scrollToTop,
  updateItemHeight,
  containerRef,
  startIndex,
  endIndex,
});
</script>

<style scoped>
.virtual-scroll-container {
  height: 100%;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
}

.virtual-scroll-spacer {
  position: relative;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-scroll-inner {
  /* 内层容器，由父组件通过 :deep() 设置 grid 布局样式 */
  width: 100%;
}
</style>
