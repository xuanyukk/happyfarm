/**
 * 文件名：queue.js
 * 作者：开发者
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：队列管理系统状态管理
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { gameService } from '../services/gameService';
import logger from '../services/logger';

export const useQueueStore = defineStore('queue', () => {
  const queueStats = ref(null);
  const selectedQueue = ref(null);
  const jobs = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 轮询相关
  let pollingInterval = null;
  const isPolling = ref(false);
  const POLLING_INTERVAL = 5000;

  // 队列配置
  const queueTypes = [
    { name: 'email', label: '邮件队列', icon: '📧' },
    { name: 'notification', label: '通知队列', icon: '🔔' },
    { name: 'backup', label: '备份队列', icon: '💾' },
    { name: 'cache-invalidation', label: '缓存失效队列', icon: '🗑️' },
  ];

  // 计算属性
  const totalJobs = computed(() => {
    if (!queueStats.value) return 0;
    return Object.values(queueStats.value).reduce(
      (sum, q) => sum + (q.waiting || 0) + (q.active || 0) + (q.delayed || 0),
      0
    );
  });

  const completedJobs = computed(() => {
    if (!queueStats.value) return 0;
    return Object.values(queueStats.value).reduce(
      (sum, q) => sum + (q.completed || 0),
      0
    );
  });

  const failedJobs = computed(() => {
    if (!queueStats.value) return 0;
    return Object.values(queueStats.value).reduce(
      (sum, q) => sum + (q.failed || 0),
      0
    );
  });

  // 获取队列统计
  const fetchQueueStats = async () => {
    loading.value = true;
    error.value = null;
    try {
      const result = await gameService.getQueueStats();
      if (result.success) {
        queueStats.value = result.data;
        logger.debug('队列统计获取成功', queueStats.value);
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message;
      logger.error('获取队列统计失败', { error: error.value });
    } finally {
      loading.value = false;
    }
  };

  // 获取指定队列详情
  const fetchQueueDetail = async (queueName) => {
    try {
      const result = await gameService.getQueueStatsByName(queueName);
      if (result.success) {
        selectedQueue.value = { name: queueName, ...result.data };
        logger.debug('队列详情获取成功', selectedQueue.value);
      }
    } catch (err) {
      logger.error('获取队列详情失败', { queueName, error: err.message });
    }
  };

  // 添加邮件任务
  const addEmailJob = async (data) => {
    try {
      const result = await gameService.addEmailJob(data);
      if (result.success) {
        logger.info('邮件任务添加成功', { jobId: result.data?.jobId });
        await fetchQueueStats();
        return result;
      }
    } catch (err) {
      logger.error('添加邮件任务失败', { error: err.message });
      throw err;
    }
  };

  // 添加通知任务
  const addNotificationJob = async (data) => {
    try {
      const result = await gameService.addNotificationJob(data);
      if (result.success) {
        logger.info('通知任务添加成功', { jobId: result.data?.jobId });
        await fetchQueueStats();
        return result;
      }
    } catch (err) {
      logger.error('添加通知任务失败', { error: err.message });
      throw err;
    }
  };

  // 添加备份任务
  const addBackupJob = async (data = {}) => {
    try {
      const result = await gameService.addBackupJob(data);
      if (result.success) {
        logger.info('备份任务添加成功', { jobId: result.data?.jobId });
        await fetchQueueStats();
        return result;
      }
    } catch (err) {
      logger.error('添加备份任务失败', { error: err.message });
      throw err;
    }
  };

  // 添加缓存失效任务
  const addCacheInvalidationJob = async (data) => {
    try {
      const result = await gameService.addCacheInvalidationJob(data);
      if (result.success) {
        logger.info('缓存失效任务添加成功', { jobId: result.data?.jobId });
        await fetchQueueStats();
        return result;
      }
    } catch (err) {
      logger.error('添加缓存失效任务失败', { error: err.message });
      throw err;
    }
  };

  // 开始轮询
  const startPolling = () => {
    if (isPolling.value) return;

    isPolling.value = true;
    logger.info('开始队列状态轮询');

    fetchQueueStats();
    pollingInterval = setInterval(() => {
      fetchQueueStats();
    }, POLLING_INTERVAL);
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    isPolling.value = false;
    logger.info('停止队列状态轮询');
  };

  // 选择队列
  const selectQueue = (queueName) => {
    if (queueName) {
      fetchQueueDetail(queueName);
    } else {
      selectedQueue.value = null;
    }
  };

  // 刷新数据
  const refresh = () => {
    return fetchQueueStats();
  };

  return {
    queueStats,
    selectedQueue,
    jobs,
    loading,
    error,
    isPolling,
    queueTypes,
    totalJobs,
    completedJobs,
    failedJobs,
    fetchQueueStats,
    fetchQueueDetail,
    addEmailJob,
    addNotificationJob,
    addBackupJob,
    addCacheInvalidationJob,
    startPolling,
    stopPolling,
    selectQueue,
    refresh,
  };
});
