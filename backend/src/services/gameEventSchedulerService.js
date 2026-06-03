
/**
 * 文件名: gameEventSchedulerService.js
 * 作者: Trae AI
 * 日期: 2026-05-22
 * 版本: v1.0.0
 * 功能描述: 游戏活动定时任务调度服务
 */

const db = require('../config/db');
const logger = require('../config/logger');
const schedule = require('node-schedule');
const gameEventService = require('./gameEventService');
const gameEventStatsService = require('./gameEventStatsService');
const gameEventWebSocketService = require('./gameEventWebSocketService');

class GameEventSchedulerService {
  constructor() {
    this.jobs = new Map(); // 存储活动的定时任务
    this.isRunning = false;
  }

  /**
   * 初始化调度器
   */
  async init() {
    if (this.isRunning) {
      return;
    }

    logger.info('初始化活动定时任务调度器');

    // 从数据库加载需要调度的任务
    await this.loadPendingTasks();

    // 启动定期清理任务
    this.startCleanupJob();

    this.isRunning = true;
    logger.info('活动定时任务调度器初始化完成');
  }

  /**
   * 加载待处理的任务
   */
  async loadPendingTasks() {
    try {
      const result = await db.query(
        `SELECT * FROM game_event_scheduled_tasks 
         WHERE status IN ('pending', 'failed') 
         AND (scheduled_time IS NULL OR scheduled_time > NOW() - INTERVAL '1 hour')
         ORDER BY created_at`
      );

      for (const task of result.rows) {
        await this.scheduleTask(task);
      }

      logger.info(`加载了 ${result.rows.length} 个待处理任务`);
    } catch (error) {
      logger.error('加载待处理任务失败', { error: error.message });
    }
  }

  /**
   * 获取可用的任务类型
   */
  getAvailableTasks() {
    return [
      { id: 'event_start', name: '活动开始', description: '在指定时间启动活动' },
      { id: 'event_end', name: '活动结束', description: '在指定时间结束活动' },
      { id: 'daily_reset', name: '日常任务重置', description: '每日重置日常任务进度' },
      { id: 'weekly_reset', name: '周常任务重置', description: '每周重置周常任务进度' },
      { id: 'stats_compute', name: '统计数据计算', description: '定期计算活动统计数据' }
    ];
  }

  /**
   * 创建定时任务
   */
  async createTask(taskData) {
    const {
      task_type,
      event_id,
      cron_expression,
      scheduled_time,
      task_config,
      max_retries = 3
    } = taskData;

    const result = await db.query(
      `INSERT INTO game_event_scheduled_tasks 
       (task_type, event_id, cron_expression, scheduled_time, task_config, max_retries, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [task_type, event_id, cron_expression, scheduled_time, task_config, max_retries]
    );

    const task = result.rows[0];
    logger.info('创建定时任务', { taskId: task.id, taskType: task_type });

    // 调度任务
    await this.scheduleTask(task);

    return task;
  }

  /**
   * 调度任务
   */
  async scheduleTask(task) {
    const jobId = `task_${task.id}`;

    // 取消已存在的同ID任务
    if (this.jobs.has(jobId)) {
      this.jobs.get(jobId).cancel();
    }

    try {
      let job;
      
      if (task.cron_expression) {
        // 使用cron表达式调度
        job = schedule.scheduleJob(jobId, task.cron_expression, () => {
          this.executeTask(task.id);
        });
      } else if (task.scheduled_time) {
        // 使用固定时间调度
        const scheduledDate = new Date(task.scheduled_time);
        if (scheduledDate > new Date()) {
          job = schedule.scheduleJob(jobId, scheduledDate, () => {
            this.executeTask(task.id);
          });
        } else {
          // 时间已过，立即执行
          this.executeTask(task.id);
          return;
        }
      } else {
        logger.warn('任务没有调度时间或cron表达式', { taskId: task.id });
        return;
      }

      this.jobs.set(jobId, job);
      logger.info('任务已调度', { taskId: task.id });
    } catch (error) {
      logger.error('调度任务失败', { taskId: task.id, error: error.message });
      
      // 更新任务状态为失败
      await db.query(
        'UPDATE game_event_scheduled_tasks SET status = $1, last_error = $2 WHERE id = $3',
        ['failed', error.message, task.id]
      );
    }
  }

  /**
   * 执行任务
   */
  async executeTask(taskId) {
    const startTime = Date.now();
    let status = 'success';
    let errorMessage = null;
    let executionResult = null;

    try {
      logger.info('开始执行任务', { taskId });

      // 更新任务状态为运行中
      await db.query(
        'UPDATE game_event_scheduled_tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['running', taskId]
      );

      // 获取任务信息
      const taskResult = await db.query(
        'SELECT * FROM game_event_scheduled_tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error('任务不存在');
      }

      const task = taskResult.rows[0];

      // 根据任务类型执行
      switch (task.task_type) {
        case 'event_start':
          executionResult = await this.executeEventStart(task);
          break;
        case 'event_end':
          executionResult = await this.executeEventEnd(task);
          break;
        case 'daily_reset':
          executionResult = await this.executeDailyReset(task);
          break;
        case 'weekly_reset':
          executionResult = await this.executeWeeklyReset(task);
          break;
        case 'stats_compute':
          executionResult = await this.executeStatsCompute(task);
          break;
        default:
          throw new Error(`未知的任务类型: ${task.task_type}`);
      }

      // 任务成功完成
      await db.query(
        `UPDATE game_event_scheduled_tasks 
         SET status = $1, executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        ['completed', taskId]
      );

      logger.info('任务执行成功', { taskId, duration: Date.now() - startTime });

    } catch (error) {
      status = 'failed';
      errorMessage = error.message;
      logger.error('任务执行失败', { taskId, error: errorMessage });

      // 处理失败情况
      await this.handleTaskFailure(taskId, errorMessage);
    } finally {
      // 记录执行日志
      await this.logTaskExecution(taskId, status, executionResult, errorMessage, Date.now() - startTime);

      // 清理job
      const jobId = `task_${taskId}`;
      if (this.jobs.has(jobId)) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * 执行活动开始
   */
  async executeEventStart(task) {
    if (!task.event_id) {
      throw new Error('活动开始任务需要指定活动ID');
    }

    // 更新活动状态为进行中
    await gameEventService.updateEventStatus(task.event_id, 'active');

    // 发送WebSocket通知
    await gameEventWebSocketService.broadcastEventStatusChange(task.event_id, 'active');

    return { eventId: task.event_id, status: 'started' };
  }

  /**
   * 执行活动结束
   */
  async executeEventEnd(task) {
    if (!task.event_id) {
      throw new Error('活动结束任务需要指定活动ID');
    }

    // 更新活动状态为已结束
    await gameEventService.updateEventStatus(task.event_id, 'ended');

    // 发送WebSocket通知
    await gameEventWebSocketService.broadcastEventStatusChange(task.event_id, 'ended');

    return { eventId: task.event_id, status: 'ended' };
  }

  /**
   * 执行日常任务重置
   */
  async executeDailyReset(task) {
    const eventId = task.event_id;
    if (!eventId) {
      throw new Error('日常任务重置需要指定活动ID');
    }

    // 重置用户进度
    await db.query(
      `UPDATE game_event_user_progress 
       SET progress = 0, updated_at = CURRENT_TIMESTAMP 
       WHERE event_id = $1`,
      [eventId]
    );

    return { eventId, status: 'daily_reset_completed' };
  }

  /**
   * 执行周常任务重置
   */
  async executeWeeklyReset(task) {
    const eventId = task.event_id;
    if (!eventId) {
      throw new Error('周常任务重置需要指定活动ID');
    }

    // 重置用户进度
    await db.query(
      `UPDATE game_event_user_progress 
       SET progress = 0, updated_at = CURRENT_TIMESTAMP 
       WHERE event_id = $1`,
      [eventId]
    );

    return { eventId, status: 'weekly_reset_completed' };
  }

  /**
   * 执行统计数据计算
   */
  async executeStatsCompute(task) {
    const eventId = task.event_id;
    
    if (eventId) {
      // 计算单个活动的统计数据
      await gameEventStatsService.computeEventStats(eventId);
      return { eventId, status: 'stats_computed' };
    } else {
      // 计算所有活动的统计数据
      await gameEventStatsService.computeAllEventsStats();
      return { status: 'all_stats_computed' };
    }
  }

  /**
   * 处理任务失败
   */
  async handleTaskFailure(taskId, errorMessage) {
    const result = await db.query(
      'SELECT * FROM game_event_scheduled_tasks WHERE id = $1',
      [taskId]
    );

    if (result.rows.length === 0) {
      return;
    }

    const task = result.rows[0];
    const newRetryCount = task.retry_count + 1;

    if (newRetryCount <= task.max_retries) {
      // 可以重试
      const retryDelay = Math.min(30 * 1000 * Math.pow(2, newRetryCount - 1), 3600 * 1000); // 指数退避，最大1小时
      const retryTime = new Date(Date.now() + retryDelay);

      await db.query(
        `UPDATE game_event_scheduled_tasks 
         SET status = $1, retry_count = $2, last_error = $3, scheduled_time = $4, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5`,
        ['pending', newRetryCount, errorMessage, retryTime, taskId]
      );

      logger.info('任务将重试', { taskId, retryCount: newRetryCount, retryTime });

      // 重新调度任务
      const updatedTask = await db.query('SELECT * FROM game_event_scheduled_tasks WHERE id = $1', [taskId]);
      await this.scheduleTask(updatedTask.rows[0]);
    } else {
      // 达到最大重试次数
      await db.query(
        `UPDATE game_event_scheduled_tasks 
         SET status = $1, last_error = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        ['failed', errorMessage, taskId]
      );

      logger.error('任务达到最大重试次数，标记为失败', { taskId });
    }
  }

  /**
   * 记录任务执行日志
   */
  async logTaskExecution(taskId, status, executionResult, errorMessage, durationMs) {
    await db.query(
      `INSERT INTO game_event_task_logs 
       (task_id, status, execution_result, error_message, execution_duration_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [taskId, status, executionResult || null, errorMessage || null, durationMs]
    );
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId) {
    const jobId = `task_${taskId}`;
    
    // 取消定时任务
    if (this.jobs.has(jobId)) {
      this.jobs.get(jobId).cancel();
      this.jobs.delete(jobId);
    }

    // 更新数据库状态
    await db.query(
      'UPDATE game_event_scheduled_tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', taskId]
    );

    logger.info('任务已取消', { taskId });
  }

  /**
   * 获取任务列表
   */
  async getTasks(filters = {}) {
    let query = 'SELECT * FROM game_event_scheduled_tasks WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.task_type) {
      query += ` AND task_type = $${paramIndex}`;
      params.push(filters.task_type);
      paramIndex++;
    }

    if (filters.event_id) {
      query += ` AND event_id = $${paramIndex}`;
      params.push(filters.event_id);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * 获取任务执行日志
   */
  async getTaskLogs(taskId) {
    const result = await db.query(
      'SELECT * FROM game_event_task_logs WHERE task_id = $1 ORDER BY executed_at DESC',
      [taskId]
    );
    return result.rows;
  }

  /**
   * 启动定期清理任务
   */
  startCleanupJob() {
    // 每天凌晨2点清理旧的已完成任务
    const cleanupJob = schedule.scheduleJob('0 2 * * *', async () => {
      try {
        logger.info('开始清理旧的定时任务记录');

        // 删除30天前的已完成任务和日志
        await db.query(
          `DELETE FROM game_event_task_logs 
           WHERE executed_at < NOW() - INTERVAL '30 days'`
        );

        await db.query(
          `DELETE FROM game_event_scheduled_tasks 
           WHERE status IN ('completed', 'cancelled') 
           AND updated_at < NOW() - INTERVAL '30 days'`
        );

        logger.info('清理旧的定时任务记录完成');
      } catch (error) {
        logger.error('清理旧的定时任务记录失败', { error: error.message });
      }
    });

    this.jobs.set('cleanup', cleanupJob);
  }

  /**
   * 优雅关闭
   */
  async shutdown() {
    logger.info('正在关闭活动定时任务调度器');
    
    for (const [jobId, job] of this.jobs) {
      if (job.cancel) {
        job.cancel();
      }
    }
    
    this.jobs.clear();
    this.isRunning = false;
    logger.info('活动定时任务调度器已关闭');
  }
}

module.exports = new GameEventSchedulerService();

