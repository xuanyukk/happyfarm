/**
 * 文件名：queueConfig.js
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：BullMQ队列配置和管理
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建，提供BullMQ队列基础配置
 */

const { Queue, Worker, QueueEvents } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../config/logger');

/**
 * 队列配置
 */
const QUEUE_CONFIG = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
      count: 5000,
    },
  },
};

/**
 * 队列管理器
 */
class QueueManager {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.queueEvents = new Map();
    this.isInitialized = false;
  }

  /**
   * 初始化队列管理器
   */
  async init() {
    if (this.isInitialized) {
      logger.warn('QueueManager 已经初始化');
      return;
    }

    if (!redisClient) {
      logger.warn('Redis 未启用，队列功能不可用');
      return;
    }

    logger.info('QueueManager 初始化中...');
    this.isInitialized = true;
    logger.info('QueueManager 初始化完成');
  }

  /**
   * 创建或获取队列
   * @param {string} queueName - 队列名称
   * @param {object} options - 队列选项
   * @returns {Queue} BullMQ队列实例
   */
  getQueue(queueName, options = {}) {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    const queue = new Queue(queueName, {
      connection: QUEUE_CONFIG.connection,
      ...options,
    });

    this.queues.set(queueName, queue);
    logger.info(`队列 ${queueName} 已创建`);

    return queue;
  }

  /**
   * 创建Worker
   * @param {string} queueName - 队列名称
   * @param {function} processor - 任务处理器
   * @param {object} options - Worker选项
   * @returns {Worker} BullMQ Worker实例
   */
  createWorker(queueName, processor, options = {}) {
    if (this.workers.has(queueName)) {
      logger.warn(`Worker ${queueName} 已存在`);
      return this.workers.get(queueName);
    }

    const worker = new Worker(queueName, processor, {
      connection: QUEUE_CONFIG.connection,
      ...options,
    });

    // 注册Worker事件
    worker.on('completed', (job) => {
      logger.info(`任务 ${job.id} 完成`, { queue: queueName });
    });

    worker.on('failed', (job, err) => {
      logger.error(`任务 ${job?.id} 失败`, {
        queue: queueName,
        error: err.message,
        stack: err.stack,
      });
    });

    worker.on('progress', (job, progress) => {
      logger.debug(`任务 ${job.id} 进度: ${progress}%`, { queue: queueName });
    });

    this.workers.set(queueName, worker);
    logger.info(`Worker ${queueName} 已创建`);

    return worker;
  }

  /**
   * 创建队列事件监听器
   * @param {string} queueName - 队列名称
   * @returns {QueueEvents} QueueEvents实例
   */
  getQueueEvents(queueName) {
    if (this.queueEvents.has(queueName)) {
      return this.queueEvents.get(queueName);
    }

    const queueEvents = new QueueEvents(queueName, {
      connection: QUEUE_CONFIG.connection,
    });

    this.queueEvents.set(queueName, queueEvents);
    logger.info(`QueueEvents ${queueName} 已创建`);

    return queueEvents;
  }

  /**
   * 添加任务到队列
   * @param {string} queueName - 队列名称
   * @param {string} jobName - 任务名称
   * @param {any} data - 任务数据
   * @param {object} options - 任务选项
   * @returns {Job} BullMQ Job实例
   */
  async addJob(queueName, jobName, data, options = {}) {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, {
      ...QUEUE_CONFIG.defaultJobOptions,
      ...options,
    });
    logger.info(`任务 ${job.id} 已添加到队列 ${queueName}`, { jobName });
    return job;
  }

  /**
   * 批量添加任务
   * @param {string} queueName - 队列名称
   * @param {Array} jobs - 任务数组
   * @returns {Promise<Array<Job>>} Job实例数组
   */
  async addBulkJobs(queueName, jobs) {
    const queue = this.getQueue(queueName);
    const addedJobs = await queue.addBulk(
      jobs.map((job) => ({
        name: job.name,
        data: job.data,
        opts: { ...QUEUE_CONFIG.defaultJobOptions, ...job.opts },
      }))
    );
    logger.info(`批量添加 ${addedJobs.length} 个任务到队列 ${queueName}`);
    return addedJobs;
  }

  /**
   * 获取任务状态
   * @param {string} queueName - 队列名称
   * @param {string} jobId - 任务ID
   * @returns {Promise<Job|null>} Job实例
   */
  async getJob(queueName, jobId) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    return job;
  }

  /**
   * 获取队列统计信息
   * @param {string} queueName - 队列名称
   * @returns {Promise<object>} 统计信息
   */
  async getQueueStats(queueName) {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * 关闭所有队列和Worker
   */
  async close() {
    logger.info('正在关闭 QueueManager...');

    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info(`Worker ${name} 已关闭`);
    }

    for (const [name, queueEvents] of this.queueEvents) {
      await queueEvents.close();
      logger.info(`QueueEvents ${name} 已关闭`);
    }

    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${name} 已关闭`);
    }

    this.workers.clear();
    this.queueEvents.clear();
    this.queues.clear();
    this.isInitialized = false;

    logger.info('QueueManager 已关闭');
  }
}

module.exports = {
  QueueManager,
  QUEUE_CONFIG,
  queueManager: new QueueManager(),
};
