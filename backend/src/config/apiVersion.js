/**
 * 文件名：apiVersion.js
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：API版本控制管理
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建，提供API版本控制功能
 */

const { Router } = require('express');
const logger = require('../config/logger');

/**
 * 支持的API版本常量
 */
const API_VERSIONS = {
  V1: 'v1',
};

/**
 * 当前默认API版本
 */
const CURRENT_VERSION = API_VERSIONS.V1;

/**
 * 创建带版本控制的路由
 * @param {string} version - API版本号，默认为当前版本
 * @returns {Router} 带版本控制的Express路由对象
 */
const createVersionedRouter = (version = CURRENT_VERSION) => {
  const router = Router();

  /**
   * 路由中间件：设置API版本信息
   * @param {object} req - Express请求对象
   * @param {object} res - Express响应对象
   * @param {function} next - Express next函数
   */
  router.use((req, res, next) => {
    req.apiVersion = version;
    res.setHeader('X-API-Version', version);
    next();
  });

  return router;
};

/**
 * 获取API版本中间件
 * @returns {function} Express中间件函数
 */
const getApiVersionMiddleware = () => {
  return (req, res, next) => {
    const versionFromHeader = req.headers['x-api-version'];
    const versionFromUrl = req.path.match(/^\/api\/(v\d+)/)?.[1];

    req.apiVersion = versionFromUrl || versionFromHeader || CURRENT_VERSION;

    if (!Object.values(API_VERSIONS).includes(req.apiVersion)) {
      logger.warn('不支持的API版本', {
        requested: req.apiVersion,
        supported: Object.values(API_VERSIONS),
      });
      return res.status(400).json({
        success: false,
        message: '不支持的API版本',
        supported: Object.values(API_VERSIONS),
      });
    }

    res.setHeader('X-API-Version', req.apiVersion);
    next();
  };
};

/**
 * API版本控制器
 */
const versionController = {
  /**
   * 获取API版本信息
   * @param {object} req - Express请求对象
   * @param {object} res - Express响应对象
   */
  getVersion: (req, res) => {
    res.json({
      success: true,
      data: {
        current: req.apiVersion || CURRENT_VERSION,
        supported: Object.values(API_VERSIONS),
        latest: CURRENT_VERSION,
      },
    });
  },
};

module.exports = {
  API_VERSIONS,
  CURRENT_VERSION,
  createVersionedRouter,
  getApiVersionMiddleware,
  versionController,
};
