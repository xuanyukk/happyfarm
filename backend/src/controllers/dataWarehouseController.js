/**
 * 文件名：dataWarehouseController.js
 * 作者：Trae AI
 * 日期：2026-05-09
 * 版本：v1.0.0
 * 功能描述：数据仓库控制器 - 处理数据分析和BI报表相关请求
 * 更新记录：
 *   2026-05-09 - v1.0.0 - 初始版本创建
 */

const dataWarehouseService = require('../services/dataWarehouseService');
const logger = require('../config/logger');

/**
 * 获取数据仓库概览
 */
const getWarehouseOverview = async (req, res, next) => {
  try {
    const overview = await dataWarehouseService.getWarehouseOverview();
    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    logger.error('获取数据仓库概览失败', { error: error.message });
    next(error);
  }
};

/**
 * 获取DAU统计数据
 */
const getDAUStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 30))
      .toISOString()
      .split('T')[0];

    const stats = await dataWarehouseService.getDAUStats(
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取DAU统计数据失败', { error: error.message });
    next(error);
  }
};

/**
 * 获取作物统计数据
 */
const getCropStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 30))
      .toISOString()
      .split('T')[0];

    const stats = await dataWarehouseService.getCropStats(
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取作物统计数据失败', { error: error.message });
    next(error);
  }
};

/**
 * 获取收入统计数据
 */
const getRevenueStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 30))
      .toISOString()
      .split('T')[0];

    const stats = await dataWarehouseService.getRevenueStats(
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('获取收入统计数据失败', { error: error.message });
    next(error);
  }
};

/**
 * 获取留存分析数据
 */
const getRetentionAnalysis = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const today = new Date();
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = new Date(today.setDate(today.getDate() - 30))
      .toISOString()
      .split('T')[0];

    const analysis = await dataWarehouseService.getRetentionAnalysis(
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    logger.error('获取留存分析数据失败', { error: error.message });
    next(error);
  }
};

/**
 * 手动触发ETL任务
 */
const triggerETL = async (req, res, next) => {
  try {
    const result = await dataWarehouseService.triggerETL();
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('触发ETL任务失败', { error: error.message });
    next(error);
  }
};

module.exports = {
  getWarehouseOverview,
  getDAUStats,
  getCropStats,
  getRevenueStats,
  getRetentionAnalysis,
  triggerETL,
};
