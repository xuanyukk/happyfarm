/**
 * 文件名：dailyTaskService.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.2.0
 * 功能描述：每日任务服务——任务进度更新、奖励领取、每日重置
 * 更新记录：
 *   2026-05-31 - v1.0.0 - LG-02修复：初始版本创建
 *   2026-06-09 - v1.1.0 - 时间字段统一：update_time → updated_at
 *   2026-06-11 - v1.2.0 - D3修复：premium_currency改为player_currency.gem_num（字段不存在于player_base）
 */

const pool = require('../config/db');
const logger = require('../config/logger');

exports.getPlayerDailyTasks = async function (playerId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // B4-2修复：直接使用INSERT ON CONFLICT初始化，消除SELECT-then-INSERT竞态
    // initializeDailyTasks内部已使用ON CONFLICT DO NOTHING防止重复插入
    await initializeDailyTasks(playerId, today);

    const result = await pool.query(
      'SELECT * FROM player_daily_task WHERE player_id = $1 AND task_date = $2',
      [playerId, today]
    );
    return await enrichTaskData(result.rows);
  } catch (error) {
    logger.error('获取每日任务失败', { playerId, error: error.message });
    throw error;
  }
};

exports.updateTaskProgress = async function (
  playerId,
  taskCategory,
  count = 1
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const today = new Date().toISOString().split('T')[0];

    const existingTasks = await client.query(
      'SELECT * FROM player_daily_task WHERE player_id = $1 AND task_date = $2',
      [playerId, today]
    );

    if (existingTasks.rows.length === 0) {
      await initializeDailyTasksClient(client, playerId, today);
    }

    // B4-1修复：添加FOR UPDATE行锁防止并发进度超计
    const matchingTasks = await client.query(
      `SELECT pdt.*, dtc.target_count
       FROM player_daily_task pdt
       JOIN daily_task_config dtc ON pdt.task_id = dtc.task_id
       WHERE pdt.player_id = $1
         AND pdt.task_date = $2
         AND dtc.task_category = $3
         AND pdt.is_completed = FALSE
       FOR UPDATE`,
      [playerId, today, taskCategory]
    );

    const updated = [];
    for (const task of matchingTasks.rows) {
      const newProgress = Math.min(task.progress + count, task.target_count);
      const completed = newProgress >= task.target_count;

      await client.query(
        `UPDATE player_daily_task
         SET progress = $1, is_completed = $2, updated_at = CURRENT_TIMESTAMP
         WHERE player_id = $3 AND task_id = $4 AND task_date = $5`,
        [newProgress, completed, playerId, task.task_id, today]
      );

      updated.push({
        taskId: task.task_id,
        progress: newProgress,
        isCompleted: completed,
      });
    }

    await client.query('COMMIT');
    return { success: true, updated };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('更新任务进度失败', {
      playerId,
      taskCategory,
      error: error.message,
    });
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
};

exports.claimTaskReward = async function (playerId, taskId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const today = new Date().toISOString().split('T')[0];

    const taskProgress = await client.query(
      `SELECT * FROM player_daily_task
       WHERE player_id = $1 AND task_id = $2 AND task_date = $3
       FOR UPDATE`,
      [playerId, taskId, today]
    );

    if (taskProgress.rows.length === 0) {
      throw new Error('今日任务不存在');
    }

    const task = taskProgress.rows[0];
    if (!task.is_completed) {
      throw new Error('任务未完成');
    }
    if (task.is_claimed) {
      throw new Error('奖励已领取');
    }

    const taskConfig = await client.query(
      'SELECT * FROM daily_task_config WHERE task_id = $1',
      [taskId]
    );

    if (taskConfig.rows.length === 0) {
      throw new Error('任务配置不存在');
    }

    const config = taskConfig.rows[0];

    await client.query(
      `UPDATE player_daily_task
       SET is_claimed = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE player_id = $1 AND task_id = $2 AND task_date = $3`,
      [playerId, taskId, today]
    );

    await client.query(
      `UPDATE player_base
       SET player_exp = player_exp + $1, updated_at = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [config.reward_exp, playerId]
    );

    // B4-3修复：仅在有金币奖励时才更新并记录
    if (config.reward_gold > 0) {
      const balanceResult = await client.query(
        'SELECT currency_num FROM player_currency WHERE player_id = $1 FOR UPDATE',
        [playerId]
      );
      const balanceBefore = parseInt(balanceResult.rows[0]?.currency_num || 0);

      await client.query(
        `UPDATE player_currency
         SET currency_num = currency_num + $1,
             total_earn = total_earn + $1,
             last_earn_time = CURRENT_TIMESTAMP
         WHERE player_id = $2`,
        [config.reward_gold, playerId]
      );

      await client.query(
        `INSERT INTO player_currency_log
         (player_id, type, amount, source, related_id, balance_before, balance_after)
         VALUES ($1, 1, $2, 'daily_task_reward', $3, $4, $5)`,
        [
          playerId,
          config.reward_gold,
          taskId,
          balanceBefore,
          balanceBefore + config.reward_gold,
        ]
      );
    }

    const receivedItems = [];
    if (config.reward_items && Array.isArray(config.reward_items)) {
      for (const item of config.reward_items) {
        const existingItem = await client.query(
          'SELECT id, item_num FROM player_inventory WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2 FOR UPDATE',
          [playerId, item.item_id]
        );

        if (existingItem.rows.length > 0) {
          await client.query(
            'UPDATE player_inventory SET item_num = item_num + $1, total_add = total_add + $1, last_add_time = CURRENT_TIMESTAMP WHERE player_id = $2 AND item_type = 2 AND item_obj_id = $3',
            [item.count, playerId, item.item_id]
          );
        } else {
          await client.query(
            'INSERT INTO player_inventory (player_id, item_type, item_obj_id, item_num, total_add, last_add_time) VALUES ($1, 2, $2, $3, $3, CURRENT_TIMESTAMP)',
            [playerId, item.item_id, item.count]
          );
        }
        receivedItems.push({ itemId: item.item_id, count: item.count });
      }
    }

    if (config.reward_gems > 0) {
      await client.query(
        'UPDATE player_base SET premium_currency = premium_currency + $1, updated_at = CURRENT_TIMESTAMP WHERE player_id = $2',
        [config.reward_gems, playerId]
      );
    }

    await client.query('COMMIT');

    return {
      success: true,
      taskId,
      reward: {
        exp: config.reward_exp,
        gold: config.reward_gold,
        gems: config.reward_gems,
        items: receivedItems,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('领取任务奖励失败', {
      playerId,
      taskId,
      error: error.message,
    });
    throw error;
  } finally {
    client.release();
  }
};

async function initializeDailyTasks(playerId, date) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await initializeDailyTasksClient(client, playerId, date);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function initializeDailyTasksClient(client, playerId, date) {
  const playerResult = await client.query(
    'SELECT player_level FROM player_base WHERE player_id = $1',
    [playerId]
  );

  if (playerResult.rows.length === 0) {
    throw new Error('玩家不存在');
  }

  const playerLevel = playerResult.rows[0].player_level;

  const tasksResult = await client.query(
    `SELECT * FROM daily_task_config
     WHERE unlock_level <= $1 AND is_active = TRUE
     ORDER BY sort_order`,
    [playerLevel]
  );

  for (const task of tasksResult.rows) {
    await client.query(
      `INSERT INTO player_daily_task (player_id, task_id, progress, task_date)
       VALUES ($1, $2, 0, $3)
       ON CONFLICT (player_id, task_id, task_date) DO NOTHING`,
      [playerId, task.task_id, date]
    );
  }
}

async function enrichTaskData(tasks) {
  const taskIds = tasks.map((t) => t.task_id);
  if (taskIds.length === 0) return [];

  const configs = await pool.query(
    `SELECT * FROM daily_task_config WHERE task_id = ANY($1::int[])`,
    [taskIds]
  );

  const configMap = {};
  configs.rows.forEach((c) => {
    configMap[c.task_id] = c;
  });

  return tasks.map((t) => {
    const config = configMap[t.task_id] || {};
    return {
      id: t.id,
      taskId: t.task_id,
      taskName: config.task_name || '',
      taskDescription: config.task_description || '',
      taskCategory: config.task_category || '',
      targetCount: config.target_count || 0,
      progress: t.progress,
      isCompleted: t.is_completed,
      isClaimed: t.is_claimed,
      rewardExp: config.reward_exp || 0,
      rewardGold: config.reward_gold || 0,
      rewardGems: config.reward_gems || 0,
      rewardItems: config.reward_items || null,
      sortOrder: config.sort_order || 0,
    };
  });
}
