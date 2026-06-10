/**
 * 文件名：shop.js
 * 作者：开发者
 * 日期：2026-03-20
 * 版本：v1.3.0
 * 功能描述：商店状态管理
 * 更新记录：
 *   2026-03-22 - v1.3.0 - 修复API调用，添加inventory状态
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { gameService } from '../services/gameService';

export const useShopStore = defineStore('shop', () => {
  const goods = ref([]);
  const inventory = ref({
    seeds: [],
    crops: [],
    items: [],
  });
  const loading = ref(false);
  const error = ref(null);

  const fetchGoods = async () => {
    loading.value = true;
    error.value = null;
    try {
      const result = await gameService.getShopGoods();
      if (result.success) {
        goods.value = result.data;
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
    } finally {
      loading.value = false;
    }
  };

  const fetchInventory = async () => {
    loading.value = true;
    error.value = null;
    try {
      const result = await gameService.getInventory();
      if (result.success) {
        inventory.value = result.data || { seeds: [], crops: [], items: [] };
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
    } finally {
      loading.value = false;
    }
  };

  const buyGoods = async (goodsId, quantity) => {
    try {
      const result = await gameService.buyGoods(goodsId, quantity);
      if (result.success) {
        await fetchInventory();
        await fetchGoods();
      }
      return result;
    } catch (err) {
      console.error('购买商品失败', err);
      throw err;
    }
  };

  const sellCrop = async (itemId, quantity) => {
    try {
      const result = await gameService.sellCrop(itemId, quantity);
      if (result.success) {
        await fetchInventory();
      }
      return result;
    } catch (err) {
      console.error('出售作物失败', err);
      throw err;
    }
  };

  return {
    goods,
    inventory,
    loading,
    error,
    fetchGoods,
    fetchInventory,
    buyGoods,
    sellCrop,
  };
});
