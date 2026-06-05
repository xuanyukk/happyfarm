/**
 * 文件名：batchController.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：批量操作功能控制器
 * 更新记录：
 *   2026-05-01 - v1.0.0 - 初始版本创建
 */

const batchService = require('../services/batchService');
const logger = require('../config/logger');

/**
 * 获取批量操作列表
 */
exports.getBatchList = async (req, res) => {
  try {
    const {
      operation_type,
      status,
      target_module,
      start_date,
      end_date,
      page = 1,
      pageSize = 20,
    } = req.query;
    const result = await batchService.getBatchList(
      { operation_type, status, target_module, start_date, end_date },
      parseInt(page),
      parseInt(pageSize)
    );
    res.json({
      success: true,
      data: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (error) {
    logger.error('获取批量操作列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取批量操作列表失败',
      error: error.message,
    });
  }
};

/**
 * 获取批量操作详情
 */
exports.getBatchDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await batchService.getBatchDetail(parseInt(id));

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: '批量操作不存在',
      });
    }

    res.json({
      success: true,
      data: batch,
    });
  } catch (error) {
    logger.error('获取批量操作详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取批量操作详情失败',
      error: error.message,
    });
  }
};

/**
 * 创建批量操作
 */
exports.createBatch = async (req, res) => {
  try {
    const data = req.body;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    const batch = await batchService.createBatch(data, operatorId, ipAddress);
    res.status(201).json({
      success: true,
      message: '批量操作创建成功',
      data: batch,
    });
  } catch (error) {
    logger.error('创建批量操作失败:', error);
    res.status(500).json({
      success: false,
      message: '创建批量操作失败',
      error: error.message,
    });
  }
};

/**
 * 执行批量操作
 */
exports.executeBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const operatorId = req.user?.id;

    const result = await batchService.executeBatch(parseInt(id), operatorId);
    res.json({
      success: true,
      message: '批量操作开始执行',
      data: result,
    });
  } catch (error) {
    logger.error('执行批量操作失败:', error);
    res.status(500).json({
      success: false,
      message: '执行批量操作失败',
      error: error.message,
    });
  }
};

/**
 * 取消批量操作
 */
exports.cancelBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const operatorId = req.user?.id;

    const batch = await batchService.cancelBatch(parseInt(id), operatorId);
    res.json({
      success: true,
      message: '批量操作已取消',
      data: batch,
    });
  } catch (error) {
    logger.error('取消批量操作失败:', error);
    if (error.message === 'Batch operation not found or cannot be cancelled') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: '取消批量操作失败',
      error: error.message,
    });
  }
};

/**
 * 导出结果
 */
exports.exportResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const result = await batchService.exportResult(parseInt(id));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=batch-${id}-result.json`
      );
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('导出批量操作结果失败:', error);
    res.status(500).json({
      success: false,
      message: '导出批量操作结果失败',
      error: error.message,
    });
  }
};

/**
 * 批量更新状态
 */
exports.batchStatusUpdate = async (req, res) => {
  try {
    const { target_module, target_ids, new_status } = req.body;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    if (
      !target_module ||
      !target_ids ||
      !Array.isArray(target_ids) ||
      !new_status
    ) {
      return res.status(400).json({
        success: false,
        message: '参数错误，请检查参数',
      });
    }

    const batch = await batchService.batchStatusUpdate(
      target_module,
      target_ids,
      new_status,
      operatorId,
      ipAddress
    );

    res.status(201).json({
      success: true,
      message: '批量状态更新已创建',
      data: batch,
    });
  } catch (error) {
    logger.error('批量更新状态失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新状态失败',
      error: error.message,
    });
  }
};

/**
 * 批量删除
 */
exports.batchDelete = async (req, res) => {
  try {
    const { target_module, target_ids } = req.body;
    const operatorId = req.user?.id;
    const ipAddress = req.ip;

    if (!target_module || !target_ids || !Array.isArray(target_ids)) {
      return res.status(400).json({
        success: false,
        message: '参数错误，请检查参数',
      });
    }

    const batch = await batchService.batchDelete(
      target_module,
      target_ids,
      operatorId,
      ipAddress
    );

    res.status(201).json({
      success: true,
      message: '批量删除操作已创建',
      data: batch,
    });
  } catch (error) {
    logger.error('批量删除失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message,
    });
  }
};
