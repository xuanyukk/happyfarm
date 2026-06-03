/**
 * 文件名：achievement.js
 * 作者：开发者
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：成就系统状态管理
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { gameService } from '../services/gameService';
import logger from '../services/logger';

export const useAchievementStore = defineStore('achievement', () => {
  const achievements = ref([]);
  const unlockedAchievements = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const selectedCategory = ref('all');
  const newUnlockedAchievements = ref([]);

  // 缓存时间
  const lastFetchTime = ref(0);
  const CACHE_DURATION = 30000;

  const categories = [
    { label: '全部', value: 'all' },
    { label: '种植', value: 'farming' },
    { label: '农场', value: 'farm' },
    { label: '经济', value: 'economy' },
    { label: '等级', value: 'level' },
    { label: '道具', value: 'item' },
  ];

  // 计算属性
  const filteredAchievements = computed(() => {
    if (selectedCategory.value === 'all') {
      return achievements.value;
    }
    return achievements.value.filter(
      (a) => a.category === selectedCategory.value
    );
  });

  const completedCount = computed(() => {
    return achievements.value.filter((a) => a.is_completed).length;
  });

  const totalCount = computed(() => {
    return achievements.value.length;
  });

  const completionRate = computed(() => {
    if (totalCount.value === 0) return 0;
    return Math.round((completedCount.value / totalCount.value) * 100);
  });

  const shouldRefresh = computed(() => {
    return Date.now() - lastFetchTime.value > CACHE_DURATION;
  });

  // 获取成就列表
  const fetchAchievements = async (forceRefresh = false) => {
    if (
      !forceRefresh &&
      achievements.value.length > 0 &&
      !shouldRefresh.value
    ) {
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await gameService.getAchievements();
      if (result.success) {
        achievements.value = result.data || [];
        lastFetchTime.value = Date.now();
        logger.info('成就列表获取成功', {
          total: achievements.value.length,
          completed: completedCount.value,
        });
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      logger.error('获取成就列表失败', { error: error.value });
    } finally {
      loading.value = false;
    }
  };

  // 获取已解锁成就
  const fetchUnlockedAchievements = async (forceRefresh = false) => {
    if (!forceRefresh && !shouldRefresh.value) {
      return;
    }

    try {
      const result = await gameService.getUnlockedAchievements();
      if (result.success) {
        unlockedAchievements.value = result.data || [];
      }
    } catch (err) {
      logger.error('获取已解锁成就失败', { error: err.message });
    }
  };

  // 添加新解锁的成就（用于动画展示）
  const addNewUnlockedAchievement = (achievement) => {
    newUnlockedAchievements.value.push(achievement);
    logger.info('成就解锁', {
      achievementId: achievement.achievement_id,
      name: achievement.achievement_name,
    });
  };

  // 移除已展示的新解锁成就
  const removeNewUnlockedAchievement = (achievementId) => {
    const index = newUnlockedAchievements.value.findIndex(
      (a) => a.achievement_id === achievementId
    );
    if (index > -1) {
      newUnlockedAchievements.value.splice(index, 1);
    }
  };

  // 选择分类
  const setCategory = (category) => {
    selectedCategory.value = category;
  };

  // 刷新所有数据
  const refresh = () => {
    return Promise.all([
      fetchAchievements(true),
      fetchUnlockedAchievements(true),
    ]);
  };

  return {
    achievements,
    unlockedAchievements,
    loading,
    error,
    selectedCategory,
    newUnlockedAchievements,
    categories,
    filteredAchievements,
    completedCount,
    totalCount,
    completionRate,
    fetchAchievements,
    fetchUnlockedAchievements,
    addNewUnlockedAchievement,
    removeNewUnlockedAchievement,
    setCategory,
    refresh,
  };
});
