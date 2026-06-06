/**
 * 文件名：offlineCache.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：离线操作缓存服务
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，实现离线操作缓存功能
 */

import { logger } from './logger';
import { networkMonitor } from './networkMonitor';
import api from './api';
import { gameService } from './gameService';

/**
 * 离线操作缓存服务
 * 用于在断网时缓存用户操作，联网后批量同步到后端
 */
class OfflineCache {
  constructor() {
    this.DB_NAME = 'happy_farm_offline_db';
    this.DB_VERSION = 1;
    this.STORE_NAME = 'pending_operations';
    this.db = null;
    this.isInitialized = false;
    this.isSyncing = false;
    this.subscribers = new Map(); // eventName -> Set<handlers>
    this.maxRetryCount = 3;
  }

  /**
   * 初始化IndexedDB数据库
   */
  async init() {
    if (this.isInitialized) {
      logger.warn('OfflineCache: 已初始化');
      return;
    }

    logger.info('OfflineCache: 初始化离线操作缓存');

    try {
      this.db = await this.openDatabase();
      this.isInitialized = true;

      // 监听网络状态变化
      networkMonitor.on('online', this.handleOnline.bind(this));

      // 检查是否有待同步的操作
      const pendingOps = await this.getPendingOperations();
      if (pendingOps.length > 0) {
        logger.info(`OfflineCache: 发现 ${pendingOps.length} 个待同步操作`);
        // 如果在线，立即同步
        if (networkMonitor.isOnline) {
          this.syncPendingOperations();
        }
      }

      logger.info('OfflineCache: 初始化完成');
    } catch (error) {
      logger.error('OfflineCache: 初始化失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 打开IndexedDB数据库
   * @returns {Promise<IDBDatabase>} 数据库实例
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('打开数据库失败'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          logger.info('OfflineCache: 创建对象存储成功');
        }
      };
    });
  }

  /**
   * 处理网络上线事件
   */
  async handleOnline() {
    logger.info('OfflineCache: 网络已连接，开始同步待处理操作');
    await this.syncPendingOperations();
  }

  /**
   * 添加操作到缓存
   * @param {Object} operation 操作对象
   * @param {string} operation.type 操作类型（plant, harvest, etc.）
   * @param {Object} operation.data 操作数据
   * @param {Function} operation.execute 执行操作的函数
   * @returns {Promise<number>} 操作ID
   */
  async addOperation(operation) {
    if (!this.isInitialized) {
      await this.init();
    }

    const operationData = {
      type: operation.type,
      data: operation.data,
      timestamp: Date.now(),
      status: 'pending', // pending, syncing, failed, completed
      retryCount: 0,
      error: null,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(operationData);

      request.onsuccess = () => {
        const id = request.result;
        logger.info('OfflineCache: 操作已添加到缓存', {
          id,
          type: operation.type,
        });
        this.notify('operation_added', { id, operation: operationData });
        resolve(id);
      };

      request.onerror = () => {
        reject(new Error('添加操作到缓存失败'));
      };
    });
  }

  /**
   * 获取待同步的操作
   * @returns {Promise<Array>} 待同步操作列表
   */
  async getPendingOperations() {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => a.timestamp - b.timestamp));
      };

      request.onerror = () => {
        reject(new Error('获取待同步操作失败'));
      };
    });
  }

  /**
   * 更新操作状态
   * @param {number} id 操作ID
   * @param {string} status 新状态
   * @param {string} [error] 错误信息
   */
  async updateOperationStatus(id, status, error = null) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (!operation) {
          reject(new Error('操作不存在'));
          return;
        }

        operation.status = status;
        if (status === 'failed') {
          operation.retryCount++;
          operation.error = error;
        }

        const putRequest = store.put(operation);
        putRequest.onsuccess = () => {
          this.notify('operation_updated', { id, operation });
          resolve();
        };
        putRequest.onerror = () => {
          reject(new Error('更新操作状态失败'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('获取操作失败'));
      };
    });
  }

  /**
   * 删除操作
   * @param {number} id 操作ID
   */
  async deleteOperation(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        logger.info('OfflineCache: 操作已删除', { id });
        this.notify('operation_deleted', { id });
        resolve();
      };

      request.onerror = () => {
        reject(new Error('删除操作失败'));
      };
    });
  }

  /**
   * 同步待处理的操作
   */
  async syncPendingOperations() {
    if (this.isSyncing) {
      logger.warn('OfflineCache: 正在同步中，跳过本次同步');
      return;
    }

    if (!networkMonitor.isOnline) {
      logger.warn('OfflineCache: 网络未连接，无法同步');
      return;
    }

    this.isSyncing = true;
    this.notify('sync_started');

    try {
      const operations = await this.getPendingOperations();
      logger.info(`OfflineCache: 开始同步 ${operations.length} 个操作`);

      for (const operation of operations) {
        await this.syncSingleOperation(operation);
      }

      logger.info('OfflineCache: 同步完成');
      this.notify('sync_completed');
    } catch (error) {
      logger.error('OfflineCache: 同步失败', { error: error.message });
      this.notify('sync_failed', { error: error.message });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步单个操作
   * @param {Object} operation 操作对象
   */
  async syncSingleOperation(operation) {
    try {
      await this.updateOperationStatus(operation.id, 'syncing');

      // 根据操作类型调用对应的API
      await this.executeOperation(operation);

      await this.deleteOperation(operation.id);
      this.notify('operation_synced', { id: operation.id, operation });
    } catch (error) {
      logger.error('OfflineCache: 同步操作失败', {
        id: operation.id,
        error: error.message,
      });

      if (operation.retryCount < this.maxRetryCount) {
        await this.updateOperationStatus(
          operation.id,
          'pending',
          error.message
        );
      } else {
        await this.updateOperationStatus(operation.id, 'failed', error.message);
        this.notify('operation_failed', {
          id: operation.id,
          operation,
          error: error.message,
        });
      }
    }
  }

  /**
   * 根据操作类型执行对应的API调用
   * @param {Object} operation 操作对象
   */
  async executeOperation(operation) {
    const { type, data } = operation;

    // 操作类型到API调用的映射
    const operationMap = {
      plant: () => api.post('/crops/plant', data),
      harvest: () => api.post('/crops/harvest', data),
      water: () => api.post('/crops/water', data),
      fertilize: () => api.post('/crops/fertilize', data),
      unlockLand: () => api.post('/farm/unlock-land', data),
      upgradeLand: () => api.post('/farm/upgrade-land', data),
      buyItem: () => api.post('/shop/buy', data),
      sellItem: () => api.post('/shop/sell', data),
      useItem: () => api.post('/items/use', data),
    };

    const handler = operationMap[type];
    if (handler) {
      logger.info('OfflineCache: 执行离线操作', { type, data });
      return await handler();
    } else {
      throw new Error(`未知的操作类型: ${type}`);
    }
  }

  /**
   * 订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} handler 处理函数
   */
  on(eventName, handler) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    this.subscribers.get(eventName).add(handler);
  }

  /**
   * 取消订阅事件
   * @param {string} eventName 事件名称
   * @param {Function} handler 处理函数
   */
  off(eventName, handler) {
    if (this.subscribers.has(eventName)) {
      this.subscribers.get(eventName).delete(handler);
    }
  }

  /**
   * 通知订阅者
   * @param {string} eventName 事件名称
   * @param {any} data 事件数据
   */
  notify(eventName, data) {
    if (this.subscribers.has(eventName)) {
      this.subscribers.get(eventName).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          logger.error('OfflineCache: 通知订阅者失败', {
            eventName,
            error: error.message,
          });
        }
      });
    }
  }

  /**
   * 获取缓存状态
   * @returns {Object} 状态信息
   */
  async getStatus() {
    const pendingOps = await this.getPendingOperations();
    return {
      isInitialized: this.isInitialized,
      isSyncing: this.isSyncing,
      pendingCount: pendingOps.length,
      databaseName: this.DB_NAME,
    };
  }

  /**
   * 清空所有缓存
   */
  async clearAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        logger.info('OfflineCache: 所有缓存已清空');
        this.notify('cache_cleared');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('清空缓存失败'));
      };
    });
  }

  /**
   * 销毁服务
   */
  destroy() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    networkMonitor.off('online', this.handleOnline.bind(this));
    logger.info('OfflineCache: 服务已销毁');
  }
}

// 创建单例实例
export const offlineCache = new OfflineCache();
export default offlineCache;
