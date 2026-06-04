/**
 * 文件名：adminMailRoutes.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：后台管理系统邮件管理路由
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 初始创建邮件管理路由
 */

const express = require('express');
const router = express.Router();
const { checkAdminPermission } = require('../controllers/adminController');
const adminMailController = require('../controllers/adminMailController');

router.use(checkAdminPermission);

router.get('/templates', adminMailController.getMailTemplates);
router.get('/templates/:templateId', adminMailController.getMailTemplateDetail);
router.post('/templates', adminMailController.createMailTemplate);
router.put('/templates/:templateId', adminMailController.updateMailTemplate);
router.delete('/templates/:templateId', adminMailController.deleteMailTemplate);

router.post('/send', adminMailController.sendMail);
router.get('/history', adminMailController.getMailHistory);
router.get('/:mailId', adminMailController.getMailDetail);

module.exports = router;
