
/**
 * 文件名：gameEventStatsService.js
 * 作者：Trae AI
 * 日期：2026-05-22
 * 版本：v1.0.0
 * 功能描述：游戏活动统计服务
 * 更新记录：
 *   2026-05-22 - v1.0.0 - 初始创建
 */

const db = require('../config/db');
const logger = require('../config/logger');

/**
 * 计算活动统计数据
 * @param {number} eventId - 活动ID
 * @param {string} date - 统计日期
 * @returns {Promise&lt;Object>} 统计数据
 */
const computeEventStats = async (eventId, date = null) => {
  const statDate = date || new Date().toISOString().split('T')[0];
  
  // 计算独立参与人数
  const uniqueParticipants = await getUniqueParticipants(eventId, statDate);
  
  // 计算总参与人次
  const totalParticipants = await getTotalParticipants(eventId, statDate);
  
  // 计算新增参与人数
  const newParticipants = await getNewParticipants(eventId, statDate);
  
  // 计算完成任务数
  const tasksCompleted = await getTasksCompleted(eventId, statDate);
  
  // 计算完成率
  const completionRate = await calculateCompletionRate(eventId, statDate, uniqueParticipants);
  
  // 计算奖励领取数
  const rewardClaimedCount = await getRewardClaimed(eventId, statDate);
  
  // 计算转化率
  const conversionRate = await calculateConversionRate(eventId, statDate, uniqueParticipants);
  
  // 计算留存率
  const day1Retention = await calculateRetention(eventId, statDate, 1);
  const day7Retention = await calculateRetention(eventId, statDate, 7);
  
  const stats = {
    event_id: eventId,
    stat_date: statDate,
    unique_participants: uniqueParticipants,
    total_participants: totalParticipants,
    new_participants: newParticipants,
    tasks_completed: tasksCompleted,
    completion_rate: completionRate,
    reward_claimed_count: rewardClaimedCount,
    conversion_rate: conversionRate,
    day1_retention: day1Retention,
    day7_retention: day7Retention
  };
  
  // 保存到数据库
  await saveEventStats(stats);
  
  // 计算漏斗数据
  await computeEventFunnel(eventId, statDate);
  
  return stats;
};

/**
 * 获取独立参与人数
 */
const getUniqueParticipants = async (eventId, date) => {
  const result = await db.query(
    `SELECT COUNT(DISTINCT player_id) as count
    FROM player_event_progress
    WHERE event_id = $1
    AND DATE(created_at) = $2`,
    [eventId, date]
  );
  return result.rows[0].count;
};

/**
 * 获取总参与人次
 */
const getTotalParticipants = async (eventId, date) => {
  const result = await db.query(
    `SELECT COUNT(*) as count
    FROM player_event_progress
    WHERE event_id = $1
    AND DATE(created_at) = $2`,
    [eventId, date]
  );
  return result.rows[0].count;
};

/**
 * 获取新增参与人数
 */
const getNewParticipants = async (eventId, date) => {
  // 获取在该日期首次参与该活动的用户数
  const result = await db.query(
    `WITH first_participation AS (
      SELECT player_id, MIN(DATE(created_at)) as first_date
      FROM player_event_progress
      WHERE event_id = $1
      GROUP BY player_id
    )
    SELECT COUNT(*) as count
    FROM first_participation
    WHERE first_date = $2`,
    [eventId, date]
  );
  return result.rows[0].count;
};

/**
 * 获取完成任务数
 */
const getTasksCompleted = async (eventId, date) => {
  const result = await db.query(
    `SELECT COUNT(*) as count
    FROM player_event_progress
    WHERE event_id = $1
    AND is_completed = true
    AND DATE(completed_at) = $2`,
    [eventId, date]
  );
  return result.rows[0].count;
};

/**
 * 计算完成率
 */
const calculateCompletionRate = async (eventId, date, uniqueParticipants) => {
  if (uniqueParticipants === 0) return 0;
  
  const completedUsers = await db.query(
    `SELECT COUNT(DISTINCT player_id) as count
    FROM player_event_progress
    WHERE event_id = $1
    AND is_completed = true
    AND DATE(completed_at) = $2`,
    [eventId, date]
  );
  
  const completedCount = completedUsers.rows[0].count;
  return Math.round((completedCount / uniqueParticipants) * 100 * 100) / 100;
};

/**
 * 获取奖励领取数
 */
const getRewardClaimed = async (eventId, date) => {
  const result = await db.query(
    `SELECT COUNT(*) as count
    FROM game_event_rewards
    WHERE event_id = $1
    AND DATE(distributed_at) = $2`,
    [eventId, date]
  );
  return result.rows[0].count;
};

/**
 * 计算转化率
 */
const calculateConversionRate = async (eventId, date, uniqueParticipants) => {
  if (uniqueParticipants === 0) return 0;
  
  const claimedUsers = await db.query(
    `SELECT COUNT(DISTINCT player_id) as count
    FROM game_event_rewards
    WHERE event_id = $1
    AND DATE(distributed_at) = $2`,
    [eventId, date]
  );
  
  const claimedCount = claimedUsers.rows[0].count;
  return Math.round((claimedCount / uniqueParticipants) * 100 * 100) / 100;
};

/**
 * 计算留存率
 */
const calculateRetention = async (eventId, statDate, days) => {
  // 计算N天后仍在参与的用户比例
  // 这里是简化实现，实际可能需要更复杂的逻辑
  return 0;
};

/**
 * 保存统计数据
 */
const saveEventStats = async (stats) => {
  // 检查是否已存在
  const existing = await db.query(
    'SELECT id FROM game_event_stats WHERE event_id = $1 AND stat_date = $2',
    [stats.event_id, stats.stat_date]
  );
  
  if (existing.rows.length > 0) {
    // 更新
    await db.query(
      `UPDATE game_event_stats 
       SET unique_participants = $1, total_participants = $2, 
           new_participants = $3, tasks_completed = $4, 
           completion_rate = $5, reward_claimed_count = $6, 
           conversion_rate = $7, day1_retention = $8, 
           day7_retention = $9, updated_at = CURRENT_TIMESTAMP
       WHERE event_id = $10 AND stat_date = $11`,
      [
        stats.unique_participants, stats.total_participants,
        stats.new_participants, stats.tasks_completed,
        stats.completion_rate, stats.reward_claimed_count,
        stats.conversion_rate, stats.day1_retention,
        stats.day7_retention, stats.event_id, stats.stat_date
      ]
    );
  } else {
    // 插入
    await db.query(
      `INSERT INTO game_event_stats 
       (event_id, stat_date, unique_participants, total_participants, 
       new_participants, tasks_completed, completion_rate, 
       reward_claimed_count, conversion_rate, day1_retention, day7_retention)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        stats.event_id, stats.stat_date,
        stats.unique_participants, stats.total_participants,
        stats.new_participants, stats.tasks_completed,
        stats.completion_rate, stats.reward_claimed_count,
        stats.conversion_rate, stats.day1_retention, stats.day7_retention
      ]
    );
  }
  
  logger.info('保存活动统计数据', { eventId: stats.event_id, date: stats.stat_date });
};

/**
 * 计算活动漏斗数据
 */
const computeEventFunnel = async (eventId, statDate) => {
  const steps = ['saw_event', 'clicked_event', 'joined_event', 
                 'completed_task', 'claimed_reward'];
  
  // 这里是简化实现，实际需要根据业务逻辑获取各步骤的用户数
  
  for (let i = 0; i < steps.length; i++) {
    // 先删除旧数据
    await db.query(
      'DELETE FROM game_event_funnel WHERE event_id = $1 AND funnel_step = $2 AND stat_date = $3',
      [eventId, steps[i], statDate]
    );
    
    // 插入新数据（简化版，数据暂时设为0）
    await db.query(
      `INSERT INTO game_event_funnel (event_id, funnel_step, user_count, conversion_rate, stat_date)
      VALUES ($1, $2, $3, $4, $5)`,
      [eventId, steps[i], 0, 0, statDate]
    );
  }
};

/**
 * 获取活动统计数据
 */
const getEventStats = async (eventId, startDate, endDate) => {
  let query = 'SELECT * FROM game_event_stats WHERE event_id = $1';
  const params = [eventId];
  
  if (startDate) {
    query += ' AND stat_date >= $2';
    params.push(startDate);
  }
  
  if (endDate) {
    const index = params.length + 1;
    query += ` AND stat_date <= $${index}`;
    params.push(endDate);
  }
  
  query += ' ORDER BY stat_date DESC';
  
  const result = await db.query(query, params);
  return result.rows;
};

/**
 * 获取活动漏斗数据
 */
const getEventFunnel = async (eventId, date) => {
  const result = await db.query(
    'SELECT * FROM game_event_funnel WHERE event_id = $1 AND stat_date = $2',
    [eventId, date]
  );
  return result.rows;
};

/**
 * 批量计算所有活动的统计数据
 */
const computeAllEventsStats = async (date = null) => {
  // 获取所有活跃的活动
  const events = await db.query('SELECT id FROM game_events WHERE is_active = true');
  
  for (const event of events.rows) {
    try {
      await computeEventStats(event.id, date);
    } catch (error) {
      logger.error('计算活动统计失败', { eventId: event.id, error: error.message });
    }
  }
};

module.exports = {
  computeEventStats,
  getEventStats,
  getEventFunnel,
  computeAllEventsStats
};

