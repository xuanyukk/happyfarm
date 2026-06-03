/**
 * 文件名：eventService.js
 * 作者：Trae AI
 * 日期：2026-05-13
 * 版本：v2.5.0
 * 功能描述：游戏活动服务，处理活动的管理、参与和奖励发放
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 获取当前进行中的活动
 */
const getActiveEvents = async function () {
  const query = `
    SELECT ge.*, get.template_name, get.template_type, get.template_description
    FROM game_events ge
    JOIN game_event_templates get ON ge.template_id = get.id
    WHERE ge.is_active = true 
      AND ge.start_time <= CURRENT_TIMESTAMP
      AND (ge.end_time IS NULL OR ge.end_time >= CURRENT_TIMESTAMP)
    ORDER BY ge.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * 玩家参与活动
 */
const participateEvent = async function (playerId, eventId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 检查活动是否存在且活跃
    const eventQuery = `
      SELECT * FROM game_events 
      WHERE id = $1 AND is_active = true
    `;
    const eventResult = await client.query(eventQuery, [eventId]);
    if (eventResult.rows.length === 0) {
      throw new Error('活动不存在或未激活');
    }

    const event = eventResult.rows[0];

    // 检查玩家是否已参与
    const participationQuery = `
      SELECT * FROM player_event_participation 
      WHERE player_id = $1 AND event_id = $2
    `;
    const participationResult = await client.query(participationQuery, [
      playerId,
      eventId,
    ]);

    if (participationResult.rows.length === 0) {
      // 记录参与
      await client.query(
        `
        INSERT INTO player_event_participation 
          (player_id, event_id, joined_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `,
        [playerId, eventId]
      );

      // 发放参与奖励
      if (event.participation_reward) {
        await giveEventReward(
          client,
          playerId,
          event.participation_reward,
          '参与活动奖励'
        );
      }
    }

    await client.query('COMMIT');
    return {
      success: true,
      eventId,
      alreadyParticipated: participationResult.rows.length > 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('参与活动失败', { playerId, eventId, error: error.message });
    throw error;
  } finally {
    client.release();
  }
};

/**
 * 发放活动奖励
 */
const giveEventReward = async function (client, playerId, reward, description) {
  if (reward.currency && reward.currency > 0) {
    await client.query(
      `
      UPDATE player_currency 
      SET currency_num = currency_num + $1, 
          total_earn = total_earn + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE player_id = $2
    `,
      [reward.currency, playerId]
    );

    await client.query(
      `
      INSERT INTO player_currency_log 
        (player_id, currency_type, change_type, change_amount, description)
      VALUES ($1, 1, 'add', $2, $3)
    `,
      [playerId, reward.currency, description]
    );
  }

  if (reward.items && reward.items.length > 0) {
    for (const itemReward of reward.items) {
      await client.query(
        `
        INSERT INTO player_inventory 
          (player_id, item_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (player_id, item_id) DO UPDATE
          SET quantity = player_inventory.quantity + EXCLUDED.quantity,
              updated_at = CURRENT_TIMESTAMP
      `,
        [playerId, itemReward.itemId, itemReward.quantity || 1]
      );
    }
  }
};

/**
 * 获取玩家活动进度
 */
const getPlayerEventProgress = async function (playerId) {
  const query = `
    SELECT 
      pep.*,
      ge.event_name,
      ge.event_description,
      get.template_type
    FROM player_event_participation pep
    JOIN game_events ge ON pep.event_id = ge.id
    JOIN game_event_templates get ON ge.template_id = get.id
    WHERE pep.player_id = $1
    ORDER BY pep.joined_at DESC
  `;
  const result = await pool.query(query, [playerId]);
  return result.rows;
};

module.exports = {
  getActiveEvents,
  participateEvent,
  getPlayerEventProgress,
};
