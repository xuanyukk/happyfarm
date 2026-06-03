
/**
 * 文件名: adminItemService.js
 * 作者: Trae AI
 * 日期: 2026-05-23
 * 版本: v1.0.0
 * 功能描述: 管理后台道具配置管理服务
 * 更新记录:
 *   2026-05-23 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 获取道具列表
 */
async function getItemList(params = {}) {
  try {
    let query = 'SELECT * FROM item_config WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (params.itemType) {
      query += ` AND item_type = $${paramIndex++}`;
      queryParams.push(params.itemType);
    }

    if (params.search) {
      query += ` AND item_name ILIKE $${paramIndex++}`;
      queryParams.push(`%${params.search}%`);
    }

    query += ' ORDER BY item_type, item_id';

    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error('获取道具列表失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取道具详情
 */
async function getItemDetail(itemId) {
  try {
    const query = 'SELECT * FROM item_config WHERE item_id = $1';
    const result = await pool.query(query, [itemId]);
    if (result.rows.length === 0) {
      throw new Error('道具不存在');
    }
    return result.rows[0];
  } catch (error) {
    logger.error('获取道具详情失败', { itemId, error: error.message });
    throw error;
  }
}

/**
 * 创建道具
 */
async function createItem(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO item_config (
        item_type, item_name, item_desc, effect_value, effect_duration,
        unlock_world_level, unlock_player_level, max_stack
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await client.query(query, [
      data.itemType, data.itemName, data.itemDesc,
      data.effectValue, data.effectDuration || null,
      data.unlockWorldLevel, data.unlockPlayerLevel, data.maxStack
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('创建道具失败', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 更新道具
 */
async function updateItem(itemId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkQuery = 'SELECT * FROM item_config WHERE item_id = $1 FOR UPDATE';
    const checkResult = await client.query(checkQuery, [itemId]);
    if (checkResult.rows.length === 0) {
      throw new Error('道具不存在');
    }

    const query = `
      UPDATE item_config SET
        item_type = COALESCE($2, item_type),
        item_name = COALESCE($3, item_name),
        item_desc = COALESCE($4, item_desc),
        effect_value = COALESCE($5, effect_value),
        effect_duration = $6,
        unlock_world_level = COALESCE($7, unlock_world_level),
        unlock_player_level = COALESCE($8, unlock_player_level),
        max_stack = COALESCE($9, max_stack),
        updated_at = CURRENT_TIMESTAMP
      WHERE item_id = $1
      RETURNING *
    `;

    const result = await client.query(query, [
      itemId, data.itemType, data.itemName, data.itemDesc,
      data.effectValue, data.effectDuration !== undefined ? data.effectDuration : null,
      data.unlockWorldLevel, data.unlockPlayerLevel, data.maxStack
    ]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('更新道具失败', { itemId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 删除道具
 */
async function deleteItem(itemId) {
  try {
    const query = 'DELETE FROM item_config WHERE item_id = $1 RETURNING *';
    const result = await pool.query(query, [itemId]);
    if (result.rows.length === 0) {
      throw new Error('道具不存在');
    }
    return { success: true, message: '删除成功' };
  } catch (error) {
    logger.error('删除道具失败', { itemId, error: error.message });
    throw error;
  }
}

module.exports = {
  getItemList,
  getItemDetail,
  createItem,
  updateItem,
  deleteItem,
};

