/**
 * 文件名：adminRoutes.js
 * 作者：AI助手
 * 日期：2026-06-06
 * 版本：v1.0.0
 * 功能描述：管理员路由 - 向后兼容占位文件
 * 更新记录：
 *   2026-06-06 - v1.0.0 - 创建占位文件，解决模块找不到错误
 */

const express = require('express');
const router = express.Router();

// 占位路由 - 实际功能已迁移到 adminManagementRoutes.js 和其他admin相关路由
router.get('/', (req, res) => {
  res.status(200).json({ 
    message: '管理员路由已迁移，请使用具体的管理员功能路由',
    availableRoutes: [
      '/api/admin/rbac',
      '/api/admin/announcements',
      '/api/admin/configs',
      '/api/admin/batch',
      '/api/admin/alerts',
      '/api/admin/backup',
      '/api/admin/log-analysis',
      '/api/admin/game-events',
      '/api/admin/crops',
      '/api/admin/items',
      '/api/admin/game-config',
      '/api/admin/shop',
      '/api/admin/achievements',
      '/api/admin/farm-levels',
      '/api/admin/database',
      '/api/admin/mails'
    ]
  });
});

module.exports = router;
