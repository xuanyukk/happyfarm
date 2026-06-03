/**
 * 文件名：initService.js
 * 作者：开发者
 * 日期：2026-03-22
 * 版本：v1.1.0
 * 功能描述：玩家数据初始化服务
 * 更新记录：
 *   2026-03-22 - v1.0.0 - 初始版本创建
 *   2026-03-22 - v1.1.0 - 修复数据库表结构适配问题，添加错误处理
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 检查玩家是否已初始化
 * @param {string} playerId - 玩家ID
 * @returns {Promise<boolean>} 是否已初始化
 */
async function isPlayerInitialized(playerId) {
  try {
    const query = 'SELECT player_id FROM player_base WHERE player_id = $1';
    const result = await pool.query(query, [playerId]);
    return result.rows.length > 0;
  } catch (error) {
    logger.error('检查玩家初始化状态失败', {
      playerId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * 初始化玩家数据
 * @param {string} playerId - 玩家ID
 * @param {string} username - 用户名
 * @returns {Promise<void>}
 */
async function initializePlayer(playerId, username) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    logger.info('开始初始化玩家数据', { playerId, username });

    // 1. 初始化玩家基础数据
    await client.query(
      `INSERT INTO player_base 
       (player_id, player_level, player_exp, farm_level, world_level, 
        current_land_quality, covered_land_num, unlocked_land_num, 
        total_earn, total_spend)
       VALUES ($1, 1, 0, 1, 1, 1, 0, 3, 0, 0)`,
      [playerId]
    );

    // 2. 初始化玩家货币数据（100农场币新手礼包）
    await client.query(
      `INSERT INTO player_currency 
       (player_id, currency_num, total_earn, total_spend, daily_earn, daily_spend)
       VALUES ($1, 100, 0, 0, 0, 0)`,
      [playerId]
    );

    // 3. 初始化地块状态（50块地块，前3块已解锁）
    for (let landNum = 1; landNum <= 50; landNum++) {
      const isUnlocked = landNum <= 3;
      await client.query(
        `INSERT INTO player_land_status 
         (player_id, land_num, is_unlocked, current_quality, crop_id, 
          status, planted_time, harvest_time, last_harvest_time)
         VALUES ($1, $2, $3, 1, NULL, 'idle', NULL, NULL, NULL)`,
        [playerId, landNum, isUnlocked]
      );
    }

    // 4. 初始化新手种子（基础作物种子各5个）
    // 假设作物ID 1-5是基础作物
    const starterSeeds = [1, 2, 3, 4, 5];
    for (const cropId of starterSeeds) {
      await client.query(
        `INSERT INTO player_inventory 
         (player_id, item_type, item_obj_id, item_num, lock_num, total_add, total_use)
         VALUES ($1, 1, $2, 5, 0, 5, 0)`,
        [playerId, cropId]
      );
    }

    await client.query('COMMIT');
    logger.info('玩家数据初始化成功', { playerId, username });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('玩家数据初始化失败', {
      playerId,
      username,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 确保玩家已初始化，如果未初始化则进行初始化
 * @param {string} playerId - 玩家ID
 * @param {string} username - 用户名
 * @returns {Promise<void>}
 */
async function ensurePlayerInitialized(playerId, username) {
  try {
    const initialized = await isPlayerInitialized(playerId);
    if (!initialized) {
      await initializePlayer(playerId, username);
    }
  } catch (error) {
    logger.error('确保玩家初始化失败', {
      playerId,
      username,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  isPlayerInitialized,
  initializePlayer,
  ensurePlayerInitialized,
};
