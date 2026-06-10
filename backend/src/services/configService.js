/**
 * 文件名: configService.js
 * 作者: Trae AI
 * 日期: 2026-04-30
 * 版本: v1.1.0
 * 功能描述: 游戏参数配置管理业务服务层，包含热更新功能
 * 更新记录:
 *   2026-04-30 - v1.0.0 - 初始版本创建
 *   2026-05-06 - v1.1.0 - 添加配置热更新、缓存管理、实时通知功能
 */

const pool = require('../config/db');
const logger = require('../config/logger');

class ConfigService {
  /**
   * 获取配置分类列表
   */
  async getConfigCategories() {
    const result = await pool.query(
      'SELECT DISTINCT category FROM game_config WHERE is_active = true ORDER BY category'
    );
    return result.rows.map((row) => row.category);
  }

  /**
   * 获取配置列表
   */
  async getConfigList(filters = {}) {
    let query = `
      SELECT id, key, name, description, category, data_type, 
             value, default_value, is_readonly, is_required_approval, 
             sort_order, is_active, created_at, updated_at 
      FROM game_config WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.search) {
      query += ` AND (name ILIKE $${paramIndex++} OR key ILIKE $${paramIndex++})`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY sort_order, category, name';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 获取配置详情
   */
  async getConfigDetail(key) {
    const result = await pool.query(
      'SELECT * FROM game_config WHERE key = $1',
      [key]
    );
    return result.rows[0];
  }

  /**
   * 创建新配置
   */
  async createConfig(data, operatorId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 检查key是否已存在
      const checkResult = await client.query(
        'SELECT id FROM game_config WHERE key = $1',
        [data.key]
      );
      if (checkResult.rows.length > 0) {
        throw new Error('配置键已存在');
      }

      // 创建配置
      const result = await client.query(
        `INSERT INTO game_config 
         (key, name, description, category, data_type, value, default_value, 
          validation_rules, enum_options, is_readonly, is_required_approval, 
          sort_order, updated_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
         RETURNING *`,
        [
          data.key,
          data.name,
          data.description,
          data.category,
          data.data_type,
          data.value,
          data.default_value || data.value,
          data.validation_rules ? JSON.stringify(data.validation_rules) : null,
          data.enum_options ? JSON.stringify(data.enum_options) : null,
          data.is_readonly || false,
          data.is_required_approval || false,
          data.sort_order || 0,
          operatorId,
        ]
      );

      const config = result.rows[0];

      // 创建版本记录
      await client.query(
        `INSERT INTO config_version 
         (config_id, version, old_value, new_value, change_type, changed_by, change_reason)
         VALUES ($1, 1, NULL, $2, 'CREATE', $3, $4)`,
        [config.id, data.value, operatorId, data.reason || '创建新配置']
      );

      // 记录变更日志
      await client.query(
        `INSERT INTO config_change_log 
         (config_id, operator_id, action, old_value, new_value, reason, ip_address)
         VALUES ($1, $2, 'CREATE', NULL, $3, $4, $5)`,
        [
          config.id,
          operatorId,
          data.value,
          data.reason || '创建新配置',
          ipAddress,
        ]
      );

      await client.query('COMMIT');
      return config;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(key, data, operatorId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取当前配置
      const currentResult = await client.query(
        'SELECT * FROM game_config WHERE key = $1',
        [key]
      );
      if (currentResult.rows.length === 0) {
        throw new Error('配置不存在');
      }
      const currentConfig = currentResult.rows[0];

      // 检查是否只读
      if (currentConfig.is_readonly) {
        throw new Error('该配置为只读，无法修改');
      }

      // 获取最新版本号
      const versionResult = await client.query(
        'SELECT MAX(version) as max_version FROM config_version WHERE config_id = $1',
        [currentConfig.id]
      );
      const newVersion = (versionResult.rows[0].max_version || 0) + 1;

      // 更新配置
      const result = await client.query(
        `UPDATE game_config 
         SET name = COALESCE($1, name), 
             description = COALESCE($2, description), 
             value = $3, 
             validation_rules = COALESCE($4, validation_rules), 
             enum_options = COALESCE($5, enum_options), 
             is_readonly = COALESCE($6, is_readonly), 
             is_required_approval = COALESCE($7, is_required_approval), 
             sort_order = COALESCE($8, sort_order), 
             updated_by = $9, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE key = $10 
         RETURNING *`,
        [
          data.name,
          data.description,
          data.value,
          data.validation_rules ? JSON.stringify(data.validation_rules) : null,
          data.enum_options ? JSON.stringify(data.enum_options) : null,
          data.is_readonly,
          data.is_required_approval,
          data.sort_order,
          operatorId,
          key,
        ]
      );

      const config = result.rows[0];

      // 创建版本记录
      await client.query(
        `INSERT INTO config_version 
         (config_id, version, old_value, new_value, change_type, changed_by, change_reason)
         VALUES ($1, $2, $3, $4, 'UPDATE', $5, $6)`,
        [
          config.id,
          newVersion,
          currentConfig.value,
          data.value,
          operatorId,
          data.reason || '更新配置',
        ]
      );

      // 记录变更日志
      await client.query(
        `INSERT INTO config_change_log 
         (config_id, operator_id, action, old_value, new_value, reason, ip_address)
         VALUES ($1, $2, 'UPDATE', $3, $4, $5, $6)`,
        [
          config.id,
          operatorId,
          currentConfig.value,
          data.value,
          data.reason || '更新配置',
          ipAddress,
        ]
      );

      await client.query('COMMIT');
      return config;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除配置
   */
  async deleteConfig(key, operatorId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取当前配置
      const currentResult = await client.query(
        'SELECT * FROM game_config WHERE key = $1',
        [key]
      );
      if (currentResult.rows.length === 0) {
        throw new Error('配置不存在');
      }
      const currentConfig = currentResult.rows[0];

      // 记录变更日志
      await client.query(
        `INSERT INTO config_change_log 
         (config_id, operator_id, action, old_value, new_value, reason, ip_address)
         VALUES ($1, $2, 'DELETE', $3, NULL, $4, $5)`,
        [
          currentConfig.id,
          operatorId,
          currentConfig.value,
          '删除配置',
          ipAddress,
        ]
      );

      // 删除配置
      await client.query('DELETE FROM game_config WHERE key = $1', [key]);

      await client.query('COMMIT');
      return { success: true, message: '配置已删除' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取配置历史版本
   */
  async getConfigHistory(key) {
    const configResult = await pool.query(
      'SELECT id FROM game_config WHERE key = $1',
      [key]
    );
    if (configResult.rows.length === 0) {
      throw new Error('配置不存在');
    }
    const configId = configResult.rows[0].id;

    const result = await pool.query(
      `SELECT cv.*, a.username as changed_by_name 
       FROM config_version cv 
       LEFT JOIN sys_user a ON cv.changed_by = a.id 
       WHERE cv.config_id = $1 
       ORDER BY cv.version DESC`,
      [configId]
    );
    return result.rows;
  }

  /**
   * 恢复配置到历史版本
   */
  async restoreConfigVersion(key, version, operatorId, ipAddress) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取当前配置
      const configResult = await client.query(
        'SELECT * FROM game_config WHERE key = $1',
        [key]
      );
      if (configResult.rows.length === 0) {
        throw new Error('配置不存在');
      }
      const currentConfig = configResult.rows[0];

      // 获取历史版本
      const versionResult = await client.query(
        'SELECT * FROM config_version WHERE config_id = $1 AND version = $2',
        [currentConfig.id, version]
      );
      if (versionResult.rows.length === 0) {
        throw new Error('版本不存在');
      }
      const historyVersion = versionResult.rows[0];

      // 获取最新版本号
      const latestVersionResult = await client.query(
        'SELECT MAX(version) as max_version FROM config_version WHERE config_id = $1',
        [currentConfig.id]
      );
      const newVersion = latestVersionResult.rows[0].max_version + 1;

      // 更新配置
      const updateResult = await client.query(
        `UPDATE game_config 
         SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE key = $3 
         RETURNING *`,
        [historyVersion.old_value, operatorId, key]
      );

      const config = updateResult.rows[0];

      // 创建回滚版本记录
      await client.query(
        `INSERT INTO config_version 
         (config_id, version, old_value, new_value, change_type, changed_by, change_reason)
         VALUES ($1, $2, $3, $4, 'UPDATE', $5, $6)`,
        [
          config.id,
          newVersion,
          currentConfig.value,
          historyVersion.old_value,
          operatorId,
          `回滚到版本 ${version}`,
        ]
      );

      // 记录变更日志
      await client.query(
        `INSERT INTO config_change_log 
         (config_id, operator_id, action, old_value, new_value, reason, ip_address)
         VALUES ($1, $2, 'ROLLBACK', $3, $4, $5, $6)`,
        [
          config.id,
          operatorId,
          currentConfig.value,
          historyVersion.old_value,
          `回滚到版本 ${version}`,
          ipAddress,
        ]
      );

      await client.query('COMMIT');
      return config;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 导出配置
   */
  async exportConfigs(category = null) {
    let query = `
      SELECT key, name, description, category, data_type, value, 
             default_value, validation_rules, enum_options, sort_order 
      FROM game_config WHERE is_active = true
    `;
    const params = [];

    if (category) {
      query += ' AND category = $1';
      params.push(category);
    }

    query += ' ORDER BY sort_order, category, key';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * 创建审批请求
   */
  async createApprovalRequest(key, requestData, operatorId, reason) {
    const configResult = await pool.query(
      'SELECT id FROM game_config WHERE key = $1',
      [key]
    );
    if (configResult.rows.length === 0) {
      throw new Error('配置不存在');
    }
    const configId = configResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO config_approval 
       (config_id, requestor_id, request_data, reason, status) 
       VALUES ($1, $2, $3, $4, 'PENDING') 
       RETURNING *`,
      [configId, operatorId, JSON.stringify(requestData), reason]
    );
    return result.rows[0];
  }

  /**
   * 审批配置变更
   */
  async approveConfigChange(approvalId, status, approverId, comment) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 获取审批请求
      const approvalResult = await client.query(
        'SELECT * FROM config_approval WHERE id = $1',
        [approvalId]
      );
      if (approvalResult.rows.length === 0) {
        throw new Error('审批请求不存在');
      }
      const approval = approvalResult.rows[0];

      // 更新审批状态
      const result = await client.query(
        `UPDATE config_approval 
         SET status = $1, approver_id = $2, approval_comment = $3, approved_at = CURRENT_TIMESTAMP 
         WHERE id = $4 
         RETURNING *`,
        [status, approverId, comment, approvalId]
      );

      // 如果审批通过，应用配置变更
      if (status === 'APPROVED') {
        const configResult = await client.query(
          'SELECT * FROM game_config WHERE id = $1',
          [approval.config_id]
        );
        const config = configResult.rows[0];
        const requestData = approval.request_data;

        await client.query(
          `UPDATE game_config 
           SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [requestData.value, approverId, approval.config_id]
        );

        // 记录变更日志
        await client.query(
          `INSERT INTO config_change_log 
           (config_id, operator_id, action, old_value, new_value, reason, ip_address)
           VALUES ($1, $2, 'UPDATE', $3, $4, $5, NULL)`,
          [
            approval.config_id,
            approverId,
            config.value,
            requestData.value,
            '审批通过应用变更',
          ]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 获取审批请求列表
   */
  async getApprovalRequests(status = null) {
    let query = `
      SELECT ca.*, gc.key, gc.name as config_name, a.username as requestor_name 
      FROM config_approval ca 
      JOIN game_config gc ON ca.config_id = gc.id 
      LEFT JOIN sys_user a ON ca.requestor_id = a.id 
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND ca.status = $1';
      params.push(status);
    }

    query += ' ORDER BY ca.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // ==================== 配置热更新功能 ====================

  // 配置缓存
  configCache = new Map();
  cacheLastUpdated = new Map();
  cacheVersion = 0;

  /**
   * 初始化配置缓存（启动时调用）
   */
  async initializeConfigCache() {
    logger.info('开始初始化配置缓存...');
    const configs = await this.getConfigList();
    configs.forEach((config) => {
      this.configCache.set(config.key, config);
      this.cacheLastUpdated.set(config.key, new Date());
    });
    this.cacheVersion++;
    logger.info(`配置缓存初始化完成，共缓存 ${configs.length} 条配置`);
  }

  /**
   * 获取单个配置（从缓存）
   */
  getCachedConfig(key) {
    return this.configCache.get(key);
  }

  /**
   * 获取配置值（简单方法，自动类型转换）
   * @param {string} key - 配置键
   * @param {*} defaultValue - 默认值
   * @param {function} validator - 可选的验证函数
   * @returns {*} 配置值
   */
  getConfig(key, defaultValue = null, validator = null) {
    const config = this.getCachedConfig(key);
    if (!config) {
      logger.debug(`配置未找到，使用默认值: ${key} = ${defaultValue}`);
      return defaultValue;
    }

    // 根据 data_type 转换值类型
    let value;
    try {
      switch (config.data_type) {
        case 'number':
        case 'integer':
          value = Number(config.value);
          if (isNaN(value)) {
            logger.warn(`配置值不是有效数字: ${key} = ${config.value}`);
            value = defaultValue;
          }
          break;
        case 'boolean': {
          const boolStr = String(config.value).toLowerCase().trim();
          value = boolStr === 'true' || boolStr === '1' || boolStr === 'yes';
          break;
        }
        case 'json':
        case 'object':
          try {
            value = JSON.parse(config.value);
          } catch (e) {
            logger.warn(`配置JSON解析失败: ${key} = ${config.value}`, {
              error: e.message,
            });
            value = defaultValue;
          }
          break;
        case 'array':
          value = String(config.value)
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          break;
        case 'date':
          value = new Date(config.value);
          if (isNaN(value.getTime())) {
            logger.warn(`配置日期无效: ${key} = ${config.value}`);
            value = defaultValue;
          }
          break;
        default: // string
          value = config.value;
      }
    } catch (error) {
      logger.error(`解析配置值失败: ${key}`, {
        error: error.message,
        configValue: config.value,
      });
      value = defaultValue;
    }

    // 如果有验证函数，进行验证
    if (validator && value !== defaultValue) {
      try {
        const isValid = validator(value);
        if (!isValid) {
          logger.warn(`配置值验证失败: ${key} = ${value}`, { key, value });
          return defaultValue;
        }
      } catch (error) {
        logger.error(`配置验证函数执行失败: ${key}`, { error: error.message });
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * 获取所有配置（从缓存）
   */
  getAllCachedConfigs() {
    return Array.from(this.configCache.values());
  }

  /**
   * 获取缓存版本号
   */
  getCacheVersion() {
    return this.cacheVersion;
  }

  /**
   * 刷新单个配置的缓存
   */
  async refreshConfigCache(key) {
    try {
      const config = await this.getConfigDetail(key);
      if (config) {
        this.configCache.set(key, config);
        this.cacheLastUpdated.set(key, new Date());
        this.cacheVersion++;
        logger.info(`配置缓存已刷新: ${key}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`刷新配置缓存失败: ${key}`, { error });
      return false;
    }
  }

  /**
   * 刷新所有配置缓存
   */
  async refreshAllConfigCache() {
    try {
      const configs = await this.getConfigList();
      this.configCache.clear();
      this.cacheLastUpdated.clear();
      configs.forEach((config) => {
        this.configCache.set(config.key, config);
        this.cacheLastUpdated.set(config.key, new Date());
      });
      this.cacheVersion++;
      logger.info(`配置缓存全部刷新完成，共缓存 ${configs.length} 条配置`);
      return true;
    } catch (error) {
      logger.error('刷新所有配置缓存失败', { error });
      return false;
    }
  }

  /**
   * 清除单个配置的缓存
   */
  clearConfigCache(key) {
    this.configCache.delete(key);
    this.cacheLastUpdated.delete(key);
    this.cacheVersion++;
    logger.info(`配置缓存已清除: ${key}`);
  }

  /**
   * 获取配置缓存状态
   */
  getCacheStatus() {
    return {
      total: this.configCache.size,
      version: this.cacheVersion,
      lastUpdated: Array.from(this.cacheLastUpdated.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, time]) => ({ key, time })),
    };
  }

  /**
   * 批量更新配置并热加载
   */
  async batchUpdateConfigs(updates, operatorId, ipAddress) {
    const client = await pool.connect();
    const results = [];

    try {
      await client.query('BEGIN');

      for (const update of updates) {
        try {
          // 获取当前配置
          const currentResult = await client.query(
            'SELECT * FROM game_config WHERE key = $1',
            [update.key]
          );

          if (currentResult.rows.length === 0) {
            results.push({
              key: update.key,
              success: false,
              error: '配置不存在',
            });
            continue;
          }

          const currentConfig = currentResult.rows[0];

          if (currentConfig.is_readonly) {
            results.push({
              key: update.key,
              success: false,
              error: '配置为只读，无法修改',
            });
            continue;
          }

          // 更新配置
          const updateResult = await client.query(
            `UPDATE game_config 
             SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP 
             WHERE key = $3 
             RETURNING *`,
            [update.value, operatorId, update.key]
          );

          const updatedConfig = updateResult.rows[0];

          // 创建版本记录
          const versionResult = await client.query(
            'SELECT MAX(version) as max_version FROM config_version WHERE config_id = $1',
            [updatedConfig.id]
          );
          const newVersion = (versionResult.rows[0].max_version || 0) + 1;

          await client.query(
            `INSERT INTO config_version 
             (config_id, version, old_value, new_value, change_type, changed_by, change_reason)
             VALUES ($1, $2, $3, $4, 'UPDATE', $5, $6)`,
            [
              updatedConfig.id,
              newVersion,
              currentConfig.value,
              update.value,
              operatorId,
              update.reason || '批量更新',
            ]
          );

          // 记录变更日志
          await client.query(
            `INSERT INTO config_change_log 
             (config_id, operator_id, action, old_value, new_value, reason, ip_address)
             VALUES ($1, $2, 'UPDATE', $3, $4, $5, $6)`,
            [
              updatedConfig.id,
              operatorId,
              currentConfig.value,
              update.value,
              update.reason || '批量更新',
              ipAddress,
            ]
          );

          // 更新缓存
          this.configCache.set(update.key, updatedConfig);
          this.cacheLastUpdated.set(update.key, new Date());

          results.push({
            key: update.key,
            success: true,
            config: updatedConfig,
          });
        } catch (error) {
          results.push({
            key: update.key,
            success: false,
            error: error.message,
          });
        }
      }

      this.cacheVersion++;
      await client.query('COMMIT');
      logger.info('批量配置更新完成', { results });

      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 导入配置
   */
  async importConfigs(importData, operatorId, ipAddress, override = false) {
    const client = await pool.connect();
    const results = [];

    try {
      await client.query('BEGIN');

      for (const configData of importData) {
        try {
          // 检查配置是否已存在
          const checkResult = await client.query(
            'SELECT * FROM game_config WHERE key = $1',
            [configData.key]
          );

          if (checkResult.rows.length > 0) {
            if (override) {
              // 覆盖更新
              const currentConfig = checkResult.rows[0];

              const updateResult = await client.query(
                `UPDATE game_config 
                 SET name = COALESCE($1, name),
                     description = COALESCE($2, description),
                     category = COALESCE($3, category),
                     data_type = COALESCE($4, data_type),
                     value = $5,
                     default_value = COALESCE($6, default_value),
                     validation_rules = COALESCE($7, validation_rules),
                     enum_options = COALESCE($8, enum_options),
                     sort_order = COALESCE($9, sort_order),
                     updated_by = $10,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE key = $11
                 RETURNING *`,
                [
                  configData.name,
                  configData.description,
                  configData.category,
                  configData.data_type,
                  configData.value,
                  configData.default_value,
                  configData.validation_rules
                    ? JSON.stringify(configData.validation_rules)
                    : null,
                  configData.enum_options
                    ? JSON.stringify(configData.enum_options)
                    : null,
                  configData.sort_order,
                  operatorId,
                  configData.key,
                ]
              );

              results.push({
                key: configData.key,
                action: 'updated',
                success: true,
              });
            } else {
              results.push({
                key: configData.key,
                action: 'skipped',
                success: true,
                message: '配置已存在，跳过',
              });
            }
          } else {
            // 新建配置
            await client.query(
              `INSERT INTO game_config 
               (key, name, description, category, data_type, value, default_value,
                validation_rules, enum_options, is_readonly, is_required_approval,
                sort_order, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
              [
                configData.key,
                configData.name,
                configData.description || '',
                configData.category || 'other',
                configData.data_type || 'string',
                configData.value,
                configData.default_value || configData.value,
                configData.validation_rules
                  ? JSON.stringify(configData.validation_rules)
                  : null,
                configData.enum_options
                  ? JSON.stringify(configData.enum_options)
                  : null,
                configData.is_readonly || false,
                configData.is_required_approval || false,
                configData.sort_order || 0,
                operatorId,
              ]
            );

            results.push({
              key: configData.key,
              action: 'created',
              success: true,
            });
          }
        } catch (error) {
          results.push({
            key: configData.key,
            action: 'error',
            success: false,
            error: error.message,
          });
        }
      }

      // 刷新缓存
      await this.refreshAllConfigCache();
      await client.query('COMMIT');

      logger.info('配置导入完成', { results });
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

const configService = new ConfigService();

// 导出时初始化缓存（如果还没有初始化）
const initialize = async () => {
  try {
    await configService.initializeConfigCache();
  } catch (error) {
    logger.error('初始化配置缓存失败', { error });
  }
};

// 启动时初始化（需要显式调用 autoInit()）

module.exports = configService;
