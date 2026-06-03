/** * 文件名：LandGrid.vue * 作者：开发者 * 日期：2026-03-28 * 版本：v1.0.0 *
功能描述：土地网格组件 - 显示所有地块的网格布局 * 更新记录： * 2026-03-28 -
v1.0.0 - 初始创建，土地网格功能 */

<template>
  <div ref="gridRef" class="land-grid">
    <LandCell
      v-for="land in lands"
      :key="land.land_num"
      :ref="(el) => setCellRef(el, land.land_num)"
      v-memo="[
        land.land_num,
        land.is_unlocked,
        land.crop_id,
        land.crop_name,
        land.current_quality,
        land.yield_boost,
        land.speed_boost,
        land.harvest_time,
        visibleLands.has(land.land_num) ? land.growthProgress || 0 : 0,
        visibleLands.has(land.land_num) ? land.isMatured || false : false,
        farmStore.isLandLoading(land.land_num),
      ]"
      :land="land"
      :growth-progress="
        visibleLands.has(land.land_num) ? land.growthProgress || 0 : 0
      "
      :is-matured="
        visibleLands.has(land.land_num) ? land.isMatured || false : false
      "
      :is-loading="farmStore.isLandLoading(land.land_num)"
      @click="handleLandClick"
      @quality-click="handleQualityClick"
      @use-item="handleUseItem"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useFarmStore } from '../stores/farm';
import LandCell from './LandCell.vue';

const farmStore = useFarmStore();
const { lands } = storeToRefs(farmStore);

const emit = defineEmits(['land-click', 'quality-click', 'use-item']);

const gridRef = ref(null);
const cellRefs = ref(new Map());
const visibleLands = ref(new Set());
let observer = null;

const setCellRef = (el, landNum) => {
  if (el) {
    cellRefs.value.set(landNum, el);
  } else {
    cellRefs.value.delete(landNum);
  }
};

const initObserver = () => {
  if (!gridRef.value) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const landNum = parseInt(entry.target.dataset.landNum);
        if (entry.isIntersecting) {
          visibleLands.value.add(landNum);
        } else {
          visibleLands.value.delete(landNum);
        }
      });
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    }
  );
};

const observeCells = () => {
  if (!observer) return;

  cellRefs.value.forEach((cell, landNum) => {
    if (cell.$el) {
      cell.$el.dataset.landNum = landNum;
      observer.observe(cell.$el);
    }
  });
};

const disconnectObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

const handleLandClick = (land) => {
  emit('land-click', land);
};

const handleQualityClick = (land) => {
  emit('quality-click', land);
};

const handleUseItem = (land) => {
  emit('use-item', land);
};

onMounted(() => {
  initObserver();
  setTimeout(() => {
    observeCells();
  }, 100);
});

onUnmounted(() => {
  disconnectObserver();
});
</script>

<style scoped>
.land-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 12px;
  padding: 30px;
  max-width: 1050px;
  margin: 0 auto;
}
</style>
