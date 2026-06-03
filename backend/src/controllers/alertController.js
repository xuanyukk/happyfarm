/**
 * 文件名: alertController.js
 * 作者: Trae AI
 * 日期: 2026-05-01
 * 版本: v1.0.0
 * 功能描述: 预警推送系统控制器
 */
const alertService = require('../services/alertService');
const logger = require('../config/logger');

exports.getRuleList = async (req, res) => {
  try {
    const rules = await alertService.getRuleList(req.query);
    res.json({ success: true, data: rules });
  } catch (err) {
    logger.error('获取预警规则列表失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createRule = async (req, res) => {
  try {
    const rule = await alertService.createRule(req.body, req.user?.id);
    res.status(201).json({ success: true, data: rule, message: '创建成功' });
  } catch (err) {
    logger.error('创建预警规则失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRule = async (req, res) => {
  try {
    const rule = await alertService.updateRule(
      parseInt(req.params.id),
      req.body,
      req.user?.id
    );
    res.json({ success: true, data: rule, message: '更新成功' });
  } catch (err) {
    logger.error('更新预警规则失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    await alertService.deleteRule(parseInt(req.params.id));
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    logger.error('删除预警规则失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRecordList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, ...filters } = req.query;
    const result = await alertService.getRecordList(
      filters,
      parseInt(page),
      parseInt(pageSize)
    );
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('获取预警记录列表失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRecordDetail = async (req, res) => {
  try {
    const record = await alertService.getRecordDetail(parseInt(req.params.id));
    res.json({ success: true, data: record });
  } catch (err) {
    logger.error('获取预警详情失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const record = await alertService.markAsRead(parseInt(req.params.id));
    res.json({ success: true, data: record, message: '已标记为已读' });
  } catch (err) {
    logger.error('标记已读失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resolveRecord = async (req, res) => {
  try {
    const record = await alertService.resolveRecord(
      parseInt(req.params.id),
      req.user?.id,
      req.body.note
    );
    res.json({ success: true, data: record, message: '已解决预警' });
  } catch (err) {
    logger.error('解决预警失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.ignoreRecord = async (req, res) => {
  try {
    const record = await alertService.ignoreRecord(parseInt(req.params.id));
    res.json({ success: true, data: record, message: '已忽略预警' });
  } catch (err) {
    logger.error('忽略预警失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.triggerDemo = async (req, res) => {
  try {
    const io = req.app.get('io');
    const record = await alertService.triggerDemoAlert(io);
    res.json({ success: true, data: record, message: '测试预警已触发' });
  } catch (err) {
    logger.error('触发测试预警失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOverviewStats = async (req, res) => {
  try {
    const stats = await alertService.getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    logger.error('获取统计失败', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
