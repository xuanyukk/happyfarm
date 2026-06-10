/**
 * 文件名：websocketService.js
 * 作者：开发者
 * 日期：2026-03-27
 * 版本：v1.2.0
 * 功能描述：WebSocket服务，管理实时通信和数据推送
 * 更新记录：
 *   2026-03-27 - v1.0.0 - 新建文件，实现WebSocket服务功能
 *   2026-03-29 - v1.1.0 - 添加作物成熟推送功能
 *   2026-06-11 - v1.2.0 - B6-2/B6-3修复：添加僵尸连接清理、Socket验证
 */

const logger = require('../config/logger');

// 静态导入WebSocket实例
let ioInstance = null;
let connectedUsersInstance = null;

function getIO() {
  try {
    if (!ioInstance || !connectedUsersInstance) {
      const serverModule = require('../server');
      ioInstance = serverModule.io;
      connectedUsersInstance = serverModule.connectedUsers;
    }
    return {
      io: ioInstance,
      connectedUsers: connectedUsersInstance,
    };
  } catch (error) {
    logger.warn('WebSocket服务尚未初始化', { error: error.message });
    return { io: null, connectedUsers: null };
  }
}

/**
 * 向特定用户推送消息
 * @param {string} userId - 用户ID
 * @param {string} event - 事件名称
 * @param {any} data - 消息数据
 * @returns {boolean} - 是否推送成功
 */
const sendToUser = (userId, event, data) => {
  const { io, connectedUsers } = getIO();

  if (!io || !connectedUsers) {
    logger.warn('WebSocket服务未初始化，无法推送消息');
    return false;
  }

  const socketId = connectedUsers.get(userId);
  if (!socketId) {
    logger.warn('用户未连接WebSocket', { userId });
    return false;
  }

  // B6-3修复：验证Socket是否存在后再推送
  const socket = io.sockets.sockets.get(socketId);
  if (!socket || !socket.connected) {
    logger.warn('Socket连接已断开，清理映射', { userId, socketId });
    connectedUsers.delete(userId);
    return false;
  }

  try {
    io.to(socketId).emit(event, data);
    logger.debug('向用户推送消息', {
      userId,
      event,
      data: JSON.stringify(data),
    });
    return true;
  } catch (error) {
    logger.error('推送消息失败', { userId, event, error: error.message });
    return false;
  }
};

/**
 * 广播消息给所有连接的用户
 * @param {string} event - 事件名称
 * @param {any} data - 消息数据
 */
const broadcast = (event, data) => {
  const { io } = getIO();

  if (!io) {
    logger.warn('WebSocket服务未初始化，无法广播消息');
    return;
  }

  try {
    io.emit(event, data);
    logger.debug('广播消息', { event, data: JSON.stringify(data) });
  } catch (error) {
    logger.error('广播消息失败', { event, error: error.message });
  }
};

/**
 * 向多个用户推送消息
 * @param {Array<string>} userIds - 用户ID数组
 * @param {string} event - 事件名称
 * @param {any} data - 消息数据
 */
const sendToMultipleUsers = (userIds, event, data) => {
  userIds.forEach((userId) => {
    sendToUser(userId, event, data);
  });
};

/**
 * 推送资源更新消息
 * @param {string} userId - 用户ID
 * @param {Object} resources - 资源数据
 */
const sendResourceUpdate = (userId, resources) => {
  sendToUser(userId, 'resource_update', resources);
};

/**
 * 推送作物状态更新消息
 * @param {string} userId - 用户ID
 * @param {Object} cropStatus - 作物状态数据
 */
const sendCropUpdate = (userId, cropStatus) => {
  sendToUser(userId, 'crop_update', cropStatus);
};

/**
 * 推送成就解锁消息
 * @param {string} userId - 用户ID
 * @param {Object} achievement - 成就数据
 */
const sendAchievementUnlocked = (userId, achievement) => {
  sendToUser(userId, 'achievement_unlocked', achievement);
};

/**
 * 推送任务进度更新消息
 * @param {string} userId - 用户ID
 * @param {Object} taskProgress - 任务进度数据
 */
const sendTaskUpdate = (userId, taskProgress) => {
  sendToUser(userId, 'task_update', taskProgress);
};

/**
 * 推送系统通知消息
 * @param {string} userId - 用户ID
 * @param {Object} notification - 通知数据
 */
const sendNotification = (userId, notification) => {
  sendToUser(userId, 'notification', notification);
};

/**
 * 获取当前连接的用户数量
 * @returns {number} - 连接用户数量
 */
const getConnectedUserCount = () => {
  const { connectedUsers } = getIO();
  return connectedUsers ? connectedUsers.size : 0;
};

/**
 * 检查用户是否已连接
 * @param {string} userId - 用户ID
 * @returns {boolean} - 是否已连接
 */
const isUserConnected = (userId) => {
  const { connectedUsers } = getIO();
  return connectedUsers ? connectedUsers.has(userId) : false;
};

/**
 * B6-2修复：启动僵尸连接清理定时器
 * 每60秒检查一次connectedUsers映射，移除已断开的Socket
 * @returns {Object} 定时器引用，可供外部停止
 */
const startZombieCleanup = () => {
  const intervalMs = 60 * 1000; // 60秒

  return setInterval(() => {
    try {
      const { io, connectedUsers } = getIO();
      if (!io || !connectedUsers) {
        return;
      }

      let cleanedCount = 0;
      for (const [userId, socketId] of connectedUsers.entries()) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          connectedUsers.delete(userId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info('僵尸连接清理完成', {
          cleanedCount,
          remainingCount: connectedUsers.size,
        });
      }
    } catch (error) {
      logger.warn('僵尸连接清理异常', { error: error.message });
    }
  }, intervalMs);
};

/**
 * 推送活动日志更新消息
 * @param {string} userId - 用户ID
 * @param {Object} activityLog - 活动日志数据
 */
const sendActivityLogUpdated = (userId, activityLog) => {
  sendToUser(userId, 'activity_log_updated', activityLog);
};

/**
 * 推送作物成熟消息
 * @param {string} userId - 用户ID
 * @param {Object} maturedCrop - 成熟作物数据
 */
const sendCropMatured = (userId, maturedCrop) => {
  sendToUser(userId, 'crop_matured', maturedCrop);
};

/**
 * 推送资源变更消息
 * @param {string} userId - 用户ID
 * @param {Object} resourceChange - 资源变更数据
 */
const sendResourceChanged = (userId, resourceChange) => {
  sendToUser(userId, 'resource_changed', resourceChange);
};

module.exports = {
  sendToUser,
  broadcast,
  sendToMultipleUsers,
  sendResourceUpdate,
  sendCropUpdate,
  sendAchievementUnlocked,
  sendTaskUpdate,
  sendNotification,
  sendActivityLogUpdated,
  sendCropMatured,
  sendResourceChanged,
  getConnectedUserCount,
  isUserConnected,
  startZombieCleanup,
};
