/**
 * 文件名：batchImportExportService.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v1.0.0
 * 功能描述：批量数据导入/导出服务，支持CSV、JSON、Excel格式的数据导入导出
 * 更新记录：
 *   2026-05-26 - v1.0.0 - 初始版本创建
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const pool = require('../config/db');
const redisService = require('../config/redis');

/** 导出文件存储目录 */
const EXPORT_DIR = path.join(__dirname, '../../exports');

/** 分页导出每批次行数 */
const PAGE_SIZE = 1000;

/** Redis 进度键前缀 */
const PROGRESS_PREFIX = 'batch:progress:';

// 确保导出目录存在
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * 获取表的所有字段名
 *
 * @param {string} tableName - 表名称
 * @returns {Promise<string[]>} 字段名数组
 */
async function getTableColumns(tableName) {
  const query = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `;
  const result = await pool.query(query, [tableName]);
  return result.rows.map((r) => r.column_name);
}

/**
 * 更新 Redis 中的任务进度
 *
 * @param {string} taskId - 任务ID
 * @param {Object} progress - 进度数据
 */
async function updateProgress(taskId, progress) {
  if (redisService && redisService.set) {
    const key = `${PROGRESS_PREFIX}${taskId}`;
    await redisService.set(key, JSON.stringify(progress), 'EX', 3600);
  }
}

/**
 * 获取 Redis 中的任务进度
 *
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object|null>} 进度数据
 */
async function getProgress(taskId) {
  if (redisService && redisService.get) {
    const key = `${PROGRESS_PREFIX}${taskId}`;
    const data = await redisService.get(key);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

/**
 * 构建查询的 WHERE 子句
 *
 * @param {Object} filters - 过滤条件 { field: value }
 * @param {Array} params - 参数数组（会被修改）
 * @returns {string} WHERE 子句
 */
function buildWhereClause(filters, params) {
  if (!filters || Object.keys(filters).length === 0) {
    return '';
  }

  const conditions = [];
  let paramIndex = params.length + 1;

  Object.entries(filters).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${field} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

/**
 * 构建查询的 ORDER BY 子句
 *
 * @param {Object} sort - 排序条件 { field: 'asc'|'desc' }
 * @returns {string} ORDER BY 子句
 */
function buildOrderClause(sort) {
  if (!sort || Object.keys(sort).length === 0) {
    return '';
  }

  const orders = Object.entries(sort).map(([field, direction]) => {
    const dir = direction.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    return `${field} ${dir}`;
  });

  return `ORDER BY ${orders.join(', ')}`;
}

/**
 * 导出数据为 CSV 格式
 *
 * @param {string} tableName - 表名称
 * @param {Object} options - 导出选项
 * @param {Object} options.filters - 过滤条件
 * @param {Object} options.sort - 排序条件
 * @param {string[]} options.fields - 选择的字段
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<string>} 导出文件路径
 */
async function exportToCSV(tableName, options = {}) {
  const { filters = {}, sort = {}, fields, onProgress } = options;
  const taskId = `csv_${tableName}_${Date.now()}`;
  const filePath = path.join(EXPORT_DIR, `${taskId}.csv`);

  logger.info('开始CSV导出', { tableName, taskId });

  const selectedFields = fields || (await getTableColumns(tableName));
  const columns = selectedFields.join(', ');
  const countQuery = `SELECT COUNT(*) FROM ${tableName} ${buildWhereClause(filters, [])}`;
  const countResult = await pool.query(countQuery);
  const totalRows = parseInt(countResult.rows[0].count, 10);

  await updateProgress(taskId, {
    status: 'processing',
    total: totalRows,
    processed: 0,
    format: 'csv',
  });

  const writeStream = fs.createWriteStream(filePath);
  // BOM for Excel UTF-8 compatibility
  writeStream.write('\uFEFF');
  writeStream.write(selectedFields.map((f) => `"${f}"`).join(',') + '\n');

  let offset = 0;

  while (offset < totalRows) {
    const params = [];
    const whereClause = buildWhereClause(filters, params);
    const orderClause = buildOrderClause(sort);

    const query = `
      SELECT ${columns}
      FROM ${tableName}
      ${whereClause}
      ${orderClause}
      LIMIT ${PAGE_SIZE} OFFSET $${params.length + 1}
    `;
    params.push(offset);

    const result = await pool.query(query, params);

    result.rows.forEach((row) => {
      const line = selectedFields
        .map((f) => {
          const val = row[f];
          if (val === null || val === undefined) return '';
          const strVal = String(val);
          if (
            strVal.includes(',') ||
            strVal.includes('"') ||
            strVal.includes('\n')
          ) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        })
        .join(',');
      writeStream.write(line + '\n');
    });

    offset += PAGE_SIZE;
    await updateProgress(taskId, {
      status: 'processing',
      total: totalRows,
      processed: Math.min(offset, totalRows),
      format: 'csv',
    });

    if (onProgress) {
      onProgress({ processed: Math.min(offset, totalRows), total: totalRows });
    }
  }

  writeStream.end();
  await new Promise((resolve) => writeStream.on('finish', resolve));

  await updateProgress(taskId, {
    status: 'completed',
    total: totalRows,
    processed: totalRows,
    format: 'csv',
    filePath,
  });

  logger.info('CSV导出完成', { tableName, taskId, totalRows });
  return { taskId, filePath, totalRows, format: 'csv' };
}

/**
 * 导出数据为 JSON 格式
 *
 * @param {string} tableName - 表名称
 * @param {Object} options - 导出选项
 * @returns {Promise<Object>} 导出结果
 */
async function exportToJSON(tableName, options = {}) {
  const { filters = {}, sort = {}, fields, onProgress } = options;
  const taskId = `json_${tableName}_${Date.now()}`;
  const filePath = path.join(EXPORT_DIR, `${taskId}.json`);

  logger.info('开始JSON导出', { tableName, taskId });

  const selectedFields = fields || (await getTableColumns(tableName));
  const columns = selectedFields.join(', ');
  const countQuery = `SELECT COUNT(*) FROM ${tableName} ${buildWhereClause(filters, [])}`;
  const countResult = await pool.query(countQuery);
  const totalRows = parseInt(countResult.rows[0].count, 10);

  await updateProgress(taskId, {
    status: 'processing',
    total: totalRows,
    processed: 0,
    format: 'json',
  });

  const writeStream = fs.createWriteStream(filePath);
  writeStream.write('[\n');

  let offset = 0;
  let isFirst = true;

  while (offset < totalRows) {
    const params = [];
    const whereClause = buildWhereClause(filters, params);
    const orderClause = buildOrderClause(sort);

    const query = `
      SELECT ${columns}
      FROM ${tableName}
      ${whereClause}
      ${orderClause}
      LIMIT ${PAGE_SIZE} OFFSET $${params.length + 1}
    `;
    params.push(offset);
    const result = await pool.query(query, params);

    result.rows.forEach((row) => {
      const filteredRow = {};
      selectedFields.forEach((f) => {
        filteredRow[f] = row[f];
      });
      if (!isFirst) {
        writeStream.write(',\n');
      }
      writeStream.write(JSON.stringify(filteredRow));
      isFirst = false;
    });

    offset += PAGE_SIZE;
    await updateProgress(taskId, {
      status: 'processing',
      total: totalRows,
      processed: Math.min(offset, totalRows),
      format: 'json',
    });

    if (onProgress) {
      onProgress({ processed: Math.min(offset, totalRows), total: totalRows });
    }
  }

  writeStream.write('\n]');
  writeStream.end();
  await new Promise((resolve) => writeStream.on('finish', resolve));

  await updateProgress(taskId, {
    status: 'completed',
    total: totalRows,
    processed: totalRows,
    format: 'json',
    filePath,
  });

  logger.info('JSON导出完成', { tableName, taskId, totalRows });
  return { taskId, filePath, totalRows, format: 'json' };
}

/**
 * 导出数据为 Excel 格式
 *
 * @param {string} tableName - 表名称
 * @param {Object} options - 导出选项
 * @returns {Promise<Object>} 导出结果
 */
async function exportToExcel(tableName, options = {}) {
  const { filters = {}, sort = {}, fields, onProgress } = options;

  try {
    const ExcelJS = require('exceljs');
    const taskId = `xlsx_${tableName}_${Date.now()}`;
    const filePath = path.join(EXPORT_DIR, `${taskId}.xlsx`);

    logger.info('开始Excel导出', { tableName, taskId });

    const selectedFields = fields || (await getTableColumns(tableName));
    const columns = selectedFields.join(', ');
    const countQuery = `SELECT COUNT(*) FROM ${tableName} ${buildWhereClause(filters, [])}`;
    const countResult = await pool.query(countQuery);
    const totalRows = parseInt(countResult.rows[0].count, 10);

    await updateProgress(taskId, {
      status: 'processing',
      total: totalRows,
      processed: 0,
      format: 'excel',
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Happy Farm Admin';
    const worksheet = workbook.addWorksheet(tableName);

    // 添加表头
    const headerRow = worksheet.addRow(selectedFields);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1890FF' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    let offset = 0;

    while (offset < totalRows) {
      const params = [];
      const whereClause = buildWhereClause(filters, params);
      const orderClause = buildOrderClause(sort);

      const query = `
        SELECT ${columns}
        FROM ${tableName}
        ${whereClause}
        ${orderClause}
        LIMIT ${PAGE_SIZE} OFFSET $${params.length + 1}
      `;
      params.push(offset);
      const result = await pool.query(query, params);

      result.rows.forEach((row) => {
        const rowData = selectedFields.map((f) => row[f]);
        worksheet.addRow(rowData);
      });

      offset += PAGE_SIZE;
      await updateProgress(taskId, {
        status: 'processing',
        total: totalRows,
        processed: Math.min(offset, totalRows),
        format: 'excel',
      });

      if (onProgress) {
        onProgress({
          processed: Math.min(offset, totalRows),
          total: totalRows,
        });
      }
    }

    // 自动调整列宽
    worksheet.columns.forEach((column, index) => {
      if (index < selectedFields.length) {
        column.width = Math.max(selectedFields[index].length + 4, 12);
      }
    });

    await workbook.xlsx.writeFile(filePath);

    await updateProgress(taskId, {
      status: 'completed',
      total: totalRows,
      processed: totalRows,
      format: 'excel',
      filePath,
    });

    logger.info('Excel导出完成', { tableName, taskId, totalRows });
    return { taskId, filePath, totalRows, format: 'excel' };
  } catch (error) {
    logger.error('Excel导出失败', {
      error: error.message,
      hint: '请确认已安装 exceljs 依赖',
    });
    throw new Error(`Excel导出需要 exceljs 依赖: ${error.message}`);
  }
}

/**
 * 验证导入数据
 *
 * @param {Array<Object>} rows - 数据行
 * @param {string} tableName - 表名称
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} 验证结果 { validRows, errors }
 */
async function validateImportData(rows, tableName, options = {}) {
  const columns = await getTableColumns(tableName);
  const errors = [];
  const validRows = [];

  // 获取必填字段（排除自增主键和默认值字段）
  const requiredColumns = columns.filter((col) => {
    return col !== 'id' && col !== 'created_at' && col !== 'updated_at';
  });

  rows.forEach((row, index) => {
    const rowErrors = [];

    // 类型检查
    requiredColumns.forEach((col) => {
      if (row[col] === undefined && !options.skipRequiredCheck) {
        rowErrors.push(`第${index + 1}行：缺少必填字段 "${col}"`);
      }
    });

    // 数据清洗 - 去除字符串字段的首尾空格
    const cleanedRow = {};
    Object.keys(row).forEach((key) => {
      if (typeof row[key] === 'string') {
        cleanedRow[key] = row[key].trim();
      } else {
        cleanedRow[key] = row[key];
      }
    });

    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, data: row, errors: rowErrors });
    } else {
      validRows.push(cleanedRow);
    }
  });

  return { validRows, errors };
}

/**
 * 从 CSV 文件导入数据
 *
 * @param {string} filePath - CSV 文件路径
 * @param {string} tableName - 目标表名称
 * @param {Object} options - 导入选项
 * @param {string} options.mode - 导入模式 'insert'|'upsert'
 * @param {boolean} options.skipRequiredCheck - 是否跳过必填检查
 * @returns {Promise<Object>} 导入结果
 */
async function importFromCSV(filePath, tableName, options = {}) {
  const { mode = 'insert', skipRequiredCheck = false } = options;
  const taskId = `csv_import_${tableName}_${Date.now()}`;

  logger.info('开始CSV导入', { tableName, taskId, mode });

  const csvParser = require('csv-parser');
  const rows = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  return executeImport(rows, tableName, taskId, mode, skipRequiredCheck);
}

/**
 * 从 JSON 文件导入数据
 *
 * @param {string} filePath - JSON 文件路径
 * @param {string} tableName - 目标表名称
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} 导入结果
 */
async function importFromJSON(filePath, tableName, options = {}) {
  const { mode = 'insert', skipRequiredCheck = false } = options;
  const taskId = `json_import_${tableName}_${Date.now()}`;

  logger.info('开始JSON导入', { tableName, taskId, mode });

  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = JSON.parse(content);

  if (!Array.isArray(rows)) {
    throw new Error('JSON文件格式错误：需要一个对象数组');
  }

  return executeImport(rows, tableName, taskId, mode, skipRequiredCheck);
}

/**
 * 从 Excel 文件导入数据
 *
 * @param {string} filePath - Excel 文件路径
 * @param {string} tableName - 目标表名称
 * @param {Object} options - 导入选项
 * @returns {Promise<Object>} 导入结果
 */
async function importFromExcel(filePath, tableName, options = {}) {
  const { mode = 'insert', skipRequiredCheck = false } = options;
  const taskId = `xlsx_import_${tableName}_${Date.now()}`;

  logger.info('开始Excel导入', { tableName, taskId, mode });

  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Excel文件中未找到工作表');
    }

    const rows = [];
    const headers = [];

    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value);
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const rowData = {};
      row.eachCell((cell, colNumber) => {
        if (colNumber <= headers.length) {
          rowData[headers[colNumber - 1]] = cell.value;
        }
      });
      rows.push(rowData);
    });

    return executeImport(rows, tableName, taskId, mode, skipRequiredCheck);
  } catch (error) {
    logger.error('Excel导入失败', {
      error: error.message,
      hint: '请确认已安装 exceljs 依赖',
    });
    throw new Error(`Excel导入需要 exceljs 依赖: ${error.message}`);
  }
}

/**
 * 执行数据导入（通用逻辑）
 *
 * @param {Array<Object>} rows - 数据行
 * @param {string} tableName - 目标表名称
 * @param {string} taskId - 任务ID
 * @param {string} mode - 导入模式
 * @param {boolean} skipRequiredCheck - 是否跳过必填检查
 * @returns {Promise<Object>} 导入结果
 */
async function executeImport(rows, tableName, taskId, mode, skipRequiredCheck) {
  const totalRows = rows.length;

  await updateProgress(taskId, {
    status: 'processing',
    total: totalRows,
    processed: 0,
    mode,
    tableName,
  });

  const { validRows, errors: validateErrors } = await validateImportData(
    rows,
    tableName,
    { skipRequiredCheck }
  );

  let importedCount = 0;
  let skippedCount = 0;
  const importErrors = [...validateErrors];

  const columns = await getTableColumns(tableName);
  const pkColumn = columns[0]; // 假设第一列是主键

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];

    try {
      if (mode === 'upsert') {
        // Upsert 模式：存在则更新，不存在则插入
        const insertColumns = Object.keys(row);
        const values = insertColumns.map((col) => row[col]);
        const placeholders = values.map((_, idx) => `$${idx + 1}`);

        const updateSet = insertColumns
          .map((col) => `${col} = EXCLUDED.${col}`)
          .join(', ');

        const upsertQuery = `
          INSERT INTO ${tableName} (${insertColumns.join(', ')})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (${pkColumn}) DO UPDATE SET ${updateSet}
        `;

        await pool.query(upsertQuery, values);
      } else {
        // Insert 模式：直接插入
        const insertColumns = Object.keys(row);
        const values = insertColumns.map((col) => row[col]);
        const placeholders = values.map((_, idx) => `$${idx + 1}`);

        const insertQuery = `
          INSERT INTO ${tableName} (${insertColumns.join(', ')})
          VALUES (${placeholders.join(', ')})
        `;

        await pool.query(insertQuery, values);
      }

      importedCount++;
    } catch (error) {
      skippedCount++;
      importErrors.push({
        row: i + 1,
        data: row,
        errors: [error.message],
      });

      logger.warn('导入行失败', {
        tableName,
        row: i + 1,
        error: error.message,
      });
    }

    if ((i + 1) % 100 === 0 || i === validRows.length - 1) {
      await updateProgress(taskId, {
        status: 'processing',
        total: totalRows,
        processed: i + 1,
        imported: importedCount,
        skipped: skippedCount,
        mode,
        tableName,
      });
    }
  }

  const finalResult = {
    total: totalRows,
    imported: importedCount,
    skipped: skippedCount,
    errors: importErrors,
  };

  await updateProgress(taskId, {
    status: 'completed',
    ...finalResult,
    mode,
    tableName,
  });

  logger.info('导入完成', { tableName, taskId, ...finalResult });
  return { taskId, ...finalResult };
}

/**
 * 获取可导入/导出的数据库表列表
 *
 * @returns {Promise<Array<Object>>} 表列表
 */
async function getAvailableTables() {
  try {
    const query = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const result = await pool.query(query);

    return result.rows.map((row) => ({
      name: row.table_name,
      columnCount: parseInt(row.column_count, 10),
    }));
  } catch (error) {
    logger.error('获取表列表失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取导出任务状态
 *
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object|null>} 任务状态
 */
async function getExportTaskStatus(taskId) {
  return getProgress(taskId);
}

/**
 * 获取导入任务状态
 *
 * @param {string} taskId - 任务ID
 * @returns {Promise<Object|null>} 任务状态
 */
async function getImportTaskStatus(taskId) {
  return getProgress(taskId);
}

/**
 * 获取导入错误详情
 *
 * @param {string} taskId - 任务ID
 * @returns {Promise<Array|null>} 错误列表
 */
async function getImportErrors(taskId) {
  const progress = await getProgress(taskId);
  return progress ? progress.errors || [] : null;
}

module.exports = {
  exportToCSV,
  exportToJSON,
  exportToExcel,
  importFromCSV,
  importFromJSON,
  importFromExcel,
  getAvailableTables,
  getExportTaskStatus,
  getImportTaskStatus,
  getImportErrors,
  EXPORT_DIR,
};
