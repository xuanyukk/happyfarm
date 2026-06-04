/**
 * 文件名: adminDatabaseRoutes.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台数据库管理路由
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminDatabaseController = require('../controllers/adminDatabaseController');

router.use(checkAdminPermission);

router.get('/info', adminDatabaseController.getDatabaseInfo);
router.get('/tables', adminDatabaseController.getDbTables);
router.get('/indexes', adminDatabaseController.getDbIndexes);
router.get('/indexes/unused', adminDatabaseController.getDbUnusedIndexes);

module.exports = router;
