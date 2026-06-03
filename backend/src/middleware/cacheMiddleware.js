/**
 * 文件名：backend/src/middleware/cacheMiddleware.js
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：缓存中间件，为API请求提供缓存
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建，提供缓存中间件
 */

const cacheService = require('../services/cacheService');
const logger = require('../config/logger');

/**
 * 缓存中间件
 * @param {string} cacheKey - 缓存键
 * @param {number} ttl - 缓存时间（秒）
 */
const cacheMiddleware = (cacheKey, ttl = 300) => {
  return async (req, res, next) => {
    try {
      // 只缓存GET请求
      if (req.method !== 'GET') {
        return next();
      }

      // 构建完整的缓存键（包含查询参数）
      const queryKey = Object.keys(req.query)
        .sort()
        .map((key) => `${key}:${req.query[key]}`)
        .join('|');

      const fullCacheKey = queryKey ? `${cacheKey}:${queryKey}` : cacheKey;

      // 尝试获取缓存
      const cachedData = await cacheService.get(fullCacheKey);
      if (cachedData) {
        logger.debug(`缓存命中: ${fullCacheKey}`);
        return res.json(cachedData);
      }

      // 缓存未命中，继续处理请求
      // 保存原始的json方法
      const originalJson = res.json;
      res.json = function (data) {
        // 缓存响应数据
        cacheService.set(fullCacheKey, data, ttl).catch((err) => {
          logger.error('缓存写入失败', { key: fullCacheKey, err: err.message });
        });
        // 调用原始的json方法
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('缓存中间件错误', { error: error.message });
      // 缓存错误不影响请求处理
      next();
    }
  };
};

/**
 * 清除缓存中间件
 * @param {string|string[]} cacheKeys - 要清除的缓存键或键模式
 */
const clearCacheMiddleware = (cacheKeys) => {
  return async (req, res, next) => {
    try {
      const keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
      for (const key of keys) {
        if (key.includes('*')) {
          // 模式匹配清除
          await cacheService.delPattern(key);
        } else {
          await cacheService.del(key);
        }
      }
      logger.debug(`缓存已清除: ${keys.join(', ')}`);
      next();
    } catch (error) {
      logger.error('清除缓存错误', { error: error.message });
      // 缓存错误不影响请求处理
      next();
    }
  };
};

module.exports = {
  cacheMiddleware,
  clearCacheMiddleware,
};
