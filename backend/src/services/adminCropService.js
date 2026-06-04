/**
 * 文件名: adminCropService.js
 * 作者: Trae AI
 * 日期: 2026-05-23
 * 版本: v1.0.0
 * 功能描述: 管理后台作物配置管理服务
 * 更新记录:
 *   2026-05-23 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 获取作物列表
 */
async function getCropList(params = {}) {
  try {
    let query = 'SELECT * FROM crop WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (params.worldId) {
      query += ` AND world_id = $${paramIndex++}`;
      queryParams.push(params.worldId);
    }

    if (params.cropType) {
      query += ` AND crop_type = $${paramIndex++}`;
      queryParams.push(params.cropType);
    }

    if (params.search) {
      query += ` AND crop_name ILIKE $${paramIndex++}`;
      queryParams.push(`%${params.search}%`);
    }

    query += ' ORDER BY world_id, crop_id';

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('获取作物列表失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取作物详情
 */
async function getCropDetail(cropId) {
  try {
    const query = 'SELECT * FROM crop WHERE crop_id = $1';
    const result = await pool.query(query, [cropId]);
    if (result.rows.length === 0) {
      throw new Error('作物不存在');
    }
    return result.rows[0];
  } catch (error) {
    logger.error('获取作物详情失败', { cropId, error: error.message });
    throw error;
  }
}

/**
 * 创建作物
 */
async function createCrop(data, operatorId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO crop (
        crop_name, world_id, unlock_player_level, unlock_farm_level,
        growth_cycle, base_yield, min_yield, max_yield, sell_price, seed_cost,
        gp_per_min, crop_type, unlock_desc,
        player_exp_base, farm_exp_base, world_exp_base
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await client.query(query, [
      data.cropName,
      data.worldId,
      data.unlockPlayerLevel,
      data.unlockFarmLevel,
      data.growthCycle,
      data.baseYield,
      data.minYield,
      data.maxYield,
      data.sellPrice,
      data.seedCost,
      data.gpPerMin,
      data.cropType,
      data.unlockDesc,
      data.playerExpBase,
      data.farmExpBase,
      data.worldExpBase,
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('创建作物失败', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 更新作物
 */
async function updateCrop(cropId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkQuery = 'SELECT * FROM crop WHERE crop_id = $1 FOR UPDATE';
    const checkResult = await client.query(checkQuery, [cropId]);
    if (checkResult.rows.length === 0) {
      throw new Error('作物不存在');
    }

    const query = `
      UPDATE crop SET
        crop_name = COALESCE($2, crop_name),
        world_id = COALESCE($3, world_id),
        unlock_player_level = COALESCE($4, unlock_player_level),
        unlock_farm_level = COALESCE($5, unlock_farm_level),
        growth_cycle = COALESCE($6, growth_cycle),
        base_yield = COALESCE($7, base_yield),
        min_yield = COALESCE($8, min_yield),
        max_yield = COALESCE($9, max_yield),
        sell_price = COALESCE($10, sell_price),
        seed_cost = COALESCE($11, seed_cost),
        gp_per_min = COALESCE($12, gp_per_min),
        crop_type = COALESCE($13, crop_type),
        unlock_desc = COALESCE($14, unlock_desc),
        player_exp_base = COALESCE($15, player_exp_base),
        farm_exp_base = COALESCE($16, farm_exp_base),
        world_exp_base = COALESCE($17, world_exp_base),
        updated_at = CURRENT_TIMESTAMP
      WHERE crop_id = $1
      RETURNING *
    `;

    const result = await client.query(query, [
      cropId,
      data.cropName,
      data.worldId,
      data.unlockPlayerLevel,
      data.unlockFarmLevel,
      data.growthCycle,
      data.baseYield,
      data.minYield,
      data.maxYield,
      data.sellPrice,
      data.seedCost,
      data.gpPerMin,
      data.cropType,
      data.unlockDesc,
      data.playerExpBase,
      data.farmExpBase,
      data.worldExpBase,
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('更新作物失败', { cropId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 删除作物
 */
async function deleteCrop(cropId) {
  try {
    const query = 'DELETE FROM crop WHERE crop_id = $1 RETURNING *';
    const result = await pool.query(query, [cropId]);
    if (result.rows.length === 0) {
      throw new Error('作物不存在');
    }
    return { success: true, message: '删除成功' };
  } catch (error) {
    logger.error('删除作物失败', { cropId, error: error.message });
    throw error;
  }
}

module.exports = {
  getCropList,
  getCropDetail,
  createCrop,
  updateCrop,
  deleteCrop,
};
