/**
 * 文件名: adminFarmLevelService.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台农场等级管理服务，提供农场等级的CRUD操作
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 获取农场等级列表
 * @param {Object} params - 查询参数 { search }
 * @returns {Array} 农场等级列表
 */
async function getFarmLevelList(params = {}) {
  try {
    let query = 'SELECT * FROM farm_level ORDER BY level_num';
    const queryParams = [];

    if (params.search) {
      query = 'SELECT * FROM farm_level WHERE level_name ILIKE $1 ORDER BY level_num';
      queryParams.push(`%${params.search}%`);
    }

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('获取农场等级列表失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取农场等级详情
 * @param {number} levelId - 等级ID
 * @returns {Object} 等级详情
 */
async function getFarmLevelDetail(levelId) {
  try {
    const query = 'SELECT * FROM farm_level WHERE level_id = $1';
    const result = await pool.query(query, [levelId]);
    if (result.rows.length === 0) {
      throw new Error('农场等级不存在');
    }
    return result.rows[0];
  } catch (error) {
    logger.error('获取农场等级详情失败', { levelId, error: error.message });
    throw error;
  }
}

/**
 * 创建农场等级
 * @param {Object} data - 等级数据
 * @returns {Object} 创建的等级
 */
async function createFarmLevel(data) {
  try {
    const query = `
      INSERT INTO farm_level (
        level_num, level_name, experience_required, max_land_count,
        unlock_item_type, unlock_item_id, farm_bonus_rate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.levelNum || data.level_num || 1,
      data.levelName || data.level_name || '新等级',
      data.experienceRequired || data.experience_required || 100,
      data.maxLandCount || data.max_land_count || 5,
      data.unlockItemType || data.unlock_item_type || null,
      data.unlockItemId || data.unlock_item_id || null,
      data.farmBonusRate || data.farm_bonus_rate || 0
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('创建农场等级失败', { error: error.message });
    throw error;
  }
}

/**
 * 更新农场等级
 * @param {number} levelId - 等级ID
 * @param {Object} data - 更新数据
 * @returns {Object} 更新后的等级
 */
async function updateFarmLevel(levelId, data) {
  try {
    const checkQuery = 'SELECT * FROM farm_level WHERE level_id = $1';
    const checkResult = await pool.query(checkQuery, [levelId]);
    if (checkResult.rows.length === 0) {
      throw new Error('农场等级不存在');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMap = {
      levelNum: 'level_num',
      levelName: 'level_name',
      experienceRequired: 'experience_required',
      maxLandCount: 'max_land_count',
      unlockItemType: 'unlock_item_type',
      unlockItemId: 'unlock_item_id',
      farmBonusRate: 'farm_bonus_rate'
    };

    Object.entries(fieldMap).forEach(([key, column]) => {
      if (data[key] !== undefined) {
        fields.push(`${column} = $${paramIndex++}`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('没有需要更新的字段');
    }

    values.push(levelId);
    const query = `
      UPDATE farm_level SET ${fields.join(', ')}
      WHERE level_id = $${paramIndex}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('更新农场等级失败', { levelId, error: error.message });
    throw error;
  }
}

/**
 * 删除农场等级
 * @param {number} levelId - 等级ID
 * @returns {Object} 删除结果
 */
async function deleteFarmLevel(levelId) {
  try {
    const checkQuery = 'SELECT * FROM farm_level WHERE level_id = $1';
    const checkResult = await pool.query(checkQuery, [levelId]);
    if (checkResult.rows.length === 0) {
      throw new Error('农场等级不存在');
    }

    const query = 'DELETE FROM farm_level WHERE level_id = $1';
    await pool.query(query, [levelId]);
    return { message: '农场等级已删除' };
  } catch (error) {
    logger.error('删除农场等级失败', { levelId, error: error.message });
    throw error;
  }
}

module.exports = {
  getFarmLevelList,
  getFarmLevelDetail,
  createFarmLevel,
  updateFarmLevel,
  deleteFarmLevel
};