/**
 * 文件名：farmService.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v1.5.0
 * 功能描述：农场服务，处理地块解锁、状态查询、品质提升等
 * 更新记录：
 *   2026-03-21 - v1.1.0 - 修复数据库字段名映射，添加upgradeLandQuality函数实现8档品质提升功能
 *   2026-03-22 - v1.2.0 - 修复解锁地块的货币日志参数错误
 *   2026-03-23 - v1.3.0 - 获取地块时返回完整解锁要求信息（玩家等级、农场等级、世界等级）
 *   2026-03-28 - v1.4.0 - 【阶段二完成】品质提升功能完整实现，支持8档品质逐块覆盖
 *   2026-05-30 - v1.5.0 - getPlayerLands增加产量预估(min_yield/max_yield/base_yield)和道具效果剩余时间
 */

const pool = require('../config/db');
const logger = require('../config/logger');
const gameActivityService = require('./gameActivityService');

const getPlayerLands = async function (playerId) {
  try {
    const query = `
      SELECT 
        pls.*,
        fl.unlock_cost,
        fl.unlock_player_level,
        fl.unlock_farm_level,
        fl.unlock_world_level,
        fl.description,
        lq.quality_name,
        lq.yield_rate,
        lq.grow_speed,
        c.crop_name,
        c.min_yield,
        c.max_yield,
        c.base_yield,
        CASE
          WHEN pls.yield_boost_end_time IS NOT NULL AND pls.yield_boost_end_time > NOW()
            THEN EXTRACT(EPOCH FROM (pls.yield_boost_end_time - NOW()))::INTEGER
          ELSE NULL
        END AS yield_boost_remaining,
        CASE
          WHEN pls.speed_boost_end_time IS NOT NULL AND pls.speed_boost_end_time > NOW()
            THEN EXTRACT(EPOCH FROM (pls.speed_boost_end_time - NOW()))::INTEGER
          ELSE NULL
        END AS speed_boost_remaining
      FROM player_land_status pls
      LEFT JOIN farm_land fl ON pls.land_num = fl.land_num
      LEFT JOIN land_quality lq ON pls.current_quality = lq.quality_id
      LEFT JOIN crop c ON pls.crop_id = c.crop_id
      WHERE pls.player_id = $1
      ORDER BY pls.land_num
    `;
    const result = await pool.query(query, [playerId]);
    return result.rows;
  } catch (error) {
    logger.error('获取玩家地块失败', { playerId, error: error.message });
    throw error;
  }
};

const unlockLand = async function (playerId, landNum) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const landQuery = 'SELECT unlock_cost FROM farm_land WHERE land_num = $1';
    const landResult = await client.query(landQuery, [landNum]);

    if (landResult.rows.length === 0) {
      throw new Error('地块不存在');
    }

    const unlockCost = parseInt(landResult.rows[0].unlock_cost);

    const statusQuery =
      'SELECT is_unlocked FROM player_land_status WHERE player_id = $1 AND land_num = $2';
    const statusResult = await client.query(statusQuery, [playerId, landNum]);

    if (statusResult.rows[0].is_unlocked) {
      throw new Error('地块已解锁');
    }

    const currencyQuery =
      'SELECT currency_num FROM player_currency WHERE player_id = $1 FOR UPDATE';
    const currencyResult = await client.query(currencyQuery, [playerId]);

    const currentCurrency = parseInt(currencyResult.rows[0].currency_num);

    if (currentCurrency < unlockCost) {
      throw new Error('农场币不足');
    }

    const currencyBefore = currentCurrency;
    const currencyAfter = currencyBefore - unlockCost;

    await client.query(
      `UPDATE player_currency 
       SET currency_num = currency_num - $1, 
           total_spend = total_spend + $1,
           daily_spend = daily_spend + $1,
           last_spend_time = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [unlockCost, playerId]
    );

    await client.query(
      `INSERT INTO player_currency_log 
       (player_id, type, amount, source, related_id, balance_before, balance_after)
       VALUES ($1, 2, $2, $3, $4, $5, $6)`,
      [
        playerId,
        unlockCost,
        'land_unlock',
        landNum,
        currencyBefore,
        currencyAfter,
      ]
    );

    await client.query(
      `UPDATE player_land_status 
       SET is_unlocked = TRUE, unlock_time = CURRENT_TIMESTAMP
       WHERE player_id = $1 AND land_num = $2`,
      [playerId, landNum]
    );

    await client.query(
      `UPDATE player_base 
       SET unlocked_land_num = unlocked_land_num + 1
       WHERE player_id = $1`,
      [playerId]
    );

    await client.query('COMMIT');
    logger.info('地块解锁成功', { playerId, landNum, cost: unlockCost });

    try {
      await gameActivityService.logUnlockLand(playerId, landNum, unlockCost);
    } catch (logError) {
      logger.warn('记录解锁地块活动日志失败', { error: logError.message });
    }

    return { success: true, landNum, cost: unlockCost };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('地块解锁失败', { playerId, landNum, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

const upgradeLandQuality = async function (playerId, landNum, targetQualityId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const qualityQuery = 'SELECT * FROM land_quality WHERE quality_id = $1';
    const qualityResult = await client.query(qualityQuery, [targetQualityId]);

    if (qualityResult.rows.length === 0) {
      throw new Error('品质不存在');
    }

    const targetQuality = qualityResult.rows[0];

    const landStatusQuery = `
      SELECT pls.*, pb.player_level, pb.farm_level, pb.world_level
      FROM player_land_status pls
      JOIN player_base pb ON pls.player_id = pb.player_id
      WHERE pls.player_id = $1 AND pls.land_num = $2
      FOR UPDATE
    `;
    const landStatusResult = await client.query(landStatusQuery, [
      playerId,
      landNum,
    ]);

    if (landStatusResult.rows.length === 0) {
      throw new Error('地块不存在');
    }

    const currentLand = landStatusResult.rows[0];

    if (!currentLand.is_unlocked) {
      throw new Error('地块未解锁');
    }

    if (currentLand.current_quality >= targetQualityId) {
      throw new Error('地块品质已达到或超过目标品质');
    }

    if (currentLand.player_level < targetQuality.unlock_player_level) {
      throw new Error(
        `玩家等级不足，需要${targetQuality.unlock_player_level}级`
      );
    }
    if (currentLand.farm_level < targetQuality.unlock_farm_level) {
      throw new Error(`农场等级不足，需要${targetQuality.unlock_farm_level}级`);
    }
    if (currentLand.world_level < targetQuality.unlock_world_level) {
      throw new Error(
        `世界等级不足，需要${targetQuality.unlock_world_level}级`
      );
    }

    if (currentLand.current_quality + 1 !== targetQualityId) {
      throw new Error('必须逐品质升级，不能跳级');
    }

    // 从普通品质升级到铜品质：需要所有50块普通品质地块达到5星
    if (currentLand.current_quality === 1 && targetQualityId === 2) {
      const allLandsResult = await client.query(
        `SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE current_quality = 1 AND star_level >= 5) as full_star
         FROM player_land_status
         WHERE player_id = $1`,
        [playerId]
      );
      const { total, full_star } = allLandsResult.rows[0];
      if (parseInt(full_star) < parseInt(total)) {
        throw new Error(
          `需要所有普通品质地块达到五星后才能升级为铜品质（当前: ${full_star}/${total}）`
        );
      }
    }

    if (targetQuality.cover_cost_type !== 2) {
      throw new Error('当前品质仅支持农场币覆盖');
    }

    const coverCost = parseInt(targetQuality.cover_cost_num);

    const currencyQuery =
      'SELECT currency_num FROM player_currency WHERE player_id = $1 FOR UPDATE';
    const currencyResult = await client.query(currencyQuery, [playerId]);

    const currentCurrency = parseInt(currencyResult.rows[0].currency_num);

    if (currentCurrency < coverCost) {
      throw new Error('农场币不足');
    }

    const currencyBefore = currentCurrency;
    const currencyAfter = currencyBefore - coverCost;

    await client.query(
      `UPDATE player_currency 
       SET currency_num = currency_num - $1, 
           total_spend = total_spend + $1,
           daily_spend = daily_spend + $1,
           last_spend_time = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [coverCost, playerId]
    );

    await client.query(
      `INSERT INTO player_currency_log 
       (player_id, type, amount, source, related_id, balance_before, balance_after)
       VALUES ($1, 2, $2, $3, $4, $5, $6)`,
      [
        playerId,
        coverCost,
        'quality_cover',
        targetQualityId,
        currencyBefore,
        currencyAfter,
      ]
    );

    await client.query(
      `UPDATE player_land_status 
       SET current_quality = $1, cover_time = CURRENT_TIMESTAMP
       WHERE player_id = $2 AND land_num = $3`,
      [targetQualityId, playerId, landNum]
    );

    await client.query(
      `UPDATE player_base 
       SET covered_land_num = covered_land_num + 1,
           current_land_quality = GREATEST(current_land_quality, $1)
       WHERE player_id = $2`,
      [targetQualityId, playerId]
    );

    await client.query('COMMIT');
    logger.info('地块品质提升成功', {
      playerId,
      landNum,
      targetQualityId,
      qualityName: targetQuality.quality_name,
      cost: coverCost,
    });

    try {
      await gameActivityService.logUpgradeQuality(
        playerId,
        landNum,
        targetQuality.quality_name,
        coverCost
      );
    } catch (logError) {
      logger.warn('记录提升品质活动日志失败', { error: logError.message });
    }

    return {
      success: true,
      landNum,
      qualityId: targetQualityId,
      qualityName: targetQuality.quality_name,
      cost: coverCost,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('地块品质提升失败', {
      playerId,
      landNum,
      targetQualityId,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

const upgradeLandStar = async (playerId, landNum) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const landResult = await client.query(
      `SELECT pls.*, pb.player_level
       FROM player_land_status pls
       JOIN player_base pb ON pls.player_id = pb.player_id
       WHERE pls.player_id = $1 AND pls.land_num = $2`,
      [playerId, landNum]
    );

    if (landResult.rows.length === 0) {
      throw new Error('地块不存在');
    }

    const land = landResult.rows[0];

    if (!land.is_unlocked) {
      throw new Error('地块未解锁');
    }

    if (land.star_level >= 5) {
      throw new Error('已达到五星，无法继续提升');
    }

    const targetStar = land.star_level + 1;

    const starConfigResult = await client.query(
      `SELECT * FROM land_quality_star
       WHERE quality_id = $1 AND star_level = $2`,
      [land.current_quality, targetStar]
    );

    if (starConfigResult.rows.length === 0) {
      throw new Error('星级配置不存在');
    }

    const starConfig = starConfigResult.rows[0];

    if (land.player_level < starConfig.unlock_player_level) {
      throw new Error(
        `玩家等级不足，需要${starConfig.unlock_player_level}级`
      );
    }

    const cost = parseInt(starConfig.upgrade_cost);
    if (cost <= 0) {
      throw new Error('当前星级无法升级');
    }

    const currencyResult = await client.query(
      'SELECT currency_num FROM player_currency WHERE player_id = $1 FOR UPDATE',
      [playerId]
    );
    const currentCurrency = parseInt(currencyResult.rows[0].currency_num);
    if (currentCurrency < cost) {
      throw new Error(`金币不足，需要${cost}金币`);
    }

    await client.query(
      `UPDATE player_currency
       SET currency_num = currency_num - $1,
           total_spend = total_spend + $1,
           last_spend_time = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [cost, playerId]
    );

    await client.query(
      `UPDATE player_land_status
       SET star_level = $1, update_time = CURRENT_TIMESTAMP
       WHERE player_id = $2 AND land_num = $3`,
      [targetStar, playerId, landNum]
    );

    await client.query('COMMIT');

    return {
      success: true,
      landNum,
      qualityId: land.current_quality,
      newStarLevel: targetStar,
      starName: starConfig.star_name,
      yieldBonus: parseFloat(starConfig.yield_bonus),
      speedBonus: parseFloat(starConfig.speed_bonus),
      cost,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('地块星级提升失败', {
      playerId,
      landNum,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

const getLandStarConfigs = async (qualityId) => {
  try {
    const result = await pool.query(
      `SELECT * FROM land_quality_star
       WHERE quality_id = $1
       ORDER BY star_level`,
      [qualityId]
    );
    return result.rows;
  } catch (error) {
    logger.error('获取星级配置失败', { qualityId, error: error.message });
    throw error;
  }
};

module.exports = {
  getPlayerLands,
  unlockLand,
  upgradeLandQuality,
  upgradeLandStar,
  getLandStarConfigs,
};
