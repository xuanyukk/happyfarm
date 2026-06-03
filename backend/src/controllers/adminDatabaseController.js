/**
 * 文件名: adminDatabaseController.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台数据库管理控制器
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const adminDatabaseService = require('../services/adminDatabaseService');
const logger = require('../config/logger');

/**
 * 获取数据库基本信息
 */
exports.getDatabaseInfo = async function (req, res) {
  try {
    const info = await adminDatabaseService.getDatabaseInfo();
    res.status(200).json({ success: true, data: info });
  } catch (error) {
    logger.error('获取数据库信息失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取数据表列表
 */
exports.getDbTables = async function (req, res) {
  try {
    const tables = await adminDatabaseService.getDbTables();
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    logger.error('获取数据表列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取索引列表
 */
exports.getDbIndexes = async function (req, res) {
  try {
    const indexes = await adminDatabaseService.getDbIndexes();
    res.status(200).json({ success: true, data: indexes });
  } catch (error) {
    logger.error('获取索引列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取未使用索引列表
 */
exports.getDbUnusedIndexes = async function (req, res) {
  try {
    const unusedIndexes = await adminDatabaseService.getDbUnusedIndexes();
    res.status(200).json({ success: true, data: unusedIndexes });
  } catch (error) {
    logger.error('获取未使用索引失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};