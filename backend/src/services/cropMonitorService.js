/**
 * 文件名：cropMonitorService.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：作物成熟监测服务
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现作物成熟监测和推送功能
 */

const pool = require('../config/db');
const logger = require('../config/logger');
const websocketService = require('./websocketService');

/**
 * 作物成熟监测服务
 * 定期检查作物成熟状态，并通过WebSocket推送成熟事件
 */
class CropMonitorService {
  constructor() {
    this.checkInterval = null;
    this.isRunning = false;
    this.monitoredPlayers = new Set();
    this.checkIntervalMs = 5000; // 每5秒检查一次
  }

  /**
   * 启动监测服务
   */
  start() {
    if (this.isRunning) {
      logger.warn('CropMonitorService: 监测服务已在运行中');
      return;
    }

    this.isRunning = true;
    logger.info('CropMonitorService: 启动作物成熟监测服务');

    // 启动定期检查
    this.checkInterval = setInterval(() => {
      this.checkMaturedCrops();
    }, this.checkIntervalMs);

    // 立即执行一次检查
    this.checkMaturedCrops();
  }

  /**
   * 停止监测服务
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    logger.info('CropMonitorService: 监测服务已停止');
  }

  /**
   * 检查即将成熟的作物
   */
  async checkMaturedCrops() {
    const client = await pool.connect();
    try {
      const now = new Date();

      // 查询刚成熟的作物（在最近一个检查周期内成熟的）
      const query = `
        SELECT 
          pls.player_id,
          pls.land_num,
          pls.crop_id,
          c.crop_name,
          pls.harvest_time,
          pls.notified_mature
        FROM player_land_status pls
        JOIN crop c ON pls.crop_id = c.crop_id
        WHERE 
          pls.crop_id IS NOT NULL
          AND pls.harvest_time <= $1
          AND pls.notified_mature = FALSE
      `;

      const result = await client.query(query, [now]);

      if (result.rows.length > 0) {
        logger.info(
          `CropMonitorService: 发现 ${result.rows.length} 个刚成熟的作物`
        );

        // 处理每个成熟的作物
        for (const row of result.rows) {
          await this.handleMaturedCrop(client, row);
        }
      }
    } catch (error) {
      logger.error('CropMonitorService: 检查成熟作物失败', {
        error: error.message,
      });
    } finally {
      client.release();
    }
  }

  /**
   * 处理单个成熟的作物
   * @param {Object} client 数据库连接
   * @param {Object} cropData 作物数据
   */
  async handleMaturedCrop(client, cropData) {
    const { player_id, land_num, crop_id, crop_name, harvest_time } = cropData;

    try {
      // 更新通知状态
      const updateQuery = `
        UPDATE player_land_status 
        SET notified_mature = TRUE
        WHERE player_id = $1 AND land_num = $2
      `;
      await client.query(updateQuery, [player_id, land_num]);

      // 推送成熟事件给用户
      this.pushMatureEvent(player_id, {
        landNum: land_num,
        cropId: crop_id,
        cropName: crop_name,
        harvestTime: harvest_time,
      });

      logger.info('CropMonitorService: 作物成熟事件已推送', {
        playerId: player_id,
        landNum: land_num,
        cropName: crop_name,
      });
    } catch (error) {
      logger.error('CropMonitorService: 处理成熟作物失败', {
        playerId: player_id,
        landNum: land_num,
        error: error.message,
      });
    }
  }

  /**
   * 推送作物成熟事件
   * @param {string} userId 用户ID
   * @param {Object} data 成熟事件数据
   */
  pushMatureEvent(userId, data) {
    // 通过WebSocket推送
    const pushed = websocketService.sendToUser(
      userId.toString(),
      'crop_matured',
      data
    );

    if (!pushed) {
      logger.warn('CropMonitorService: WebSocket推送失败，用户未连接', {
        userId,
      });
    }
  }

  /**
   * 当用户种植作物时调用，添加到监测
   * @param {string} userId 用户ID
   * @param {number} landNum 地块编号
   */
  onCropPlanted(userId, landNum) {
    this.monitoredPlayers.add(userId.toString());
    logger.debug('CropMonitorService: 用户种植作物，添加到监测', {
      userId,
      landNum,
    });
  }

  /**
   * 当用户收获作物时调用
   * @param {string} userId 用户ID
   * @param {number} landNum 地块编号
   */
  onCropHarvested(userId, landNum) {
    logger.debug('CropMonitorService: 用户收获作物', { userId, landNum });
  }

  /**
   * 获取服务状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkIntervalMs: this.checkIntervalMs,
      monitoredPlayerCount: this.monitoredPlayers.size,
    };
  }
}

// 创建单例实例
const cropMonitorService = new CropMonitorService();

module.exports = cropMonitorService;
