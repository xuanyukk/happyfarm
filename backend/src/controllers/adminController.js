/**
 * 文件名：adminController.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：后台管理控制器，处理玩家管理、系统监控、货币调控等API
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始版本创建
 */

const { body, validationResult, query } = require('express-validator');
const adminService = require('../services/adminService');
const docsExportService = require('../services/docsExportService');
const logger = require('../config/logger');

/**
 * 检查管理员权限中间件
 */
exports.checkAdminPermission = (req, res, next) => {
  if (!req.user.is_admin) {
    logger.warn('非管理员尝试访问后台API', {
      userId: req.user.id,
      username: req.user.username,
      ip: req.ip,
    });
    return res.status(403).json({ success: false, message: '无管理员权限' });
  }
  next();
};

/**
 * 获取玩家列表
 * @swagger
 * /api/admin/players:
 *   get:
 *     summary: 获取玩家列表
 *     tags: [后台管理-玩家管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 每页数量
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: 用户名筛选
 *       - in: query
 *         name: playerId
 *         schema:
 *           type: string
 *         description: 玩家ID筛选
 *       - in: query
 *         name: minLevel
 *         schema:
 *           type: integer
 *         description: 最小等级
 *       - in: query
 *         name: maxLevel
 *         schema:
 *           type: integer
 *         description: 最大等级
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: 账户状态
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getPlayerList = async function (req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      username,
      playerId,
      minLevel,
      maxLevel,
      status,
    } = req.query;

    const result = await adminService.getPlayerList(
      { username, playerId, minLevel, maxLevel, status },
      parseInt(page),
      parseInt(pageSize)
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取玩家列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取玩家详情
 * @swagger
 * /api/admin/players/{playerId}:
 *   get:
 *     summary: 获取玩家详情
 *     tags: [后台管理-玩家管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getPlayerDetail = async function (req, res) {
  try {
    const { playerId } = req.params;
    const result = await adminService.getPlayerDetail(playerId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取玩家详情失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 更新玩家状态
 * @swagger
 * /api/admin/players/{playerId}/status:
 *   put:
 *     summary: 更新玩家账户状态
 *     tags: [后台管理-玩家管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.updatePlayerStatus = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const { playerId } = req.params;
    const { isActive, reason } = req.body;
    const result = await adminService.updatePlayerStatus(
      playerId,
      isActive,
      req.user.id,
      req.user.username,
      reason
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error('更新玩家状态失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updatePlayerStatusValidation = [
  body('isActive').isBoolean().withMessage('isActive必须是布尔值'),
  body('reason').optional().isString().withMessage('原因必须是字符串'),
];

/**
 * 创建审批请求
 * @swagger
 * /api/admin/approvals:
 *   post:
 *     summary: 创建操作审批请求
 *     tags: [后台管理-审批流程]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               operationType:
 *                 type: string
 *               operationModule:
 *                 type: string
 *               operationDesc:
 *                 type: string
 *               targetPlayerId:
 *                 type: string
 *               targetData:
 *                 type: object
 *     responses:
 *       200:
 *         description: 成功
 */
exports.createApprovalRequest = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const result = await adminService.createApprovalRequest(
      req.body,
      req.user.id,
      req.user.username
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('创建审批请求失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createApprovalRequestValidation = [
  body('operationType').isString().notEmpty().withMessage('操作类型不能为空'),
  body('operationModule').isString().notEmpty().withMessage('操作模块不能为空'),
  body('operationDesc').isString().notEmpty().withMessage('操作描述不能为空'),
  body('targetPlayerId').optional().isString(),
  body('targetData').isObject().withMessage('目标数据必须是对象'),
];

/**
 * 获取审批列表
 * @swagger
 * /api/admin/approvals:
 *   get:
 *     summary: 获取审批请求列表
 *     tags: [后台管理-审批流程]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getApprovalList = async function (req, res) {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const result = await adminService.getApprovalList(
      { status },
      parseInt(page),
      parseInt(pageSize)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取审批列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 审批操作
 * @swagger
 * /api/admin/approvals/{requestId}/approve:
 *   post:
 *     summary: 审批操作请求
 *     tags: [后台管理-审批流程]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.approveOperation = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const { requestId } = req.params;
    const { status, note } = req.body;
    const result = await adminService.approveOperation(
      requestId,
      status,
      note,
      req.user.id,
      req.user.username
    );
    res.status(200).json(result);
  } catch (error) {
    logger.error('审批操作失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveOperationValidation = [
  body('status').isIn(['approved', 'rejected']).withMessage('审批状态无效'),
  body('note').optional().isString().withMessage('备注必须是字符串'),
];

/**
 * 获取操作日志
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: 获取管理员操作日志
 *     tags: [后台管理-日志管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: operationType
 *         schema:
 *           type: string
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getOperationLogs = async function (req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      adminId,
      operationType,
      module,
      status,
    } = req.query;

    const result = await adminService.getOperationLogs(
      { adminId, operationType, module, status },
      parseInt(page),
      parseInt(pageSize)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取操作日志失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取监控数据
 * @swagger
 * /api/admin/monitoring/{type}:
 *   get:
 *     summary: 获取系统监控数据
 *     tags: [后台管理-系统监控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getMonitoringData = async function (req, res) {
  try {
    const { type } = req.params;
    const { limit = 100 } = req.query;
    const result = await adminService.getMonitoringData(type, parseInt(limit));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取监控数据失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取预警列表
 * @swagger
 * /api/admin/alerts:
 *   get:
 *     summary: 获取预警记录列表
 *     tags: [后台管理-系统监控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getAlertList = async function (req, res) {
  try {
    const { page = 1, pageSize = 20, status, level, type } = req.query;
    const result = await adminService.getAlertList(
      { status, level, type },
      parseInt(page),
      parseInt(pageSize)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取预警列表失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 处理预警
 * @swagger
 * /api/admin/alerts/{alertId}/handle:
 *   post:
 *     summary: 处理预警
 *     tags: [后台管理-系统监控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.handleAlert = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: errors.array()[0].msg });
    }

    const { alertId } = req.params;
    const { status, note } = req.body;
    const result = await adminService.handleAlert(
      parseInt(alertId),
      status,
      note,
      req.user.id
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('处理预警失败', { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.handleAlertValidation = [
  body('status').isString().notEmpty().withMessage('状态不能为空'),
  body('note').optional().isString().withMessage('备注必须是字符串'),
];

/**
 * 获取货币平衡数据
 * @swagger
 * /api/admin/currency-balance:
 *   get:
 *     summary: 获取货币平衡监测数据
 *     tags: [后台管理-货币调控]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currencyType
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getCurrencyBalanceData = async function (req, res) {
  try {
    const { currencyType = 'coin', days = 30 } = req.query;
    const result = await adminService.getCurrencyBalanceData(
      currencyType,
      parseInt(days)
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取货币平衡数据失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取统计数据
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: 获取统计数据
 *     tags: [后台管理-数据统计]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getStatisticsData = async function (req, res) {
  try {
    const { period = 'daily', type = 'player', startDate, endDate } = req.query;
    const result = await adminService.getStatisticsData(
      period,
      type,
      startDate,
      endDate
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('获取统计数据失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 获取后台仪表板概览数据
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: 获取仪表板概览数据
 *     tags: [后台管理-仪表板]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getDashboardData = async function (req, res) {
  try {
    const [players, recentLogs, recentAlerts] = await Promise.all([
      adminService.getPlayerList({}, 1, 5),
      adminService.getOperationLogs({}, 1, 10),
      adminService.getAlertList({ status: 'pending' }, 1, 10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPlayers: players.total,
        recentPlayers: players.players,
        recentLogs: recentLogs.logs,
        pendingAlerts: recentAlerts.alerts,
      },
    });
  } catch (error) {
    logger.error('获取仪表板数据失败', { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 导出数据库文档
 * @swagger
 * /api/admin/docs/export:
 *   post:
 *     summary: 导出数据库文档
 *     tags: [后台管理-文档管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.exportDatabaseDocs = async function (req, res) {
  try {
    logger.info('导出数据库文档', {
      adminId: req.user.id,
      username: req.user.username,
    });

    const result = await docsExportService.exportDocs();

    res.status(200).json({
      success: true,
      message: '文档导出成功',
      data: result,
    });
  } catch (error) {
    logger.error('导出数据库文档失败', { error: error.message });
    res
      .status(500)
      .json({ success: false, message: '文档导出失败：' + error.message });
  }
};

/**
 * 获取表结构文档内容
 * @swagger
 * /api/admin/docs/structure:
 *   get:
 *     summary: 获取表结构文档内容
 *     tags: [后台管理-文档管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getTableStructureDoc = async function (req, res) {
  try {
    const content = await docsExportService.getDocContent('structure');

    res.set('Content-Type', 'text/markdown');
    res.set('Content-Disposition', 'attachment; filename="table_structure.md"');
    res.send(content);
  } catch (error) {
    logger.error('获取表结构文档失败', { error: error.message });
    res
      .status(500)
      .json({ success: false, message: '获取文档失败：' + error.message });
  }
};

/**
 * 获取表数据文档内容
 * @swagger
 * /api/admin/docs/data:
 *   get:
 *     summary: 获取表数据文档内容
 *     tags: [后台管理-文档管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
exports.getTableDataDoc = async function (req, res) {
  try {
    const content = await docsExportService.getDocContent('data');

    res.set('Content-Type', 'text/markdown');
    res.set('Content-Disposition', 'attachment; filename="table_data.md"');
    res.send(content);
  } catch (error) {
    logger.error('获取表数据文档失败', { error: error.message });
    res
      .status(500)
      .json({ success: false, message: '获取文档失败：' + error.message });
  }
};
