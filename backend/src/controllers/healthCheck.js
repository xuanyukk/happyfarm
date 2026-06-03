/**
 * 文件名：healthCheck.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v1.0.0
 * 功能描述：系统健康检查中间件
 */

const os = require('os');
const { pool } = require('../config/db');
const { logger } = require('../config/logger');
const redis = require('../config/redis');

const checkDatabase = async () => {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

const checkRedis = async () => {
  try {
    const startTime = Date.now();
    await redis.ping();
    const responseTime = Date.now() - startTime;
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

const getSystemInfo = () => {
  const memory = process.memoryUsage();

  return {
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
      arrayBuffers: Math.round((memory.arrayBuffers || 0) / 1024 / 1024),
    },
    nodeVersion: process.version,
    platform: process.platform,
    loadavg: os.loadavg?.() || [0, 0, 0],
    cpuUsage: process.cpuUsage(),
  };
};

const healthCheck = async (req, res) => {
  try {
    const dbCheck = await checkDatabase();
    const redisCheck = await checkRedis();
    const systemInfo = getSystemInfo();

    const allHealthy =
      dbCheck.status === 'healthy' && redisCheck.status === 'healthy';

    res.json({
      success: true,
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbCheck,
        redis: redisCheck,
      },
      system: systemInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
};

module.exports = {
  healthCheck,
  checkDatabase,
  checkRedis,
  getSystemInfo,
};
