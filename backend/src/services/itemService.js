/**
 * 文件名: itemService.js
 * 作者: Trae AI
 * 日期: 2026-05-13
 * 版本: v2.11.0
 * 功能描述: 道具服务 - 完整的30种道具功能实现（含二期扩展）
 * 更新记录:
 *   2026-05-24 - v2.6.0 - 性能优化：useTimeHourglass循环UPDATE改为批量单条SQL
 *   2026-05-31 - v2.7.0 - 修复useStaminaPotion体力上限
 *   2026-05-31 - v2.8.0 - IS-02:useHarvestGod设置yield_boost_end_time等
 *   2026-05-31 - v2.9.0 - 方案B：新增10种道具类型（21-30）
 *   2026-06-09 - v2.10.0 - 时间字段统一：update_time → updated_at
 *   2026-06-10 - v2.11.0 - useYieldBoost/useSpeedBoost叠加而非覆盖（乘法，上限2.5x/5x）；
 *             useHarvestGod仅对无独立增产效果地块生效
 */

const pool = require('../config/db');
const logger = require('../utils/logger-advanced');
const { getPlayer, checkAndUpgradeLevel } = require('./playerService');
const configService = require('./configService');
const itemUsageLogService = require('./itemUsageLogService');

/**
 * 道具类型定义
 */
const ITEM_TYPES = {
  YIELD_BOOST_1: 1, // 初级增产剂
  YIELD_BOOST_2: 2, // 中级增产剂
  YIELD_BOOST_3: 3, // 高级增产剂
  SPEED_BOOST_1: 4, // 初级加速剂
  SPEED_BOOST_2: 5, // 中级加速剂
  SPEED_BOOST_3: 6, // 高级加速剂
  YIELD_BOOST_4: 7, // 超级增产剂
  SPEED_BOOST_4: 8, // 超级加速剂
  LUCKY_SEED: 9, // 幸运种子
  TIME_HOURGLASS: 10, // 时光沙漏
  HARVEST_GOD: 11, // 丰收之神
  LAND_BLESSING: 12, // 土地祝福
  EXP_POTION: 13, // 经验药水
  GOLD_BAG: 14, // 金币袋
  MYSTERY_BOX: 15, // 神秘宝箱
  FARM_BOOK: 16, // 农场手册
  WORLD_BOOK: 17, // 世界之书
  STAMINA_POTION_1: 18, // 体力药水
  STAMINA_POTION_2: 19, // 高级体力药水
  STAMINA_POTION_3: 20, // 超级体力药水
  // 二期新增道具（方案B）
  WATERING_BOOST_1: 21, // 青铜水壶
  WATERING_BOOST_2: 22, // 银质水壶
  WATERING_BOOST_3: 23, // 金质水壶
  FERTILIZE_BOOST: 24, // 超级肥料包
  HARVEST_BOOST: 25, // 丰收镰刀
  SKIN_SPRING: 26, // 春日农场皮肤
  SKIN_SUMMER: 27, // 夏日农场皮肤
  SKIN_AUTUMN: 28, // 秋日农场皮肤
  DECORATION_FENCE: 29, // 木栅栏
  DECORATION_SCARECROW: 30, // 稻草人
};

/**
 * 获取玩家道具库存
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Array>}
 */
const getPlayerInventory = async function (playerId) {
  logger.info('获取玩家道具库存', { playerId });
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      SELECT 
        pi.*, 
        ic.item_name, 
        ic.item_desc,
        ic.item_type,
        ic.effect_value,
        ic.effect_duration
      FROM player_inventory pi
      INNER JOIN item_config ic ON pi.item_obj_id = ic.item_id
      WHERE pi.player_id = $1 AND pi.item_type = 2 AND pi.item_num > 0
      ORDER BY pi.updated_at DESC
    `,
      [playerId]
    );
    logger.info('获取玩家道具库存成功', {
      playerId,
      count: result.rows.length,
    });
    return result.rows;
  } catch (error) {
    logger.error('获取玩家道具库存失败', { playerId, error: error.message });
    throw new Error('获取道具库存失败');
  } finally {
    client.release();
  }
};

/**
 * 获取玩家可用道具列表（与getPlayerInventory功能相同）
 * @param {string} playerId - 玩家ID
 * @returns {Promise<Array>}
 */
const getAvailableItems = async function (playerId) {
  return getPlayerInventory(playerId);
};

/**
 * 使用道具
 * @param {string} playerId - 玩家ID
 * @param {number} itemId - 道具ID
 * @param {number} [landNum] - 地块序号（部分道具需要）
 * @returns {Promise<Object>}
 */
const useItem = async function (playerId, itemId, landNum = null) {
  logger.info('使用道具', { playerId, itemId, landNum });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 获取道具信息
    const itemResult = await client.query(
      'SELECT * FROM item_config WHERE item_id = $1',
      [itemId]
    );
    if (itemResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('道具不存在');
    }
    const item = itemResult.rows[0];

    // 2. 检查库存
    const inventoryResult = await client.query(
      'SELECT * FROM player_inventory WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2',
      [playerId, itemId]
    );
    if (
      inventoryResult.rows.length === 0 ||
      inventoryResult.rows[0].item_num < 1
    ) {
      await client.query('ROLLBACK');
      throw new Error('道具库存不足');
    }

    // 3. 根据道具类型执行不同逻辑
    let result;
    switch (item.item_type) {
      case ITEM_TYPES.YIELD_BOOST_1:
      case ITEM_TYPES.YIELD_BOOST_2:
      case ITEM_TYPES.YIELD_BOOST_3:
      case ITEM_TYPES.YIELD_BOOST_4:
        result = await useYieldBoost(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.SPEED_BOOST_1:
      case ITEM_TYPES.SPEED_BOOST_2:
      case ITEM_TYPES.SPEED_BOOST_3:
      case ITEM_TYPES.SPEED_BOOST_4:
        result = await useSpeedBoost(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.LUCKY_SEED:
        result = await useLuckySeed(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.TIME_HOURGLASS:
        result = await useTimeHourglass(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.HARVEST_GOD:
        result = await useHarvestGod(client, playerId, item);
        break;

      case ITEM_TYPES.LAND_BLESSING:
        result = await useLandBlessing(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.EXP_POTION:
        result = await useExpPotion(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.GOLD_BAG:
        result = await useGoldBag(client, playerId, item);
        break;

      case ITEM_TYPES.MYSTERY_BOX:
        result = await useMysteryBox(client, playerId, item);
        break;

      case ITEM_TYPES.FARM_BOOK:
        result = await useFarmBook(client, playerId, item);
        break;

      case ITEM_TYPES.WORLD_BOOK:
        result = await useWorldBook(client, playerId, item);
        break;

      case ITEM_TYPES.STAMINA_POTION_1:
      case ITEM_TYPES.STAMINA_POTION_2:
      case ITEM_TYPES.STAMINA_POTION_3:
        result = await useStaminaPotion(client, playerId, item);
        break;

      case ITEM_TYPES.WATERING_BOOST_1:
      case ITEM_TYPES.WATERING_BOOST_2:
      case ITEM_TYPES.WATERING_BOOST_3:
        result = await useWateringBoost(client, playerId, item);
        break;

      case ITEM_TYPES.FERTILIZE_BOOST:
        result = await useFertilizeBoost(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.HARVEST_BOOST:
        result = await useHarvestBoost(client, playerId, item, landNum);
        break;

      case ITEM_TYPES.SKIN_SPRING:
      case ITEM_TYPES.SKIN_SUMMER:
      case ITEM_TYPES.SKIN_AUTUMN:
        result = await useSkin(client, playerId, item);
        break;

      case ITEM_TYPES.DECORATION_FENCE:
      case ITEM_TYPES.DECORATION_SCARECROW:
        result = await useDecoration(client, playerId, item, landNum);
        break;

      default:
        await client.query('ROLLBACK');
        throw new Error('暂不支持该道具');
    }

    // 4. 扣除道具
    await client.query(
      `
      UPDATE player_inventory 
      SET item_num = item_num - 1, total_use = total_use + 1, last_use_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2
    `,
      [playerId, itemId]
    );

    await client.query('COMMIT');
    logger.info('使用道具成功', { playerId, itemId, itemType: item.item_type });

    const inventoryBefore = inventoryResult.rows[0]
      ? inventoryResult.rows[0].item_num
      : 0;
    const inventoryAfter = Math.max(0, inventoryBefore - 1);
    try {
      await itemUsageLogService.logUsage({
        playerId,
        itemId,
        itemName: item.item_name,
        quantity: 1,
        usageScene: landNum ? 'farm_land' : 'inventory',
        landNum: landNum || null,
        result: 'success',
        effectDetail: {
          item_type: item.item_type,
          effect_value: item.effect_value,
          effect_duration: item.effect_duration,
        },
        inventoryBefore,
        inventoryAfter,
      });
    } catch (logErr) {
      logger.warn('道具使用日志写入失败（不影响游戏流程）', {
        playerId,
        itemId,
        error: logErr.message,
      });
    }

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('使用道具失败', { playerId, itemId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 使用增产剂
 * IS-01 修复说明：添加 yield_boost_end_time 过期机制
 * - useYieldBoost/itemId 1-3,7：增产剂使用后设置过期时间
 * - effect_duration 默认30分钟，到期后增产效果自动失效
 * - 过期设置在 cropService.harvestCrop/harvestAllMatured 中检查
 */
const useYieldBoost = async function (client, playerId, item, landNum) {
  if (!landNum) {
    throw new Error('请选择要使用道具的地块');
  }

  // 检查地块
  const landResult = await client.query(
    'SELECT * FROM player_land_status WHERE player_id = $1 AND land_num = $2',
    [playerId, landNum]
  );
  if (landResult.rows.length === 0) {
    throw new Error('地块不存在');
  }
  const land = landResult.rows[0];

  if (land.crop_id === null) {
    throw new Error('增产剂只能用于已种植作物的地块');
  }

  // 计算增产效果结束时间（默认30分钟）
  const durationMinutes = item.effect_duration || 30;
  const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);

  // 叠加逻辑：若旧效果未过期，乘法叠加（上限2.5x）
  let finalBoost = parseFloat(item.effect_value);
  const existingBoost = parseFloat(land.yield_boost) || 1.0;
  const existingEnd = land.yield_boost_end_time ? new Date(land.yield_boost_end_time) : null;
  if (existingBoost !== 1.0 && existingEnd && existingEnd > new Date()) {
    finalBoost = Math.min(existingBoost * finalBoost, 2.5);
  }

  // 应用增产效果
  await client.query(
    `
    UPDATE player_land_status 
    SET yield_boost = $1, yield_boost_end_time = $2, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $3 AND land_num = $4
  `,
    [finalBoost, endTime, playerId, landNum]
  );

  return {
    message: existingBoost !== 1.0 && existingEnd && existingEnd > new Date()
      ? `成功使用${item.item_name}，产量提升叠加至${Math.round((finalBoost - 1) * 100)}%，持续${durationMinutes}分钟`
      : `成功使用${item.item_name}，产量提升${Math.round((finalBoost - 1) * 100)}%，持续${durationMinutes}分钟`,
    landNum,
    yieldBoost: finalBoost,
    endTime,
  };
};

/**
 * 使用加速剂
 */
const useSpeedBoost = async function (client, playerId, item, landNum) {
  if (!landNum) {
    throw new Error('请选择要使用道具的地块');
  }

  // 检查地块
  const landResult = await client.query(
    'SELECT * FROM player_land_status WHERE player_id = $1 AND land_num = $2',
    [playerId, landNum]
  );
  if (landResult.rows.length === 0) {
    throw new Error('地块不存在');
  }
  const land = landResult.rows[0];

  if (land.crop_id === null) {
    throw new Error('加速剂只能用于已种植作物的地块');
  }

  // 计算加速结束时间
  const endTime = new Date(Date.now() + item.effect_duration * 60 * 1000);

  // 叠加逻辑：若旧加速效果未过期，乘法叠加（上限5x）
  let finalSpeed = parseFloat(item.effect_value);
  const existingSpeed = parseFloat(land.speed_boost) || 1.0;
  const existingSpeedEnd = land.speed_boost_end_time ? new Date(land.speed_boost_end_time) : null;
  if (existingSpeed !== 1.0 && existingSpeedEnd && existingSpeedEnd > new Date()) {
    finalSpeed = Math.min(existingSpeed * finalSpeed, 5.0);
  }

  // 速度加成: 1.0=正常, 10.0=10倍速, amount > 1.0 时 growthCycle /= speed_boost
  await client.query(
    `
    UPDATE player_land_status 
    SET speed_boost = $1, speed_boost_end_time = $2, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $3 AND land_num = $4
  `,
    [finalSpeed, endTime, playerId, landNum]
  );

  return {
    message: existingSpeed !== 1.0 && existingSpeedEnd && existingSpeedEnd > new Date()
      ? `成功使用${item.item_name}，生长速度叠加至${finalSpeed.toFixed(1)}x，持续${item.effect_duration}分钟`
      : `成功使用${item.item_name}，生长速度提升至${finalSpeed.toFixed(1)}x，持续${item.effect_duration}分钟`,
    landNum,
    speedBoost: item.effect_value,
    endTime,
  };
};

/**
 * 使用幸运种子
 */
const useLuckySeed = async function (client, playerId, item, landNum) {
  if (!landNum) {
    throw new Error('请选择要使用道具的地块');
  }

  // 检查地块
  const landResult = await client.query(
    'SELECT * FROM player_land_status WHERE player_id = $1 AND land_num = $2',
    [playerId, landNum]
  );
  if (landResult.rows.length === 0) {
    throw new Error('地块不存在');
  }
  const land = landResult.rows[0];

  if (land.crop_id === null) {
    throw new Error('幸运种子只能用于已种植作物的地块');
  }

  // 从配置系统读取双倍概率
  const doubleChance = configService.getConfig('LUCKY_SEED_DOUBLE_CHANCE', 0.5);
  const chancePercent = Math.round(doubleChance * 100);

  // 激活幸运种子效果
  await client.query(
    `
    UPDATE player_land_status 
    SET lucky_seed_active = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $1 AND land_num = $2
  `,
    [playerId, landNum]
  );

  return {
    message: `成功使用${item.item_name}，收获时有${chancePercent}%几率获得双倍收益`,
    landNum,
    luckySeedActive: true,
  };
};

/**
 * 使用时光沙漏 - 立即成熟所有作物
 * IS-04 修复说明：添加地块种植状态校验
 * - 原问题：未校验地块状态，可对空地块/已成熟/已枯萎地块使用
 * - 修复：指定地块时校验状态必须为 'planting'
 *   - harvestable → 提示"该地块作物已经成熟"
 *   - withered → 提示"该地块作物已枯萎"
 *   - idle → 提示"该地块作物无需加速"
 */
const useTimeHourglass = async function (client, playerId, item, landNum) {
  if (landNum) {
    const landResult = await client.query(
      'SELECT * FROM player_land_status WHERE player_id = $1 AND land_num = $2',
      [playerId, landNum]
    );
    if (landResult.rows.length === 0) {
      throw new Error('地块不存在');
    }
    const land = landResult.rows[0];
    if (!land.crop_id) {
      throw new Error('该地块未种植作物');
    }
    if (land.status !== 'planting') {
      throw new Error(
        land.status === 'harvestable'
          ? '该地块作物已经成熟'
          : land.status === 'withered'
            ? '该地块作物已枯萎'
            : '该地块作物无需加速'
      );
    }

    await client.query(
      `UPDATE player_land_status 
       SET status = 'harvestable', 
          harvest_time = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE player_id = $1 AND land_num = $2`,
     [playerId, landNum]
    );

    return {
      message: `成功使用${item.item_name}，地块${landNum}的作物已立即成熟`,
      landNum,
      updatedCount: 1,
    };
  }

  const countResult = await client.query(
    `SELECT COUNT(*) as cnt FROM player_land_status 
     WHERE player_id = $1 AND status = 'planting' AND crop_id IS NOT NULL`,
    [playerId]
  );
  const plantingCount = parseInt(countResult.rows[0].cnt);
  if (plantingCount === 0) {
    throw new Error('没有正在生长的作物，无需使用时光沙漏');
  }

  const result = await client.query(
    `UPDATE player_land_status 
     SET status = 'harvestable', 
        harvest_time = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $1 AND status = 'planting' AND crop_id IS NOT NULL
    RETURNING id`,
   [playerId]
  );

  const updatedCount = result.rowCount;

  return {
    message: `成功使用${item.item_name}，${updatedCount}块地块的作物已立即成熟`,
    updatedCount,
  };
};

/**
 * 使用丰收之神 - 配置时间内所有作物产量增加配置倍数
 * IS-02 修复说明：添加 yield_boost_end_time 过期清理机制
 * - 原问题：丰收之神无过期时间，全局永久生效
 * - 修复：设置 yield_boost_end_time（默认24小时后过期）
 * - 过期后在 cropService 收获时自动跳过增产效果
 */
const useHarvestGod = async function (client, playerId, item) {
  const durationHours = configService.getConfig('HARVEST_GOD_DURATION', 24);
  const yieldBoost = configService.getConfig('HARVEST_GOD_YIELD_BOOST', 1.5);
  const endTime = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  await client.query(
    `
    UPDATE player_land_status 
    SET yield_boost = $1,
        yield_boost_end_time = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $3 AND is_unlocked = TRUE
      AND (yield_boost = 1.0 OR yield_boost IS NULL OR yield_boost_end_time <= CURRENT_TIMESTAMP)
  `,
    [yieldBoost, endTime, playerId]
  );

  // 统计跳过的地块数（已有独立增产效果的）
  const skippedResult = await client.query(
    `SELECT COUNT(*) as skipped FROM player_land_status 
     WHERE player_id = $1 AND is_unlocked = TRUE 
       AND yield_boost > 1.0 AND yield_boost_end_time > CURRENT_TIMESTAMP`,
    [playerId]
  );

  await client.query(
    `
    INSERT INTO game_activity_log (activity_type, player_id, details, created_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
  `,
    [
      'harvest_god_activated',
      playerId,
      JSON.stringify({
        endTime,
        yieldBoost: 1.5,
        durationHours,
      }),
    ]
  );

  const skippedCount = parseInt(skippedResult.rows[0].skipped) || 0;

  return {
    message: skippedCount > 0
      ? `成功使用${item.item_name}，${durationHours}小时内所有地块产量+${Math.round((yieldBoost - 1) * 100)}%（${skippedCount}个地块已有独立增产效果，未被覆盖）`
      : `成功使用${item.item_name}，${durationHours}小时内所有作物产量+${Math.round((yieldBoost - 1) * 100)}%`,
    endTime,
    yieldBoost,
    skippedCount,
  };
};

/**
 * 使用土地祝福 - 普通地块品质+1
 */
const useLandBlessing = async function (client, playerId, item, landNum) {
  if (!landNum) {
    throw new Error('请选择要使用道具的地块');
  }

  // 检查地块
  const landResult = await client.query(
    'SELECT * FROM player_land_status WHERE player_id = $1 AND land_num = $2',
    [playerId, landNum]
  );
  if (landResult.rows.length === 0) {
    throw new Error('地块不存在');
  }
  const land = landResult.rows[0];

  if (land.current_quality >= 8) {
    throw new Error('该地块品质已达最高级');
  }

  // 品质+1
  await client.query(
    `
    UPDATE player_land_status 
    SET current_quality = current_quality + 1, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $1 AND land_num = $2
  `,
    [playerId, landNum]
  );

  return {
    message: `成功使用${item.item_name}，地块品质提升到${land.current_quality + 1}级`,
    landNum,
    newQuality: land.current_quality + 1,
  };
};

/**
 * 使用经验药水 - 收获时双倍经验标记
 */
const useExpPotion = async function (client, playerId, item, landNum) {
  if (!landNum) {
    throw new Error('请选择要使用道具的地块');
  }

  // 检查地块
  const landResult = await client.query(
    'SELECT * FROM player_land_status WHERE player_id = $1 AND land_num = $2',
    [playerId, landNum]
  );
  if (landResult.rows.length === 0) {
    throw new Error('地块不存在');
  }

  // 激活经验药水效果
  await client.query(
    `
    UPDATE player_land_status 
    SET exp_potion_active = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $1 AND land_num = $2
  `,
    [playerId, landNum]
  );

  return {
    message: `成功使用${item.item_name}，该地块下次收获获得双倍经验`,
    landNum,
    expMultiplier: 2,
  };
};

/**
 * 使用金币袋 - 随机获得配置范围内的金币
 */
const useGoldBag = async function (client, playerId, item) {
  // 从配置系统读取金币范围
  const minGold = configService.getConfig('GOLD_BAG_MIN_GOLD', 1000);
  const maxGold = configService.getConfig('GOLD_BAG_MAX_GOLD', 10000);
  const goldAmount =
    Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

  // 获取当前余额
  const currencyResult = await client.query(
    'SELECT currency_num FROM player_currency WHERE player_id = $1',
    [playerId]
  );
  const balanceBefore = currencyResult.rows[0]?.currency_num || 0;
  const balanceAfter = balanceBefore + goldAmount;

  // 给玩家金币
  await client.query(
    `
    UPDATE player_currency 
    SET currency_num = currency_num + $1, total_earn = total_earn + $1, daily_earn = daily_earn + $1, last_earn_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $2
  `,
    [goldAmount, playerId]
  );

  // 记录日志
  await client.query(
    `
    INSERT INTO player_currency_log (player_id, type, amount, source, related_id, balance_before, balance_after)
    VALUES ($1, 1, $2, $3, $4, $5, $6)
  `,
    [
      playerId,
      goldAmount,
      'item_use',
      item.item_id,
      balanceBefore,
      balanceAfter,
    ]
  );

  return {
    message: `成功使用${item.item_name}，获得${goldAmount}金币`,
    goldAmount,
  };
};

/**
 * 使用神秘宝箱 - 随机获得道具
 */
const useMysteryBox = async function (client, playerId, item) {
  // 从配置系统读取宝箱可能掉落的道具
  let possibleRewards = configService.getConfig('MYSTERY_BOX_REWARDS', [
    { itemId: 1, min: 1, max: 5 }, // 初级增产剂
    { itemId: 4, min: 1, max: 5 }, // 初级加速剂
    { itemId: 18, min: 1, max: 3 }, // 体力药水
    { itemId: 2, min: 0, max: 2 }, // 中级增产剂
    { itemId: 5, min: 0, max: 2 }, // 中级加速剂
  ]);

  // 确保possibleRewards是数组
  if (!Array.isArray(possibleRewards)) {
    possibleRewards = [
      { itemId: 1, min: 1, max: 5 },
      { itemId: 4, min: 1, max: 5 },
      { itemId: 18, min: 1, max: 3 },
      { itemId: 2, min: 0, max: 2 },
      { itemId: 5, min: 0, max: 2 },
    ];
  }

  // 从配置系统读取奖励数量范围
  const minRewards = configService.getConfig('MYSTERY_BOX_MIN_REWARDS', 1);
  const maxRewards = configService.getConfig('MYSTERY_BOX_MAX_REWARDS', 3);

  // 随机选择奖励
  const rewards = [];
  const rewardCount =
    Math.floor(Math.random() * (maxRewards - minRewards + 1)) + minRewards;

  for (let i = 0; i < rewardCount; i++) {
    const rewardIndex = Math.floor(Math.random() * possibleRewards.length);
    const reward = possibleRewards[rewardIndex];
    const quantity =
      Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;

    if (quantity > 0) {
      rewards.push({ itemId: reward.itemId, quantity });

      // 添加到背包
      const inventoryCheck = await client.query(
        `SELECT id FROM player_inventory WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2`,
        [playerId, reward.itemId]
      );

      if (inventoryCheck.rows.length > 0) {
        await client.query(
          `
          UPDATE player_inventory 
          SET item_num = item_num + $1, total_add = total_add + $1, last_add_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE player_id = $2 AND item_type = 2 AND item_obj_id = $3
        `,
          [quantity, playerId, reward.itemId]
        );
      } else {
        await client.query(
          `
          INSERT INTO player_inventory (player_id, item_type, item_obj_id, item_num, total_add, last_add_time, created_at, updated_at)
          VALUES ($1, 2, $2, $3, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
          [playerId, reward.itemId, quantity]
        );
      }
    }
  }

  // 获取奖励的道具名称（批量查询避免N+1问题）
  const rewardItemIds = rewards.map((r) => r.itemId);
  const rewardNames = [];
  if (rewardItemIds.length > 0) {
    const nameResult = await client.query(
      'SELECT item_id, item_name FROM item_config WHERE item_id = ANY($1::int[])',
      [rewardItemIds]
    );
    const nameMap = new Map(
      nameResult.rows.map((r) => [r.item_id, r.item_name])
    );
    for (const reward of rewards) {
      const name = nameMap.get(reward.itemId) || `道具#${reward.itemId}`;
      rewardNames.push(`${name} x${reward.quantity}`);
    }
  }

  return {
    message: `成功使用${item.item_name}，获得: ${rewardNames.join(', ')}`,
    rewards,
  };
};

/**
 * 使用农场手册 - 获得配置的农场经验
 * IS-03 修复说明：使用后调用 checkAndUpgradeLevel 触发升级检查
 * - 原问题：经验道具使用后不检查升级，需等待下次操作才触发
 * - 修复：添加 try-catch 包裹的 checkAndUpgradeLevel 调用
 * - 即使升级检查失败也不影响经验道具的正常使用
 */
const useFarmBook = async function (client, playerId, item) {
  const expAmount =
    item.effect_value > 1
      ? parseInt(item.effect_value)
      : configService.getConfig('FARM_BOOK_EXP', 5000);

  // 获取玩家信息
  const playerResult = await client.query(
    'SELECT * FROM player_base WHERE player_id = $1',
    [playerId]
  );
  if (playerResult.rows.length === 0) {
    throw new Error('玩家不存在');
  }
  const player = playerResult.rows[0];

  // 增加农场经验
  const newFarmExp = (player.farm_exp || 0) + expAmount;

  await client.query(
    `
    UPDATE player_base 
    SET farm_exp = $1, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $2
  `,
    [newFarmExp, playerId]
  );

  let upgradeResult = null;
  try {
    upgradeResult = await checkAndUpgradeLevel(playerId);
  } catch (upgradeError) {
    logger.warn('农场手册触发升级检查失败', {
      playerId,
      error: upgradeError.message,
    });
  }

  return {
    message: `成功使用${item.item_name}，获得${expAmount}农场经验`,
    expAmount,
    newFarmExp,
    upgrade: upgradeResult,
  };
};

/**
 * 使用世界之书 - 获得配置的世界经验
 * IS-03 修复说明：使用后调用 checkAndUpgradeLevel 触发升级检查
 * - 与 useFarmBook 相同修复逻辑，确保世界等级升级即时触发
 */
const useWorldBook = async function (client, playerId, item) {
  const expAmount =
    item.effect_value > 1
      ? parseInt(item.effect_value)
      : configService.getConfig('WORLD_BOOK_EXP', 2000);

  // 获取玩家信息
  const playerResult = await client.query(
    'SELECT * FROM player_base WHERE player_id = $1',
    [playerId]
  );
  if (playerResult.rows.length === 0) {
    throw new Error('玩家不存在');
  }
  const player = playerResult.rows[0];

  // 增加世界经验
  const newWorldExp = (player.world_exp || 0) + expAmount;

  await client.query(
    `
    UPDATE player_base 
    SET world_exp = $1, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $2
  `,
    [newWorldExp, playerId]
  );

  let upgradeResult = null;
  try {
    upgradeResult = await checkAndUpgradeLevel(playerId);
  } catch (upgradeError) {
    logger.warn('世界之书触发升级检查失败', {
      playerId,
      error: upgradeError.message,
    });
  }

  return {
    message: `成功使用${item.item_name}，获得${expAmount}世界经验`,
    expAmount,
    newWorldExp,
    upgrade: upgradeResult,
  };
};

/**
 * 使用体力药水
 */
const useStaminaPotion = async function (client, playerId, item) {
  // 获取玩家信息
  const playerResult = await client.query(
    'SELECT * FROM player_base WHERE player_id = $1',
    [playerId]
  );
  if (playerResult.rows.length === 0) {
    throw new Error('玩家不存在');
  }
  const player = playerResult.rows[0];

  // 使用玩家数据库中存储的体力上限，支持等级解锁后的更高上限
  const maxStamina = player.max_stamina || 200;

  let restoreAmount;
  switch (item.item_type) {
    case ITEM_TYPES.STAMINA_POTION_1:
      restoreAmount =
        item.effect_value > 1
          ? parseInt(item.effect_value)
          : configService.getConfig('STAMINA_POTION_1_RESTORE', 50);
      break;
    case ITEM_TYPES.STAMINA_POTION_2:
      restoreAmount =
        item.effect_value > 1
          ? parseInt(item.effect_value)
          : configService.getConfig('STAMINA_POTION_2_RESTORE', 200);
      break;
    case ITEM_TYPES.STAMINA_POTION_3: {
      // 超级体力药水 - 恢复到满
      const currentStamina = player.current_stamina || 100;
      restoreAmount = Math.max(0, maxStamina - currentStamina);
      break;
    }
    default:
      restoreAmount = configService.getConfig('STAMINA_POTION_1_RESTORE', 50);
  }

  const newStamina = Math.min(
    (player.current_stamina || 100) + restoreAmount,
    maxStamina
  );
  const actualRestore = newStamina - (player.current_stamina || 100);

  if (actualRestore <= 0) {
    throw new Error('体力已满，无需使用');
  }

  await client.query(
    `
    UPDATE player_base 
    SET current_stamina = $1, updated_at = CURRENT_TIMESTAMP
    WHERE player_id = $2
  `,
    [newStamina, playerId]
  );

  return {
    message: `成功使用${item.item_name}，恢复${actualRestore}点体力`,
    restoreAmount: actualRestore,
    newStamina,
  };
};

/**
 * 使用浇水强化道具（青铜/银质/金质水壶）
 * 减少全局浇水耗时
 * @param {Object} client - 数据库客户端
 * @param {string} playerId - 玩家ID
 * @param {Object} item - 道具信息
 * @returns {Promise<Object>}
 */
const useWateringBoost = async function (client, playerId, item) {
  logger.info('使用浇水强化道具', { playerId, itemId: item.item_id });

  const durationMinutes = item.effect_duration || 60;
  const effectValue = parseFloat(item.effect_value);

  // 更新玩家浇水速度效果
  await client.query(
    `
    UPDATE player_base
    SET watering_speed_multiplier = $1,
        watering_boost_expire_at = CURRENT_TIMESTAMP + ($2 || ' minutes')::INTERVAL
    WHERE player_id = $3
  `,
    [effectValue, durationMinutes, playerId]
  );

  logger.info('浇水强化道具使用成功', {
    playerId,
    itemId: item.item_id,
    effectValue,
    durationMinutes,
  });

  return {
    message: `成功使用${item.item_name}，浇水耗时降至${Math.round(effectValue * 100)}%，持续${durationMinutes}分钟`,
    effectValue,
    durationMinutes,
  };
};

/**
 * 使用超级肥料包
 * 提升施肥产出倍率
 * @param {Object} client - 数据库客户端
 * @param {string} playerId - 玩家ID
 * @param {Object} item - 道具信息
 * @param {number} landNum - 地块序号
 * @returns {Promise<Object>}
 */
const useFertilizeBoost = async function (client, playerId, item, landNum) {
  logger.info('使用超级肥料包', { playerId, itemId: item.item_id, landNum });

  if (!landNum) {
    throw new Error('使用超级肥料包需要指定地块序号');
  }

  const effectValue = parseFloat(item.effect_value);
  const playerResult = await client.query(
    'SELECT * FROM player_base WHERE player_id = $1',
    [playerId]
  );
  if (playerResult.rows.length === 0) {
    throw new Error('玩家数据不存在');
  }
  const player = playerResult.rows[0];

  // 验证地块是否已解锁且有作物
  const landResult = await client.query(
    `
    SELECT pls.*, fl.unlock_world_level, fl.unlock_farm_level
    FROM player_land_status pls
    INNER JOIN farm_land fl ON pls.land_id = fl.id
    WHERE pls.player_id = $1 AND pls.land_num = $2
  `,
    [playerId, landNum]
  );
  if (landResult.rows.length === 0) {
    throw new Error('地块不存在');
  }
  const land = landResult.rows[0];
  const landQuality = land.land_quality_level || 1;

  // 检查地块品质是否满足要求（品质≥4金才能使用）
  if (landQuality < 4) {
    throw new Error('超级肥料包只能在金品质及以上地块使用');
  }

  if (!land.crop_id) {
    throw new Error('该地块没有种植作物');
  }

  // 设置施肥倍率提升
  const newFertilizerMultiplier = effectValue;

  await client.query(
    `
    UPDATE player_land_status
    SET fertilizer_multiplier = $1,
        last_fertilized_at = CURRENT_TIMESTAMP
    WHERE player_id = $2 AND land_num = $3
  `,
    [newFertilizerMultiplier, playerId, landNum]
  );

  logger.info('超级肥料包使用成功', {
    playerId,
    landNum,
    effectValue,
  });

  return {
    message: `成功使用${item.item_name}，施肥效果提升至${Math.round(effectValue * 100)}%`,
    landNum,
    effectValue,
  };
};

/**
 * 使用丰收镰刀
 * 提升收获产量
 * @param {Object} client - 数据库客户端
 * @param {string} playerId - 玩家ID
 * @param {Object} item - 道具信息
 * @param {number} landNum - 地块序号
 * @returns {Promise<Object>}
 */
const useHarvestBoost = async function (client, playerId, item, landNum) {
  logger.info('使用丰收镰刀', { playerId, itemId: item.item_id, landNum });

  if (!landNum) {
    throw new Error('使用丰收镰刀需要指定地块序号');
  }

  const effectValue = parseFloat(item.effect_value);

  // 验证地块品质≥6钻石
  const landResult = await client.query(
    `
    SELECT pls.* FROM player_land_status pls
    WHERE pls.player_id = $1 AND pls.land_num = $2
  `,
    [playerId, landNum]
  );
  if (landResult.rows.length === 0) {
    throw new Error('地块不存在');
  }
  const land = landResult.rows[0];
  const landQuality = land.land_quality_level || 1;

  if (landQuality < 6) {
    throw new Error('丰收镰刀只能在钻石品质及以上地块使用');
  }

  if (!land.crop_id) {
    throw new Error('该地块没有种植作物');
  }

  // 设置收获产量倍率
  await client.query(
    `
    UPDATE player_land_status
    SET harvest_multiplier = $1,
        harvest_boost_applied_at = CURRENT_TIMESTAMP
    WHERE player_id = $2 AND land_num = $3
  `,
    [effectValue, playerId, landNum]
  );

  logger.info('丰收镰刀使用成功', {
    playerId,
    landNum,
    effectValue,
  });

  return {
    message: `成功使用${item.item_name}，本次收获产量额外增加${Math.round((effectValue - 1) * 100)}%`,
    landNum,
    effectValue,
  };
};

/**
 * 使用限时皮肤
 * 激活农场视觉主题皮肤
 * @param {Object} client - 数据库客户端
 * @param {string} playerId - 玩家ID
 * @param {Object} item - 道具信息
 * @returns {Promise<Object>}
 */
const useSkin = async function (client, playerId, item) {
  logger.info('使用皮肤道具', { playerId, itemId: item.item_id });

  const durationDays = parseFloat(item.effect_value);
  const durationMinutes = item.effect_duration || durationDays * 1440;

  // 停用当前激活的皮肤
  await client.query(
    `
    UPDATE player_skin_record
    SET is_active = FALSE,
        remaining_minutes = GREATEST(0, remaining_minutes - 
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - activated_at)) / 60),
        paused_at = CURRENT_TIMESTAMP
    WHERE player_id = $1 AND is_active = TRUE
  `,
    [playerId]
  );

  // 检查是否已拥有同款皮肤（可续期）
  const existingSkin = await client.query(
    `
    SELECT * FROM player_skin_record
    WHERE player_id = $1 AND skin_item_id = $2
  `,
    [playerId, item.item_id]
  );

  if (existingSkin.rows.length > 0) {
    // 续期：在原剩余时间基础上叠加
    const skin = existingSkin.rows[0];
    const newRemaining =
      Math.max(0, skin.remaining_minutes || 0) + durationMinutes;
    const newTotal = (skin.total_duration_minutes || 0) + durationMinutes;

    await client.query(
      `
      UPDATE player_skin_record
      SET total_duration_minutes = $1,
          remaining_minutes = $2,
          is_active = TRUE,
          activated_at = CURRENT_TIMESTAMP,
          expires_at = CURRENT_TIMESTAMP + ($3 || ' minutes')::INTERVAL,
          paused_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE record_id = $4
    `,
      [newTotal, newRemaining, durationMinutes, skin.record_id]
    );
  } else {
    // 首次获得：创建新记录
    await client.query(
      `
      INSERT INTO player_skin_record
        (player_id, skin_item_id, skin_name, total_duration_minutes,
         remaining_minutes, is_active, activated_at, expires_at)
      VALUES ($1, $2, $3, $4, $4, TRUE, CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP + ($4 || ' minutes')::INTERVAL)
    `,
      [playerId, item.item_id, item.item_name, durationMinutes]
    );
  }

  // 更新玩家当前激活皮肤ID
  await client.query(
    `
    UPDATE player_base
    SET active_skin_id = $1
    WHERE player_id = $2
  `,
    [item.item_id, playerId]
  );

  logger.info('皮肤激活成功', {
    playerId,
    skinId: item.item_id,
    skinName: item.item_name,
    durationDays,
  });

  return {
    message: `成功激活${item.item_name}，持续${durationDays}天`,
    skinName: item.item_name,
    durationDays,
  };
};

/**
 * 使用装饰道具（木栅栏/稻草人）
 * 将装饰物放入玩家背包（实际放置需要通过装饰系统API）
 * @param {Object} client - 数据库客户端
 * @param {string} playerId - 玩家ID
 * @param {Object} item - 道具信息
 * @param {number} [landNum] - 地块序号（可选，用于指定放置位置）
 * @returns {Promise<Object>}
 */
const useDecoration = async function (client, playerId, item, landNum) {
  logger.info('使用装饰道具', { playerId, itemId: item.item_id, landNum });

  const maxStack = item.max_stack || 50;

  // 更新装饰物拥有记录
  const existingDeco = await client.query(
    `
    SELECT * FROM player_decoration_inventory
    WHERE player_id = $1 AND decoration_id = $2
  `,
    [playerId, item.item_id]
  );

  if (existingDeco.rows.length > 0) {
    const deco = existingDeco.rows[0];
    if (deco.owned_count - deco.placed_count >= maxStack) {
      throw new Error(`已达到${item.item_name}的最大拥有数量(${maxStack}个)`);
    }
    await client.query(
      `
      UPDATE player_decoration_inventory
      SET owned_count = owned_count + 1
      WHERE player_id = $1 AND decoration_id = $2
    `,
      [playerId, item.item_id]
    );
  } else {
    await client.query(
      `
      INSERT INTO player_decoration_inventory
        (player_id, decoration_id, owned_count, placed_count)
      VALUES ($1, $2, 1, 0)
    `,
      [playerId, item.item_id]
    );
  }

  // 初始化/更新美观度记录
  const beautyCheck = await client.query(
    'SELECT * FROM farm_beauty_record WHERE player_id = $1',
    [playerId]
  );
  if (beautyCheck.rows.length === 0) {
    await client.query(
      'INSERT INTO farm_beauty_record (player_id) VALUES ($1)',
      [playerId]
    );
  }

  // 如果指定了地块号，自动放置装饰物
  if (landNum) {
    const placeResult = await client.query(
      `
      INSERT INTO farm_decoration_placement
        (player_id, decoration_id, grid_x, grid_y)
      VALUES ($1, $2, $3, $3)
      ON CONFLICT (player_id, grid_x, grid_y, decoration_id) DO NOTHING
    `,
      [playerId, item.item_id, landNum]
    );

    if (placeResult.rowCount > 0) {
      await client.query(
        `
        UPDATE player_decoration_inventory
        SET placed_count = placed_count + 1
        WHERE player_id = $1 AND decoration_id = $2
      `,
        [playerId, item.item_id]
      );
    }

    // 更新美观度
    await client.query(
      `
      UPDATE farm_beauty_record
      SET decoration_count = decoration_count + 1,
          total_beauty_score = total_beauty_score + $1,
          last_calculated_at = CURRENT_TIMESTAMP
      WHERE player_id = $2
    `,
      [item.item_id === 29 ? 2 : 5, playerId]
    );
  }

  logger.info('装饰道具使用成功', {
    playerId,
    itemId: item.item_id,
    landNum,
  });

  return {
    message: landNum
      ? `成功放置${item.item_name}在地块${landNum}`
      : `${item.item_name}已放入背包，请进入编辑模式放置`,
    itemId: item.item_id,
    landNum,
  };
};

// ============================================
// 二期新道具函数结束
// ============================================

/**
 * 获取道具配置
 * @param {number} [itemId] - 道具ID（可选，不传则获取全部）
 * @returns {Promise<Array|Object>}
 */
const getItemConfig = async function (itemId = null) {
  logger.info('获取道具配置', { itemId });
  const client = await pool.connect();
  try {
    let query =
      'SELECT * FROM item_config WHERE is_active = TRUE ORDER BY item_id';
    let params = [];

    if (itemId) {
      query =
        'SELECT * FROM item_config WHERE item_id = $1 AND is_active = TRUE';
      params = [itemId];
    }

    const result = await client.query(query, params);

    if (itemId) {
      if (result.rows.length === 0) {
        throw new Error('道具不存在');
      }
      logger.info('获取道具配置成功', { itemId });
      return result.rows[0];
    }

    logger.info('获取道具配置列表成功', { count: result.rows.length });
    return result.rows;
  } catch (error) {
    logger.error('获取道具配置失败', { itemId, error: error.message });
    throw new Error('获取道具配置失败');
  } finally {
    client.release();
  }
};

/**
 * 购买道具
 * @param {string} playerId - 玩家ID
 * @param {number} goodsId - 商品ID
 * @param {number} quantity - 数量
 * @returns {Promise<Object>}
 */
const buyItem = async function (playerId, goodsId, quantity = 1) {
  logger.info('购买道具', { playerId, goodsId, quantity });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 获取商品信息
    const goodsResult = await client.query(
      'SELECT * FROM shop_goods WHERE id = $1 AND goods_type = 2', // goods_type=2是道具
      [goodsId]
    );
    if (goodsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('商品不存在');
    }
    const goods = goodsResult.rows[0];

    if (!goods.is_on_sale) {
      await client.query('ROLLBACK');
      throw new Error('商品已下架');
    }

    // 计算总价
    const totalPrice = goods.price_num * quantity;

    // 检查玩家金币
    const currencyResult = await client.query(
      'SELECT * FROM player_currency WHERE player_id = $1',
      [playerId]
    );
    if (
      currencyResult.rows.length === 0 ||
      currencyResult.rows[0].currency_num < totalPrice
    ) {
      await client.query('ROLLBACK');
      throw new Error('金币不足');
    }

    const balanceBefore = currencyResult.rows[0].currency_num;
    const balanceAfter = balanceBefore - totalPrice;

    // 扣除金币
    await client.query(
      `
      UPDATE player_currency 
      SET currency_num = currency_num - $1, total_spend = total_spend + $1, daily_spend = daily_spend + $1, last_spend_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE player_id = $2
    `,
      [totalPrice, playerId]
    );

    await client.query(
      `
      INSERT INTO player_currency_log (player_id, type, amount, source, related_id, balance_before, balance_after)
      VALUES ($1, 2, $2, $3, $4, $5, $6)
    `,
      [playerId, -totalPrice, 'shop_buy', goodsId, balanceBefore, balanceAfter]
    );

    // 添加道具
    const inventoryCheck = await client.query(
      `SELECT id FROM player_inventory WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2`,
      [playerId, goods.goods_obj_id]
    );

    if (inventoryCheck.rows.length > 0) {
      await client.query(
        `
        UPDATE player_inventory 
        SET item_num = item_num + $1, total_add = total_add + $1, last_add_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE player_id = $2 AND item_type = 2 AND item_obj_id = $3
      `,
        [quantity, playerId, goods.goods_obj_id]
      );
    } else {
      await client.query(
        `
        INSERT INTO player_inventory (player_id, item_type, item_obj_id, item_num, total_add, last_add_time, created_at, updated_at)
        VALUES ($1, 2, $2, $3, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
        [playerId, goods.goods_obj_id, quantity]
      );
    }

    // 更新销量
    await client.query(
      `
      UPDATE shop_goods 
      SET sales_volume = sales_volume + $1, update_time = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [quantity, goodsId]
    );

    await client.query('COMMIT');
    logger.info('购买道具成功', { playerId, goodsId, quantity, totalPrice });
    return {
      message: `成功购买${goods.goods_name} x${quantity}`,
      goodsId,
      quantity,
      totalPrice,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('购买道具失败', {
      playerId,
      goodsId,
      quantity,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getPlayerInventory,
  getAvailableItems,
  useItem,
  getItemConfig,
  buyItem,
  ITEM_TYPES,
};
