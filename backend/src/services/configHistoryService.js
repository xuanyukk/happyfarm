/**
 * 文件名: configHistoryService.js
 * 作者: Trae AI
 * 日期: 2026-05-26
 * 版本: v1.0.0
 * 功能描述: 配置变更历史与回滚服务层
 *   支持字段级diff、版本对比、回滚预览、变更统计、搜索过滤
 * 更新记录:
 *   2026-05-26 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

class ConfigHistoryService {
  /**
   * 记录配置变更
   * @param {string} key - 配置键
   * @param {string} changeType - 变更类型(CREATE/UPDATE/DELETE/RESTORE)
   * @param {object|null} oldValue - 变更前的值
   * @param {object|null} newValue - 变更后的值
   * @param {number} operatorId - 操作人ID
   * @param {string} operatorName - 操作人名称
   * @param {string} ipAddress - 操作IP
   * @param {string} reason - 变更原因
   * @returns {object} 创建的日志记录
   */
  async logChange(
    key,
    changeType,
    oldValue,
    newValue,
    operatorId,
    operatorName,
    ipAddress,
    reason
  ) {
    const client = await pool.connect();
    try {
      // 计算变更的字段列表
      const changedFields = this._computeChangedFields(oldValue, newValue);

      // 获取当前版本号
      const versionResult = await client.query(
        `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM config_change_log WHERE config_key = $1`,
        [key]
      );
      const version = versionResult.rows[0].next_version;

      // 获取操作人名称（如果未传入）
      let resolvedOperatorName = operatorName;
      if (!resolvedOperatorName && operatorId) {
        try {
          const userResult = await client.query(
            'SELECT username FROM sys_user WHERE id = $1',
            [operatorId]
          );
          if (userResult.rows.length > 0) {
            resolvedOperatorName = userResult.rows[0].username;
          }
        } catch (e) {
          // 忽略查询错误，使用默认值
        }
      }
      if (!resolvedOperatorName) {
        resolvedOperatorName = 'system';
      }

      const result = await client.query(
        `INSERT INTO config_change_log
         (config_key, change_type, old_value, new_value, changed_fields,
          operator_id, operator_name, ip_address, change_reason, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          key,
          changeType,
          oldValue ? JSON.stringify(oldValue) : null,
          newValue ? JSON.stringify(newValue) : null,
          changedFields,
          operatorId || null,
          resolvedOperatorName,
          ipAddress || null,
          reason || '',
          version,
        ]
      );

      logger.info(`配置变更日志已记录: ${key} v${version} [${changeType}]`);
      return result.rows[0];
    } catch (error) {
      logger.error(`记录配置变更日志失败: ${key}`, { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 计算两个值之间变更的字段列表
   * @param {object|null} oldValue - 旧值
   * @param {object|null} newValue - 新值
   * @returns {string[]} 变更字段列表
   */
  _computeChangedFields(oldValue, newValue) {
    const fields = new Set();

    if (!oldValue && !newValue) {
      return [];
    }

    if (!oldValue) {
      // CREATE: 所有字段都是新的
      if (typeof newValue === 'object' && newValue !== null) {
        Object.keys(newValue).forEach((k) => fields.add(k));
      } else {
        fields.add('value');
      }
      return Array.from(fields);
    }

    if (!newValue) {
      // DELETE: 所有旧字段都被删除
      if (typeof oldValue === 'object' && oldValue !== null) {
        Object.keys(oldValue).forEach((k) => fields.add(k));
      } else {
        fields.add('value');
      }
      return Array.from(fields);
    }

    // 处理对象比较
    const oldObj =
      typeof oldValue === 'object' ? oldValue : { value: oldValue };
    const newObj =
      typeof newValue === 'object' ? newValue : { value: newValue };

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    allKeys.forEach((k) => {
      const oldVal = JSON.stringify(oldObj[k]);
      const newVal = JSON.stringify(newObj[k]);
      if (oldVal !== newVal) {
        fields.add(k);
      }
    });

    return Array.from(fields);
  }

  /**
   * 获取配置变更历史
   * @param {string} key - 配置键
   * @param {object} options - { page, limit }
   * @returns {object} { records, total, page, limit, totalPages }
   */
  async getHistory(key, options = {}) {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM config_change_log
       WHERE config_key = $1`,
      [key]
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT id, config_key, change_type, old_value, new_value,
              changed_fields, operator_id, operator_name, ip_address,
              change_reason, version, created_at
       FROM config_change_log
       WHERE config_key = $1
       ORDER BY version DESC
       LIMIT $2 OFFSET $3`,
      [key, limit, offset]
    );

    return {
      records: result.rows,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * 获取单条变更详情
   * @param {number} changeId - 变更记录ID
   * @returns {object|null} 变更详情
   */
  async getChangeDetail(changeId) {
    const result = await pool.query(
      `SELECT id, config_key, change_type, old_value, new_value,
              changed_fields, operator_id, operator_name, ip_address,
              change_reason, version, created_at
       FROM config_change_log
       WHERE id = $1`,
      [changeId]
    );
    return result.rows[0] || null;
  }

  /**
   * 比较两个版本的差异，返回字段级diff
   * @param {string} key - 配置键
   * @param {number} version1 - 版本1
   * @param {number} version2 - 版本2
   * @returns {object} diff结果
   */
  async compareVersions(key, version1, version2) {
    const v1 = await pool.query(
      `SELECT * FROM config_change_log
       WHERE config_key = $1 AND version = $2`,
      [key, version1]
    );

    const v2 = await pool.query(
      `SELECT * FROM config_change_log
       WHERE config_key = $1 AND version = $2`,
      [key, version2]
    );

    if (v1.rows.length === 0) {
      throw new Error(`版本 ${version1} 不存在`);
    }
    if (v2.rows.length === 0) {
      throw new Error(`版本 ${version2} 不存在`);
    }

    const record1 = v1.rows[0];
    const record2 = v2.rows[0];

    // 获取两个版本的值
    // 版本1使用new_value（当时保存后的值）
    // 版本2使用new_value
    const val1 = record1.new_value || {};
    const val2 = record2.new_value || {};

    const changes = [];
    const allKeys = new Set([...Object.keys(val1), ...Object.keys(val2)]);

    allKeys.forEach((field) => {
      const fieldVal1 = val1[field];
      const fieldVal2 = val2[field];
      const str1 = JSON.stringify(fieldVal1);
      const str2 = JSON.stringify(fieldVal2);

      if (str1 !== str2) {
        changes.push({
          field,
          oldValue: fieldVal1,
          newValue: fieldVal2,
          changed: true,
        });
      } else {
        changes.push({
          field,
          value: fieldVal1,
          changed: false,
        });
      }
    });

    return {
      key,
      version1: {
        version: version1,
        createdAt: record1.created_at,
        operatorName: record1.operator_name,
        changeReason: record1.change_reason,
      },
      version2: {
        version: version2,
        createdAt: record2.created_at,
        operatorName: record2.operator_name,
        changeReason: record2.change_reason,
      },
      changes,
      summary: {
        totalFields: allKeys.size,
        changedFields: changes.filter((c) => c.changed).length,
        unchangedFields: changes.filter((c) => !c.changed).length,
      },
    };
  }

  /**
   * 回滚到指定版本
   * @param {string} key - 配置键
   * @param {number} targetVersion - 目标版本号
   * @param {number} operatorId - 操作人ID
   * @param {string} operatorName - 操作人名称
   * @param {string} ipAddress - 操作IP
   * @param {string} reason - 回滚原因
   * @returns {object} 回滚结果
   */
  async rollbackToVersion(
    key,
    targetVersion,
    operatorId,
    operatorName,
    ipAddress,
    reason
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取目标版本的数据
      const targetResult = await client.query(
        `SELECT * FROM config_change_log
         WHERE config_key = $1 AND version = $2`,
        [key, targetVersion]
      );

      if (targetResult.rows.length === 0) {
        throw new Error(`目标版本 ${targetVersion} 不存在`);
      }

      const targetRecord = targetResult.rows[0];
      const targetValue = targetRecord.new_value;

      // 获取当前配置
      const currentResult = await client.query(
        'SELECT * FROM game_config WHERE key = $1',
        [key]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('配置不存在');
      }
      const currentConfig = currentResult.rows[0];

      // 获取旧值用于日志
      const oldValue = {
        value: currentConfig.value,
        name: currentConfig.name,
        description: currentConfig.description,
      };

      // 构建更新数据
      let updateValue = currentConfig.value;
      if (targetValue) {
        if (
          typeof targetValue === 'object' &&
          targetValue.value !== undefined
        ) {
          updateValue = targetValue.value;
        } else if (typeof targetValue === 'string') {
          updateValue = targetValue;
        } else {
          updateValue = JSON.stringify(targetValue);
        }
      }

      // 更新配置
      await client.query(
        `UPDATE game_config
         SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
         WHERE key = $3`,
        [updateValue, operatorId, key]
      );

      // 记录RESTORE日志
      const changedFields = this._computeChangedFields(oldValue, targetValue);
      const nextVersionResult = await client.query(
        `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
         FROM config_change_log WHERE config_key = $1`,
        [key]
      );
      const newVersion = nextVersionResult.rows[0].next_version;

      let resolvedOperatorName = operatorName;
      if (!resolvedOperatorName && operatorId) {
        try {
          const userResult = await client.query(
            'SELECT username FROM sys_user WHERE id = $1',
            [operatorId]
          );
          if (userResult.rows.length > 0) {
            resolvedOperatorName = userResult.rows[0].username;
          }
        } catch (e) {
          // 忽略
        }
      }
      if (!resolvedOperatorName) {
        resolvedOperatorName = 'system';
      }

      await client.query(
        `INSERT INTO config_change_log
         (config_key, change_type, old_value, new_value, changed_fields,
          operator_id, operator_name, ip_address, change_reason, version)
         VALUES ($1, 'RESTORE', $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          key,
          JSON.stringify(oldValue),
          JSON.stringify(targetValue),
          changedFields,
          operatorId || null,
          resolvedOperatorName,
          ipAddress || null,
          reason || `回滚到版本 ${targetVersion}`,
          newVersion,
        ]
      );

      await client.query('COMMIT');

      logger.info(`配置回滚成功: ${key} -> v${targetVersion}`);
      return {
        key,
        fromVersion: currentConfig.version,
        toVersion: targetVersion,
        newLogVersion: newVersion,
        changedFields,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`回滚配置失败: ${key}`, { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取回滚预览信息
   * @param {string} key - 配置键
   * @param {number} targetVersion - 目标版本号
   * @returns {object} 预览信息
   */
  async getRollbackInfo(key, targetVersion) {
    // 获取目标版本的数据
    const targetResult = await pool.query(
      `SELECT * FROM config_change_log
       WHERE config_key = $1 AND version = $2`,
      [key, targetVersion]
    );

    if (targetResult.rows.length === 0) {
      throw new Error(`目标版本 ${targetVersion} 不存在`);
    }

    const targetRecord = targetResult.rows[0];

    // 获取当前配置状态
    const currentResult = await pool.query(
      'SELECT value, name, description FROM game_config WHERE key = $1',
      [key]
    );

    const currentValue =
      currentResult.rows.length > 0
        ? {
            value: currentResult.rows[0].value,
            name: currentResult.rows[0].name,
            description: currentResult.rows[0].description,
          }
        : null;

    // 获取最新版本号
    const latestVersionResult = await pool.query(
      `SELECT COALESCE(MAX(version), 0) AS max_version
       FROM config_change_log WHERE config_key = $1`,
      [key]
    );
    const currentVersion = latestVersionResult.rows[0].max_version;

    // 计算差异
    const targetValue = targetRecord.new_value || {};
    const oldValue = currentValue || {};
    const changes = [];

    const allKeys = new Set([
      ...Object.keys(oldValue),
      ...Object.keys(targetValue),
    ]);

    allKeys.forEach((field) => {
      const fieldOldVal = oldValue[field];
      const fieldNewVal = targetValue[field];
      const strOld = JSON.stringify(fieldOldVal);
      const strNew = JSON.stringify(fieldNewVal);

      if (strOld !== strNew) {
        changes.push({
          field,
          currentValue: fieldOldVal,
          rollbackValue: fieldNewVal,
          changed: true,
        });
      }
    });

    return {
      key,
      currentVersion,
      targetVersion,
      targetCreatedAt: targetRecord.created_at,
      targetOperatorName: targetRecord.operator_name,
      targetChangeReason: targetRecord.change_reason,
      changes,
      summary: {
        totalChangedFields: changes.length,
      },
    };
  }

  /**
   * 搜索变更历史
   * @param {object} filters - { key, operatorId, operatorName, changeType,
   *   startDate, endDate, page, limit }
   * @returns {object} 搜索结果
   */
  async searchHistory(filters = {}) {
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (filters.key) {
      whereConditions.push(`config_key ILIKE $${paramIndex++}`);
      params.push(`%${filters.key}%`);
    }

    if (filters.operatorId) {
      whereConditions.push(`operator_id = $${paramIndex++}`);
      params.push(filters.operatorId);
    }

    if (filters.operatorName) {
      whereConditions.push(`operator_name ILIKE $${paramIndex++}`);
      params.push(`%${filters.operatorName}%`);
    }

    if (filters.changeType) {
      whereConditions.push(`change_type = $${paramIndex++}`);
      params.push(filters.changeType);
    }

    if (filters.startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const whereClause =
      whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

    // 统计总数
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM config_change_log ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // 查询分页数据
    const result = await pool.query(
      `SELECT id, config_key, change_type, old_value, new_value,
              changed_fields, operator_id, operator_name, ip_address,
              change_reason, version, created_at
       FROM config_change_log
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      records: result.rows,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * 获取配置变更统计
   * @param {string} key - 配置键(可选，不传则返回全局统计)
   * @returns {object} 统计数据
   */
  async getChangeStats(key = null) {
    let params = [];
    let paramIndex = 1;
    let whereClause = '';

    if (key) {
      whereClause = `WHERE config_key = $${paramIndex++}`;
      params.push(key);
    }

    // 总变更次数
    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total FROM config_change_log ${whereClause}`,
      params
    );

    // 按变更类型分布
    const typeResult = await pool.query(
      `SELECT change_type, COUNT(*) AS count
       FROM config_change_log ${whereClause}
       GROUP BY change_type
       ORDER BY count DESC`,
      params
    );

    // 按操作人员统计（有额外条件时重新计算params）
    let statsParams = key ? [key] : [];
    let statsParamIndex = key ? 2 : 1;

    const operatorResult = await pool.query(
      `SELECT operator_id, operator_name, COUNT(*) AS count
       FROM config_change_log
       ${key ? 'WHERE config_key = $1' : ''}
       GROUP BY operator_id, operator_name
       ORDER BY count DESC
       LIMIT 20`,
      statsParams
    );

    // 最近变更时间
    let recentParams = key ? [key] : [];
    const recentResult = await pool.query(
      `SELECT config_key, change_type, operator_name, created_at, version
       FROM config_change_log
       ${key ? 'WHERE config_key = $1' : ''}
       ORDER BY created_at DESC
       LIMIT 10`,
      recentParams
    );

    return {
      totalChanges: parseInt(totalResult.rows[0].total),
      byType: typeResult.rows,
      byOperator: operatorResult.rows,
      recentChanges: recentResult.rows,
    };
  }
}

module.exports = new ConfigHistoryService();
