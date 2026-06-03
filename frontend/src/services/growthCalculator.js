/**
 * 文件名：growthCalculator.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：生长状态本地预计算服务
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现生长状态本地预计算功能
 */

import { logger } from './logger';
import { timeSyncService } from './timeSync';

/**
 * 生长状态本地预计算服务
 * 用于在前端自主计算作物成熟时间和生长进度，减少对后端的请求依赖
 */
class GrowthCalculator {
  constructor() {
    this.landData = new Map(); // 存储地块数据：landNum -> { plantedTime, growthCycle, harvestTime }
    this.cropData = new Map(); // 存储作物数据：cropId -> { growthCycle }
    this.initialized = false;
  }

  /**
   * 初始化生长计算器
   * @param {Array} crops 作物列表
   */
  init(crops = []) {
    logger.info('GrowthCalculator: 初始化生长状态计算器');

    // 初始化作物数据
    crops.forEach((crop) => {
      if (crop.crop_id && crop.growth_cycle) {
        this.cropData.set(crop.crop_id, {
          growthCycle: crop.growth_cycle * 1000, // 转换为毫秒
        });
      }
    });

    this.initialized = true;
    logger.info(`GrowthCalculator: 已加载 ${this.cropData.size} 种作物数据`);
  }

  /**
   * 更新作物数据
   * @param {Array} crops 作物列表
   */
  updateCrops(crops) {
    crops.forEach((crop) => {
      if (crop.crop_id && crop.growth_cycle) {
        this.cropData.set(crop.crop_id, {
          growthCycle: crop.growth_cycle * 1000,
        });
      }
    });
    logger.info(
      `GrowthCalculator: 更新作物数据，当前共 ${this.cropData.size} 种作物`
    );
  }

  /**
   * 注册地块种植信息
   * @param {number} landNum 地块编号
   * @param {Object} options 种植选项
   * @param {string} options.plantedTime 种植时间（ISO字符串）
   * @param {number} options.cropId 作物ID
   * @param {string} [options.harvestTime] 后端返回的收获时间（ISO字符串）
   */
  registerPlanting(landNum, { plantedTime, cropId, harvestTime }) {
    const cropInfo = this.cropData.get(cropId);
    if (!cropInfo) {
      logger.warn(`GrowthCalculator: 未知作物ID ${cropId}，无法注册种植信息`);
      return;
    }

    const plantedTimeMs = new Date(plantedTime).getTime();
    let calculatedHarvestTime;

    if (harvestTime) {
      // 使用后端返回的收获时间
      calculatedHarvestTime = new Date(harvestTime).getTime();
    } else {
      // 自主计算收获时间
      calculatedHarvestTime = plantedTimeMs + cropInfo.growthCycle;
    }

    this.landData.set(landNum, {
      plantedTime: plantedTimeMs,
      growthCycle: cropInfo.growthCycle,
      harvestTime: calculatedHarvestTime,
      cropId,
    });

    logger.info(
      `GrowthCalculator: 地块 ${landNum} 种植信息已注册，作物ID: ${cropId}`
    );
  }

  /**
   * 清除地块种植信息（收获或清空时）
   * @param {number} landNum 地块编号
   */
  clearLand(landNum) {
    this.landData.delete(landNum);
    logger.info(`GrowthCalculator: 地块 ${landNum} 种植信息已清除`);
  }

  /**
   * 计算地块当前生长进度
   * @param {number} landNum 地块编号
   * @returns {Object} 生长状态信息
   */
  calculateGrowth(landNum) {
    const landInfo = this.landData.get(landNum);
    if (!landInfo) {
      return {
        progress: 0,
        isMatured: false,
        timeRemaining: 0,
        harvestTime: null,
      };
    }

    const currentTime = timeSyncService.now();
    const elapsed = currentTime - landInfo.plantedTime;
    const progress = Math.min(
      100,
      Math.max(0, (elapsed / landInfo.growthCycle) * 100)
    );
    const isMatured = progress >= 100;
    const timeRemaining = Math.max(0, landInfo.harvestTime - currentTime);

    return {
      progress,
      isMatured,
      timeRemaining,
      harvestTime: landInfo.harvestTime,
    };
  }

  /**
   * 检查地块是否已成熟
   * @param {number} landNum 地块编号
   * @returns {boolean} 是否已成熟
   */
  isMatured(landNum) {
    const growth = this.calculateGrowth(landNum);
    return growth.isMatured;
  }

  /**
   * 获取成熟时间（毫秒时间戳）
   * @param {number} landNum 地块编号
   * @returns {number|null} 成熟时间戳
   */
  getHarvestTime(landNum) {
    const landInfo = this.landData.get(landNum);
    return landInfo ? landInfo.harvestTime : null;
  }

  /**
   * 获取所有已种植地块的成熟时间
   * @returns {Array} 成熟时间列表 [{ landNum, harvestTime }]
   */
  getAllHarvestTimes() {
    const result = [];
    this.landData.forEach((landInfo, landNum) => {
      result.push({
        landNum,
        harvestTime: landInfo.harvestTime,
      });
    });
    return result.sort((a, b) => a.harvestTime - b.harvestTime);
  }

  /**
   * 获取即将成熟的地块
   * @param {number} thresholdMs 阈值（毫秒），默认60秒
   * @returns {Array} 即将成熟的地块列表
   */
  getSoonToMature(thresholdMs = 60 * 1000) {
    const currentTime = timeSyncService.now();
    const result = [];

    this.landData.forEach((landInfo, landNum) => {
      const timeRemaining = landInfo.harvestTime - currentTime;
      if (timeRemaining > 0 && timeRemaining <= thresholdMs) {
        result.push({
          landNum,
          timeRemaining,
          harvestTime: landInfo.harvestTime,
        });
      }
    });

    return result.sort((a, b) => a.timeRemaining - b.timeRemaining);
  }

  /**
   * 从服务器数据批量更新地块信息
   * @param {Array} lands 地块列表
   */
  updateFromServerData(lands) {
    lands.forEach((land) => {
      if (land.crop_id && land.planted_time) {
        this.registerPlanting(land.land_num, {
          plantedTime: land.planted_time,
          cropId: land.crop_id,
          harvestTime: land.harvest_time,
        });
      } else {
        this.clearLand(land.land_num);
      }
    });
    logger.info(
      `GrowthCalculator: 从服务器数据更新了 ${lands.length} 个地块信息`
    );
  }

  /**
   * 获取计算器状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      initialized: this.initialized,
      cropCount: this.cropData.size,
      plantedLandCount: this.landData.size,
      lands: Array.from(this.landData.keys()),
    };
  }

  /**
   * 重置计算器
   */
  reset() {
    this.landData.clear();
    this.cropData.clear();
    this.initialized = false;
    logger.info('GrowthCalculator: 已重置');
  }
}

// 创建单例实例
export const growthCalculator = new GrowthCalculator();
export default growthCalculator;
