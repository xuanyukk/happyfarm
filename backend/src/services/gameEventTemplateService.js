
/**
 * 文件名: gameEventTemplateService.js
 * 作者: Trae AI
 * 日期: 2026-05-22
 * 版本: v1.0.0
 * 功能描述: 游戏活动模板服务
 */

const db = require('../config/db');
const logger = require('../config/logger');
const gameEventService = require('./gameEventService');

class GameEventTemplateService {
  /**
   * 获取所有活动模板
   */
  async getAllTemplates(includeInactive = false) {
    let query = 'SELECT * FROM game_event_templates';
    const params = [];
    
    if (!includeInactive) {
      query += ' WHERE is_active = TRUE';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * 根据ID获取模板
   */
  async getTemplateById(templateId) {
    const result = await db.query(
      'SELECT * FROM game_event_templates WHERE id = $1',
      [templateId]
    );
    return result.rows[0] || null;
  }

  /**
   * 获取模板的变量定义
   */
  async getTemplateVariables(templateId) {
    const result = await db.query(
      'SELECT * FROM game_event_template_variables WHERE template_id = $1 ORDER BY id',
      [templateId]
    );
    return result.rows;
  }

  /**
   * 获取模板的版本历史
   */
  async getTemplateVersions(templateId) {
    const result = await db.query(
      'SELECT * FROM game_event_template_versions WHERE template_id = $1 ORDER BY version DESC',
      [templateId]
    );
    return result.rows;
  }

  /**
   * 创建活动模板
   */
  async createTemplate(templateData, userId) {
    const {
      template_name,
      template_type,
      description,
      template_config,
      variables = []
    } = templateData;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 创建模板
      const templateResult = await client.query(
        `INSERT INTO game_event_templates 
         (template_name, template_type, description, template_config, created_by, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [template_name, template_type, description, template_config, userId]
      );
      
      const template = templateResult.rows[0];

      // 创建初始版本
      await client.query(
        `INSERT INTO game_event_template_versions 
         (template_id, version, template_config, change_log, created_by)
         VALUES ($1, 1, $2, '初始版本', $3)`,
        [template.id, template_config, userId]
      );

      // 创建模板变量
      for (const variable of variables) {
        await client.query(
          `INSERT INTO game_event_template_variables 
           (template_id, variable_name, variable_type, default_value, is_required, description, options)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            template.id,
            variable.variable_name,
            variable.variable_type,
            variable.default_value || null,
            variable.is_required !== false,
            variable.description || null,
            variable.options || null
          ]
        );
      }

      await client.query('COMMIT');
      logger.info('创建活动模板成功', { templateId: template.id });
      return template;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('创建活动模板失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新活动模板
   */
  async updateTemplate(templateId, templateData, userId) {
    const {
      template_name,
      template_type,
      description,
      template_config,
      change_log,
      variables = []
    } = templateData;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 获取当前模板的版本号
      const currentResult = await client.query(
        'SELECT version FROM game_event_templates WHERE id = $1',
        [templateId]
      );
      
      if (currentResult.rows.length === 0) {
        throw new Error('模板不存在');
      }
      
      const currentVersion = currentResult.rows[0].version;
      const newVersion = currentVersion + 1;

      // 保存当前版本到历史
      const oldTemplateResult = await client.query(
        'SELECT template_config FROM game_event_templates WHERE id = $1',
        [templateId]
      );
      
      await client.query(
        `INSERT INTO game_event_template_versions 
         (template_id, version, template_config, change_log, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [templateId, currentVersion, oldTemplateResult.rows[0].template_config, change_log || '更新模板', userId]
      );

      // 更新模板
      const updateResult = await client.query(
        `UPDATE game_event_templates 
         SET template_name = $1, template_type = $2, description = $3, 
             template_config = $4, version = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 RETURNING *`,
        [template_name, template_type, description, template_config, newVersion, templateId]
      );

      // 更新变量 - 先删除后重建
      await client.query('DELETE FROM game_event_template_variables WHERE template_id = $1', [templateId]);
      
      for (const variable of variables) {
        await client.query(
          `INSERT INTO game_event_template_variables 
           (template_id, variable_name, variable_type, default_value, is_required, description, options)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            templateId,
            variable.variable_name,
            variable.variable_type,
            variable.default_value || null,
            variable.is_required !== false,
            variable.description || null,
            variable.options || null
          ]
        );
      }

      await client.query('COMMIT');
      logger.info('更新活动模板成功', { templateId });
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('更新活动模板失败', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 验证模板变量
   */
  async validateVariables(template, variables) {
    const templateVariables = await this.getTemplateVariables(template.id);
    
    for (const templateVar of templateVariables) {
      if (templateVar.is_required && variables[templateVar.variable_name] === undefined) {
        throw new Error(`变量 ${templateVar.variable_name} 是必填项`);
      }

      // 验证变量类型
      const value = variables[templateVar.variable_name];
      if (value !== undefined) {
        switch (templateVar.variable_type) {
          case 'number':
            if (isNaN(Number(value))) {
              throw new Error(`变量 ${templateVar.variable_name} 必须是数字`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              throw new Error(`变量 ${templateVar.variable_name} 必须是有效的日期`);
            }
            break;
        }
      }
    }

    return true;
  }

  /**
   * 渲染模板 - 变量替换
   */
  renderTemplate(template, variables) {
    let config = JSON.parse(JSON.stringify(template.template_config));
    
    config = this.replaceVariables(config, variables);
    config = this.processDateExpressions(config, variables);
    
    return config;
  }

  /**
   * 替换变量
   */
  replaceVariables(obj, variables) {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] !== undefined ? variables[varName] : match;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = this.replaceVariables(obj[key], variables);
      }
    }
    return obj;
  }

  /**
   * 处理日期表达式
   */
  processDateExpressions(obj, variables) {
    if (typeof obj === 'string') {
      // 支持 {{date:+7d}} 这样的表达式
      const dateMatch = obj.match(/\{\{date:([+-]?\d+)([dMmy])\}\}/);
      if (dateMatch) {
        const amount = parseInt(dateMatch[1]);
        const unit = dateMatch[2];
        const now = new Date();
        
        switch (unit) {
          case 'd':
            now.setDate(now.getDate() + amount);
            break;
          case 'M':
            now.setMonth(now.getMonth() + amount);
            break;
          case 'y':
            now.setFullYear(now.getFullYear() + amount);
            break;
        }
        
        return now.toISOString().split('T')[0];
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = this.processDateExpressions(obj[key], variables);
      }
    }
    return obj;
  }

  /**
   * 从模板创建活动
   */
  async createEventFromTemplate(templateId, templateVariables, userId) {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('模板不存在');
    }

    // 验证变量
    await this.validateVariables(template, templateVariables);

    // 渲染模板
    const renderedConfig = this.renderTemplate(template, templateVariables);

    // 创建活动
    const eventData = {
      event_name: renderedConfig.event_name || template.template_name,
      event_description: renderedConfig.event_description || template.description || '',
      start_time: renderedConfig.start_time,
      end_time: renderedConfig.end_time,
      event_config: renderedConfig,
      template_id: templateId
    };

    const event = await gameEventService.createEvent(eventData, userId);
    logger.info('从模板创建活动成功', { templateId, eventId: event.id });
    
    return event;
  }

  /**
   * 删除/停用模板
   */
  async deactivateTemplate(templateId) {
    const result = await db.query(
      'UPDATE game_event_templates SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [templateId]
    );
    logger.info('停用活动模板成功', { templateId });
    return result.rows[0];
  }

  /**
   * 对比模板版本
   */
  async compareVersions(templateId, version1, version2) {
    const result = await db.query(
      `SELECT v1.template_config as config1, v2.template_config as config2
       FROM game_event_template_versions v1, game_event_template_versions v2
       WHERE v1.template_id = $1 AND v2.template_id = $1
       AND v1.version = $2 AND v2.version = $3`,
      [templateId, version1, version2]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      config1: result.rows[0].config1,
      config2: result.rows[0].config2,
      differences: this.findDifferences(result.rows[0].config1, result.rows[0].config2)
    };
  }

  /**
   * 查找配置差异
   */
  findDifferences(obj1, obj2, path = '') {
    const differences = [];
    
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj1)) {
        differences.push({ path: currentPath, type: 'added', value: obj2[key] });
      } else if (!(key in obj2)) {
        differences.push({ path: currentPath, type: 'removed', value: obj1[key] });
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null && typeof obj2[key] === 'object' && obj2[key] !== null) {
        differences.push(...this.findDifferences(obj1[key], obj2[key], currentPath));
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences.push({ 
          path: currentPath, 
          type: 'modified', 
          oldValue: obj1[key], 
          newValue: obj2[key] 
        });
      }
    }
    
    return differences;
  }
}

module.exports = new GameEventTemplateService();

