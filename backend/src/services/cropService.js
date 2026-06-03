/**
 * 文件名：cropService.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v2.5.0
 * 功能描述：作物服务，处理种植、收获、出售、作物解锁等功能
 * 更新记录：
 *   2026-03-21 - v1.1.0 - 修复数据库字段名映射，添加getUnlockedCrops函数实现作物解锁系统，添加道具效果支持
 *   2026-03-22 - v1.2.0 - 修复数据类型转换问题，添加一键收获功能
 *   2026-03-22 - v1.3.0 - 修复出售作物时余额计算的字符串拼接问题
 *   2026-03-22 - v1.4.0 - 实现完整的经验系统重构：收获作物获得三种经验，移除出售经验，添加一键收获经验获取
 *   2026-03-24 - v1.5.0 - 修复经验计算函数参数，使用正确的作物字段（world_id、growth_cycle、base_yield、sell_price）
 *   2026-03-25 - v2.0.0 - 作物收获系统优化：实现产量随机范围，使用基于作物基础经验值的经验计算方法
 *   2026-05-24 - v2.1.0 - 性能优化：harvestAllMatured合并为单事务+批量预加载作物信息+异步日志；getUnlockedCrops精确字段
 *   2026-05-31 - v2.2.0 - 修复加速剂公式：speed_boost从除法改为乘法(actualGrowthSpeed * speed_boost)，适配新数值(>1)
 *   2026-05-31 - v2.3.0 - LG-04修复：收获接口接入item_drop_config实现道具概率掉落
 *   2026-05-31 - v2.4.0 - IS-01/IS-02修复：收获时检查yield_boost_end_time过期，过期自动重置为1.0
 *   2026-05-31 - v2.5.0 - 简化收获经验计算（消除双重计算）、添加种子扣减双重保险、修复harvestAllMatured成功条件
 */

const pool = require('../config/db');
const logger = require('../config/logger');
const playerService = require('./playerService');
const gameActivityService = require('./gameActivityService');
const currencyConfigService = require('./currencyConfigService');

const calculateRandomYield = function (minYield, maxYield) {
  const safeMin = Math.max(1, parseInt(minYield) || 1);
  const safeMax = Math.max(safeMin, parseInt(maxYield) || safeMin);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};

const getItemDropConfigs = async function (sourceType, sourceId) {
  try {
    const query = `
      SELECT idc.*, ic.item_name, ic.item_type
      FROM item_drop_config idc
      JOIN item_config ic ON idc.item_id = ic.item_id
      WHERE idc.source_type = $1
        AND idc.source_id = $2
        AND idc.is_active = TRUE
    `;
    const result = await pool.query(query, [sourceType, sourceId]);
    return result.rows;
  } catch (error) {
    logger.warn('查询道具掉落配置失败', { sourceType, sourceId, error: error.message });
    return [];
  }
};

const processItemDrops = async function (client, playerId, cropId, land, playerData) {
  const drops = [];
  try {
    const dropConfigs = await getItemDropConfigs('harvest', cropId);

    for (const config of dropConfigs) {
      if (config.quality_min && land.current_quality < config.quality_min) continue;
      if (config.world_level_min && playerData.world_level < config.world_level_min) continue;
      if (config.player_level_min && playerData.player_level < config.player_level_min) continue;

      const roll = Math.random();
      if (roll <= parseFloat(config.drop_rate)) {
        const count = Math.floor(
          Math.random() * (config.max_count - config.min_count + 1)
        ) + config.min_count;

        const existingItem = await client.query(
          'SELECT id, item_num FROM player_inventory WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2 FOR UPDATE',
          [playerId, config.item_id]
        );

        if (existingItem.rows.length > 0) {
          await client.query(
            'UPDATE player_inventory SET item_num = item_num + $1, total_add = total_add + $1, last_add_time = CURRENT_TIMESTAMP WHERE player_id = $2 AND item_type = 2 AND item_obj_id = $3',
            [count, playerId, config.item_id]
          );
        } else {
          await client.query(
            'INSERT INTO player_inventory (player_id, item_type, item_obj_id, item_num, total_add, last_add_time) VALUES ($1, 2, $2, $3, $3, CURRENT_TIMESTAMP)',
            [playerId, config.item_id, count]
          );
        }

        drops.push({
          itemId: config.item_id,
          itemName: config.item_name || `道具#${config.item_id}`,
          count,
        });
      }
    }
  } catch (error) {
    logger.warn('处理道具掉落失败', { playerId, cropId, error: error.message });
  }
  return drops;
};

const getUnlockedCrops = async function (playerId, worldLevel) {
  try {
    let targetWorldLevel = worldLevel;
    let playerLevel = 1;
    let farmLevel = 1;

    if (playerId) {
      const playerQuery =
        'SELECT world_level, player_level, farm_level FROM player_base WHERE player_id = $1';
      const playerResult = await pool.query(playerQuery, [playerId]);
      if (playerResult.rows.length > 0) {
        if (!targetWorldLevel) {
          targetWorldLevel = playerResult.rows[0].world_level;
        }
        playerLevel = playerResult.rows[0].player_level;
        farmLevel = playerResult.rows[0].farm_level;
      }
    }

    if (!targetWorldLevel) {
      targetWorldLevel = 1;
    }

    const query = `
      SELECT crop_id, crop_name, world_id, growth_cycle, base_yield,
             min_yield, max_yield, seed_cost, sell_price, 
             player_exp_base, farm_exp_base, world_exp_base,
             unlock_player_level, unlock_farm_level, crop_type,
             gp_per_min
      FROM crop 
      WHERE world_id <= $1 
        AND unlock_player_level <= $2 
        AND unlock_farm_level <= $3
      ORDER BY crop_id
    `;
    const result = await pool.query(query, [
      targetWorldLevel,
      playerLevel,
      farmLevel,
    ]);
    return result.rows;
  } catch (error) {
    logger.error('获取作物列表失败', {
      playerId,
      worldLevel,
      error: error.message,
    });
    throw error;
  }
};

const plantCrop = async function (playerId, landNum, cropId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const landQuery = `
      SELECT pls.*, lq.yield_rate, lq.grow_speed
      FROM player_land_status pls
      JOIN land_quality lq ON pls.current_quality = lq.quality_id
      WHERE pls.player_id = $1 AND pls.land_num = $2 FOR UPDATE
    `;
    const landResult = await client.query(landQuery, [playerId, landNum]);

    if (landResult.rows.length === 0) {
      throw new Error('地块不存在');
    }

    const land = landResult.rows[0];

    if (!land.is_unlocked) {
      throw new Error('地块未解锁');
    }

    if (land.crop_id !== null) {
      throw new Error('地块已种植作物');
    }

    const cropQuery = 'SELECT * FROM crop WHERE crop_id = $1';
    const cropResult = await client.query(cropQuery, [parseInt(cropId)]);

    if (cropResult.rows.length === 0) {
      throw new Error('作物不存在');
    }

    const crop = cropResult.rows[0];

    // 验证作物解锁条件
    const playerInfoQuery = `
      SELECT world_level, player_level, farm_level 
      FROM player_base 
      WHERE player_id = $1
    `;
    const playerInfoResult = await client.query(playerInfoQuery, [playerId]);
    const playerInfo = playerInfoResult.rows[0];

    if (!playerInfo) {
      throw new Error('玩家信息不存在');
    }

    if (playerInfo.world_level < crop.world_id) {
      throw new Error(`需要世界等级 ${crop.world_id} 才能种植该作物`);
    }
    if (playerInfo.player_level < crop.unlock_player_level) {
      throw new Error(
        `需要玩家等级 ${crop.unlock_player_level} 才能种植该作物`
      );
    }
    if (playerInfo.farm_level < crop.unlock_farm_level) {
      throw new Error(`需要农场等级 ${crop.unlock_farm_level} 才能种植该作物`);
    }

    const inventoryQuery = `
      SELECT item_num FROM player_inventory 
      WHERE player_id = $1 AND item_type = 1 AND item_obj_id = $2 FOR UPDATE
    `;
    const inventoryResult = await client.query(inventoryQuery, [
      playerId,
      cropId,
    ]);

    if (
      inventoryResult.rows.length === 0 ||
      inventoryResult.rows[0].item_num < 1
    ) {
      throw new Error('种子不足');
    }

    await client.query(
      `UPDATE player_inventory 
       SET item_num = item_num - 1, 
           total_use = total_use + 1,
           last_use_time = CURRENT_TIMESTAMP
       WHERE player_id = $1 AND item_type = 1 AND item_obj_id = $2 AND item_num >= 1`,
      [playerId, parseInt(cropId)]
    );

    let actualGrowthSpeed = parseFloat(land.grow_speed);
    
    // speed_boost: 1.0=正常速度, >1.0=加速倍率, 值越大越快
    // IS-02修复：检查speed_boost_end_time过期，过期不应用加速效果
    if (land.speed_boost && land.speed_boost > 1.0) {
      if (!land.speed_boost_end_time || new Date(land.speed_boost_end_time) > new Date()) {
        actualGrowthSpeed = actualGrowthSpeed * parseFloat(land.speed_boost);
      }
    }
    
    const actualGrowthCycle = Math.floor(
      parseInt(crop.growth_cycle) / actualGrowthSpeed
    );

    const harvestTime = new Date(Date.now() + actualGrowthCycle * 60 * 1000);
    await client.query(
      `UPDATE player_land_status 
       SET crop_id = $1, 
           status = 'planting',
           planted_time = CURRENT_TIMESTAMP,
           harvest_time = $2
       WHERE player_id = $3 AND land_num = $4`,
      [parseInt(cropId), harvestTime, playerId, landNum]
    );

    await client.query('COMMIT');
    logger.info('作物种植成功', {
      playerId,
      landNum,
      cropId,
      cropName: crop.crop_name,
    });

    try {
      await gameActivityService.logPlant(playerId, crop.crop_name, landNum);
    } catch (logError) {
      logger.warn('记录种植活动日志失败', { error: logError.message });
    }

    return {
      success: true,
      landNum,
      cropId,
      cropName: crop.crop_name,
      harvestTime,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('作物种植失败', {
      playerId,
      landNum,
      cropId,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

const harvestCrop = async function (playerId, landNum) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const landQuery = `
      SELECT pls.*, lq.yield_rate
      FROM player_land_status pls
      JOIN land_quality lq ON pls.current_quality = lq.quality_id
      WHERE pls.player_id = $1 AND pls.land_num = $2 FOR UPDATE
    `;
    const landResult = await client.query(landQuery, [playerId, landNum]);

    if (landResult.rows.length === 0) {
      throw new Error('地块不存在');
    }

    const land = landResult.rows[0];

    if (land.crop_id === null) {
      throw new Error('地块未种植作物');
    }

    if (new Date(land.harvest_time) > new Date()) {
      throw new Error('作物尚未成熟');
    }

    const now = new Date();
    const harvestTime = new Date(land.harvest_time);
    const overdueMs = now - harvestTime;
    const overdueHours = overdueMs / (1000 * 60 * 60);

    if (overdueHours >= 48) {
      await client.query(
        `UPDATE player_land_status 
         SET crop_id = NULL, status = 'idle', planted_time = NULL, harvest_time = NULL
         WHERE player_id = $1 AND land_num = $2`,
        [playerId, landNum]
      );
      await client.query('COMMIT');
      throw new Error('作物已枯萎，超过48小时未收获，地块已重置');
    }

    const cropQuery = 'SELECT * FROM crop WHERE crop_id = $1';
    const cropResult = await client.query(cropQuery, [land.crop_id]);
    const crop = cropResult.rows[0];

    let randomYield = calculateRandomYield(crop.min_yield, crop.max_yield);
    let actualYield = Math.floor(randomYield * parseFloat(land.yield_rate));
    
    /*
     * IS-01 修复说明：增产效果过期检查
     * - 问题：增产剂(道具ID:1-3,7)和丰收之神(道具ID:11)设置yield_boost后无过期检查
     * - 影响：过期增产效果在收获时仍然生效
     * - 修复：检查yield_boost_end_time是否已过期
     *   - yield_boost_end_time为null表示永久效果（兼容旧数据）
     *   - 仅当效果未过期时才应用增产倍率
     *   - 过期效果被静默跳过，不阻断收获流程
     */
    if (land.yield_boost && land.yield_boost !== 1.0) {
      if (!land.yield_boost_end_time || new Date(land.yield_boost_end_time) > new Date()) {
        actualYield = Math.floor(actualYield * parseFloat(land.yield_boost));
      }
    }
    
    // 应用幸运种子效果（50%概率双倍收益）
    let luckyApplied = false;
    if (land.lucky_seed_active) {
      if (Math.random() < 0.5) {
        actualYield = actualYield * 2;
        luckyApplied = true;
      }
    }
    
    // 保存经验药水状态（事务外使用）
    const expPotionActive = land.exp_potion_active;

    const inventoryCheck = await client.query(
      `SELECT id FROM player_inventory 
       WHERE player_id = $1 AND item_type = 3 AND item_obj_id = $2`,
      [playerId, land.crop_id]
    );

    if (inventoryCheck.rows.length > 0) {
      await client.query(
        `UPDATE player_inventory 
         SET item_num = item_num + $1, 
             total_add = total_add + $1,
             last_add_time = CURRENT_TIMESTAMP
         WHERE player_id = $2 AND item_type = 3 AND item_obj_id = $3`,
        [actualYield, playerId, land.crop_id]
      );
    } else {
      await client.query(
        `INSERT INTO player_inventory 
         (player_id, item_type, item_obj_id, item_num, total_add, last_add_time)
         VALUES ($1, 3, $2, $3, $3, CURRENT_TIMESTAMP)`,
        [playerId, land.crop_id, actualYield]
      );
    }

    // 重置道具状态
    await client.query(
      `UPDATE player_land_status 
       SET crop_id = NULL, 
           status = 'idle',
           planted_time = NULL,
           harvest_time = NULL,
           last_harvest_time = CURRENT_TIMESTAMP,
           yield_boost = 1.0,
           speed_boost = 1.0,
           speed_boost_end_time = NULL,
           lucky_seed_active = FALSE,
           exp_potion_active = FALSE
       WHERE player_id = $1 AND land_num = $2`,
      [playerId, landNum]
    );

    const playerData = await playerService.getPlayerData(playerId);
    const droppedItems = await processItemDrops(
      client, playerId, land.crop_id, land, playerData
    );

    await client.query('COMMIT');
    
    let playerExp = playerService.calculatePlayerExpByCrop(
      crop.player_exp_base,
      actualYield,
      land.current_quality
    );
    let farmExp = playerService.calculateFarmExpByCrop(
      crop.farm_exp_base,
      actualYield
    );
    let worldExp = playerService.calculateWorldExpByCrop(
      crop.world_exp_base,
      actualYield,
      playerData.world_level
    );
    
    if (expPotionActive) {
      playerExp = playerExp * 2;
      farmExp = farmExp * 2;
      worldExp = worldExp * 2;
    }

    await playerService.addExp(playerId, playerExp, farmExp, worldExp);
    const upgradeResult = await playerService.checkAndUpgradeLevel(playerId);

    logger.info('作物收获成功', {
      playerId,
      landNum,
      cropId: land.crop_id,
      yield: actualYield,
      playerExp,
      farmExp,
      worldExp,
    });

    try {
      await gameActivityService.logHarvest(
        playerId,
        crop.crop_name,
        landNum,
        actualYield,
        {
          playerExp,
          farmExp,
          worldExp,
        }
      );
    } catch (logError) {
      logger.warn('记录收获活动日志失败', { error: logError.message });
    }

    return {
      success: true,
      landNum,
      cropId: land.crop_id,
      cropName: crop.crop_name,
      yield: actualYield,
      exp: {
        playerExp,
        farmExp,
        worldExp,
      },
      upgrade: upgradeResult,
      itemDrops: droppedItems,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('作物收获失败', { playerId, landNum, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

const sellCrop = async function (playerId, cropId, quantity) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inventoryQuery = `
      SELECT item_num FROM player_inventory 
      WHERE player_id = $1 AND item_type = 3 AND item_obj_id = $2 FOR UPDATE
    `;
    const inventoryResult = await client.query(inventoryQuery, [
      playerId,
      parseInt(cropId),
    ]);

    if (
      inventoryResult.rows.length === 0 ||
      inventoryResult.rows[0].item_num < quantity
    ) {
      throw new Error('作物库存不足');
    }

    const cropQuery =
      'SELECT sell_price, crop_name FROM crop WHERE crop_id = $1';
    const cropResult = await client.query(cropQuery, [parseInt(cropId)]);
    const crop = cropResult.rows[0];
    const totalIncome = parseInt(crop.sell_price) * quantity;

    const currencyQuery = `
      SELECT currency_num FROM player_currency 
      WHERE player_id = $1 FOR UPDATE
    `;
    const currencyResult = await client.query(currencyQuery, [playerId]);
    if (currencyResult.rows.length === 0) {
      throw new Error('玩家货币数据不存在');
    }

    const currencyBefore = parseInt(currencyResult.rows[0].currency_num);

    // 校验货币上限
    const holdCheck = await currencyConfigService.validateCurrencyAdd(
      playerId, totalIncome, 1
    );
    const actualIncome = holdCheck.actualAdd;
    if (holdCheck.isExceeded) {
      logger.warn('出售作物超出货币持有上限，自动截断', {
        playerId,
        cropId,
        totalIncome,
        actualIncome,
        maxHold: holdCheck.maxHold,
        currencyBefore,
      });
    }

    const currencyAfter = currencyBefore + actualIncome;

    await client.query(
      `UPDATE player_inventory 
       SET item_num = item_num - $1, 
           total_use = total_use + $1,
           last_use_time = CURRENT_TIMESTAMP
       WHERE player_id = $2 AND item_type = 3 AND item_obj_id = $3`,
      [quantity, playerId, parseInt(cropId)]
    );

    await client.query(
      `UPDATE player_currency 
       SET currency_num = currency_num + $1, 
           total_earn = total_earn + $1,
           daily_earn = daily_earn + $1,
           last_earn_time = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [actualIncome, playerId]
    );

    await client.query(
      `INSERT INTO player_currency_log 
       (player_id, type, amount, source, related_id, balance_before, balance_after)
       VALUES ($1, 1, $2, $3, $4, $5, $6)`,
      [
        playerId,
        actualIncome,
        'crop_sell',
        parseInt(cropId),
        currencyBefore,
        currencyAfter,
      ]
    );

    await client.query('COMMIT');
    logger.info('作物出售成功', {
      playerId,
      cropId,
      cropName: crop.crop_name,
      quantity,
      income: actualIncome,
    });

    try {
      await gameActivityService.logSell(
        playerId,
        crop.crop_name,
        quantity,
        actualIncome
      );
    } catch (logError) {
      logger.warn('记录出售活动日志失败', { error: logError.message });
    }

    return {
      success: true,
      cropId,
      cropName: crop.crop_name,
      quantity,
      income: actualIncome,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('作物出售失败', {
      playerId,
      cropId,
      quantity,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

const sellBatchCrops = async function (playerId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('出售列表不能为空');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inventoryQuery = `
      SELECT item_obj_id, item_num FROM player_inventory 
      WHERE player_id = $1 AND item_type = 3 AND item_num > 0 FOR UPDATE
    `;
    const inventoryResult = await client.query(inventoryQuery, [playerId]);
    const inventoryMap = new Map();
    inventoryResult.rows.forEach((row) => {
      inventoryMap.set(row.item_obj_id, parseInt(row.item_num));
    });

    const cropIds = [...new Set(items.map((i) => parseInt(i.cropId)))];
    const cropsResult = await client.query(
      'SELECT crop_id, sell_price, crop_name FROM crop WHERE crop_id = ANY($1::int[])',
      [cropIds]
    );
    const cropMap = new Map();
    cropsResult.rows.forEach((c) => {
      cropMap.set(c.crop_id, c);
    });

    let totalIncome = 0;
    const soldDetails = [];
    const failedDetails = [];

    for (const item of items) {
      const cropId = parseInt(item.cropId);
      const quantity = parseInt(item.quantity) || 1;

      if (!cropMap.has(cropId)) {
        failedDetails.push({ cropId, reason: '作物不存在' });
        continue;
      }
      const currentStock = inventoryMap.get(cropId) || 0;
      if (currentStock < quantity) {
        failedDetails.push({
          cropId,
          reason: `库存不足(需求${quantity}, 库存${currentStock})`,
        });
        continue;
      }
      const crop = cropMap.get(cropId);
      const income = parseInt(crop.sell_price) * quantity;
      totalIncome += income;
      soldDetails.push({
        cropId,
        cropName: crop.crop_name,
        quantity,
        income,
      });
      inventoryMap.set(cropId, currentStock - quantity);
    }

    if (soldDetails.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: true,
        sold: [],
        failed: failedDetails,
        totalIncome: 0,
        message: '没有可出售的作物',
      };
    }

    const currencyQuery = `
      SELECT currency_num FROM player_currency 
      WHERE player_id = $1 FOR UPDATE
    `;
    const currencyResult = await client.query(currencyQuery, [playerId]);
    if (currencyResult.rows.length === 0) {
      throw new Error('玩家货币数据不存在');
    }
    const currencyBefore = parseInt(currencyResult.rows[0].currency_num);

    const holdCheck = await currencyConfigService.validateCurrencyAdd(
      playerId, totalIncome, 1
    );
    const actualIncome = holdCheck.actualAdd;
    const currencyAfter = currencyBefore + actualIncome;

    for (const detail of soldDetails) {
      await client.query(
        `UPDATE player_inventory 
         SET item_num = item_num - $1, 
             total_use = total_use + $1,
             last_use_time = CURRENT_TIMESTAMP
         WHERE player_id = $2 AND item_type = 3 AND item_obj_id = $3`,
        [detail.quantity, playerId, detail.cropId]
      );
    }

    await client.query(
      `UPDATE player_currency 
       SET currency_num = currency_num + $1, 
           total_earn = total_earn + $1,
           daily_earn = daily_earn + $1,
           last_earn_time = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [actualIncome, playerId]
    );

    await client.query(
      `INSERT INTO player_currency_log 
       (player_id, type, amount, source, related_id, balance_before, balance_after)
       VALUES ($1, 1, $2, $3, $4, $5, $6)`,
      [
        playerId,
        actualIncome,
        'batch_sell',
        0,
        currencyBefore,
        currencyAfter,
      ]
    );

    await client.query('COMMIT');

    for (const detail of soldDetails) {
      try {
        await gameActivityService.logSell(
          playerId, detail.cropName, detail.quantity, detail.income
        );
      } catch (logError) {
        logger.warn('记录出售活动日志失败', { error: logError.message });
      }
    }

    return {
      success: true,
      sold: soldDetails,
      failed: failedDetails,
      totalIncome: actualIncome,
      message: `成功出售${soldDetails.length}种作物，收入${actualIncome}金币`,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('批量出售失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

const harvestAllMatured = async function (playerId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const landsQuery = `
      SELECT pls.*, lq.yield_rate
      FROM player_land_status pls
      JOIN land_quality lq ON pls.current_quality = lq.quality_id
      WHERE pls.player_id = $1 
        AND pls.is_unlocked = true 
        AND pls.crop_id IS NOT NULL
        AND pls.harvest_time <= CURRENT_TIMESTAMP
      FOR UPDATE
    `;
    const landsResult = await client.query(landsQuery, [playerId]);

    if (landsResult.rows.length === 0) {
      await client.query('COMMIT');
      return {
        success: true,
        harvested: [],
        failed: [],
        totalYield: 0,
        totalExp: { playerExp: 0, farmExp: 0, worldExp: 0 },
        message: '没有成熟的作物可以收获',
      };
    }

    // 批量预加载作物信息
    const cropIds = [...new Set(
      landsResult.rows.map(l => l.crop_id)
    )];
    const cropsResult = await client.query(
      'SELECT * FROM crop WHERE crop_id = ANY($1::int[])',
      [cropIds]
    );
    const cropMap = new Map(
      cropsResult.rows.map(c => [c.crop_id, c])
    );

    const harvested = [];
    const failed = [];
    let totalYield = 0;
    let totalPlayerExp = 0;
    let totalFarmExp = 0;
    let totalWorldExp = 0;
    const allItemDrops = [];

    const playerData = await playerService.getPlayerData(playerId);

    for (const land of landsResult.rows) {
      try {
        const crop = cropMap.get(land.crop_id);
        if (!crop) {
          failed.push({ landNum: land.land_num,
                        error: '作物数据不存在' });
          continue;
        }

        const overdueHours =
          (new Date() - new Date(land.harvest_time)) / (1000 * 60 * 60);
        if (overdueHours >= 48) {
          await client.query(
            `UPDATE player_land_status 
             SET crop_id = NULL, status = 'idle', planted_time = NULL, harvest_time = NULL
             WHERE player_id = $1 AND land_num = $2`,
            [playerId, land.land_num]
          );
          failed.push({ landNum: land.land_num,
                        error: '作物已枯萎超过48小时' });
          continue;
        }

        let randomYield = calculateRandomYield(
          crop.min_yield,
          crop.max_yield
        );
        let actualYield = Math.floor(
          randomYield * parseFloat(land.yield_rate)
        );
        
        /*
         * IS-01 修复说明：增产效果过期检查（同一键收获）
         * - 与 harvestCrop 中相同的过期检查逻辑
         * - 确保一键收获时也不会应用已过期的增产效果
         */
        if (land.yield_boost && land.yield_boost !== 1.0) {
          if (!land.yield_boost_end_time || new Date(land.yield_boost_end_time) > new Date()) {
            actualYield = Math.floor(actualYield * parseFloat(land.yield_boost));
          }
        }
        
        // 应用幸运种子效果（50%概率双倍收益）
        let luckyApplied = false;
        if (land.lucky_seed_active) {
          if (Math.random() < 0.5) {
            actualYield = actualYield * 2;
            luckyApplied = true;
          }
        }
        
        // 计算经验
        const expPotionActive = land.exp_potion_active;
        let playerExp = playerService.calculatePlayerExpByCrop(
          crop.player_exp_base,
          actualYield,
          land.current_quality
        );
        let farmExp = playerService.calculateFarmExpByCrop(
          crop.farm_exp_base,
          actualYield
        );
        let worldExp = playerService.calculateWorldExpByCrop(
          crop.world_exp_base,
          actualYield,
          playerData.world_level
        );
        
        // 应用经验药水效果
        if (expPotionActive) {
          playerExp = playerExp * 2;
          farmExp = farmExp * 2;
          worldExp = worldExp * 2;
        }

        const inventoryCheck = await client.query(
          `SELECT id FROM player_inventory 
           WHERE player_id = $1 AND item_type = 3 AND item_obj_id = $2`,
          [playerId, land.crop_id]
        );

        if (inventoryCheck.rows.length > 0) {
          await client.query(
            `UPDATE player_inventory 
             SET item_num = item_num + $1, 
                 total_add = total_add + $1,
                 last_add_time = CURRENT_TIMESTAMP
             WHERE player_id = $2 AND item_type = 3 AND item_obj_id = $3`,
            [actualYield, playerId, land.crop_id]
          );
        } else {
          await client.query(
            `INSERT INTO player_inventory 
             (player_id, item_type, item_obj_id, item_num, total_add, last_add_time)
             VALUES ($1, 3, $2, $3, $3, CURRENT_TIMESTAMP)`,
            [playerId, land.crop_id, actualYield]
          );
        }

        // 重置道具状态
        await client.query(
          `UPDATE player_land_status 
           SET crop_id = NULL, 
               status = 'idle',
               planted_time = NULL,
               harvest_time = NULL,
               last_harvest_time = CURRENT_TIMESTAMP,
               yield_boost = 1.0,
               speed_boost = 1.0,
               speed_boost_end_time = NULL,
               lucky_seed_active = FALSE,
               exp_potion_active = FALSE
           WHERE player_id = $1 AND land_num = $2`,
          [playerId, land.land_num]
        );

        const droppedItems = await processItemDrops(
          client, playerId, land.crop_id, land, playerData
        );
        if (droppedItems.length > 0) {
          allItemDrops.push({
            landNum: land.land_num,
            cropName: crop.crop_name,
            items: droppedItems,
          });
        }

        totalYield += actualYield;
        totalPlayerExp += playerExp;
        totalFarmExp += farmExp;
        totalWorldExp += worldExp;

        harvested.push({
          landNum: land.land_num,
          cropId: land.crop_id,
          cropName: crop.crop_name,
          yield: actualYield,
          exp: { playerExp, farmExp, worldExp },
        });

        // 异步日志（非阻塞）
        gameActivityService.logHarvest(
          playerId,
          crop.crop_name,
          land.land_num,
          actualYield,
          {
            playerExp,
            farmExp,
            worldExp,
          }
        ).catch(err => logger.warn('记录收获活动日志失败', { error: err.message }));
      } catch (error) {
        failed.push({
          landNum: land.land_num,
          error: error.message,
        });
      }
    }

    await client.query('COMMIT');

    if (totalPlayerExp > 0) {
      await playerService.addExp(
        playerId,
        totalPlayerExp,
        totalFarmExp,
        totalWorldExp
      );
      await playerService.checkAndUpgradeLevel(playerId);
    }

    logger.info('一键收获完成', {
      playerId,
      harvestedCount: harvested.length,
      failedCount: failed.length,
      totalYield,
      totalPlayerExp,
      totalFarmExp,
      totalWorldExp,
    });

    let message = `成功收获 ${harvested.length} 块作物！`;
    if (failed.length > 0) {
      message += ` 失败 ${failed.length} 块`;
    }

    return {
      success: harvested.length > 0,
      harvested,
      failed,
      totalYield,
      totalExp: {
        playerExp: totalPlayerExp,
        farmExp: totalFarmExp,
        worldExp: totalWorldExp,
      },
      itemDrops: allItemDrops,
      message,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('一键收获失败', { playerId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getUnlockedCrops,
  plantCrop,
  harvestCrop,
  harvestAllMatured,
  sellCrop,
  sellBatchCrops,
};
