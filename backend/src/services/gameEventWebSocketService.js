/**
 * 文件名：gameEventWebSocketService.js
 * 作者：Trae AI
 * 日期：2026-05-22
 * 版本：v1.0.0
 * 功能描述：游戏活动WebSocket服务，提供实时推送
 * 更新记录：
 *   2026-05-22 - v1.0.0 - 初始创建
 */

const logger = require('../config/logger');
const websocketService = require('./websocketService');

// 消息队列：存储用户断线期间的消息
const messageQueues = new Map();
const MAX_QUEUE_SIZE = 100;

/**
 * 广播活动状态变更
 * @param {number} eventId - 活动ID
 * @param {string} newStatus - 新状态
 */
const broadcastEventStatusChange = (eventId, newStatus) => {
  const data = {
    eventId,
    newStatus,
    timestamp: new Date().toISOString()
  };
  
  websocketService.broadcast('event:statusChanged', data);
  logger.info('广播活动状态变更', { eventId, newStatus });
};

/**
 * 推送用户活动进度更新
 * @param {string} playerId - 玩家ID
 * @param {Object} progressData - 进度数据
 */
const pushUserProgressUpdate = (playerId, progressData) => {
  const isConnected = websocketService.isUserConnected(playerId);
  
  if (isConnected) {
    websocketService.sendToUser(playerId, 'event:progressUpdated', progressData);
    logger.debug('推送用户进度更新', { playerId });
  } else {
    // 用户离线，加入消息队列
    enqueueMessage(playerId, 'event:progressUpdated', progressData);
  }
};

/**
 * 推送奖励领取通知
 * @param {string} playerId - 玩家ID
 * @param {Object} rewardData - 奖励数据
 */
const pushRewardClaimed = (playerId, rewardData) => {
  const isConnected = websocketService.isUserConnected(playerId);
  
  if (isConnected) {
    websocketService.sendToUser(playerId, 'event:rewardClaimed', rewardData);
    logger.debug('推送奖励领取通知', { playerId });
  } else {
    enqueueMessage(playerId, 'event:rewardClaimed', rewardData);
  }
};

/**
 * 推送新活动上线通知
 * @param {Object} eventData - 活动数据
 */
const pushNewEvent = (eventData) => {
  websocketService.broadcast('event:newEvent', eventData);
  logger.info('推送新活动上线通知', { eventId: eventData.id });
};

/**
 * 用户重连时补发消息
 * @param {string} playerId - 玩家ID
 */
const handleUserReconnect = (playerId) => {
  const messages = messageQueues.get(playerId) || [];
  
  if (messages.length > 0) {
    logger.info('补发离线消息给用户', { playerId, count: messages.length });
    
    messages.forEach(({ event, data }) => {
      websocketService.sendToUser(playerId, event, data);
    });
    
    // 清空队列
    messageQueues.delete(playerId);
  }
};

/**
 * 将消息加入队列
 * @param {string} playerId - 玩家ID
 * @param {string} event - 事件名称
 * @param {any} data - 数据
 */
const enqueueMessage = (playerId, event, data) => {
  if (!messageQueues.has(playerId)) {
    messageQueues.set(playerId, []);
  }
  
  const queue = messageQueues.get(playerId);
  
  // 限制队列大小
  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift();
  }
  
  queue.push({ event, data, timestamp: new Date().toISOString() });
  
  logger.debug('消息加入队列', { playerId, event });
};

/**
 * 获取消息队列大小
 * @param {string} playerId - 玩家ID
 * @returns {number} - 队列大小
 */
const getQueueSize = (playerId) => {
  return messageQueues.get(playerId)?.length || 0;
};

/**
 * 获取所有队列统计
 * @returns {Object} - 队列统计
 */
const getQueueStats = () => {
  const stats = {
    totalUsers: messageQueues.size,
    totalMessages: 0,
    queues: {}
  };
  
  messageQueues.forEach((queue, userId) => {
    stats.totalMessages += queue.length;
    stats.queues[userId] = queue.length;
  });
  
  return stats;
};

module.exports = {
  broadcastEventStatusChange,
  pushUserProgressUpdate,
  pushRewardClaimed,
  pushNewEvent,
  handleUserReconnect,
  getQueueSize,
  getQueueStats
};

