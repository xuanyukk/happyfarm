/**
 * 文件名：serviceProvider.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.1.0
 * 功能描述：服务提供者，负责注册和配置所有服务到DI容器
 * 更新记录：
 *   2026-05-01 - v1.1.0 - 添加所有服务的完整注册
 */

const diContainer = require('./diContainer');
const logger = require('./logger');
const pool = require('./db');
const redisClient = require('./redis');

module.exports = {
  registerAll() {
    logger.info('Registering all services to DI container...');

    // Register configuration and infrastructure (values)
    diContainer.registerValue('logger', logger);
    diContainer.registerValue('pool', pool);
    diContainer.registerValue('redisClient', redisClient);

    // Register services (singleton)
    this._registerServices();

    logger.info('All services registered successfully', {
      services: diContainer.getRegisteredServices(),
    });
  },

  _registerServices() {
    // Register cache service
    diContainer.registerSingleton(
      'cacheService',
      require('../services/cacheService'),
      ['redisClient', 'logger']
    );

    // Register queue service
    diContainer.registerSingleton(
      'queueService',
      require('../services/queueService'),
      ['logger']
    );

    // Register email service
    diContainer.registerSingleton(
      'emailService',
      require('../services/emailService'),
      ['logger']
    );

    // Register websocket service
    diContainer.registerSingleton(
      'websocketService',
      require('../services/websocketService'),
      ['logger']
    );

    // Register backup service
    diContainer.registerSingleton(
      'backupService',
      require('../services/backupService'),
      ['logger', 'pool']
    );

    // Register RBAC service
    diContainer.registerSingleton(
      'rbacService',
      require('../services/rbacService'),
      ['logger', 'pool', 'cacheService']
    );

    // Register core game services
    diContainer.registerSingleton(
      'cropService',
      require('../services/cropService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'farmService',
      require('../services/farmService'),
      ['logger', 'pool', 'cropService']
    );

    diContainer.registerSingleton(
      'playerService',
      require('../services/playerService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'economyService',
      require('../services/economyService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'itemService',
      require('../services/itemService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'gameActivityService',
      require('../services/gameActivityService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'achievementService',
      require('../services/achievementService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'announcementService',
      require('../services/announcementService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'configService',
      require('../services/configService'),
      ['logger', 'pool']
    );

    diContainer.registerSingleton(
      'shopService',
      require('../services/shopService'),
      ['logger', 'pool', 'itemService']
    );

    // Register admin service
    diContainer.registerSingleton(
      'adminService',
      require('../services/adminService'),
      ['logger', 'pool']
    );

    // Register alert service
    diContainer.registerSingleton(
      'alertService',
      require('../services/alertService'),
      ['logger', 'pool']
    );

    // Register audit service
    diContainer.registerSingleton(
      'auditService',
      require('../services/auditService'),
      ['logger', 'pool']
    );

    // Register batch service
    diContainer.registerSingleton(
      'batchService',
      require('../services/batchService'),
      ['logger', 'pool']
    );

    // Register crop monitor service
    diContainer.registerSingleton(
      'cropMonitorService',
      require('../services/cropMonitorService'),
      ['logger', 'pool', 'cropService']
    );

    // Register device service
    diContainer.registerSingleton(
      'deviceService',
      require('../services/deviceService'),
      ['logger', 'pool']
    );

    // Register docs export service
    diContainer.registerSingleton(
      'docsExportService',
      require('../services/docsExportService'),
      ['logger', 'pool']
    );

    // Register encryption service
    diContainer.registerSingleton(
      'encryptionService',
      require('../services/encryptionService'),
      ['logger']
    );

    // Register init service
    diContainer.registerSingleton(
      'initService',
      require('../services/initService'),
      ['logger', 'pool']
    );

    // Register monitoring service
    diContainer.registerSingleton(
      'monitoringService',
      require('../services/monitoringService'),
      ['logger', 'pool']
    );

    // Register scheduler service
    diContainer.registerSingleton(
      'schedulerService',
      require('../services/schedulerService'),
      ['logger']
    );

    // Register two-factor service
    diContainer.registerSingleton(
      'twoFactorService',
      require('../services/twoFactorService'),
      ['logger']
    );
  },

  /**
   * Get service from container (convenience method)
   * @param {string} serviceName - Service name
   * @returns {*} service instance
   */
  get(serviceName) {
    return diContainer.resolve(serviceName);
  },

  /**
   * Get container instance
   * @returns {DIContainer}
   */
  getContainer() {
    return diContainer;
  },

  /**
   * 兼容性包装器：通过DI容器服务，提供简单的工厂方法
   * @returns {object} 包含所有服务的对象
   */
  services: new Proxy(
    {},
    {
      get: (target, prop) => {
        return diContainer.resolve(prop);
      },
    }
  ),
};
