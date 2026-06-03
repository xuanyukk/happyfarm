/** * 文件名：VirtualLandGrid.vue * 作者：开发者 * 日期：2026-03-28 *
版本：v1.0.0 * 功能描述：虚拟滚动土地网格 - 针对大量地块的高性能渲染 *
更新记录： * 2026-03-28 - v1.0.0 - 初始创建，虚拟滚动土地网格功能 */

<template>
  <div class="virtual-land-grid-container">
    <VirtualScroll
      ref="virtualScrollRef"
      :items="lands"
      :item-height="itemHeight"
      :buffer-size="5"
      key-field="land_num"
      @visible="handleVisible"
    >
      <template #default="{ item: land, index }">
        <div class="land-item-wrapper">
          <slot
            name="land-item"
            :land="land"
            :index="index"
            :land-key="getLandKey(land)"
          ></slot>
        </div>
      </template>
    </VirtualScroll>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import VirtualScroll from './VirtualScroll.vue';

const props = defineProps({
  lands: { type: Array, required: true },
  itemHeight: { type: Number, default: 180 },
});

const emit = defineEmits(['visible']);

const virtualScrollRef = ref(null);

const getLandKey = (land) => {
  return land.land_num || land.id || land.index;
};

const handleVisible = (event) => {
  emit('visible', event);
};

const scrollToLand = (landNum, align = 'start') => {
  const index = props.lands.findIndex((l) => l.land_num === landNum);
  if (index !== -1 && virtualScrollRef.value) {
    virtualScrollRef.value.scrollToIndex(index, align);
  }
};

const scrollToTop = () => {
  virtualScrollRef.value?.scrollToTop();
};

const scrollToBottom = () => {
  virtualScrollRef.value?.scrollToBottom();
};

defineExpose({
  scrollToLand,
  scrollToTop,
  scrollToBottom,
  virtualScrollRef,
});
</script>

<style scoped>
.virtual-land-grid-container {
  width: 100%;
  height: 100%;
}

.land-item-wrapper {
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
}

/* Grid布局支持 */
:deep(.virtual-scroll-content) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
}
</style>
