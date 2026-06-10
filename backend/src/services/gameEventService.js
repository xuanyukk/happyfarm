/**
 * 文件名：gameEventService.js
 * 作者：开发者
 * 日期：2026-05-22
 * 版本：v2.3.0
 * 功能描述：游戏活动管理服务 - 活动创建、任务管理、进度追踪、管理后台进度概览
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本
 *   2026-05-22 - v2.0.0 - 修复数据库引用、添加状态计算、完善奖励发放逻辑
 *   2026-05-24 - v2.1.0 - 修复奖励发放字段名Bug(balance→currency_num等)、消除双重子查询、修正物品奖励字段名
 *   2026-05-31 - v2.2.0 - 新增 getAdminEventProgress 管理后台活动进度概览方法
 *   2026-06-09 - v2.3.0 - 时间字段统一：update_time → updated_at
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 计算活动状态
 * @param {Object} event - 活动对象
 * @returns {string} 状态: 'upcoming' | 'active' | 'ended'
 */
function calculateEventStatus(event) {
  if (!event.is_active) {
    return 'ended';
  }

  const now = new Date();
  const startTime = new Date(event.start_time);
  const endTime = event.end_time ? new Date(event.end_time) : null;

  if (now < startTime) {
    return 'upcoming';
  }

  if (endTime && now > endTime) {
    return 'ended';
  }

  return 'active';
}

/**
 * 增强活动数据 - 添加状态和处理配置
 * @param {Object} event - 原始活动数据
 * @returns {Object} 增强后的活动数据
 */
function enhanceEventData(event) {
  return {
    ...event,
    status: calculateEventStatus(event),
  };
}

const gameEventService = {
  /**
   * 获取所有活动
   * @param {boolean} includeInactive - 是否包含非活跃活动
   * @returns {Promise<Array>} 活动列表
   */
  async getAllEvents(includeInactive = false) {
    try {
      let query = `
        SELECT 
          e.*,
          u.username as creator_name
        FROM game_events e
        LEFT JOIN sys_user u ON e.created_by = u.id
      `;
      const params = [];

      if (!includeInactive) {
        query += ' WHERE e.is_active = true';
      }

      query += ' ORDER BY e.start_time DESC';

      const result = await pool.query(query, params);
      return result.rows.map(enhanceEventData);
    } catch (error) {
      logger.error('获取所有活动失败', { error: error.message });
      throw error;
    }
  },

  /**
   * 获取活跃活动
   * @returns {Promise<Array>} 活跃活动列表
   */
  async getActiveEvents() {
    try {
      const query = `
        SELECT * FROM game_events
        WHERE is_active = true
          AND start_time <= NOW()
          AND (end_time IS NULL OR end_time >= NOW())
        ORDER BY start_time DESC
      `;
      const result = await pool.query(query);
      return result.rows.map(enhanceEventData);
    } catch (error) {
      logger.error('获取活动失败', { error: error.message });
      throw error;
    }
  },

  /**
   * 获取活动详情
   * @param {number} eventId - 活动ID
   * @returns {Promise<Object|null>} 活动详情
   */
  async getEventById(eventId) {
    try {
      const query = 'SELECT * FROM game_events WHERE id = $1';
      const result = await pool.query(query, [eventId]);
      if (result.rows.length === 0) {
        return null;
      }
      return enhanceEventData(result.rows[0]);
    } catch (error) {
      logger.error('获取活动失败', { error: error.message, eventId });
      throw error;
    }
  },

  /**
   * 创建活动
   * @param {Object} eventData - 活动数据
   * @param {number} adminId - 管理员ID
   * @returns {Promise<Object>} 创建的活动
   */
  async createEvent(eventData, adminId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO game_events (
          event_name, event_type, event_description, event_banner,
          template_id, start_time, end_time, event_config, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        eventData.event_name,
        eventData.event_type,
        eventData.event_description || null,
        eventData.event_banner || null,
        eventData.template_id || null,
        eventData.start_time,
        eventData.end_time,
        JSON.stringify(eventData.event_config || {}),
        adminId,
      ];

      const result = await client.query(query, values);
      const event = result.rows[0];

      // 如果有任务配置，同时创建任务
      if (eventData.tasks && Array.isArray(eventData.tasks)) {
        for (const taskData of eventData.tasks) {
          await this._createTask(client, event.id, taskData);
        }
      }

      await client.query('COMMIT');
      logger.info('创建活动成功', {
        eventId: event.id,
        eventName: event.event_name,
      });
      return enhanceEventData(event);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('创建活动失败', {
        error: error.message,
        eventName: eventData?.event_name,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * 更新活动
   * @param {number} eventId - 活动ID
   * @param {Object} eventData - 更新数据
   * @returns {Promise<Object>} 更新后的活动
   */
  async updateEvent(eventId, eventData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE game_events SET
          event_name = COALESCE($1, event_name),
          event_type = COALESCE($2, event_type),
          event_description = COALESCE($3, event_description),
          event_banner = COALESCE($4, event_banner),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          event_config = COALESCE($7, event_config),
          is_active = COALESCE($8, is_active)
        WHERE id = $9
        RETURNING *
      `;

      const values = [
        eventData.event_name,
        eventData.event_type,
        eventData.event_description,
        eventData.event_banner,
        eventData.start_time,
        eventData.end_time,
        eventData.event_config ? JSON.stringify(eventData.event_config) : null,
        eventData.is_active,
        eventId,
      ];

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('活动不存在');
      }

      await client.query('COMMIT');
      logger.info('更新活动成功', { eventId });
      return enhanceEventData(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新活动失败', { error: error.message, eventId });
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * 删除活动（软删除）
   * @param {number} eventId - 活动ID
   * @returns {Promise<Object>} 操作结果
   */
  async deleteEvent(eventId) {
    try {
      const query = 'UPDATE game_events SET is_active = false WHERE id = $1';
      await pool.query(query, [eventId]);
      logger.info('删除活动成功', { eventId });
      return { success: true };
    } catch (error) {
      logger.error('删除活动失败', { error: error.message, eventId });
      throw error;
    }
  },

  /**
   * 创建活动任务（内部方法）
   * @private
   * @param {Object} client - 数据库客户端
   * @param {number} eventId - 活动ID
   * @param {Object} taskData - 任务数据
   * @returns {Promise<Object>} 创建的任务
   */
  async _createTask(client, eventId, taskData) {
    const query = `
      INSERT INTO game_event_tasks (
        event_id, task_name, task_type, task_description,
        task_target, task_rewards, task_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      eventId,
      taskData.task_name,
      taskData.task_type,
      taskData.task_description || null,
      taskData.task_target,
      JSON.stringify(taskData.task_rewards || {}),
      taskData.task_order || 0,
      taskData.is_active !== undefined ? taskData.is_active : true,
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  },

  /**
   * 获取活动任务列表
   * @param {number} eventId - 活动ID
   * @returns {Promise<Array>} 任务列表
   */
  async getEventTasks(eventId) {
    try {
      const query = `
        SELECT * FROM game_event_tasks
        WHERE event_id = $1
        ORDER BY task_order, id
      `;
      const result = await pool.query(query, [eventId]);
      return result.rows;
    } catch (error) {
      logger.error('获取活动任务失败', { error: error.message, eventId });
      throw error;
    }
  },

  /**
   * 添加活动任务
   * @param {number} eventId - 活动ID
   * @param {Object} taskData - 任务数据
   * @returns {Promise<Object>} 创建的任务
   */
  async addTask(eventId, taskData) {
    try {
      const query = `
        INSERT INTO game_event_tasks (
          event_id, task_name, task_type, task_description,
          task_target, task_rewards, task_order, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        eventId,
        taskData.task_name,
        taskData.task_type,
        taskData.task_description || null,
        taskData.task_target,
        JSON.stringify(taskData.task_rewards || {}),
        taskData.task_order || 0,
        taskData.is_active !== undefined ? taskData.is_active : true,
      ];

      const result = await pool.query(query, values);
      logger.info('添加活动任务成功', {
        eventId,
        taskName: taskData.task_name,
      });
      return result.rows[0];
    } catch (error) {
      logger.error('添加活动任务失败', { error: error.message, eventId });
      throw error;
    }
  },

  /**
   * 更新活动任务
   * @param {number} taskId - 任务ID
   * @param {Object} taskData - 更新数据
   * @returns {Promise<Object>} 更新后的任务
   */
  async updateTask(taskId, taskData) {
    try {
      const query = `
        UPDATE game_event_tasks SET
          task_name = COALESCE($1, task_name),
          task_type = COALESCE($2, task_type),
          task_description = COALESCE($3, task_description),
          task_target = COALESCE($4, task_target),
          task_rewards = COALESCE($5, task_rewards),
          task_order = COALESCE($6, task_order),
          is_active = COALESCE($7, is_active)
        WHERE id = $8
        RETURNING *
      `;

      const values = [
        taskData.task_name,
        taskData.task_type,
        taskData.task_description,
        taskData.task_target,
        taskData.task_rewards ? JSON.stringify(taskData.task_rewards) : null,
        taskData.task_order,
        taskData.is_active,
        taskId,
      ];

      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('任务不存在');
      }

      logger.info('更新活动任务成功', { taskId });
      return result.rows[0];
    } catch (error) {
      logger.error('更新活动任务失败', { error: error.message, taskId });
      throw error;
    }
  },

  /**
   * 删除活动任务（软删除）
   * @param {number} taskId - 任务ID
   * @returns {Promise<Object>} 操作结果
   */
  async deleteTask(taskId) {
    try {
      const query =
        'UPDATE game_event_tasks SET is_active = false WHERE id = $1';
      await pool.query(query, [taskId]);
      logger.info('删除活动任务成功', { taskId });
      return { success: true };
    } catch (error) {
      logger.error('删除活动任务失败', { error: error.message, taskId });
      throw error;
    }
  },

  /**
   * 获取玩家活动进度
   * @param {string} playerId - 玩家ID
   * @param {number} eventId - 活动ID
   * @returns {Promise<Array>} 进度列表
   */
  async getPlayerEventProgress(playerId, eventId) {
    try {
      const query = `
        SELECT 
          p.*,
          t.task_name,
          t.task_type,
          t.task_target,
          t.task_rewards
        FROM player_event_progress p
        JOIN game_event_tasks t ON p.task_id = t.id
        WHERE p.player_id = $1 AND p.event_id = $2
        ORDER BY t.task_order, t.id
      `;
      const result = await pool.query(query, [playerId, eventId]);
      return result.rows;
    } catch (error) {
      logger.error('获取玩家活动进度失败', {
        error: error.message,
        playerId,
        eventId,
      });
      throw error;
    }
  },

  /**
   * 更新玩家活动进度
   * @param {string} playerId - 玩家ID
   * @param {number} eventId - 活动ID
   * @param {string} taskType - 任务类型
   * @param {number} increment - 增量值
   * @returns {Promise<Object>} 更新结果
   */
  async updatePlayerProgress(playerId, eventId, taskType, increment = 1) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取该活动的相关任务
      // B3-2修复：添加活动时间有效性检查
      const tasksQuery = `
        SELECT t.* FROM game_event_tasks t
        JOIN game_events e ON t.event_id = e.id
        WHERE t.event_id = $1 
          AND t.task_type = $2 
          AND t.is_active = true
          AND e.is_active = true
          AND e.start_time <= CURRENT_TIMESTAMP 
          AND e.end_time >= CURRENT_TIMESTAMP
      `;
      const tasksResult = await client.query(tasksQuery, [eventId, taskType]);

      if (tasksResult.rows.length === 0) {
        await client.query('COMMIT');
        return { updated: [] };
      }

      const updatedProgresses = [];

      for (const task of tasksResult.rows) {
        // 查找或创建玩家进度记录
        const progressQuery = `
          SELECT * FROM player_event_progress
          WHERE player_id = $1 AND event_id = $2 AND task_id = $3
          FOR UPDATE
        `;
        const progressResult = await client.query(progressQuery, [
          playerId,
          eventId,
          task.id,
        ]);

        let progress;
        if (progressResult.rows.length === 0) {
          // 创建新进度
          const insertQuery = `
            INSERT INTO player_event_progress (player_id, event_id, task_id, progress)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
          const insertResult = await client.query(insertQuery, [
            playerId,
            eventId,
            task.id,
            increment,
          ]);
          progress = insertResult.rows[0];
        } else {
          // 更新现有进度
          progress = progressResult.rows[0];

          if (!progress.is_completed) {
            const newProgress = progress.progress + increment;
            const isCompleted = newProgress >= task.task_target;

            const updateQuery = `
              UPDATE player_event_progress
              SET progress = $1,
                  is_completed = $2,
                  completed_at = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE completed_at END
              WHERE id = $3
              RETURNING *
            `;
            const updateResult = await client.query(updateQuery, [
              newProgress,
              isCompleted,
              progress.id,
            ]);
            progress = updateResult.rows[0];
          }
        }

        updatedProgresses.push(progress);
      }

      await client.query('COMMIT');
      logger.info('更新玩家活动进度成功', { playerId, eventId, taskType });
      return { updated: updatedProgresses };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新玩家活动进度失败', {
        error: error.message,
        playerId,
        eventId,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * 发放货币奖励
   * @private
   * @param {Object} client - 数据库客户端
   * @param {string} playerId - 玩家ID
   * @param {Object} currencyReward - 货币奖励配置
   * @returns {Promise<void>}
   */
  async _grantCurrencyReward(client, playerId, currencyReward) {
    if (!currencyReward || !currencyReward.amount) {
      return;
    }

    // B3-4修复：确保player_currency记录存在
    await client.query(
      `INSERT INTO player_currency (player_id, currency_num) 
       VALUES ($1, 0) ON CONFLICT (player_id) DO NOTHING`,
      [playerId]
    );

    // 获取当前余额（修正字段名：balance → currency_num）
    const balResult = await client.query(
      'SELECT currency_num FROM player_currency WHERE player_id = $1 FOR UPDATE',
      [playerId]
    );
    const beforeBalance = parseInt(balResult.rows[0]?.currency_num || 0);
    const afterBalance = beforeBalance + currencyReward.amount;

    // 更新余额（修正字段名：update_time → updated_at）
    await client.query(
      `UPDATE player_currency
       SET currency_num = $1, updated_at = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [afterBalance, playerId]
    );

    // 记录日志（修正字段名 + 消除双重子查询）
    await client.query(
      `INSERT INTO player_currency_log
       (player_id, type, amount, source, balance_before, balance_after)
       VALUES ($1, 1, $2, $3, $4, $5)`,
      [
        playerId,
        currencyReward.amount,
        'event_reward',
        beforeBalance,
        afterBalance,
      ]
    );

    logger.info('发放货币奖励成功', {
      playerId,
      amount: currencyReward.amount,
    });
  },

  /**
   * 发放物品奖励
   * @private
   * @param {Object} client - 数据库客户端
   * @param {string} playerId - 玩家ID
   * @param {Object} itemReward - 物品奖励配置
   * @returns {Promise<void>}
   */
  async _grantItemReward(client, playerId, itemReward) {
    if (!itemReward || !itemReward.item_id || !itemReward.quantity) {
      return;
    }

    // 检查玩家是否已有该道具（修正字段名）
    const checkQuery = `
      SELECT id, item_num FROM player_inventory
      WHERE player_id = $1 AND item_type = 2 AND item_obj_id = $2
      FOR UPDATE
    `;
    const checkResult = await client.query(checkQuery, [
      playerId,
      itemReward.item_id,
    ]);

    if (checkResult.rows.length > 0) {
      // 更新现有物品数量（修正字段名：quantity → item_num, update_time → updated_at）
      const updateQuery = `
        UPDATE player_inventory
        SET item_num = item_num + $1,
            total_add = total_add + $1,
            last_add_time = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      await client.query(updateQuery, [
        itemReward.quantity,
        checkResult.rows[0].id,
      ]);
    } else {
      // 添加新道具（修正字段名）
      const insertQuery = `
        INSERT INTO player_inventory
        (player_id, item_type, item_obj_id, item_num, total_add, last_add_time)
        VALUES ($1, 2, $2, $3, $3, CURRENT_TIMESTAMP)
      `;
      await client.query(insertQuery, [
        playerId,
        itemReward.item_id,
        itemReward.quantity,
      ]);
    }

    logger.info('发放物品奖励成功', {
      playerId,
      itemId: itemReward.item_id,
      quantity: itemReward.quantity,
    });
  },

  /**
   * 发放经验奖励
   * @private
   * @param {Object} client - 数据库客户端
   * @param {string} playerId - 玩家ID
   * @param {Object} expReward - 经验奖励配置
   * @returns {Promise<void>}
   */
  async _grantExpReward(client, playerId, expReward) {
    if (!expReward || !expReward.amount) {
      return;
    }

    // 修正字段名：exp → player_exp, update_time → updated_at
    await client.query(
      `UPDATE player_base
       SET player_exp = player_exp + $1, updated_at = CURRENT_TIMESTAMP
       WHERE player_id = $2`,
      [expReward.amount, playerId]
    );

    logger.info('发放经验奖励成功', {
      playerId,
      amount: expReward.amount,
    });
  },

  /**
   * 领取任务奖励
   * @param {string} playerId - 玩家ID
   * @param {number} eventId - 活动ID
   * @param {number} taskId - 任务ID
   * @returns {Promise<Object>} 领取结果
   */
  async claimTaskReward(playerId, eventId, taskId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // B3-3修复：添加活动状态检查
      const eventQuery = `
        SELECT id, is_active, start_time, end_time 
        FROM game_events 
        WHERE id = $1 FOR UPDATE
      `;
      const eventResult = await client.query(eventQuery, [eventId]);
      if (eventResult.rows.length === 0) {
        throw new Error('活动不存在');
      }
      const event = eventResult.rows[0];
      if (!event.is_active) {
        throw new Error('活动已结束');
      }
      const now = new Date();
      if (new Date(event.start_time) > now) {
        throw new Error('活动尚未开始');
      }
      if (new Date(event.end_time) < now) {
        throw new Error('活动已结束');
      }

      // 获取进度和任务信息
      const progressQuery = `
        SELECT p.*, t.task_rewards
        FROM player_event_progress p
        JOIN game_event_tasks t ON p.task_id = t.id
        WHERE p.player_id = $1 AND p.event_id = $2 AND p.task_id = $3
        FOR UPDATE
      `;
      const progressResult = await client.query(progressQuery, [
        playerId,
        eventId,
        taskId,
      ]);

      if (progressResult.rows.length === 0) {
        throw new Error('进度记录不存在');
      }

      const progress = progressResult.rows[0];

      if (!progress.is_completed) {
        throw new Error('任务尚未完成');
      }

      if (progress.is_rewarded) {
        throw new Error('奖励已领取');
      }

      // 发放奖励
      // B3-1修复：task_rewards可能是JSON字符串，需显式parse
      const rawRewards = progress.task_rewards;
      const rewards = typeof rawRewards === 'string'
        ? JSON.parse(rawRewards)
        : rawRewards;
      const grantedRewards = [];

      // 发放货币奖励
      if (rewards.currency) {
        await this._grantCurrencyReward(client, playerId, rewards.currency);
        grantedRewards.push({ type: 'currency', ...rewards.currency });
      }

      // 发放物品奖励
      if (rewards.items && Array.isArray(rewards.items)) {
        for (const item of rewards.items) {
          await this._grantItemReward(client, playerId, item);
          grantedRewards.push({ type: 'item', ...item });
        }
      }

      // 发放经验奖励
      if (rewards.exp) {
        await this._grantExpReward(client, playerId, rewards.exp);
        grantedRewards.push({ type: 'exp', ...rewards.exp });
      }

      // 标记奖励已领取
      await client.query(
        `
        UPDATE player_event_progress
        SET is_rewarded = true
        WHERE id = $1
        `,
        [progress.id]
      );

      // 记录奖励历史
      await client.query(
        `
        INSERT INTO game_event_rewards (
          player_id, event_id, task_id, reward_type, reward_data
        ) VALUES ($1, $2, $3, $4, $5)
        `,
        [playerId, eventId, taskId, 'task', JSON.stringify(rewards)]
      );

      await client.query('COMMIT');
      logger.info('玩家领取活动奖励成功', { playerId, eventId, taskId });
      return { success: true, rewards: grantedRewards };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('玩家领取活动奖励失败', {
        error: error.message,
        playerId,
        eventId,
        taskId,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * 获取活动统计信息
   * @param {number} eventId - 活动ID
   * @returns {Promise<Object>} 统计信息
   */
  async getEventStats(eventId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT player_id) as participant_count,
          COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN is_rewarded = true THEN 1 END) as rewarded_tasks
        FROM player_event_progress
        WHERE event_id = $1
      `;
      const result = await pool.query(query, [eventId]);
      return result.rows[0];
    } catch (error) {
      logger.error('获取活动统计失败', { error: error.message, eventId });
      throw error;
    }
  },

  /**
   * 获取玩家活动统计
   * @param {string} playerId - 玩家ID
   * @returns {Promise<Array>} 统计列表
   */
  async getPlayerEventStats(playerId) {
    try {
      const query = `
        SELECT 
          e.id as event_id,
          e.event_name,
          COUNT(p.id) as total_tasks,
          COUNT(CASE WHEN p.is_completed = true THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN p.is_rewarded = true THEN 1 END) as rewarded_tasks
        FROM game_events e
        LEFT JOIN player_event_progress p ON e.id = p.event_id AND p.player_id = $1
        WHERE e.is_active = true
        GROUP BY e.id, e.event_name
        ORDER BY e.start_time DESC
      `;
      const result = await pool.query(query, [playerId]);
      return result.rows.map(enhanceEventData);
    } catch (error) {
      logger.error('获取玩家活动统计失败', { error: error.message, playerId });
      throw error;
    }
  },

  async updateEventStatus(eventId, isActive) {
    try {
      const result = await pool.query(
        `UPDATE game_events SET is_active = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [eventId, isActive]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return enhanceEventData(result.rows[0]);
    } catch (error) {
      logger.error('更新活动状态失败', { error: error.message, eventId });
      throw error;
    }
  },

  async startEvent(eventId) {
    return this.updateEventStatus(eventId, true);
  },

  async resumeEvent(eventId) {
    return this.updateEventStatus(eventId, true);
  },

  async pauseEvent(eventId) {
    return this.updateEventStatus(eventId, false);
  },

  async endEvent(eventId) {
    try {
      const result = await pool.query(
        `UPDATE game_events SET is_active = false, end_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [eventId]
      );
      if (result.rows.length === 0) {
        return null;
      }
      return enhanceEventData(result.rows[0]);
    } catch (error) {
      logger.error('结束活动失败', { error: error.message, eventId });
      throw error;
    }
  },

  /**
   * 获取管理后台活动进度概览（聚合所有玩家）
   * @param {number} eventId - 活动ID
   * @returns {Object} 进度聚合数据
   */
  async getAdminEventProgress(eventId) {
    try {
      const summaryQuery = `
        SELECT
          COUNT(DISTINCT player_id) AS total_participants,
          COUNT(*) AS total_progress_records,
          COUNT(CASE WHEN is_completed = true THEN 1 END) AS completed_tasks,
          COUNT(CASE WHEN is_rewarded = true THEN 1 END) AS rewarded_tasks
        FROM player_event_progress
        WHERE event_id = $1
      `;
      const summaryResult = await pool.query(summaryQuery, [eventId]);

      const taskProgressQuery = `
        SELECT
          t.task_name,
          t.task_type,
          COUNT(DISTINCT p.player_id) AS completed_by,
          COUNT(CASE WHEN p.is_rewarded = true THEN 1 END) AS rewarded_count
        FROM game_event_tasks t
        LEFT JOIN player_event_progress p
          ON t.id = p.task_id AND p.is_completed = true
        WHERE t.event_id = $1
        GROUP BY t.id, t.task_name, t.task_type
        ORDER BY t.task_order
      `;
      const taskProgressResult = await pool.query(taskProgressQuery, [eventId]);

      return {
        summary: summaryResult.rows[0],
        taskProgress: taskProgressResult.rows,
      };
    } catch (error) {
      logger.error('获取管理后台活动进度失败', {
        error: error.message,
        eventId,
      });
      throw error;
    }
  },
};

module.exports = gameEventService;
