/**
 * 文件名：gemService.js
 * 作者：开发者
 * 日期：2026-05-25
 * 版本：v1.1.0
 * 功能描述：农场宝石币基础数据存储与读取服务
 *         当前为基础框架阶段，仅提供余额查询功能，预留完整的增减/流水记录接口
 * 更新记录：
 *   2026-05-25 - v1.0.0 - 初始版本创建
 *   2026-06-09 - v1.1.0 - 时间字段统一：update_time → updated_at
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 宝石币余额结构
 * @typedef {object} GemBalance
 * @property {string} playerId - 玩家ID
 * @property {number} amount - 当前宝石币数量
 * @property {number} totalEarn - 累计获得
 * @property {number} totalSpend - 累计消耗
 * @property {number} maxHold - 持有上限
 */

/**
 * 查询玩家宝石币余额
 * @param {string} playerId - 玩家ID
 * @returns {Promise<GemBalance>} 宝石币余额信息
 */
async function getGemBalance(playerId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT gem_num, gem_total_earn, gem_total_spend
       FROM player_currency
       WHERE player_id = $1`,
      [playerId]
    );

    if (result.rows.length === 0) {
      // 玩家货币记录不存在时返回默认值
      return {
        playerId,
        amount: 0,
        totalEarn: 0,
        totalSpend: 0,
        maxHold: 999999,
      };
    }

    return {
      playerId,
      amount: parseInt(result.rows[0].gem_num) || 0,
      totalEarn: parseInt(result.rows[0].gem_total_earn) || 0,
      totalSpend: parseInt(result.rows[0].gem_total_spend) || 0,
      maxHold: 999999,
    };
  } catch (error) {
    logger.error('查询宝石币余额失败', {
      playerId,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 【预留接口】增加宝石币
 * 当前仅提供基础框架，实际业务逻辑将在后续版本实现
 *
 * @param {string} playerId - 玩家ID
 * @param {number} amount - 增加数量
 * @param {string} source - 来源标识（如 'event_reward', 'shop_buy'）
 * @returns {Promise<object>} 操作结果
 */
async function addGems(playerId, amount, source = 'unknown') {
  // 框架预留：校验上限
  const maxHold = 999999;
  const current = await getGemBalance(playerId);
  const actualAdd = Math.min(amount, maxHold - current.amount);

  if (actualAdd <= 0) {
    logger.warn('宝石币已达上限，无法增加', {
      playerId,
      amount,
      currentAmount: current.amount,
      maxHold,
    });
    return {
      success: false,
      message: '宝石币已达上限',
      currentAmount: current.amount,
      actualAdd: 0,
    };
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE player_currency
       SET gem_num = gem_num + $1,
           gem_total_earn = gem_total_earn + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [actualAdd, playerId]
    );

    logger.info('宝石币增加成功（基础框架）', {
      playerId,
      actualAdd,
      source,
      newBalance: current.amount + actualAdd,
    });

    return {
      success: true,
      message: '宝石币增加成功',
      before: current.amount,
      added: actualAdd,
      after: current.amount + actualAdd,
    };
  } catch (error) {
    logger.error('宝石币增加失败', {
      playerId,
      amount,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 【预留接口】消耗宝石币
 * 当前仅提供基础框架，实际业务逻辑将在后续版本实现
 *
 * @param {string} playerId - 玩家ID
 * @param {number} amount - 消耗数量
 * @param {string} reason - 消耗原因（如 'unlock_land', 'buy_seed'）
 * @returns {Promise<object>} 操作结果
 */
async function spendGems(playerId, amount, reason = 'unknown') {
  const current = await getGemBalance(playerId);

  if (current.amount < amount) {
    logger.warn('宝石币余额不足', {
      playerId,
      amount,
      currentAmount: current.amount,
    });
    return {
      success: false,
      message: '宝石币余额不足',
      currentAmount: current.amount,
      requiredAmount: amount,
    };
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE player_currency
       SET gem_num = gem_num - $1,
           gem_total_spend = gem_total_spend + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [amount, playerId]
    );

    logger.info('宝石币消耗成功（基础框架）', {
      playerId,
      amount,
      reason,
      newBalance: current.amount - amount,
    });

    return {
      success: true,
      message: '宝石币消耗成功',
      before: current.amount,
      spent: amount,
      after: current.amount - amount,
    };
  } catch (error) {
    logger.error('宝石币消耗失败', {
      playerId,
      amount,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 【预留接口】获取宝石币流水记录
 * 当前返回空数组，后续版本实现完整流水记录功能
 *
 * @param {string} playerId - 玩家ID
 * @param {number} limit - 查询条数
 * @param {number} offset - 偏移量
 * @returns {Promise<Array>} 流水记录列表
 */
async function getGemLogs(playerId, limit = 20, offset = 0) {
  // 框架预留：后续版本将在 player_currency_log 表增加 currency_type 字段
  // 或创建独立的 gem_currency_log 表
  logger.info('宝石币流水查询（框架预留）', { playerId, limit, offset });
  return {
    success: true,
    data: [],
    message: '宝石币流水功能尚未实现，当前为基础框架阶段',
  };
}

module.exports = {
  getGemBalance,
  addGems,
  spendGems,
  getGemLogs,
};
