/**
 * 文件名：gameService.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v1.4.0
 * 功能描述：游戏API服务
 * 更新记录：
 *   2026-03-21 - v1.1.0 - 添加等级系统、品质提升、道具使用等API调用
 *   2026-03-22 - v1.1.1 - 添加货币流水查询API调用
 *   2026-03-22 - v1.2.0 - 添加一键收获API调用
 *   2026-03-26 - v1.3.0 - 添加游戏活动日志API调用
 *   2026-04-30 - v1.4.0 - 添加成就和队列管理API调用
 */

import api from './api';

export const gameService = {
  async getPlayerData() {
    const response = await api.get('/player/data');
    return response.data;
  },

  async getPlayerInfo() {
    const response = await api.get('/player/info');
    return response.data;
  },

  async getLevelProgress() {
    const response = await api.get('/player/level-progress');
    return response.data;
  },

  async checkAndUpgrade() {
    const response = await api.post('/player/check-upgrade');
    return response.data;
  },

  async unlockWorldLevel(targetWorldLevel) {
    const response = await api.post('/player/unlock-world-level', {
      targetWorldLevel,
    });
    return response.data;
  },

  async updateAvatar(avatar) {
    const response = await api.post('/player/update-avatar', { avatar });
    return response.data;
  },

  async getLands() {
    const response = await api.get('/farm/lands');
    return response.data;
  },

  async unlockLand(landNum) {
    const response = await api.post(`/farm/lands/${landNum}/unlock`, {
      landNum,
    });
    return response.data;
  },

  async upgradeLandQuality(landNum, targetQualityId) {
    const response = await api.post(`/farm/lands/${landNum}/quality`, {
      targetQualityId,
    });
    return response.data;
  },

  async getCrops() {
    const response = await api.get('/crops');
    return response.data;
  },

  async plantCrop(landNum, cropId) {
    const response = await api.post('/crops/plant', { landNum, cropId });
    return response.data;
  },

  async harvestCrop(landNum) {
    const response = await api.post(`/crops/${landNum}/harvest`, { landNum });
    return response.data;
  },

  async harvestAllMatured() {
    const response = await api.post('/crops/harvest-all');
    return response.data;
  },

  async sellCrop(cropId, quantity) {
    const response = await api.post('/crops/sell', { cropId, quantity });
    return response.data;
  },

  async getShopGoods() {
    const response = await api.get('/shop/goods');
    return response.data;
  },

  async getInventory() {
    const response = await api.get('/shop/inventory');
    return response.data;
  },

  async buyGoods(goodsId, quantity) {
    const response = await api.post('/shop/buy', { goodsId, quantity });
    return response.data;
  },

  async getAvailableItems() {
    const response = await api.get('/items/available');
    return response.data;
  },

  async useItem(itemId, landNum) {
    const response = await api.post('/items/use', { itemId, landNum });
    return response.data;
  },

  async getCurrencyLogs(page = 1, limit = 20, changeType = null) {
    const params = { page, limit };
    if (changeType) {
      params.changeType = changeType;
    }
    const response = await api.get('/economy/logs', { params });
    return response.data;
  },

  async getEarningsStats(startDate = null, endDate = null) {
    const params = {};
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    const response = await api.get('/economy/stats/earnings', { params });
    return response.data;
  },

  async getSpendingsStats(startDate = null, endDate = null) {
    const params = {};
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    const response = await api.get('/economy/stats/spendings', { params });
    return response.data;
  },

  async getRecentActivities(limit = 20, sinceId = 0) {
    const params = { limit };
    if (sinceId > 0) {
      params.since_id = sinceId;
    }
    const response = await api.get('/game-activities/recent', { params });
    return response.data;
  },

  async getAllActivities(limit = 50, offset = 0) {
    const response = await api.get('/game-activities/all', {
      params: { limit, offset },
    });
    return response.data;
  },

  // ========== 成就系统 API ==========
  async getAchievements() {
    const response = await api.get('/achievements');
    return response.data;
  },

  async getUnlockedAchievements() {
    const response = await api.get('/achievements/unlocked');
    return response.data;
  },

  // ========== 队列管理 API ==========
  async getQueueStats() {
    const response = await api.get('/queue/stats');
    return response.data;
  },

  async getQueueStatsByName(queueName) {
    const response = await api.get(`/queue/${queueName}/stats`);
    return response.data;
  },

  async getJobStatus(queueName, jobId) {
    const response = await api.get(`/queue/${queueName}/job/${jobId}`);
    return response.data;
  },

  async addEmailJob(data) {
    const response = await api.post('/queue/email', data);
    return response.data;
  },

  async addNotificationJob(data) {
    const response = await api.post('/queue/notification', data);
    return response.data;
  },

  async addBackupJob(data = {}) {
    const response = await api.post('/queue/backup', data);
    return response.data;
  },

  async addCacheInvalidationJob(data) {
    const response = await api.post('/queue/cache-invalidation', data);
    return response.data;
  },

  async getStamina() {
    const response = await api.get('/player/stamina');
    return response.data;
  },

  async recoverStamina() {
    const response = await api.post('/player/stamina/recover');
    return response.data;
  },

  async getOfflineRewards() {
    const response = await api.get('/player/offline-rewards');
    return response.data;
  },

  async upgradeLandStar(landNum) {
    const response = await api.post(`/farm/lands/${landNum}/star`);
    return response.data;
  },

  async getLandStarConfigs(qualityId) {
    const response = await api.get(`/farm/star-configs/${qualityId}`);
    return response.data;
  },

  async getInventorySlots() {
    const response = await api.get('/shop/inventory-slots');
    return response.data;
  },
};
