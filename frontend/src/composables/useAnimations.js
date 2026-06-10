/**
 * 文件名：useAnimations.js
 * 作者：Trae AI
 * 日期：2026-06-09
 * 版本：v1.0.0
 * 功能描述：农场动画系统 composable — 集中管理种植/收获/解锁/升级/道具/掉落
 *           等所有场景的动画触发与生命周期
 * 更新记录：
 */

import { ref } from 'vue';
import soundManager from '../services/soundManager';

// ============================================================
// 道具掉落图标映射（模块级常量，避免重复定义）
// ============================================================

/** 道具 ID 到图标的映射 */
const ITEM_ICON_MAP = {
  1: '🌾', 2: '🌾', 3: '🌾',
  4: '⚡', 5: '⚡', 6: '⚡',
  7: '🌾', 8: '⚡', 9: '🍀',
  10: '⏳', 11: '🌟', 12: '🌍',
  13: '🧪', 14: '💰', 15: '📖',
  16: '📗', 17: '🎁', 18: '💊',
  19: '💊', 20: '💊',
};

/** 道具 ID 到稀有度的映射 */
const ITEM_RARITY_MAP = {
  1: 'common', 2: 'uncommon', 3: 'rare',
  4: 'common', 5: 'uncommon', 6: 'rare',
  7: 'epic', 8: 'epic', 9: 'uncommon',
  10: 'rare', 11: 'legendary', 12: 'rare',
  13: 'uncommon', 14: 'rare', 15: 'uncommon',
  16: 'uncommon', 17: 'rare', 18: 'common',
  19: 'uncommon', 20: 'rare',
};

// ============================================================
// 导出 composable 函数
// ============================================================

/**
 * 使用动画系统的 composable
 * 需要在调用方传入 landGridRef 用于 DOM 位置计算
 *
 * @param {import('vue').Ref} landGridRef - 地块网格组件引用（用于位置计算）
 * @returns {object} 动画系统 API
 */
export function useAnimations(landGridRef) {
  // ============================================================
  // 响应式状态
  // ============================================================

  /** 种植动画列表 */
  const plantAnimations = ref([]);

  /** 收获动画列表 */
  const harvestAnimations = ref([]);

  /** 解锁动画列表 */
  const unlockAnimations = ref([]);

  /** 升级动画列表 */
  const upgradeAnimations = ref([]);

  /** 道具使用动画列表 */
  const itemUseAnimations = ref([]);

  /** 道具掉落弹窗列表 */
  const itemDropPopups = ref([]);

  /** 浮动飘字列表 */
  const floatingTexts = ref([]);

  /** 地块位置缓存 */
  const landPositionsCache = ref(null);

  // 内部计数器
  let animationIdCounter = 0;
  let floatingTextIdCounter = 0;
  let lastCacheTime = 0;

  /** 位置缓存有效期（毫秒） */
  const CACHE_DURATION = 100;

  // ============================================================
  // 位置计算
  // ============================================================

  /**
   * 更新地块 DOM 位置缓存
   * 遍历所有地块单元格的 getBoundingClientRect 缓存其中心坐标
   */
  const updateLandPositionsCache = () => {
    try {
      const landGrid = landGridRef.value;
      if (landGrid && landGrid.$el) {
        const landCells = landGrid.$el.querySelectorAll('.land-cell');
        const positions = {};
        landCells.forEach((cell, index) => {
          const rect = cell.getBoundingClientRect();
          positions[index + 1] = {
            x: rect.left + rect.width / 2 + window.scrollX,
            y: rect.top + rect.height / 2 + window.scrollY,
          };
        });
        landPositionsCache.value = positions;
        lastCacheTime = Date.now();
      }
    } catch (e) {
      console.warn('无法更新地块位置缓存', e);
    }
  };

  /**
   * 获取指定地块的屏幕坐标
   * 优先使用缓存，过期或缺失则重新计算，最后回退到估算
   * @param {number} landNum - 地块序号（1-50）
   * @returns {{ x: number, y: number }} 地块中心坐标
   */
  const getLandPosition = (landNum) => {
    const now = Date.now();

    if (!landPositionsCache.value || now - lastCacheTime > CACHE_DURATION) {
      updateLandPositionsCache();
    }

    if (landPositionsCache.value && landPositionsCache.value[landNum]) {
      return landPositionsCache.value[landNum];
    }

    // 回退估算
    const rows = 10;
    const cols = 5;
    const row = Math.floor((landNum - 1) / cols);
    const col = (landNum - 1) % cols;
    const cellWidth = 90 + 10;
    const cellHeight = 90 + 10;
    const startX = window.innerWidth / 2 - (cols * cellWidth) / 2;
    const startY = 200;

    return {
      x: startX + col * cellWidth + cellWidth / 2,
      y: startY + row * cellHeight + cellHeight / 2,
    };
  };

  // ============================================================
  // 动画添加方法
  // ============================================================

  /**
   * 添加种植动画
   * @param {number} landNum - 地块序号
   */
  const addPlantAnimation = (landNum) => {
    const pos = getLandPosition(landNum);
    plantAnimations.value.push({
      id: animationIdCounter++,
      x: pos.x,
      y: pos.y,
    });
    soundManager.play('plant');
  };

  /**
   * 添加收获动画
   * @param {number} landNum - 地块序号
   * @param {boolean} showCoins - 是否显示金币效果
   */
  const addHarvestAnimation = (landNum, showCoins = true) => {
    const pos = getLandPosition(landNum);
    harvestAnimations.value.push({
      id: animationIdCounter++,
      x: pos.x,
      y: pos.y,
      showCoins: showCoins,
    });
    soundManager.play('harvest');
    if (showCoins) {
      soundManager.play('coin');
    }
  };

  /**
   * 添加解锁动画
   * @param {number} landNum - 地块序号
   */
  const addUnlockAnimation = (landNum) => {
    const pos = getLandPosition(landNum);
    unlockAnimations.value.push({
      id: animationIdCounter++,
      x: pos.x,
      y: pos.y,
    });
    soundManager.play('unlock');
  };

  /**
   * 添加品质升级动画
   * @param {number} landNum - 地块序号
   * @param {number} newQuality - 新品质 ID
   * @param {string} qualityName - 品质名称
   */
  const addUpgradeAnimation = (landNum, newQuality, qualityName) => {
    const pos = getLandPosition(landNum);
    upgradeAnimations.value.push({
      id: animationIdCounter++,
      x: pos.x,
      y: pos.y,
      newQuality: newQuality,
      qualityName: qualityName,
    });
    soundManager.play('upgrade');
  };

  /**
   * 添加道具使用动画
   * @param {string} itemName - 道具名称
   * @param {string} itemIcon - 道具图标
   * @param {string} boostText - 效果文本
   * @param {number} landNum - 地块序号
   */
  const addItemUseAnimation = (itemName, itemIcon, boostText, landNum) => {
    const pos = getLandPosition(landNum);
    itemUseAnimations.value.push({
      id: animationIdCounter++,
      x: pos.x,
      y: pos.y,
      itemName,
      itemIcon,
      boostText,
    });
    soundManager.play('item');
  };

  /**
   * 添加道具掉落弹窗
   * @param {Array} drops - 掉落道具列表 [{ itemObjId, count }]
   * @param {string} cropName - 作物名称
   * @param {number} landNum - 地块序号
   */
  const addItemDrops = (drops, cropName, landNum) => {
    if (!drops || drops.length === 0) return;

    const pos = getLandPosition(landNum);
    const now = Date.now();
    const dropId = now + Math.random();

    const dropItems = drops.map((drop) => ({
      id: `${dropId}-${drop.itemObjId}`,
      itemObjId: drop.itemObjId,
      icon: ITEM_ICON_MAP[drop.itemObjId] || '📦',
      count: drop.count || 1,
      itemName: `道具#${drop.itemObjId}`,
      rarity: ITEM_RARITY_MAP[drop.itemObjId] || 'common',
    }));

    itemDropPopups.value.push({
      id: dropId,
      x: pos.x,
      y: pos.y,
      cropName: cropName || '',
      items: dropItems,
      timestamp: Date.now(),
    });

    // 3秒后自动移除
    setTimeout(() => {
      const idx = itemDropPopups.value.findIndex((p) => p.id === dropId);
      if (idx !== -1) {
        itemDropPopups.value.splice(idx, 1);
      }
    }, 5000);
  };

  // ============================================================
  // 动画移除方法
  // ============================================================

  /**
   * 移除指定类型的动画
   * @param {string} type - 动画类型: plant | harvest | unlock | upgrade
   * @param {number} id - 动画 ID
   */
  const removeAnimation = (type, id) => {
    const animArrays = {
      plant: plantAnimations,
      harvest: harvestAnimations,
      unlock: unlockAnimations,
      upgrade: upgradeAnimations,
    };
    const array = animArrays[type];
    if (array) {
      const index = array.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        array.value.splice(index, 1);
      }
    }
  };

  /**
   * 移除道具使用动画
   * @param {number} id - 动画 ID
   */
  const removeItemUseAnimation = (id) => {
    const index = itemUseAnimations.value.findIndex((a) => a.id === id);
    if (index !== -1) {
      itemUseAnimations.value.splice(index, 1);
    }
  };

  // ============================================================
  // 浮动飘字
  // ============================================================

  /**
   * 添加浮动飘字
   * @param {string} text - 显示文字
   * @param {string} type - 类型（影响颜色）: success | error | warning | info
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   */
  const addFloatingText = (text, type, x, y) => {
    const id = floatingTextIdCounter++;
    floatingTexts.value.push({ id, text, type, x, y });
  };

  /**
   * 移除浮动飘字
   * @param {number} id - 飘字 ID
   */
  const removeFloatingText = (id) => {
    const index = floatingTexts.value.findIndex((ft) => ft.id === id);
    if (index !== -1) {
      floatingTexts.value.splice(index, 1);
    }
  };

  /**
   * 清除地块位置缓存（窗口大小变化时调用）
   */
  const clearLandCache = () => {
    landPositionsCache.value = null;
    lastCacheTime = 0;
  };

  // ============================================================
  // 返回 API
  // ============================================================

  return {
    // 响应式状态
    plantAnimations,
    harvestAnimations,
    unlockAnimations,
    upgradeAnimations,
    itemUseAnimations,
    itemDropPopups,
    floatingTexts,
    landPositionsCache,

    // 位置计算
    updateLandPositionsCache,
    getLandPosition,
    clearLandCache,

    // 动画增删
    addPlantAnimation,
    addHarvestAnimation,
    addUnlockAnimation,
    addUpgradeAnimation,
    addItemUseAnimation,
    addItemDrops,
    removeAnimation,
    removeItemUseAnimation,

    // 浮动飘字
    addFloatingText,
    removeFloatingText,
  };
}