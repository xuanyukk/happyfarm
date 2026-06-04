/**
 * 文件名：diContainer.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：依赖注入容器，用于管理服务生命周期和依赖关系
 */

const logger = require('./logger');

/**
 * 依赖注入容器类
 *
 * 功能特性：
 * - 注册服务（单例、工厂、值）
 * - 解析服务依赖
 * - 依赖关系自动处理
 * - 循环依赖检测
 * - 生命周期管理
 */
class DIContainer {
  constructor() {
    this.services = new Map();
    this.resolvers = new Map();
    this.instances = new Map();
    this.resolving = new Set();
  }

  /**
   * 注册单例服务
   * 每次解析都返回同一个实例
   * @param {string} name - 服务名称
   * @param {Function|Class} factory - 服务工厂函数或类
   * @param {Array<string>} dependencies - 依赖的服务列表
   */
  registerSingleton(name, factory, dependencies = []) {
    this._register(name, factory, dependencies, 'singleton');
  }

  /**
   * 注册工厂服务
   * 每次解析都创建新实例
   * @param {string} name - 服务名称
   * @param {Function|Class} factory - 服务工厂函数或类
   * @param {Array<string>} dependencies - 依赖的服务列表
   */
  registerFactory(name, factory, dependencies = []) {
    this._register(name, factory, dependencies, 'factory');
  }

  /**
   * 注册值服务
   * 直接存储一个值
   * @param {string} name - 服务名称
   * @param {*} value - 服务值
   */
  registerValue(name, value) {
    this._register(name, null, [], 'value', value);
  }

  /**
   * 内部注册方法
   * @private
   */
  _register(name, factory, dependencies, type, value = null) {
    if (this.services.has(name)) {
      logger.warn(`Service ${name} is already registered, overwriting`);
    }

    this.services.set(name, {
      name,
      factory,
      dependencies,
      type,
      value,
      registeredAt: new Date(),
    });

    logger.debug(`Service ${name} registered as ${type}`, { dependencies });
  }

  /**
   * 解析服务
   * @param {string} name - 服务名称
   * @returns {*} 服务实例或值
   * @throws {Error} 服务未找到或循环依赖
   */
  resolve(name) {
    if (this.resolving.has(name)) {
      const cycle = Array.from(this.resolving).join(' → ') + ' → ' + name;
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} is not registered`);
    }

    try {
      this.resolving.add(name);

      switch (service.type) {
        case 'value':
          return service.value;

        case 'singleton': {
          if (this.instances.has(name)) {
            return this.instances.get(name);
          }
          const singletonInstance = this._createInstance(service);
          this.instances.set(name, singletonInstance);
          logger.debug(`Singleton service ${name} created and cached`);
          return singletonInstance;
        }

        case 'factory':
          logger.debug(`Factory service ${name} created new instance`);
          return this._createInstance(service);

        default:
          throw new Error(`Unknown service type: ${service.type}`);
      }
    } finally {
      this.resolving.delete(name);
    }
  }

  /**
   * 创建服务实例
   * @private
   */
  _createInstance(service) {
    // 如果工厂是对象，直接返回（比如直接模块导出的对象）
    if (typeof service.factory === 'object' && service.factory !== null) {
      return service.factory;
    }

    const dependencies = service.dependencies.map((depName) =>
      this.resolve(depName)
    );

    if (typeof service.factory === 'function') {
      if (service.factory.prototype && service.factory.prototype.constructor) {
        return new service.factory(...dependencies);
      } else {
        return service.factory(...dependencies);
      }
    }

    throw new Error(`Invalid factory for service ${service.name}`);
  }

  /**
   * 检查服务是否已注册
   * @param {string} name - 服务名称
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * 获取所有已注册的服务名称
   * @returns {Array<string>}
   */
  getRegisteredServices() {
    return Array.from(this.services.keys());
  }

  /**
   * 清除指定服务的单例缓存
   * @param {string} name - 服务名称
   */
  clearInstance(name) {
    this.instances.delete(name);
    logger.debug(`Instance cache cleared for service ${name}`);
  }

  /**
   * 清除所有单例缓存
   */
  clearAllInstances() {
    const count = this.instances.size;
    this.instances.clear();
    logger.debug(`All instance caches cleared (${count} instances)`);
  }

  /**
   * 注销服务
   * @param {string} name - 服务名称
   */
  unregister(name) {
    this.services.delete(name);
    this.instances.delete(name);
    logger.debug(`Service ${name} unregistered`);
  }

  /**
   * 重置容器（清空所有服务和实例）
   */
  reset() {
    this.services.clear();
    this.instances.clear();
    this.resolving.clear();
    logger.debug('DI container reset to empty state');
  }

  /**
   * 获取容器诊断信息
   * @returns {Object}
   */
  getDiagnostics() {
    return {
      serviceCount: this.services.size,
      instanceCount: this.instances.size,
      services: Array.from(this.services.entries()).map(([name, service]) => ({
        name,
        type: service.type,
        dependencies: service.dependencies,
        hasInstance: this.instances.has(name),
        registeredAt: service.registeredAt,
      })),
    };
  }
}

module.exports = new DIContainer();
module.exports.DIContainer = DIContainer;
