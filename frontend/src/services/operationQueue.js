/**
 * 文件名：operationQueue.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：本地操作队列管理器，确保数据一致性
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始版本创建
 */

class OperationQueue {
  constructor() {
    this.queue = this.loadFromStorage();
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * 添加操作到队列
   * @param {Object} operation - 操作对象
   * @param {string} operation.type - 操作类型
   * @param {Function} operation.execute - 执行函数
   * @param {Function} operation.rollback - 回滚函数
   * @param {Object} operation.localState - 本地状态
   */
  enqueue(operation) {
    // C12修复：去重检查，跳过相同type+未完成状态的操作
    const duplicate = this.queue.find(
      (op) => op.type === operation.type
        && (op.status === 'pending'
          || op.status === 'processing'
          || op.status === 'retrying')
    );
    if (duplicate) {
      return;
    }

    const queueItem = {
      id: Date.now() + Math.random(),
      ...operation,
      retries: 0,
      status: 'pending',
    };
    this.queue.push(queueItem);
    this.saveToStorage();
    this.processQueue();
  }

  /**
   * 处理队列
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];

      try {
        operation.status = 'processing';
        await operation.execute();
        operation.status = 'completed';
        this.queue.shift();
        this.saveToStorage();
      } catch (error) {
        operation.retries++;

        if (operation.retries >= this.maxRetries) {
          console.error('操作失败，执行回滚', operation, error);
          if (operation.rollback) {
            try {
              await operation.rollback();
            } catch (rollbackError) {
              console.error('回滚失败', rollbackError);
            }
          }
          operation.status = 'failed';
          this.queue.shift();
          this.saveToStorage();
        } else {
          console.warn(
            `操作重试 ${operation.retries}/${this.maxRetries}`,
            error
          );
          operation.status = 'retrying';
          await this.sleep(this.retryDelay * operation.retries);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * 休眠
   * @param {number} ms - 毫秒数
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 保存队列到localStorage
   */
  saveToStorage() {
    try {
      // 只持久化可序列化的数据，过滤掉函数引用
      const serializable = this.queue.map(({ execute, rollback, ...rest }) => rest);
      localStorage.setItem('operationQueue', JSON.stringify(serializable));
    } catch (e) {
      console.warn('保存操作队列到localStorage失败', e);
    }
  }

  /**
   * 从localStorage加载队列
   * @returns {Array} 恢复的队列数据
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem('operationQueue');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('从localStorage加载操作队列失败', e);
      return [];
    }
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      pending: this.queue.filter((op) => op.status === 'pending').length,
      processing: this.queue.filter((op) => op.status === 'processing').length,
      retrying: this.queue.filter((op) => op.status === 'retrying').length,
      failed: this.queue.filter((op) => op.status === 'failed').length,
    };
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue = [];
    this.isProcessing = false;
    localStorage.removeItem('operationQueue');
  }
}

const operationQueue = new OperationQueue();

export default operationQueue;
