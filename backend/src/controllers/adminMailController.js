/**
 * 文件名：adminMailController.js
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：后台管理系统邮件管理控制器，处理邮件模板CRUD和邮件发送请求
 * 更新记录：
 *   2026-05-31 - v1.0.0 - 初始创建邮件管理控制器
 */

const { body, validationResult } = require('express-validator');
const adminMailService = require('../services/adminMailService');
const logger = require('../config/logger');

/**
 * 获取邮件模板列表
 * GET /api/admin/mails/templates
 */
exports.getMailTemplates = function (req, res) {
  try {
    const templates = adminMailService.getMailTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('获取邮件模板列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取邮件模板详情
 * GET /api/admin/mails/templates/:templateId
 */
exports.getMailTemplateDetail = function (req, res) {
  try {
    const templateId = parseInt(req.params.templateId);
    const template = adminMailService.getMailTemplateById(templateId);
    res.json({ success: true, data: template });
  } catch (error) {
    if (error.message === '邮件模板不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      logger.error('获取邮件模板详情失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 创建邮件模板
 * POST /api/admin/mails/templates
 */
exports.createMailTemplate = [
  body('title').isString().notEmpty().withMessage('模板标题不能为空'),
  body('content').isString().notEmpty().withMessage('模板内容不能为空'),
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    try {
      const template = adminMailService.createMailTemplate(req.body);
      res
        .status(201)
        .json({ success: true, data: template, message: '模板创建成功' });
    } catch (error) {
      logger.error('创建邮件模板失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 更新邮件模板
 * PUT /api/admin/mails/templates/:templateId
 */
exports.updateMailTemplate = [
  body('title')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('模板标题不能为空'),
  body('content')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('模板内容不能为空'),
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    try {
      const templateId = parseInt(req.params.templateId);
      const template = adminMailService.updateMailTemplate(
        templateId,
        req.body
      );
      res.json({ success: true, data: template, message: '模板更新成功' });
    } catch (error) {
      if (error.message === '邮件模板不存在') {
        res.status(404).json({ success: false, message: error.message });
      } else {
        logger.error('更新邮件模板失败', { error: error.message });
        res.status(500).json({ success: false, message: error.message });
      }
    }
  },
];

/**
 * 删除邮件模板
 * DELETE /api/admin/mails/templates/:templateId
 */
exports.deleteMailTemplate = function (req, res) {
  try {
    const templateId = parseInt(req.params.templateId);
    adminMailService.deleteMailTemplate(templateId);
    res.json({ success: true, message: '模板删除成功' });
  } catch (error) {
    if (error.message === '邮件模板不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      logger.error('删除邮件模板失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 发送邮件
 * POST /api/admin/mails/send
 */
exports.sendMail = [
  body('recipientType').isString().notEmpty().withMessage('收件人类型不能为空'),
  body('title').isString().notEmpty().withMessage('邮件标题不能为空'),
  body('content').isString().notEmpty().withMessage('邮件内容不能为空'),
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    try {
      const mailRecord = await adminMailService.sendMail(req.body);
      res.status(201).json({
        success: true,
        data: mailRecord,
        message: '邮件发送成功',
      });
    } catch (error) {
      logger.error('发送邮件失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * 获取发送历史
 * GET /api/admin/mails/history
 */
exports.getMailHistory = function (req, res) {
  try {
    const history = adminMailService.getMailHistory(req.query);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('获取邮件历史失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取邮件详情
 * GET /api/admin/mails/:mailId
 */
exports.getMailDetail = function (req, res) {
  try {
    const mailId = parseInt(req.params.mailId);
    const mail = adminMailService.getMailDetail(mailId);
    res.json({ success: true, data: mail });
  } catch (error) {
    if (error.message === '邮件记录不存在') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      logger.error('获取邮件详情失败', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
