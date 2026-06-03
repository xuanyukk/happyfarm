/**
 * 文件名：dataWarehouseRoutes.js
 * 作者：Trae AI
 * 日期：2026-05-09
 * 版本：v1.0.0
 * 功能描述：数据仓库路由 - 定义数据分析和BI报表相关API
 * 更新记录：
 *   2026-05-09 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const dataWarehouseController = require('../controllers/dataWarehouseController');

/**
 * @route GET /api/datawarehouse/overview
 * @desc 获取数据仓库概览
 */
router.get('/overview', dataWarehouseController.getWarehouseOverview);

/**
 * @route GET /api/datawarehouse/dau
 * @desc 获取DAU统计数据
 */
router.get('/dau', dataWarehouseController.getDAUStats);

/**
 * @route GET /api/datawarehouse/crops
 * @desc 获取作物统计数据
 */
router.get('/crops', dataWarehouseController.getCropStats);

/**
 * @route GET /api/datawarehouse/revenue
 * @desc 获取收入统计数据
 */
router.get('/revenue', dataWarehouseController.getRevenueStats);

/**
 * @route GET /api/datawarehouse/retention
 * @desc 获取留存分析数据
 */
router.get('/retention', dataWarehouseController.getRetentionAnalysis);

/**
 * @route POST /api/datawarehouse/etl
 * @desc 手动触发ETL任务
 */
router.post('/etl', dataWarehouseController.triggerETL);

module.exports = router;
