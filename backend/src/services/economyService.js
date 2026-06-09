/**
 * 文件名：economyService.js
 * 作者：开发者
 * 日期：2026-03-22
 * 版本：v1.4.0
 * 功能描述：经济系统服务，提供货币流水查询 + 统一货币操作入口
 * 更新记录：
 *   2026-03-22 - v1.1.1 - 修复字段名与实际表结构一致
 *   2026-03-22 - v1.1.0 - 初始版本创建
 *   2026-03-22 - v1.2.0 - 添加完整字段查询和物品详情关联
 *   2026-05-24 - v1.3.0 - 性能优化：消除getCurrencyLogs N+1查询
 *   2026-06-10 - v1.4.0 - 新增 deductCurrency/addCurrency 统一货币操作入口
 *             （事务内执行、余额校验、日志自动写入）
 */

const pool = require('../config/db');

/**
 * 获取玩家货币流水记录
 * @param {string} playerId - 玩家ID
 * @param {number} page - 页码（从1开始）
 * @param {number} limit - 每页数量
 * @param {string} changeType - 交易类型筛选（earn/spend，可选）
 * @returns {Promise<object>} 流水记录列表和总数
 */
async function getCurrencyLogs(
  playerId,
  page = 1,
  limit = 20,
  changeType = null
) {
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE pcl.player_id = $1';
  let params = [playerId];

  if (changeType) {
    const typeValue = changeType === 'earn' ? 1 : 2;
    whereClause += ' AND pcl.type = $' + (params.length + 1);
    params.push(typeValue);
  }

  const countQuery = `
    SELECT COUNT(*) as total 
    FROM player_currency_log pcl
    ${whereClause}
  `;

  const dataQuery = `
    SELECT pcl.*,
           c.crop_name,
           ic.item_name,
           lq.quality_name
    FROM player_currency_log pcl
    LEFT JOIN crop c 
      ON pcl.source IN ('crop_sell', 'seed_buy') 
      AND pcl.related_id = c.crop_id
    LEFT JOIN item_config ic 
      ON pcl.source = 'item_buy' 
      AND pcl.related_id = ic.item_id
    LEFT JOIN land_quality lq 
      ON pcl.source = 'quality_cover' 
      AND pcl.related_id = lq.quality_id
    ${whereClause}
    ORDER BY pcl.create_time DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  params.push(limit);
  params.push(offset);

  const client = await pool.connect();
  try {
    const countResult = await client.query(
      countQuery,
      params.slice(0, params.length - 2)
    );
    const dataResult = await client.query(dataQuery, params);

    const total = parseInt(countResult.rows[0].total);

    const formattedLogs = dataResult.rows.map((row) => ({
      id: row.id,
      player_id: row.player_id,
      change_type: row.type === 1 ? 'earn' : 'spend',
      amount: row.amount,
      reason: row.source,
      related_id: row.related_id,
      item_name:
        row.crop_name ||
        row.item_name ||
        row.quality_name ||
        (row.source === 'land_unlock' ? `地块 ${row.related_id}` : null),
      balance_before: row.balance_before,
      balance_after: row.balance_after,
      created_at: row.create_time,
    }));

    return {
      logs: formattedLogs,
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };
  } finally {
    client.release();
  }
}

/**
 * 获取玩家收入统计
 * @param {string} playerId - 玩家ID
 * @param {string} startDate - 开始日期（YYYY-MM-DD格式，可选）
 * @param {string} endDate - 结束日期（YYYY-MM-DD格式，可选）
 * @returns {Promise<object>} 收入统计数据
 */
async function getEarningsStats(playerId, startDate = null, endDate = null) {
  let whereClause = 'WHERE player_id = $1 AND type = 1';
  let params = [playerId];

  if (startDate) {
    whereClause += ' AND create_time >= $' + (params.length + 1);
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND create_time <= $' + (params.length + 1);
    params.push(endDate + ' 23:59:59');
  }

  const query = `
    SELECT 
      COUNT(*) as transaction_count,
      COALESCE(SUM(amount), 0) as total_earnings,
      COALESCE(AVG(amount), 0) as avg_earnings,
      COALESCE(MAX(amount), 0) as max_earning
    FROM player_currency_log 
    ${whereClause}
  `;

  const result = await pool.query(query, params);
  return result.rows[0];
}

/**
 * 获取玩家支出统计
 * @param {string} playerId - 玩家ID
 * @param {string} startDate - 开始日期（YYYY-MM-DD格式，可选）
 * @param {string} endDate - 结束日期（YYYY-MM-DD格式，可选）
 * @returns {Promise<object>} 支出统计数据
 */
async function getSpendingsStats(playerId, startDate = null, endDate = null) {
  let whereClause = 'WHERE player_id = $1 AND type = 2';
  let params = [playerId];

  if (startDate) {
    whereClause += ' AND create_time >= $' + (params.length + 1);
    params.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND create_time <= $' + (params.length + 1);
    params.push(endDate + ' 23:59:59');
  }

  const query = `
    SELECT 
      COUNT(*) as transaction_count,
      COALESCE(SUM(amount), 0) as total_spendings,
      COALESCE(AVG(amount), 0) as avg_spending,
      COALESCE(MAX(amount), 0) as max_spending
    FROM player_currency_log 
    ${whereClause}
  `;

  const result = await pool.query(query, params);
  return result.rows[0];
}

/**
 * 统一扣减货币（在调用方事务内执行）
 * @param {Object} client - 数据库事务客户端
 * @param {string} playerId - 玩家ID
 * @param {number} amount - 扣减金额（正整数）
 * @param {string} source - 来源标识
 * @param {number} relatedId - 关联ID（可选）
 */
const deductCurrency = async function (client, playerId, amount, source, relatedId = null) {
  const currencyResult = await client.query(
    `UPDATE player_currency
     SET currency_num = currency_num - $1,
         total_spend = total_spend + $1,
         daily_spend = daily_spend + $1,
         last_spend_time = CURRENT_TIMESTAMP
     WHERE player_id = $2
     RETURNING currency_num`,
    [amount, playerId]
  );

  if (currencyResult.rows.length === 0) {
    throw Object.assign(new Error('玩家资产数据不存在'), { statusCode: 404 });
  }

  if (currencyResult.rows[0].currency_num < 0) {
    throw Object.assign(new Error('余额不足'), { statusCode: 402 });
  }

  await client.query(
    `INSERT INTO player_currency_log (player_id, type, amount, change_type, related_id, details, create_time)
     VALUES ($1, 2, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
    [playerId, amount, 'spend', relatedId, JSON.stringify({ source })]
  );

  return { newBalance: currencyResult.rows[0].currency_num };
};

/**
 * 统一增加货币（在调用方事务内执行）
 * @param {Object} client - 数据库事务客户端
 * @param {string} playerId - 玩家ID
 * @param {number} amount - 增加金额（正整数）
 * @param {string} source - 来源标识
 * @param {number} relatedId - 关联ID（可选）
 */
const addCurrency = async function (client, playerId, amount, source, relatedId = null) {
  const currencyResult = await client.query(
    `UPDATE player_currency
     SET currency_num = currency_num + $1,
         total_earn = total_earn + $1,
         daily_earn = daily_earn + $1,
         last_earn_time = CURRENT_TIMESTAMP
     WHERE player_id = $2
     RETURNING currency_num`,
    [amount, playerId]
  );

  if (currencyResult.rows.length === 0) {
    throw Object.assign(new Error('玩家资产数据不存在'), { statusCode: 404 });
  }

  await client.query(
    `INSERT INTO player_currency_log (player_id, type, amount, change_type, related_id, details, create_time)
     VALUES ($1, 1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
    [playerId, amount, 'earn', relatedId, JSON.stringify({ source })]
  );

  return { newBalance: currencyResult.rows[0].currency_num };
};

module.exports = {
  getCurrencyLogs,
  getEarningsStats,
  getSpendingsStats,
  deductCurrency,
  addCurrency,
};
