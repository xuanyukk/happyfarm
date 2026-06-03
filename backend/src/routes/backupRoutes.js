/**
 * 文件名：backupRoutes.js
 * 作者：开发者
 * 日期：2026-05-06
 * 版本：v2.0.0
 * 功能描述：备份与恢复路由
 * 更新记录：
 *   2026-05-06 - v1.0.0 - 初始版本创建
 *   2026-05-06 - v2.0.0 - 添加调度和恢复监控功能
 */

const express = require('express');
const router = express.Router();
const {
  createBackup,
  listBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  getRestoreProgress,
  rollbackRestore,
  clearRestoreProgress,
  startScheduledBackup,
  stopScheduledBackup,
  listScheduledJobs,
} = require('../controllers/backupController');

router.post('/create', createBackup);
router.get('/list', listBackups);
router.get('/download/:filename', downloadBackup);
router.delete('/delete/:filename', deleteBackup);
router.post('/restore', restoreBackup);
router.get('/restore/progress', getRestoreProgress);
router.post('/restore/rollback', rollbackRestore);
router.post('/restore/clear', clearRestoreProgress);
router.post('/schedule/start', startScheduledBackup);
router.post('/schedule/stop', stopScheduledBackup);
router.get('/schedule/list', listScheduledJobs);

module.exports = router;
