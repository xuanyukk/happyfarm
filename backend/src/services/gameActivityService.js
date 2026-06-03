/**
 * 文件名：gameActivityService.js
 * 作者：开发者
 * 日期：2026-03-26
 * 版本：v1.0.0
 * 功能描述：游戏活动日志服务 - 记录和查询玩家游戏操作日志
 */

const pool = require('../config/db');
const logger = require('../config/logger');
const wsService = require('./websocketService');

const gameActivityService = {
  async logActivity({
    playerId,
    activityType,
    activityCategory,
    message,
    metadata = null,
  }) {
    try {
      const query = `
        INSERT INTO game_activity_log (
          player_id, activity_type, activity_category, message, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, create_time
      `;

      const values = [
        playerId,
        activityType,
        activityCategory,
        message,
        metadata ? JSON.stringify(metadata) : null,
      ];

      const result = await pool.query(query, values);
      const logId = result.rows[0].id;
      const createTime = result.rows[0].create_time;

      logger.debug('游戏活动日志记录成功', {
        logId,
        activityType,
        playerId,
      });

      const activityData = {
        id: logId,
        player_id: playerId,
        activity_type: activityType,
        activity_category: activityCategory,
        message,
        create_time: createTime,
        metadata,
      };

      wsService.sendActivityLogUpdated(playerId.toString(), activityData);

      return logId;
    } catch (error) {
      logger.error('游戏活动日志记录失败', {
        error: error.message,
        activityType,
        playerId,
      });
      throw error;
    }
  },

  async getPlayerActivities(playerId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM game_activity_log
        WHERE player_id = $1
        ORDER BY create_time DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [playerId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('获取玩家游戏活动日志失败', {
        error: error.message,
        playerId,
      });
      throw error;
    }
  },

  async getRecentActivities(playerId, limit = 20, sinceId = 0) {
    try {
      let query;
      let values;

      if (sinceId > 0) {
        // 增量更新：只获取ID大于sinceId的记录
        query = `
          SELECT 
            id,
            activity_type,
            activity_category,
            message,
            create_time
          FROM game_activity_log
          WHERE player_id = $1 AND id > $2
          ORDER BY create_time DESC
          LIMIT $3
        `;
        values = [playerId, sinceId, limit];
      } else {
        // 全量更新：获取最新的记录
        query = `
          SELECT 
            id,
            activity_type,
            activity_category,
            message,
            create_time
          FROM game_activity_log
          WHERE player_id = $1
          ORDER BY create_time DESC
          LIMIT $2
        `;
        values = [playerId, limit];
      }

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('获取玩家最近活动日志失败', {
        error: error.message,
        playerId,
      });
      throw error;
    }
  },

  async logPlant(playerId, cropName, landNum, metadata = null) {
    return this.logActivity({
      playerId,
      activityType: 'plant',
      activityCategory: 'crop',
      message: `种植了 ${cropName} 在第 ${landNum} 号地块`,
      metadata: { cropName, landNum, ...metadata },
    });
  },

  async logHarvest(
    playerId,
    cropName,
    landNum,
    yieldNum,
    exp = null,
    metadata = null
  ) {
    let message = `收获了 ${cropName} x${yieldNum} 从第 ${landNum} 号地块`;
    if (exp) {
      message += ` | 获得经验：玩家+${exp.playerExp} 农场+${exp.farmExp} 世界+${exp.worldExp}`;
    }
    return this.logActivity({
      playerId,
      activityType: 'harvest',
      activityCategory: 'crop',
      message,
      metadata: { cropName, landNum, yieldNum, exp, ...metadata },
    });
  },

  async logBuy(playerId, goodsName, quantity, totalPrice, metadata = null) {
    return this.logActivity({
      playerId,
      activityType: 'buy',
      activityCategory: 'shop',
      message: `购买了 ${goodsName} x${quantity}，花费 ${totalPrice} 农场币`,
      metadata: { goodsName, quantity, totalPrice, ...metadata },
    });
  },

  async logUnlockLand(playerId, landNum, cost, metadata = null) {
    return this.logActivity({
      playerId,
      activityType: 'unlock',
      activityCategory: 'land',
      message: `解锁了第 ${landNum} 号地块，花费 ${cost} 农场币`,
      metadata: { landNum, cost, ...metadata },
    });
  },

  async logUpgradeQuality(
    playerId,
    landNum,
    newQuality,
    cost,
    metadata = null
  ) {
    return this.logActivity({
      playerId,
      activityType: 'upgrade',
      activityCategory: 'land',
      message: `将第 ${landNum} 号地块品质提升到 ${newQuality}，花费 ${cost} 农场币`,
      metadata: { landNum, newQuality, cost, ...metadata },
    });
  },

  async logUseItem(playerId, itemName, landNum, metadata = null) {
    return this.logActivity({
      playerId,
      activityType: 'use_item',
      activityCategory: 'item',
      message: `使用了 ${itemName} 在第 ${landNum} 号地块`,
      metadata: { itemName, landNum, ...metadata },
    });
  },

  async logSell(playerId, cropName, quantity, income, metadata = null) {
    return this.logActivity({
      playerId,
      activityType: 'sell',
      activityCategory: 'currency',
      message: `出售了 ${cropName} x${quantity}，获得 ${income} 农场币`,
      metadata: { cropName, quantity, income, ...metadata },
    });
  },

  async cleanOldLogs(playerId, keepDays = 30) {
    try {
      const query = `
        DELETE FROM game_activity_log
        WHERE player_id = $1
          AND create_time < NOW() - INTERVAL '${keepDays} days'
      `;

      const result = await pool.query(query, [playerId]);
      logger.info('清理旧游戏活动日志完成', {
        deletedCount: result.rowCount,
        playerId,
      });

      return result.rowCount;
    } catch (error) {
      logger.error('清理旧游戏活动日志失败', {
        error: error.message,
        playerId,
      });
      throw error;
    }
  },
};

module.exports = gameActivityService;
