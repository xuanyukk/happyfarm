/**
 * 文件名：serviceProvider.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.2.0
 * 功能描述：服务提供者，负责注册和配置所有服务到DI容器
 * 更新记录：
 *   2026-05-01 - v1.1.0 - 添加所有服务的完整注册
 *   2026-06-09 - v1.2.0 - 服务注册对齐实际依赖方式：
 *               registerSingleton → registerModule（服务模块使用直接require获取依赖）
 *               基础设施（logger/pool/redis）保持 registerValue
 *               保留依赖注释用于文档参考
 */

const diContainer = require('./diContainer');
const logger = require('./logger');
const pool = require('./db');
const redisClient = require('./redis');

module.exports = {
  registerAll() {
    logger.info('Registering all services to DI container...');

    // 注册基础设施（值注入）
    diContainer.registerValue('logger', logger);
    diContainer.registerValue('pool', pool);
    diContainer.registerValue('redisClient', redisClient);

    // 注册服务模块（所有服务通过直接 require 获取依赖，非构造函数注入）
    this._registerServices();

    logger.info('All services registered successfully', {
      services: diContainer.getRegisteredServices(),
    });
  },

  _registerServices() {
    // ============================================================
    // 通用服务
    // ============================================================

    // 缓存服务 — 依赖: redisClient, logger
    diContainer.registerModule(
      'cacheService',
      require('../services/cacheService')
    );

    // 队列服务 — 依赖: logger
    diContainer.registerModule(
      'queueService',
      require('../services/queueService')
    );

    // 邮件服务 — 依赖: logger
    diContainer.registerModule(
      'emailService',
      require('../services/emailService')
    );

    // WebSocket服务 — 依赖: logger
    diContainer.registerModule(
      'websocketService',
      require('../services/websocketService')
    );

    // 备份服务 — 依赖: logger, pool
    diContainer.registerModule(
      'backupService',
      require('../services/backupService')
    );

    // RBAC服务 — 依赖: logger, pool, cacheService
    diContainer.registerModule(
      'rbacService',
      require('../services/rbacService')
    );

    // ============================================================
    // 核心游戏服务
    // ============================================================

    // 作物服务 — 依赖: logger, pool
    diContainer.registerModule(
      'cropService',
      require('../services/cropService')
    );

    // 农场服务 — 依赖: logger, pool, cropService
    diContainer.registerModule(
      'farmService',
      require('../services/farmService')
    );

    // 玩家服务 — 依赖: logger, pool
    diContainer.registerModule(
      'playerService',
      require('../services/playerService')
    );

    // 经济服务 — 依赖: logger, pool
    diContainer.registerModule(
      'economyService',
      require('../services/economyService')
    );

    // 物品服务 — 依赖: logger, pool
    diContainer.registerModule(
      'itemService',
      require('../services/itemService')
    );

    // 游戏活动服务 — 依赖: logger, pool
    diContainer.registerModule(
      'gameActivityService',
      require('../services/gameActivityService')
    );

    // 成就服务 — 依赖: logger, pool
    diContainer.registerModule(
      'achievementService',
      require('../services/achievementService')
    );

    // 公告服务 — 依赖: logger, pool
    diContainer.registerModule(
      'announcementService',
      require('../services/announcementService')
    );

    // 配置服务 — 依赖: logger, pool
    diContainer.registerModule(
      'configService',
      require('../services/configService')
    );

    // 商店服务 — 依赖: logger, pool, itemService
    diContainer.registerModule(
      'shopService',
      require('../services/shopService')
    );

    // ============================================================
    // 管理后台服务
    // ============================================================

    // 管理服务 — 依赖: logger, pool
    diContainer.registerModule(
      'adminService',
      require('../services/adminService')
    );

    // ============================================================
    // 系统级服务
    // ============================================================

    // 告警服务 — 依赖: logger, pool
    diContainer.registerModule(
      'alertService',
      require('../services/alertService')
    );

    // 审计服务 — 依赖: logger, pool
    diContainer.registerModule(
      'auditService',
      require('../services/auditService')
    );

    // 批处理服务 — 依赖: logger, pool
    diContainer.registerModule(
      'batchService',
      require('../services/batchService')
    );

    // 作物监控服务 — 依赖: logger, pool, cropService
    diContainer.registerModule(
      'cropMonitorService',
      require('../services/cropMonitorService')
    );

    // 设备服务 — 依赖: logger, pool
    diContainer.registerModule(
      'deviceService',
      require('../services/deviceService')
    );

    // 文档导出服务 — 依赖: logger, pool
    diContainer.registerModule(
      'docsExportService',
      require('../services/docsExportService')
    );

    // 加密服务 — 依赖: logger
    diContainer.registerModule(
      'encryptionService',
      require('../services/encryptionService')
    );

    // 初始化服务 — 依赖: logger, pool
    diContainer.registerModule(
      'initService',
      require('../services/initService')
    );

    // 监控服务 — 依赖: logger, pool
    diContainer.registerModule(
      'monitoringService',
      require('../services/monitoringService')
    );

    // 调度服务 — 依赖: logger
    diContainer.registerModule(
      'schedulerService',
      require('../services/schedulerService')
    );

    // 双因素认证服务 — 依赖: logger
    diContainer.registerModule(
      'twoFactorService',
      require('../services/twoFactorService')
    );
  },

  /**
   * 从容器中获取服务（便捷方法）
   * @param {string} serviceName - 服务名称
   * @returns {*} 服务实例
   */
  get(serviceName) {
    return diContainer.resolve(serviceName);
  },

  /**
   * 获取容器实例
   * @returns {DIContainer}
   */
  getContainer() {
    return diContainer;
  },

  /**
   * 兼容性代理：通过属性访问方式获取服务
   * 用法: serviceProvider.services.farmService
   * @returns {object} 包含所有服务的代理对象
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