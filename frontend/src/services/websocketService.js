/**
 * 文件名：websocketService.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.2.0
 * 功能描述：WebSocket服务，处理与后端的实时通信
 * 更新记录：
 *   2026-03-19 - v1.0.0 - 初始版本
 *   2026-05-19 - v1.1.0 - 添加文件头注释
 *   2026-06-11 - v1.2.0 - C3修复：startHeartbeat先清理已有interval防止多心跳并行；新增reconnect_failed事件处理
 */

import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    this.messageHandlers = new Map();
    this.heartbeatInterval = null;
    this.token = null;
    this.baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3001';
    this.pendingMessages = [];
  }

  init(token) {
    if (!token) {
      console.warn('WebSocket initialization failed: no token provided');
      return;
    }

    this.token = token;

    if (this.socket) {
      this.disconnect();
    }

    console.log('Connecting to WebSocket server...', { url: this.baseUrl });

    this.socket = io(this.baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connection established', {
        socketId: this.socket.id,
      });
      this.isConnected = true;
      this.reconnectAttempts = 0;

      this.send('authenticate', token);
      this.startHeartbeat();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket connection disconnected', { reason });
      this.isConnected = false;
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(
        `Reconnecting attempt ${attemptNumber}/${this.maxReconnectAttempts}...`
      );
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      if (this.token) {
        this.send('authenticate', this.token);
      }
      // 重连后恢复所有已注册的事件订阅
      this.restoreHandlers();
      // 排空重连期间积压的消息
      this.flushPendingMessages();
    });

    // C16修复：监听reconnect_failed事件，提示用户连接已永久断开
    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket重连失败，已达到最大重试次数');
      this.isConnected = false;
    });

    this.socket.on('authenticated', (data) => {
      console.log('WebSocket authentication successful', data);
    });

    this.socket.on('authentication_error', (data) => {
      console.warn('WebSocket authentication failed:', data);
    });

    this.socket.on('pong', () => {});
  }

  send(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      this.pendingMessages.push({ event, data });
      console.warn('WebSocket not connected, message queued');
    }
  }

  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event).push(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event, handler) {
    if (this.messageHandlers.has(event)) {
      const handlers = this.messageHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    if (this.socket && handler) {
      this.socket.off(event, handler);
    }
  }

  /**
   * 恢复所有已注册的事件订阅（重连时调用）
   */
  restoreHandlers() {
    if (!this.socket) return;
    this.messageHandlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket.off(event, handler); // 避免重复注册
        this.socket.on(event, handler);
      });
    });
  }

  /**
   * 排空重连期间积压的消息队列
   */
  flushPendingMessages() {
    if (!this.isConnected || !this.socket || this.pendingMessages.length === 0) return;
    console.log(`Flushing ${this.pendingMessages.length} pending messages`);
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];
    messages.forEach(({ event, data }) => {
      this.socket.emit(event, data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  startHeartbeat() {
    // C3修复：先清理已有interval，防止重连时多个心跳并行
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('ping');
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  onResourceUpdate(callback) {
    this.on('resource_update', callback);
  }

  onCropUpdate(callback) {
    this.on('crop_update', callback);
  }

  onAchievementUnlocked(callback) {
    this.on('achievement_unlocked', callback);
  }

  onTaskUpdate(callback) {
    this.on('task_update', callback);
  }

  onNotification(callback) {
    this.on('notification', callback);
  }

  onLandUnlocked(callback) {
    this.on('land_unlocked', callback);
  }

  onQualityUpgraded(callback) {
    this.on('quality_upgraded', callback);
  }

  onCropPlanted(callback) {
    this.on('crop_planted', callback);
  }

  onCropHarvested(callback) {
    this.on('crop_harvested', callback);
  }

  onCropSold(callback) {
    this.on('crop_sold', callback);
  }

  onHarvestAllCompleted(callback) {
    this.on('harvest_all_completed', callback);
  }

  onActivityLogUpdated(callback) {
    this.on('activity_log_updated', callback);
  }

  onCropMatured(callback) {
    this.on('crop_matured', callback);
  }

  onResourceChanged(callback) {
    this.on('resource_changed', callback);
  }
}

const wsService = new WebSocketService();
export default wsService;
