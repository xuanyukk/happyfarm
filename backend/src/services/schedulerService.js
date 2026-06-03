// 文件名：schedulerService.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.1.0
// 功能描述：定时任务调度服务

const cron = require('node-cron');
const backupService = require('./backupService');
const logger = require('../config/logger');

let pool = null;
const getPool = () => {
  if (!pool) {
    try {
      pool = require('../config/db');
    } catch (e) {
      // db config not loaded yet
    }
  }
  return pool;
};

const schedulerService = {
  jobs: new Map(),

  startBackupJob(cronExpression = '0 2 * * *') {
    try {
      const jobId = 'daily-backup';

      if (this.jobs.has(jobId)) {
        logger.warn('备份任务已存在，先停止旧任务');
        this.stopJob(jobId);
      }

      const job = cron.schedule(
        cronExpression,
        async () => {
          logger.info('执行定时数据库备份任务');
          try {
            await backupService.createBackup();
          } catch (error) {
            logger.error('定时备份任务执行失败', {
              error: error.message,
              stack: error.stack,
            });
          }
        },
        {
          scheduled: true,
          timezone: 'Asia/Shanghai',
        }
      );

      this.jobs.set(jobId, job);
      logger.info('定时备份任务已启动', { cronExpression });

      return jobId;
    } catch (error) {
      logger.error('启动定时备份任务失败', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  startDailyResetJob(cronExpression = '0 0 * * *') {
    try {
      const jobId = 'daily-shop-reset';

      if (this.jobs.has(jobId)) {
        logger.warn('每日重置任务已存在，先停止旧任务');
        this.stopJob(jobId);
      }

      const job = cron.schedule(
        cronExpression,
        async () => {
          logger.info('执行每日商店限购重置任务');
          try {
            const dbPool = getPool();
            if (dbPool) {
              // 清理3天前的记录保持表整洁
              const result = await dbPool.query(
                `DELETE FROM player_shop_daily_limit 
                 WHERE purchase_date < CURRENT_DATE - INTERVAL '3 days'`
              );
              logger.info('每日商店限购重置完成', {
                cleanedRows: result.rowCount,
              });
            } else {
              logger.warn('数据库连接池未初始化，跳过每日重置');
            }
          } catch (error) {
            logger.error('每日商店限购重置失败', {
              error: error.message,
              stack: error.stack,
            });
          }
        },
        {
          scheduled: true,
          timezone: 'Asia/Shanghai',
        }
      );

      this.jobs.set(jobId, job);
      logger.info('每日商店限购重置任务已启动', { cronExpression });

      return jobId;
    } catch (error) {
      logger.error('启动每日重置任务失败', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  stopJob(jobId) {
    try {
      const job = this.jobs.get(jobId);
      if (job) {
        job.stop();
        this.jobs.delete(jobId);
        logger.info('定时任务已停止', { jobId });
        return true;
      }
      logger.warn('定时任务不存在', { jobId });
      return false;
    } catch (error) {
      logger.error('停止定时任务失败', {
        error: error.message,
        stack: error.stack,
        jobId,
      });
      throw error;
    }
  },

  stopAllJobs() {
    try {
      const jobIds = Array.from(this.jobs.keys());
      for (const jobId of jobIds) {
        this.stopJob(jobId);
      }
      logger.info('所有定时任务已停止');
    } catch (error) {
      logger.error('停止所有定时任务失败', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  },

  listJobs() {
    return Array.from(this.jobs.keys()).map((jobId) => ({
      id: jobId,
      running: this.jobs.get(jobId)?.getStatus?.() === 'scheduled',
    }));
  },
};

module.exports = schedulerService;
