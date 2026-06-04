/**
 * 文件名：shopService.js
 * 作者：开发者
 * 日期：2026-03-21
 * 版本：v2.2.0
 * 功能描述：商店服务，处理商品购买、库存查询等功能
 * 更新记录：
 *   2026-03-21 - v1.1.0 - 修复编码问题
 *   2026-03-22 - v1.2.0 - 修复货币日志插入，添加 related_id
 *   2026-03-22 - v1.3.0 - 获取库存时返回完整物品信息（价格、成熟时间等）
 *   2026-03-23 - v1.4.0 - 获取库存时返回作物完整信息（基础产量、种子成本、单位时间收益等）
 *   2026-03-25 - v2.0.0 - 商店服务优化：获取商品时返回完整详细信息（产量范围、经验值、道具效果等）
 *   2026-05-24 - v2.1.0 - 性能优化：getPlayerInventory从5表LEFT JOIN改为UNION ALL；buyGoods精确字段
 *   2026-05-31 - v2.2.0 - buyGoods支持price_type=2宝石币扣款；新增getCurrencyByPriceType辅助函数
 */

const pool = require('../config/db');
const logger = require('../config/logger');
const configService = require('./configService');
const gameActivityService = require('./gameActivityService');

const getShopGoods = async function (playerLevel, worldLevel) {
  try {
    const query = `
      SELECT sg.*, 
             CASE 
               WHEN sg.goods_type = 1 THEN c.crop_name
               WHEN sg.goods_type = 2 THEN ic.item_name
             END AS obj_name,
             CASE 
               WHEN sg.goods_type = 1 THEN c.unlock_desc
               WHEN sg.goods_type = 2 THEN ic.item_desc
             END AS obj_desc,
             CASE WHEN sg.goods_type = 1 THEN c.growth_cycle END AS growth_cycle,
             CASE WHEN sg.goods_type = 1 THEN c.base_yield END AS base_yield,
             CASE WHEN sg.goods_type = 1 THEN c.min_yield END AS min_yield,
             CASE WHEN sg.goods_type = 1 THEN c.max_yield END AS max_yield,
             CASE WHEN sg.goods_type = 1 THEN c.sell_price END AS sell_price,
             CASE WHEN sg.goods_type = 1 THEN c.seed_cost END AS seed_cost,
             CASE WHEN sg.goods_type = 1 THEN c.gp_per_min END AS gp_per_min,
             CASE WHEN sg.goods_type = 1 THEN c.crop_type END AS crop_type,
             CASE WHEN sg.goods_type = 1 THEN c.world_id END AS crop_world_id,
             CASE WHEN sg.goods_type = 1 THEN c.player_exp_base END AS player_exp_base,
             CASE WHEN sg.goods_type = 1 THEN c.farm_exp_base END AS farm_exp_base,
             CASE WHEN sg.goods_type = 1 THEN c.world_exp_base END AS world_exp_base,
             CASE WHEN sg.goods_type = 2 THEN ic.item_type END AS item_type,
             CASE WHEN sg.goods_type = 2 THEN ic.effect_value END AS effect_value,
             CASE WHEN sg.goods_type = 2 THEN ic.effect_duration END AS effect_duration,
             CASE WHEN sg.goods_type = 2 THEN ic.max_stack END AS max_stack
      FROM shop_goods sg
      LEFT JOIN crop c ON sg.goods_type = 1 AND sg.goods_obj_id = c.crop_id
      LEFT JOIN item_config ic ON sg.goods_type = 2 AND sg.goods_obj_id = ic.item_id
      WHERE sg.is_on_sale = TRUE
        AND sg.unlock_player_level <= $1
        AND sg.unlock_world_level <= $2
      ORDER BY sg.goods_type, sg.goods_id
    `;
    const result = await pool.query(query, [playerLevel, worldLevel]);
    return result.rows;
  } catch (error) {
    logger.error('获取商店商品失败', {
      playerLevel,
      worldLevel,
      error: error.message,
    });
    throw error;
  }
};

const getPlayerInventory = async function (playerId) {
  try {
    // 优化：使用UNION ALL替代5表LEFT JOIN，每行只JOIN实际需要的表
    const query = `
      SELECT pi.*,
             c.crop_name AS item_name,
             c.growth_cycle,
             c.sell_price,
             c.seed_cost,
             c.base_yield,
             c.gp_per_min,
             c.crop_type,
             c.world_id,
             c.unlock_desc AS item_desc,
             sg.price_num AS buy_price
      FROM player_inventory pi
      JOIN crop c ON pi.item_obj_id = c.crop_id
      LEFT JOIN shop_goods sg ON sg.goods_type = 1 AND sg.goods_obj_id = pi.item_obj_id
      WHERE pi.player_id = $1 AND pi.item_type = 1 AND pi.item_num > 0

      UNION ALL

      SELECT pi.*,
             ic.item_name,
             NULL AS growth_cycle,
             NULL AS sell_price,
             NULL AS seed_cost,
             NULL AS base_yield,
             NULL AS gp_per_min,
             NULL AS crop_type,
             NULL AS world_id,
             ic.item_desc,
             sg.price_num AS buy_price
      FROM player_inventory pi
      JOIN item_config ic ON pi.item_obj_id = ic.item_id
      LEFT JOIN shop_goods sg ON sg.goods_type = 2 AND sg.goods_obj_id = pi.item_obj_id
      WHERE pi.player_id = $1 AND pi.item_type = 2 AND pi.item_num > 0

      UNION ALL

      SELECT pi.*,
             c.crop_name AS item_name,
             c.growth_cycle,
             c.sell_price,
             c.seed_cost,
             c.base_yield,
             c.gp_per_min,
             c.crop_type,
             c.world_id,
             c.unlock_desc AS item_desc,
             NULL AS buy_price
      FROM player_inventory pi
      JOIN crop c ON pi.item_obj_id = c.crop_id
      WHERE pi.player_id = $1 AND pi.item_type = 3 AND pi.item_num > 0

      ORDER BY item_type, item_obj_id
    `;
    const result = await pool.query(query, [playerId]);

    const inventory = {
      seeds: [],
      items: [],
      crops: [],
    };

    result.rows.forEach((item) => {
      if (item.item_type === 1) {
        inventory.seeds.push(item);
      } else if (item.item_type === 2) {
        inventory.items.push(item);
      } else if (item.item_type === 3) {
        inventory.crops.push(item);
      }
    });

    return inventory;
  } catch (error) {
    logger.error('获取玩家库存失败', { playerId, error: error.message });
    throw error;
  }
};

const MAX_INVENTORY_SLOTS = 200;

const getMaxInventorySlots = async function () {
  try {
    const result = await pool.query(
      `SELECT value FROM game_config WHERE key = 'INVENTORY_MAX_SLOTS' AND is_active = TRUE`
    );
    if (result.rows.length > 0) {
      return parseInt(result.rows[0].value, 10);
    }
    return MAX_INVENTORY_SLOTS;
  } catch (error) {
    logger.error('获取背包槽位配置失败', { error: error.message });
    return MAX_INVENTORY_SLOTS;
  }
};

const getInventoryDistinctCount = async function (playerId) {
  const result = await pool.query(
    `SELECT COUNT(*) as cnt FROM player_inventory 
     WHERE player_id = $1 AND item_num > 0`,
    [playerId]
  );
  return parseInt(result.rows[0].cnt);
};

const buyGoods = async function (playerId, goodsId, quantity) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const goodsQuery =
      'SELECT goods_id, goods_name, goods_type, goods_obj_id, price_num, price_type, stock_limit, is_on_sale FROM shop_goods WHERE goods_id = $1 AND is_on_sale = TRUE';
    const goodsResult = await client.query(goodsQuery, [goodsId]);

    if (goodsResult.rows.length === 0) {
      throw new Error('商品不存在或已下架');
    }

    const goods = goodsResult.rows[0];
    const priceType = parseInt(goods.price_type) || 1;
    const totalCost = parseInt(goods.price_num) * quantity;

    if (goods.stock_limit < 9999) {
      const todayDate = new Date().toISOString().split('T')[0];
      const dailyResult = await client.query(
        `SELECT quantity_purchased FROM player_shop_daily_limit 
         WHERE player_id = $1 AND goods_id = $2 AND purchase_date = $3
         FOR UPDATE`,
        [playerId, goodsId, todayDate]
      );

      const currentDailyPurchased =
        dailyResult.rows.length > 0
          ? parseInt(dailyResult.rows[0].quantity_purchased)
          : 0;

      if (currentDailyPurchased + quantity > goods.stock_limit) {
        const remaining = Math.max(
          0,
          goods.stock_limit - currentDailyPurchased
        );
        throw new Error(
          `每日限购${goods.stock_limit}个，今日还可购买${remaining}个`
        );
      }

      if (dailyResult.rows.length > 0) {
        await client.query(
          `UPDATE player_shop_daily_limit 
           SET quantity_purchased = quantity_purchased + $1, last_purchase_time = CURRENT_TIMESTAMP
           WHERE player_id = $2 AND goods_id = $3 AND purchase_date = $4`,
          [quantity, playerId, goodsId, todayDate]
        );
      } else {
        await client.query(
          `INSERT INTO player_shop_daily_limit 
           (player_id, goods_id, purchase_date, quantity_purchased, last_purchase_time)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [playerId, goodsId, todayDate, quantity]
        );
      }
    }

    const currencyQuery =
      'SELECT currency_num, gem_num FROM player_currency WHERE player_id = $1 FOR UPDATE';
    const currencyResult = await client.query(currencyQuery, [playerId]);
    const currencyRow = currencyResult.rows[0];

    const sourceType = goods.goods_type === 1 ? 'seed_buy' : 'item_buy';

    if (priceType === 2) {
      const currentGem = parseInt(currencyRow.gem_num) || 0;

      if (currentGem < totalCost) {
        throw new Error('宝石币不足');
      }

      const gemBefore = currentGem;
      const gemAfter = gemBefore - totalCost;

      await client.query(
        `UPDATE player_currency
         SET gem_num = gem_num - $1,
             gem_total_spend = gem_total_spend + $1,
             update_time = CURRENT_TIMESTAMP
         WHERE player_id = $2`,
        [totalCost, playerId]
      );

      await client.query(
        `INSERT INTO player_currency_log
         (player_id, type, amount, source, related_id, balance_before, balance_after)
         VALUES ($1, 2, $2, $3, $4, $5, $6)`,
        [
          playerId,
          totalCost,
          sourceType,
          goods.goods_obj_id,
          gemBefore,
          gemAfter,
        ]
      );
    } else {
      const currentCurrency = parseInt(currencyRow.currency_num) || 0;

      if (currentCurrency < totalCost) {
        throw new Error('农场币不足');
      }

      const currencyBefore = currentCurrency;
      const currencyAfter = currencyBefore - totalCost;

      await client.query(
        `UPDATE player_currency
         SET currency_num = currency_num - $1,
             total_spend = total_spend + $1,
             daily_spend = daily_spend + $1,
             last_spend_time = CURRENT_TIMESTAMP
         WHERE player_id = $2`,
        [totalCost, playerId]
      );

      await client.query(
        `INSERT INTO player_currency_log
         (player_id, type, amount, source, related_id, balance_before, balance_after)
         VALUES ($1, 2, $2, $3, $4, $5, $6)`,
        [
          playerId,
          totalCost,
          sourceType,
          goods.goods_obj_id,
          currencyBefore,
          currencyAfter,
        ]
      );
    }

    const inventoryCheck = await client.query(
      `SELECT id FROM player_inventory 
       WHERE player_id = $1 AND item_type = $2 AND item_obj_id = $3`,
      [playerId, goods.goods_type, goods.goods_obj_id]
    );

    const isNewItemType = inventoryCheck.rows.length === 0;
    if (isNewItemType) {
      const maxSlots = await getMaxInventorySlots();
      const currentCount = await getInventoryDistinctCount(playerId);
      if (currentCount >= maxSlots) {
        throw new Error(
          `背包已满（${currentCount}/${maxSlots}），请清理后再购买`
        );
      }
    }

    if (inventoryCheck.rows.length > 0) {
      await client.query(
        `UPDATE player_inventory 
         SET item_num = item_num + $1, 
             total_add = total_add + $1,
             last_add_time = CURRENT_TIMESTAMP
         WHERE player_id = $2 AND item_type = $3 AND item_obj_id = $4`,
        [quantity, playerId, goods.goods_type, goods.goods_obj_id]
      );
    } else {
      await client.query(
        `INSERT INTO player_inventory 
         (player_id, item_type, item_obj_id, item_num, total_add, last_add_time)
         VALUES ($1, $2, $3, $4, $4, CURRENT_TIMESTAMP)`,
        [playerId, goods.goods_type, goods.goods_obj_id, quantity]
      );
    }

    await client.query(
      'UPDATE shop_goods SET sales_volume = sales_volume + $1 WHERE goods_id = $2',
      [quantity, goodsId]
    );

    await client.query('COMMIT');
    logger.info('商品购买成功', {
      playerId,
      goodsId,
      goodsName: goods.goods_name,
      quantity,
      cost: totalCost,
    });

    try {
      await gameActivityService.logBuy(
        playerId,
        goods.goods_name,
        quantity,
        totalCost
      );
    } catch (logError) {
      logger.warn('记录购买活动日志失败', { error: logError.message });
    }

    return {
      success: true,
      goodsId,
      goodsName: goods.goods_name,
      quantity,
      cost: totalCost,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('商品购买失败', {
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

const sellItem = async function (playerId, itemId, quantity = 1) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    quantity = parseInt(quantity) || 1;

    const inventoryResult = await client.query(
      `SELECT pi.item_obj_id, pi.item_num, it.item_name, sg.price_num
       FROM player_inventory pi
       LEFT JOIN item_config it ON pi.item_obj_id = it.item_id
       LEFT JOIN shop_goods sg ON sg.goods_type = 2 AND sg.goods_obj_id = pi.item_obj_id
       WHERE pi.player_id = $1 AND pi.item_type = 2 AND pi.item_obj_id = $2
       FOR UPDATE`,
      [playerId, itemId]
    );
    if (inventoryResult.rows.length === 0) {
      throw new Error('背包中没有该道具');
    }

    const row = inventoryResult.rows[0];
    if (row.item_num < quantity) {
      throw new Error(`道具不足，仅有 ${row.item_num} 个`);
    }

    const buyPrice = parseInt(row.price_num) || 0;
    const sellPrice = Math.max(1, Math.floor(buyPrice * 0.5));
    const totalIncome = sellPrice * quantity;

    await client.query(
      `UPDATE player_currency 
       SET currency_num = currency_num + $1,
           total_earn = total_earn + $1,
           daily_earn = daily_earn + $1,
           last_earn_time = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [totalIncome, playerId]
    );

    const balanceResult = await client.query(
      'SELECT currency_num FROM player_currency WHERE player_id = $1',
      [playerId]
    );
    const balanceAfter = parseInt(balanceResult.rows[0].currency_num);

    await client.query(
      `INSERT INTO player_currency_log 
       (player_id, type, amount, source, related_id, balance_before, balance_after)
       VALUES ($1, 1, $2, 'item_sell', $3, $4, $5)`,
      [playerId, totalIncome, itemId, balanceAfter - totalIncome, balanceAfter]
    );

    if (row.item_num === quantity) {
      await client.query(
        `DELETE FROM player_inventory
         WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2`,
        [playerId, itemId]
      );
    } else {
      await client.query(
        `UPDATE player_inventory
         SET item_num = item_num - $1, update_time = CURRENT_TIMESTAMP
         WHERE player_id = $2 AND item_type = 2 AND item_obj_id = $3`,
        [quantity, playerId, itemId]
      );
    }

    await client.query('COMMIT');

    return {
      success: true,
      itemId,
      itemName: row.item_name,
      quantity,
      unitPrice: sellPrice,
      totalIncome,
      remaining: Math.max(0, row.item_num - quantity),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getShopGoods,
  getPlayerInventory,
  buyGoods,
  sellItem,
  getMaxInventorySlots,
};
