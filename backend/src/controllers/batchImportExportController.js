/**
 * 文件名：batchImportExportController.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v1.0.0
 * 功能描述：批量数据导入/导出控制器
 * 更新记录：
 *   2026-05-26 - v1.0.0 - 初始版本创建
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const {
  successResponse,
  errorResponse,
  badRequestResponse,
  notFoundResponse,
} = require('../utils/response');
const batchService = require('../services/batchImportExportService');

/**
 * 发起导出任务
 * POST /api/batch/export
 *
 * @param {Object} req - 请求对象
 * @param {Object} req.body.tableName - 表名称
 * @param {Object} req.body.format - 导出格式 'csv'|'json'|'excel'
 * @param {string[]} req.body.fields - 选择的字段（可选）
 * @param {Object} req.body.filters - 过滤条件（可选）
 * @param {Object} req.body.sort - 排序条件（可选）
 */
exports.exportData = async (req, res) => {
  try {
    const { tableName, format = 'csv', fields, filters, sort } = req.body;

    if (!tableName) {
      return badRequestResponse(res, '请指定表名称');
    }

    if (!['csv', 'json', 'excel'].includes(format)) {
      return badRequestResponse(res, '不支持的导出格式，仅支持 csv/json/excel');
    }

    const options = { filters, sort, fields };

    let result;
    switch (format) {
      case 'json':
        result = await batchService.exportToJSON(tableName, options);
        break;
      case 'excel':
        result = await batchService.exportToExcel(tableName, options);
        break;
      default:
        result = await batchService.exportToCSV(tableName, options);
    }

    logger.info('导出任务已创建', { tableName, format, taskId: result.taskId });
    successResponse(res, result, '导出任务已创建');
  } catch (error) {
    logger.error('导出任务失败', { error: error.message });
    errorResponse(res, `导出失败: ${error.message}`, 500);
  }
};

/**
 * 查询导出任务进度
 * GET /api/batch/export/:taskId/status
 *
 * @param {Object} req - 请求对象
 * @param {string} req.params.taskId - 任务ID
 */
exports.getExportProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const progress = await batchService.getExportTaskStatus(taskId);

    if (!progress) {
      return notFoundResponse(res, '未找到导出任务');
    }

    successResponse(res, progress, '获取导出进度成功');
  } catch (error) {
    logger.error('获取导出进度失败', { error: error.message });
    errorResponse(res, '获取导出进度失败', 500);
  }
};

/**
 * 下载导出文件
 * GET /api/batch/export/:taskId/download
 *
 * @param {Object} req - 请求对象
 * @param {string} req.params.taskId - 任务ID
 */
exports.downloadExportFile = async (req, res) => {
  try {
    const { taskId } = req.params;
    const progress = await batchService.getExportTaskStatus(taskId);

    if (!progress) {
      return notFoundResponse(res, '未找到导出任务');
    }

    if (progress.status !== 'completed') {
      return badRequestResponse(res, '导出任务尚未完成，无法下载');
    }

    if (!progress.filePath || !fs.existsSync(progress.filePath)) {
      return notFoundResponse(res, '导出文件不存在');
    }

    const extMap = {
      csv: '.csv',
      json: '.json',
      excel: '.xlsx',
    };

    const ext = extMap[progress.format] || '.csv';
    const downloadName = `${taskId}${ext}`;

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${downloadName}"`
    );
    res.setHeader(
      'Content-Type',
      progress.format === 'json'
        ? 'application/json'
        : 'application/octet-stream'
    );

    const fileStream = fs.createReadStream(progress.filePath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('下载导出文件失败', { error: error.message });
    errorResponse(res, '下载导出文件失败', 500);
  }
};

/**
 * 发起导入任务
 * POST /api/batch/import
 *
 * @param {Object} req - 请求对象
 * @param {Object} req.file - 上传的文件（multer）
 * @param {Object} req.body.tableName - 目标表名称
 * @param {string} req.body.mode - 导入模式 'insert'|'upsert'
 */
exports.importData = async (req, res) => {
  try {
    if (!req.file) {
      return badRequestResponse(res, '请上传导入文件');
    }

    const { tableName, mode = 'insert' } = req.body;

    if (!tableName) {
      // 清理上传的临时文件
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return badRequestResponse(res, '请指定目标表名称');
    }

    if (!['insert', 'upsert'].includes(mode)) {
      fs.unlinkSync(req.file.path);
      return badRequestResponse(res, '不支持的导入模式，仅支持 insert/upsert');
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let result;

    switch (ext) {
      case '.csv':
        result = await batchService.importFromCSV(filePath, tableName, {
          mode,
        });
        break;
      case '.json':
        result = await batchService.importFromJSON(filePath, tableName, {
          mode,
        });
        break;
      case '.xlsx':
      case '.xls':
        result = await batchService.importFromExcel(filePath, tableName, {
          mode,
        });
        break;
      default:
        fs.unlinkSync(filePath);
        return badRequestResponse(
          res,
          '不支持的文件格式，仅支持 csv/json/xlsx'
        );
    }

    // 清理上传的临时文件
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    logger.info('导入任务已执行', {
      tableName,
      mode,
      taskId: result.taskId,
      imported: result.imported,
    });

    successResponse(
      res,
      {
        taskId: result.taskId,
        total: result.total,
        imported: result.imported,
        skipped: result.skipped,
        errorCount: result.errors ? result.errors.length : 0,
      },
      '导入任务已完成'
    );
  } catch (error) {
    logger.error('导入任务失败', { error: error.message });

    // 清理文件
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        logger.error('清理上传文件失败', { error: cleanupErr.message });
      }
    }

    errorResponse(res, `导入失败: ${error.message}`, 500);
  }
};

/**
 * 查询导入任务进度
 * GET /api/batch/import/:taskId/status
 *
 * @param {Object} req - 请求对象
 * @param {string} req.params.taskId - 任务ID
 */
exports.getImportProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const progress = await batchService.getImportTaskStatus(taskId);

    if (!progress) {
      return notFoundResponse(res, '未找到导入任务');
    }

    successResponse(res, progress, '获取导入进度成功');
  } catch (error) {
    logger.error('获取导入进度失败', { error: error.message });
    errorResponse(res, '获取导入进度失败', 500);
  }
};

/**
 * 获取导入错误详情
 * GET /api/batch/import/:taskId/errors
 *
 * @param {Object} req - 请求对象
 * @param {string} req.params.taskId - 任务ID
 */
exports.getImportErrors = async (req, res) => {
  try {
    const { taskId } = req.params;
    const errors = await batchService.getImportErrors(taskId);

    if (errors === null) {
      return notFoundResponse(res, '未找到导入任务');
    }

    successResponse(
      res,
      { errors, count: errors.length },
      '获取导入错误详情成功'
    );
  } catch (error) {
    logger.error('获取导入错误详情失败', { error: error.message });
    errorResponse(res, '获取导入错误详情失败', 500);
  }
};

/**
 * 获取可导入/导出的表列表
 * GET /api/batch/tables
 */
exports.getTables = async (req, res) => {
  try {
    const tables = await batchService.getAvailableTables();
    successResponse(res, tables, '获取表列表成功');
  } catch (error) {
    logger.error('获取表列表失败', { error: error.message });
    errorResponse(res, '获取表列表失败', 500);
  }
};
