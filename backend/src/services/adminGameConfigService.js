/**
 * 文件名：adminGameConfigService.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：管理后台游戏配置管理服务——player_level_config、daily_task_config、item_drop_config 三表CRUD
 * 更新记录：
 *   2026-05-31 - v1.0.0 - LG-01修复：初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

const TABLES = {
  player_level: {
    table: 'player_level_config',
    pk: 'level_id',
    columns: ['player_level', 'exp_required', 'exp_to_next', 'reward_gold', 'reward_gems', 'reward_items', 'stamina_increase', 'max_stamina', 'is_milestone'],
  },
  daily_task: {
    table: 'daily_task_config',
    pk: 'task_id',
    columns: ['task_name', 'task_description', 'task_category', 'target_count', 'reward_exp', 'reward_gold', 'reward_gems', 'reward_items', 'unlock_level', 'sort_order', 'is_active'],
  },
  item_drop: {
    table: 'item_drop_config',
    pk: 'drop_id',
    columns: ['source_type', 'source_id', 'item_id', 'drop_rate', 'min_count', 'max_count', 'quality_min', 'world_level_min', 'player_level_min', 'is_active'],
  },
};

async function getList(configType, params = {}) {
  try {
    const tableInfo = TABLES[configType];
    if (!tableInfo) throw new Error('无效的配置类型');

    let query = `SELECT * FROM ${tableInfo.table} WHERE 1=1`;
    const queryParams = [];
    let paramIndex = 1;

    if (configType === 'daily_task' && params.category) {
      query += ` AND task_category = $${paramIndex++}`;
      queryParams.push(params.category);
    }

    if (configType === 'item_drop' && params.sourceType) {
      query += ` AND source_type = $${paramIndex++}`;
      queryParams.push(params.sourceType);
    }

    if (configType === 'player_level' && params.search) {
      query += ` AND CAST(player_level AS TEXT) ILIKE $${paramIndex++}`;
      queryParams.push(`%${params.search}%`);
    }

    query += ` ORDER BY ${tableInfo.pk}`;
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    logger.error(`获取${configType}列表失败`, { error: error.message });
    throw error;
  }
}

async function getDetail(configType, id) {
  try {
    const tableInfo = TABLES[configType];
    if (!tableInfo) throw new Error('无效的配置类型');

    const query = `SELECT * FROM ${tableInfo.table} WHERE ${tableInfo.pk} = $1`;
    const result = await pool.query(query, [parseInt(id)]);
    if (result.rows.length === 0) throw new Error('记录不存在');
    return result.rows[0];
  } catch (error) {
    logger.error(`获取${configType}详情失败`, { id, error: error.message });
    throw error;
  }
}

async function create(configType, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tableInfo = TABLES[configType];
    if (!tableInfo) throw new Error('无效的配置类型');

    const fields = [];
    const values = [];
    const placeholders = [];
    let idx = 1;

    for (const col of tableInfo.columns) {
      const key = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (data[key] !== undefined) {
        fields.push(col);
        values.push(col === 'reward_items' && typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        placeholders.push(`$${idx++}`);
      }
    }

    if (fields.length === 0) throw new Error('没有可插入的数据');

    const query = `
      INSERT INTO ${tableInfo.table} (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await client.query(query, values);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`创建${configType}失败`, { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

async function update(configType, id, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tableInfo = TABLES[configType];
    if (!tableInfo) throw new Error('无效的配置类型');

    const sets = [];
    const values = [];
    let idx = 1;

    for (const col of tableInfo.columns) {
      const key = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (data[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push(col === 'reward_items' && typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
      }
    }

    if (sets.length === 0) throw new Error('没有可更新的数据');

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(parseInt(id));

    const query = `
      UPDATE ${tableInfo.table}
      SET ${sets.join(', ')}
      WHERE ${tableInfo.pk} = $${idx}
      RETURNING *
    `;

    const result = await client.query(query, values);
    if (result.rows.length === 0) throw new Error('记录不存在');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`更新${configType}失败`, { id, error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

async function remove(configType, id) {
  try {
    const tableInfo = TABLES[configType];
    if (!tableInfo) throw new Error('无效的配置类型');

    const query = `DELETE FROM ${tableInfo.table} WHERE ${tableInfo.pk} = $1 RETURNING *`;
    const result = await pool.query(query, [parseInt(id)]);
    if (result.rows.length === 0) throw new Error('记录不存在');
    return { success: true, message: '删除成功', deleted: result.rows[0] };
  } catch (error) {
    logger.error(`删除${configType}失败`, { id, error: error.message });
    throw error;
  }
}

module.exports = { getList, getDetail, create, update, remove };