/**
 * 文件名：incrementalController.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：四层核心刷新架构 - 后端增量数据控制器
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建
 */

const logger = require('../config/logger.js');
const db = require('../config/db.js');

class IncrementalController {
  constructor() {
    logger.info('IncrementalController 初始化完成');
  }

  async getIncrementalData(req, res) {
    try {
      const { lastSyncTime } = req.query;
      const playerId = req.user.id;

      logger.debug(
        `获取增量数据，玩家: ${playerId}, 上次同步: ${lastSyncTime}`
      );

      const syncTime = lastSyncTime
        ? new Date(parseInt(lastSyncTime))
        : new Date(0);

      const lands = await this.getChangedLands(playerId, syncTime);
      const playerInfo = await this.getPlayerInfoIfChanged(playerId, syncTime);
      const currency = await this.getCurrencyIfChanged(playerId, syncTime);
      const achievements = await this.getNewAchievements(playerId, syncTime);

      const hasChanges =
        lands.length > 0 || playerInfo || currency || achievements.length > 0;

      const response = {
        success: true,
        data: {
          hasChanges,
          lands,
          playerInfo,
          currency,
          achievements,
          timestamp: Date.now(),
        },
      };

      if (hasChanges) {
        logger.info(`增量数据获取成功，${lands.length} 个地块变化`);
      } else {
        logger.debug('无增量数据变化');
      }

      res.json(response);
    } catch (error) {
      logger.error('获取增量数据失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INCREMENTAL_FETCH_FAILED',
          message: '获取增量数据失败',
        },
      });
    }
  }

  async getChangedLands(playerId, sinceTime) {
    try {
      const query = `
        SELECT 
          pls.land_num as landId,
          pls.current_quality as qualityId,
          pls.is_unlocked as isUnlocked,
          pls.crop_id as cropId,
          pls.planted_at as plantedAt,
          pls.harvest_at as harvestAt,
          c.crop_name as cropName,
          lq.quality_name as qualityName,
          lq.yield_rate as yieldRate,
          pls.updated_at as updatedAt
        FROM player_land_status pls
        LEFT JOIN crop c ON pls.crop_id = c.crop_id
        LEFT JOIN land_quality lq ON pls.current_quality = lq.quality_id
        WHERE pls.player_id = $1
          AND pls.updated_at > $2
        ORDER BY pls.land_num
      `;

      const result = await db.query(query, [playerId, sinceTime]);

      return result.rows.map((row) => ({
        landId: row.landid,
        changeType: this.detectChangeType(row),
        newState: {
          landId: row.landid,
          isUnlocked: row.isunlocked,
          qualityId: row.qualityid,
          qualityName: row.qualityname,
          yieldRate: row.yieldrate,
          cropId: row.cropid,
          cropName: row.cropname,
          plantedAt: row.plantedat,
          harvestAt: row.harvestat,
          isMatured: row.harvestat
            ? new Date(row.harvestat) <= new Date()
            : false,
          growthProgress: this.calculateGrowthProgress(
            row.plantedat,
            row.harvestat
          ),
        },
      }));
    } catch (error) {
      logger.error('获取变化地块失败:', error);
      return [];
    }
  }

  detectChangeType(row) {
    if (!row.isunlocked) {
      return 'unlocked';
    }
    if (!row.cropid) {
      return 'harvested';
    }
    if (row.qualityid > 1) {
      return 'qualityUpgraded';
    }
    return 'planted';
  }

  calculateGrowthProgress(plantedAt, harvestAt) {
    if (!plantedAt || !harvestAt) {
      return 0;
    }

    const now = Date.now();
    const planted = new Date(plantedAt).getTime();
    const harvest = new Date(harvestAt).getTime();
    const total = harvest - planted;
    const elapsed = now - planted;

    if (total <= 0) {
      return 100;
    }

    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  async getPlayerInfoIfChanged(playerId, sinceTime) {
    try {
      const query = `
        SELECT 
          player_level as playerLevel,
          farm_level as farmLevel,
          world_level as worldLevel,
          player_exp as playerExp,
          updated_at as updatedAt
        FROM player_base
        WHERE player_id = $1
          AND updated_at > $2
      `;

      const result = await db.query(query, [playerId, sinceTime]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          playerLevel: row.playerlevel,
          farmLevel: row.farmlevel,
          worldLevel: row.worldlevel,
          playerExp: row.playerexp,
        };
      }

      return null;
    } catch (error) {
      logger.error('获取玩家信息变化失败:', error);
      return null;
    }
  }

  async getCurrencyIfChanged(playerId, sinceTime) {
    try {
      const query = `
        SELECT 
          currency_num as currencyNum,
          total_earn as totalEarn,
          total_spend as totalSpend,
          updated_at as updatedAt
        FROM player_currency
        WHERE player_id = $1
          AND updated_at > $2
      `;

      const result = await db.query(query, [playerId, sinceTime]);

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          currencyNum: row.currencynum,
          totalEarn: row.totalearn,
          totalSpend: row.totalspend,
        };
      }

      return null;
    } catch (error) {
      logger.error('获取货币变化失败:', error);
      return null;
    }
  }

  async getNewAchievements(playerId, sinceTime) {
    try {
      const query = `
        SELECT 
          pa.achievement_id as achievementId,
          a.achievement_name as achievementName,
          a.achievement_desc as achievementDesc,
          pa.unlocked_at as unlockedAt
        FROM player_achievement pa
        JOIN achievement a ON pa.achievement_id = a.achievement_id
        WHERE pa.player_id = $1
          AND pa.unlocked_at > $2
        ORDER BY pa.unlocked_at DESC
      `;

      const result = await db.query(query, [playerId, sinceTime]);

      return result.rows.map((row) => ({
        achievementId: row.achievementid,
        achievementName: row.achievementname,
        achievementDesc: row.achievementdesc,
        unlockedAt: row.unlockedat,
      }));
    } catch (error) {
      logger.error('获取新成就失败:', error);
      return [];
    }
  }
}

module.exports = new IncrementalController();
