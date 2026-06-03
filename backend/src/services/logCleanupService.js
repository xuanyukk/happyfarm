/**
 * 文件名：logCleanupService.js
 * 作者：开发者
 * 日期：2026-05-16
 * 版本：v1.0.0
 * 功能描述：日志清理服务 - 实现不同类型日志的差异化保留策略
 * 更新记录：
 *   2026-05-16 - v1.0.0 - 初始版本，支持多种日志类型的差异化保留策略
 */

const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// ==================== 日志保留策略配置 ====================

/**
 * 日志保留策略配置
 * 每种日志类型有独立的保留天数、最大文件数、最大总大小
 */
const LogRetentionPolicies = {
  system: {
    name: '系统日志',
    days: 30, // 保留30天
    maxFiles: 60, // 最多保留60个文件
    maxSize: '500MB', // 最大500MB
    enabled: true,
  },
  error: {
    name: '错误日志',
    days: 30, // 保留30天
    maxFiles: 60, // 最多保留60个文件
    maxSize: '200MB', // 最大200MB
    enabled: true,
  },
  access: {
    name: '访问日志',
    days: 60, // 保留60天
    maxFiles: 120, // 最多保留120个文件
    maxSize: '1GB', // 最大1GB
    enabled: true,
  },
  business: {
    name: '业务日志',
    days: 90, // 保留90天
    maxFiles: 180, // 最多保留180个文件
    maxSize: '2GB', // 最大2GB
    enabled: true,
  },
  security: {
    name: '安全日志',
    days: 90, // 保留90天（安全日志保留更长）
    maxFiles: 180, // 最多保留180个文件
    maxSize: '1GB', // 最大1GB
    enabled: true,
  },
  performance: {
    name: '性能日志',
    days: 30, // 保留30天
    maxFiles: 60, // 最多保留60个文件
    maxSize: '300MB', // 最大300MB
    enabled: true,
  },
  audit: {
    name: '审计日志',
    days: 180, // 保留180天（审计日志保留最长）
    maxFiles: 365, // 最多保留365个文件
    maxSize: '2GB', // 最大2GB
    enabled: true,
  },
  client: {
    name: '客户端日志',
    days: 30, // 保留30天
    maxFiles: 60, // 最多保留60个文件
    maxSize: '300MB', // 最大300MB
    enabled: true,
  },
  combined: {
    name: '综合日志',
    days: 7, // 保留7天（综合日志保留最短）
    maxFiles: 14, // 最多保留14个文件
    maxSize: '100MB', // 最大100MB
    enabled: true,
  },
};

// ==================== 辅助函数 ====================

/**
 * 解析大小字符串到字节数
 * @param {string} sizeStr - 大小字符串，如 '500MB', '1GB', '100KB'
 * @returns {number} 字节数
 */
function parseSizeToBytes(sizeStr) {
  const units = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  const match = sizeStr
    .toUpperCase()
    .match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/);
  if (!match) return 500 * 1024 * 1024; // 默认500MB

  const value = parseFloat(match[1]);
  const unit = match[2] || 'MB';

  return value * (units[unit] || units['MB']);
}

/**
 * 获取日志目录
 * @returns {string} 日志目录路径
 */
function getLogDir() {
  return path.join(__dirname, '../../logs');
}

/**
 * 获取指定类型的日志文件列表
 * @param {string} logType - 日志类型
 * @returns {Promise<Array>} 日志文件列表（按时间倒序）
 */
async function getLogFilesByType(logType) {
  const logDir = getLogDir();
  const files = await fs.promises.readdir(logDir);

  // 筛选当前类型的日志文件（排除当前正在写入的文件）
  const logFiles = files.filter((file) => {
    const fileName = file.toLowerCase();
    // 匹配模式：{type}-YYYY-MM-DD.log 或 {type}-YYYY-MM-DD-NUMBER.log
    const pattern = new RegExp(
      `^${logType}(-\\d{4}-\\d{2}-\\d{2}(-\\d+)?)?\\.log$`,
      'i'
    );
    return pattern.test(fileName) && fileName !== `${logType}.log`;
  });

  // 获取文件信息并按修改时间倒序排序
  const fileInfoPromises = logFiles.map(async (file) => {
    const filePath = path.join(logDir, file);
    const stats = await fs.promises.stat(filePath);
    return {
      path: filePath,
      name: file,
      size: stats.size,
      mtime: stats.mtime,
      type: logType,
    };
  });

  const fileInfos = await Promise.all(fileInfoPromises);
  return fileInfos.sort((a, b) => b.mtime - a.mtime); // 最新的在前
}

/**
 * 计算指定类型日志的总大小
 * @param {string} logType - 日志类型
 * @returns {Promise<number>} 总大小（字节）
 */
async function calculateTotalSizeByType(logType) {
  const files = await getLogFilesByType(logType);
  return files.reduce((total, file) => total + file.size, 0);
}

// ==================== 清理逻辑 ====================

/**
 * 清理指定类型的日志文件
 * @param {string} logType - 日志类型
 * @param {Object} policy - 保留策略
 * @returns {Promise<Object>} 清理结果
 */
async function cleanupByType(logType, policy) {
  if (!policy.enabled) {
    return {
      type: logType,
      name: policy.name,
      skipped: true,
      reason: '未启用',
    };
  }

  const result = {
    type: logType,
    name: policy.name,
    deleted: [],
    kept: [],
    errors: [],
    freedSpace: 0,
  };

  try {
    const logFiles = await getLogFilesByType(logType);
    const now = new Date();
    const cutoffDate = new Date(
      now.getTime() - policy.days * 24 * 60 * 60 * 1000
    );
    const maxSizeBytes = parseSizeToBytes(policy.maxSize);

    let currentSize = 0;
    let fileCount = 0;

    // 按时间倒序处理（保留最新的）
    for (const file of logFiles) {
      fileCount++;

      // 检查1：是否超过保留天数
      const isExpired = file.mtime < cutoffDate;

      // 检查2：是否超过最大文件数
      const isOverFileLimit = fileCount > policy.maxFiles;

      // 检查3：是否超过最大总大小（预计算）
      const wouldOverSizeLimit = currentSize + file.size > maxSizeBytes;

      if (isExpired || isOverFileLimit || wouldOverSizeLimit) {
        // 需要删除
        try {
          await fs.promises.unlink(file.path);
          result.deleted.push({
            name: file.name,
            size: file.size,
            reason: isExpired
              ? '过期'
              : isOverFileLimit
                ? '超文件数'
                : '超大小',
          });
          result.freedSpace += file.size;
          logger.info(
            `[日志清理] 删除 ${policy.name}: ${file.name} (${Math.round(file.size / 1024)} KB)`,
            {
              logType,
              file: file.name,
              size: file.size,
              reason: isExpired
                ? 'expired'
                : isOverFileLimit
                  ? 'over_file_limit'
                  : 'over_size_limit',
            }
          );
        } catch (err) {
          result.errors.push({
            file: file.name,
            error: err.message,
          });
          logger.error(`[日志清理] 删除失败: ${file.name}`, {
            error: err.message,
            file: file.name,
          });
        }
      } else {
        // 保留
        result.kept.push(file.name);
        currentSize += file.size;
      }
    }
  } catch (err) {
    result.errors.push({
      error: err.message,
    });
    logger.error(`[日志清理] 处理 ${policy.name} 失败`, {
      error: err.message,
      logType,
    });
  }

  return result;
}

/**
 * 执行完整的日志清理
 * @returns {Promise<Object>} 总的清理结果
 */
async function cleanupAll() {
  const results = {};
  const totalResult = {
    startTime: new Date(),
    endTime: null,
    totalFreedSpace: 0,
    totalDeleted: 0,
    totalErrors: 0,
    details: results,
  };

  logger.info('[日志清理] 开始清理...', {
    timestamp: new Date().toISOString(),
  });

  try {
    // 并行处理所有日志类型
    const cleanupPromises = Object.entries(LogRetentionPolicies).map(
      ([logType, policy]) => cleanupByType(logType, policy)
    );

    const cleanupResults = await Promise.all(cleanupPromises);

    // 汇总结果
    for (const result of cleanupResults) {
      results[result.type] = result;
      totalResult.totalFreedSpace += result.freedSpace;
      totalResult.totalDeleted += result.deleted.length;
      totalResult.totalErrors += result.errors.length;
    }
  } catch (err) {
    logger.error('[日志清理] 整体清理失败', { error: err.message });
    throw err;
  }

  totalResult.endTime = new Date();
  totalResult.duration = totalResult.endTime - totalResult.startTime;

  logger.info('[日志清理] 清理完成', {
    duration: totalResult.duration,
    freedSpace: `${Math.round(totalResult.totalFreedSpace / (1024 * 1024))} MB`,
    deletedCount: totalResult.totalDeleted,
    errorCount: totalResult.totalErrors,
  });

  return totalResult;
}

/**
 * 获取磁盘使用情况
 * @returns {Promise<Object>} 磁盘使用情况
 */
async function getDiskUsage() {
  const logDir = getLogDir();
  const usage = {
    logDir,
    totalSize: 0,
    byType: {},
    byTypeCount: {},
  };

  for (const [logType, policy] of Object.entries(LogRetentionPolicies)) {
    try {
      const files = await getLogFilesByType(logType);
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);

      usage.byType[logType] = {
        name: policy.name,
        count: files.length,
        size: totalSize,
        sizeMB: Math.round(totalSize / (1024 * 1024)),
        policy: {
          days: policy.days,
          maxFiles: policy.maxFiles,
          maxSize: policy.maxSize,
        },
      };

      usage.byTypeCount[logType] = files.length;
      usage.totalSize += totalSize;
    } catch (err) {
      usage.byType[logType] = {
        name: policy.name,
        error: err.message,
      };
    }
  }

  usage.totalSizeMB = Math.round(usage.totalSize / (1024 * 1024));

  return usage;
}

/**
 * 获取保留策略配置
 * @returns {Object} 保留策略配置
 */
function getRetentionPolicies() {
  return { ...LogRetentionPolicies };
}

/**
 * 更新保留策略
 * @param {string} logType - 日志类型
 * @param {Object} newPolicy - 新策略配置
 * @returns {Object} 更新后的策略
 */
function updateRetentionPolicy(logType, newPolicy) {
  if (!LogRetentionPolicies[logType]) {
    throw new Error(`未知的日志类型: ${logType}`);
  }

  LogRetentionPolicies[logType] = {
    ...LogRetentionPolicies[logType],
    ...newPolicy,
  };

  logger.info(`[日志清理] 更新保留策略: ${logType}`, {
    newPolicy: LogRetentionPolicies[logType],
  });

  return LogRetentionPolicies[logType];
}

module.exports = {
  cleanupAll,
  cleanupByType,
  getDiskUsage,
  getRetentionPolicies,
  updateRetentionPolicy,
  LogRetentionPolicies,
  parseSizeToBytes,
};
