/**
 * 文件名：farm.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v3.3.1
 * 功能描述：农场状态管理
 * 更新记录：
 *   2026-03-21 - v1.3.0 - 农场状态管理
 *   2026-03-22 - v1.3.1 - 统一文件头注释格式
 *   2026-03-22 - v1.4.0 - 添加一键收获功能
 *   2026-03-22 - v1.5.0 - 添加 plantCropWithoutFetch 函数用于一键种植
 *   2026-03-25 - v2.0.0 - 添加局部更新功能，优化性能，避免操作后全量刷新
 *   2026-03-25 - v2.1.0 - 修复 fetchLands 时保留 notifiedMature 状态，避免作物成熟后无限刷新
 *   2026-03-25 - v2.2.0 - 修复 harvestAllMatured 使用 updateLandLocally 确保 Vue 响应式更新
 *   2026-03-29 - v2.3.0 - 添加地块加载状态管理，实现局部加载状态
 *   2026-04-30 - v3.0.0 - 优化状态管理，添加缓存、计算属性和类型安全
 *   2026-05-31 - v3.1.0 - 新增upgradeLandStar/getLandStarConfigs函数；收获后重置boost状态(yield/speed/lucky/exp)
 *   2026-05-31 - v3.2.0 - IS-05修复：新增checkBoostExpiration道具过期检测和expiredBoosts状态
 *   2026-06-11 - v3.3.0 - C4修复：upgradeLandStar中star_level NaN风险（find返回undefined时||0+1=NaN）
 *   2026-06-11 - v3.3.1 - C17修复：shouldRefresh和lastFetchTimes全部改用serverNow()替代Date.now()
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { gameService } from '../services/gameService';
import { timeSyncService } from '../services/timeSync';
import { usePlayerStore } from './player';

// 本地缓存时间（毫秒）
const CACHE_DURATION = 30000; // 30秒

export const useFarmStore = defineStore('farm', () => {
  const serverNow = () => new Date(timeSyncService.now());

  // 核心状态
  const lands = ref([]);
  const crops = ref([]);
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const loadingLands = ref(new Set());

  // 缓存时间戳
  const lastFetchTimes = ref({
    lands: 0,
    crops: 0,
    items: 0,
  });

  // 计算属性
  const maturedLands = computed(() => {
    return lands.value.filter((land) => isMatured(land));
  });

  const lockedLands = computed(() => {
    return lands.value.filter((land) => !land.is_unlocked);
  });

  const unlockedLands = computed(() => {
    return lands.value.filter((land) => land.is_unlocked);
  });

  const plantedLands = computed(() => {
    return lands.value.filter((land) => land.crop_id !== null);
  });

  const hasMaturedCrops = computed(() => {
    return maturedLands.value.length > 0;
  });

  const totalLands = computed(() => lands.value.length);
  const maturedCount = computed(() => maturedLands.value.length);

  // C17修复：shouldRefresh改用服务器时间替代Date.now()
  // 确保缓存判断与服务器时钟同步，避免客户端时钟偏移导致缓存异常
  const shouldRefresh = computed(() => {
    const now = serverNow().getTime();
    return {
      lands: now - lastFetchTimes.value.lands > CACHE_DURATION,
      crops: now - lastFetchTimes.value.crops > CACHE_DURATION,
      items: now - lastFetchTimes.value.items > CACHE_DURATION,
    };
  });

  const markRefresh = (key) => {
    if (lastFetchTimes.value[key] !== undefined) {
      lastFetchTimes.value[key] = 0;
    }
  };

  const fetchLands = async (forceRefresh = false) => {
    if (!forceRefresh && lands.value.length > 0 && !shouldRefresh.value.lands) {
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await gameService.getLands();
      if (result.success) {
        const oldLands = lands.value;
        lands.value = result.data.map((newLand) => {
          const oldLand = oldLands.find((l) => l.land_num === newLand.land_num);
          if (oldLand) {
            return {
              ...newLand,
              notifiedMature: oldLand.notifiedMature || false,
            };
          }
          return {
            ...newLand,
            notifiedMature: false,
          };
        });
        lastFetchTimes.value.lands = serverNow().getTime();
        checkBoostExpiration();
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
    } finally {
      loading.value = false;
    }
  };

  const fetchCrops = async (forceRefresh = false) => {
    if (!forceRefresh && crops.value.length > 0 && !shouldRefresh.value.crops) {
      return;
    }

    try {
      const result = await gameService.getCrops();
      if (result.success) {
        crops.value = result.data;
        lastFetchTimes.value.crops = serverNow().getTime();
      }
    } catch (err) {
      console.error('获取作物列表失败', err);
      crops.value = [];
    }
  };

  /*
   * IS-05 修复说明：道具过期提醒机制
   * - 问题：前端无道具过期检测，玩家不知道增产/加速效果已过期
   * - 修复：新增 expiredBoosts 状态和 checkBoostExpiration 检测函数
   * - fetchLands 时自动检测所有地块的 yield_boost_end_time 和 speed_boost_end_time
   * - 过期效果被收集到 expiredBoosts 数组供 Home.vue 显示提醒
   */
  const expiredBoosts = ref([]);

  /*
   * IS-05：检测所有地块的增产/加速效果是否过期
   * - 遍历所有地块，检查 yield_boost_end_time 和 speed_boost_end_time
   * - 与服务器时间对比，收集所有已过期的效果
   * - 返回过期效果列表，同时更新 expiredBoosts 状态
   */
  const checkBoostExpiration = () => {
    const now = serverNow();
    const expired = [];

    for (const land of lands.value) {
      if (
        land.yield_boost_end_time &&
        new Date(land.yield_boost_end_time) < now
      ) {
        expired.push({
          landNum: land.land_num,
          type: 'yield_boost',
          boostValue: land.yield_boost,
          endTime: land.yield_boost_end_time,
        });
      }
      if (
        land.speed_boost_end_time &&
        new Date(land.speed_boost_end_time) < now
      ) {
        expired.push({
          landNum: land.land_num,
          type: 'speed_boost',
          boostValue: land.speed_boost,
          endTime: land.speed_boost_end_time,
        });
      }
    }

    expiredBoosts.value = expired;
    return expired;
  };

  const clearExpiredBoosts = () => {
    expiredBoosts.value = [];
  };

  const fetchItems = async (forceRefresh = false) => {
    if (!forceRefresh && items.value.length > 0 && !shouldRefresh.value.items) {
      return;
    }

    try {
      const result = await gameService.getAvailableItems();
      if (result.success) {
        items.value = result.data;
        lastFetchTimes.value.items = serverNow().getTime();
      }
    } catch (err) {
      console.error('获取道具列表失败', err);
      items.value = [];
    }
  };

  const setLandLoading = (landNum, isLoading) => {
    if (isLoading) {
      loadingLands.value.add(landNum);
    } else {
      loadingLands.value.delete(landNum);
    }
  };

  const isLandLoading = (landNum) => {
    return loadingLands.value.has(landNum);
  };

  const updateLandLocally = (landNum, updates) => {
    const landIndex = lands.value.findIndex((l) => l.land_num === landNum);
    if (landIndex !== -1) {
      lands.value[landIndex] = { ...lands.value[landIndex], ...updates };
    }
  };

  const unlockLand = async (landNum) => {
    setLandLoading(landNum, true);
    try {
      const result = await gameService.unlockLand(landNum);
      if (result.success) {
        updateLandLocally(landNum, { is_unlocked: true });
        const playerStore = usePlayerStore();
        await playerStore.fetchPlayerData(true);
      }
      return result;
    } finally {
      setLandLoading(landNum, false);
    }
  };

  const upgradeLandQuality = async (landNum, targetQualityId) => {
    setLandLoading(landNum, true);
    try {
      const result = await gameService.upgradeLandQuality(
        landNum,
        targetQualityId
      );
      if (result.success) {
        updateLandLocally(landNum, { current_quality: targetQualityId });
        const playerStore = usePlayerStore();
        await playerStore.fetchPlayerData(true);
      }
      return result;
    } finally {
      setLandLoading(landNum, false);
    }
  };

  const plantCrop = async (landNum, cropId) => {
    setLandLoading(landNum, true);
    try {
      const result = await gameService.plantCrop(landNum, cropId);
      if (result.success) {
        const crop = crops.value.find((c) => c.crop_id === cropId);
        updateLandLocally(landNum, {
          crop_id: cropId,
          crop_name: crop?.crop_name || '',
          planted_time: serverNow().toISOString(),
          harvest_time: result.harvestTime || null,
          growthProgress: 0,
          isMatured: false,
          notifiedMature: false,
        });
      }
      return result;
    } finally {
      setLandLoading(landNum, false);
    }
  };

  const plantCropWithoutFetch = async (landNum, cropId) => {
    return plantCrop(landNum, cropId);
  };

  const harvestCrop = async (landNum) => {
    setLandLoading(landNum, true);
    try {
      const result = await gameService.harvestCrop(landNum);
      if (result.success) {
        updateLandLocally(landNum, {
          crop_id: null,
          crop_name: null,
          planted_time: null,
          harvest_time: null,
          growthProgress: 0,
          isMatured: false,
          notifiedMature: false,
          yield_boost: null,
          yield_boost_end_time: null,
          speed_boost: null,
          speed_boost_end_time: null,
          lucky_seed_active: false,
          exp_potion_active: false,
        });
      }
      return result;
    } finally {
      setLandLoading(landNum, false);
    }
  };

  const harvestAllMatured = async () => {
    try {
      const result = await gameService.harvestAllMatured();
      if (result.success) {
        lands.value.forEach((land) => {
          if (land.crop_id && isMatured(land)) {
            updateLandLocally(land.land_num, {
              crop_id: null,
              crop_name: null,
              planted_time: null,
              harvest_time: null,
              growthProgress: 0,
              isMatured: false,
              notifiedMature: false,
              yield_boost: null,
              yield_boost_end_time: null,
              speed_boost: null,
              speed_boost_end_time: null,
              lucky_seed_active: false,
              exp_potion_active: false,
            });
          }
        });
      }
      return result;
    } catch (err) {
      console.error('一键收获失败', err);
      throw err;
    }
  };

  const upgradeLandStar = async (landNum) => {
    setLandLoading(landNum, true);
    try {
      const result = await gameService.upgradeLandStar(landNum);
      if (result.success) {
        // C4修复：使用??链避免find返回undefined时||0+1=NaN
        const currentLand = lands.value.find((l) => l.land_num === landNum);
        const currentStar = currentLand?.star_level ?? 0;
        updateLandLocally(landNum, {
          star_level:
            result.data?.starLevel ?? (currentStar + 1),
        });
        const playerStore = usePlayerStore();
        await playerStore.fetchPlayerData(true);
      }
      return result;
    } finally {
      setLandLoading(landNum, false);
    }
  };

  const getLandStarConfigs = async (qualityId) => {
    try {
      const result = await gameService.getLandStarConfigs(qualityId);
      return result;
    } catch (err) {
      console.error('获取地块星级配置失败', err);
      throw err;
    }
  };

  /**
   * 使用道具
   * landNum=undefined 表示不需要目标地块（如金币袋、宝箱、体力药水等）
   */
  const useItem = async (itemId, landNum) => {
    loading.value = true;
    try {
      const result = await gameService.useItem(itemId, landNum);
      if (result.success) {
        await fetchLands(true);
        await fetchItems(true);
        markRefresh('lands');
        markRefresh('items');
      }
      return result;
    } catch (err) {
      console.error('使用道具失败', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getGrowthProgress = (land) => {
    const now = serverNow();
    if (!land.planted_time || !land.harvest_time) return 0;
    const planted = new Date(land.planted_time);
    const harvest = new Date(land.harvest_time);
    const total = harvest.getTime() - planted.getTime();
    const elapsed = now.getTime() - planted.getTime();
    const progress = Math.min(
      100,
      Math.max(0, Math.round((elapsed / total) * 100))
    );
    return progress;
  };

  const isMatured = (land) => {
    if (!land.harvest_time) return false;
    return new Date(land.harvest_time) <= serverNow();
  };

  const refresh = () => {
    return Promise.all([fetchLands(true), fetchCrops(true), fetchItems(true)]);
  };

  return {
    lands,
    crops,
    items,
    loading,
    error,
    expiredBoosts,
    maturedLands,
    lockedLands,
    unlockedLands,
    plantedLands,
    hasMaturedCrops,
    totalLands,
    maturedCount,
    shouldRefresh,
    markRefresh,
    fetchLands,
    fetchCrops,
    fetchItems,
    checkBoostExpiration,
    clearExpiredBoosts,
    setLandLoading,
    isLandLoading,
    updateLandLocally,
    unlockLand,
    upgradeLandQuality,
    upgradeLandStar,
    getLandStarConfigs,
    plantCrop,
    plantCropWithoutFetch,
    harvestCrop,
    harvestAllMatured,
    useItem,
    getGrowthProgress,
    isMatured,
    refresh,
  };
});
