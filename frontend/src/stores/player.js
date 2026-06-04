/**
 * 文件名：player.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v2.1.0
 * 功能描述：玩家状态管理
 * 更新记录：
 *   2026-03-21 - v1.3.0 - 玩家状态管理
 *   2026-03-22 - v1.3.1 - 统一文件头注释格式
 *   2026-04-30 - v2.0.0 - 优化状态管理，添加缓存和类型安全
 *   2026-05-31 - v2.1.0 - 修复字段名：level→player_level, exp→player_exp，与后端返回一致
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { gameService } from '../services/gameService';

// 本地缓存时间（毫秒）
const CACHE_DURATION = 30000; // 30秒

export const usePlayerStore = defineStore('player', () => {
  // 核心状态
  const playerData = ref(null);
  const levelProgress = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // 缓存时间戳
  const lastFetchTime = ref(0);

  // 计算属性
  const isAuthenticated = computed(() => playerData.value !== null);
  const playerId = computed(() => playerData.value?.user_id);
  const playerLevel = computed(() => playerData.value?.player_level || 1);
  const playerCurrency = computed(() => playerData.value?.currency_num || 0);
  const playerExp = computed(() => playerData.value?.player_exp || 0);
  const farmLevel = computed(() => playerData.value?.farm_level || 1);
  const worldLevel = computed(() => playerData.value?.world_level || 1);

  // 检查是否需要刷新数据
  const shouldRefresh = computed(() => {
    return Date.now() - lastFetchTime.value > CACHE_DURATION;
  });

  const fetchPlayerData = async (forceRefresh = false) => {
    // 如果不需要刷新且有数据，则直接返回
    if (!forceRefresh && playerData.value && !shouldRefresh.value) {
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await gameService.getPlayerData();
      if (result.success) {
        playerData.value = result.data;
        lastFetchTime.value = Date.now();
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
    } finally {
      loading.value = false;
    }
  };

  const fetchLevelProgress = async (forceRefresh = false) => {
    if (!forceRefresh && levelProgress.value && !shouldRefresh.value) {
      return;
    }

    try {
      const result = await gameService.getLevelProgress();
      if (result.success) {
        levelProgress.value = result.data;
      }
    } catch (err) {
      console.error('获取等级进度失败', err);
      levelProgress.value = null;
    }
  };

  const checkAndUpgrade = async () => {
    const result = await gameService.checkAndUpgrade();
    if (result.success) {
      await fetchPlayerData(true);
      await fetchLevelProgress(true);
    }
    return result;
  };

  const unlockWorldLevel = async (targetWorldLevel) => {
    try {
      const result = await gameService.unlockWorldLevel(targetWorldLevel);
      if (result.success) {
        await fetchPlayerData(true);
        await fetchLevelProgress(true);
      }
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateAvatar = async (avatar) => {
    const result = await gameService.updateAvatar(avatar);
    if (result.success) {
      await fetchPlayerData(true);
    }
    return result;
  };

  const updateGold = (amount) => {
    if (playerData.value) {
      playerData.value.currency_num =
        (playerData.value.currency_num || 0) + amount;
    }
  };

  const updateExp = (amount) => {
    if (playerData.value) {
      playerData.value.exp = (playerData.value.exp || 0) + amount;
    }
  };

  const clearPlayer = () => {
    playerData.value = null;
    levelProgress.value = null;
    lastFetchTime.value = 0;
    error.value = null;
  };

  const refresh = () => {
    return Promise.all([fetchPlayerData(true), fetchLevelProgress(true)]);
  };

  return {
    playerData,
    levelProgress,
    loading,
    error,
    isAuthenticated,
    playerId,
    playerLevel,
    playerCurrency,
    playerExp,
    farmLevel,
    worldLevel,
    shouldRefresh,
    fetchPlayerData,
    fetchLevelProgress,
    checkAndUpgrade,
    unlockWorldLevel,
    updateAvatar,
    updateGold,
    updateExp,
    clearPlayer,
    refresh,
  };
});
