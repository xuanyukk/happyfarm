/**
 * 文件名：services.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：兼容性服务访问层，提供统一的服务访问接口
 *
 * 说明：这个文件提供了向后兼容的服务访问方式，
 * 允许代码逐步迁移到DI容器，而不破坏现有功能
 */

const serviceProvider = require('./serviceProvider');

// 保持向后兼容的服务访问方式
const backwardsCompatibleServices = {
  cacheService: require('../services/cacheService'),
  queueService: require('../services/queueService'),
  emailService: require('../services/emailService'),
  websocketService: require('../services/websocketService'),
  backupService: require('../services/backupService'),
  rbacService: require('../services/rbacService'),
  cropService: require('../services/cropService'),
  farmService: require('../services/farmService'),
  playerService: require('../services/playerService'),
  economyService: require('../services/economyService'),
  itemService: require('../services/itemService'),
  gameActivityService: require('../services/gameActivityService'),
  achievementService: require('../services/achievementService'),
  announcementService: require('../services/announcementService'),
  configService: require('../services/configService'),
  shopService: require('../services/shopService'),
  adminService: require('../services/adminService'),
  alertService: require('../services/alertService'),
  auditService: require('../services/auditService'),
  batchService: require('../services/batchService'),
  cropMonitorService: require('../services/cropMonitorService'),
  deviceService: require('../services/deviceService'),
  docsExportService: require('../services/docsExportService'),
  encryptionService: require('../services/encryptionService'),
  initService: require('../services/initService'),
  monitoringService: require('../services/monitoringService'),
  schedulerService: require('../services/schedulerService'),
  twoFactorService: require('../services/twoFactorService'),
};

// 智能服务访问代理
// 优先尝试从DI容器获取，如果失败则回退到直接require
const smartServiceProxy = new Proxy(backwardsCompatibleServices, {
  get: (target, serviceName) => {
    try {
      // 尝试从DI容器获取
      return serviceProvider.get(serviceName);
    } catch (error) {
      // 回退到向后兼容的方式
      if (target[serviceName]) {
        const logger = require('./logger');
        logger.warn(
          `Service ${serviceName} not found in DI container, falling back to direct require`
        );
        return target[serviceName];
      }
      throw new Error(`Service ${serviceName} not found`);
    }
  },
});

module.exports = {
  // 推荐使用方式
  services: smartServiceProxy,

  // 直接访问DI容器（如果已经初始化）
  di: serviceProvider,

  // 向后兼容的原始访问方式（完全不使用DI）
  legacy: backwardsCompatibleServices,
};
