/**
 * 文件名: alertService.js
 * 作者: Trae AI
 * 日期: 2026-05-01
 * 版本: v1.0.0
 * 功能描述: 预警推送系统业务服务层
 * 更新记录:
 *   2026-05-01 - v1.0.0 - 初始版本创建
 */
const pool = require('../config/db');
const logger = require('../config/logger');

class AlertService {
  // ==================== 预警规则管理 ====================

  async getRuleList(filters = {}) {
    let query = `SELECT ar.*, au.username as created_by_name, au2.username as updated_by_name 
                     FROM alert_rule ar 
                     LEFT JOIN sys_user au ON ar.created_by = au.id 
                     LEFT JOIN sys_user au2 ON ar.updated_by = au2.id WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (filters.enabled !== undefined && filters.enabled !== '') {
      query += ` AND ar.enabled = $${paramIndex++}`;
      params.push(filters.enabled);
    }

    if (filters.level) {
      query += ` AND ar.level = $${paramIndex++}`;
      params.push(filters.level);
    }

    query += ` ORDER BY ar.created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async createRule(data, operatorId) {
    const result = await pool.query(
      `INSERT INTO alert_rule 
             (rule_name, metric, threshold, operator, duration, level, enabled, channels, recipients, cooldown, created_by, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
      [
        data.rule_name,
        data.metric,
        data.threshold,
        data.operator,
        data.duration || '1m',
        data.level || 'INFO',
        data.enabled !== false,
        data.channels ? JSON.stringify(data.channels) : null,
        data.recipients ? JSON.stringify(data.recipients) : null,
        data.cooldown || '1h',
        operatorId,
        operatorId,
      ]
    );
    return result.rows[0];
  }

  async updateRule(id, data, operatorId) {
    const result = await pool.query(
      `UPDATE alert_rule
             SET rule_name = COALESCE($1, rule_name),
                 metric = COALESCE($2, metric),
                 threshold = COALESCE($3, threshold),
                 operator = COALESCE($4, operator),
                 duration = COALESCE($5, duration),
                 level = COALESCE($6, level),
                 enabled = COALESCE($7, enabled),
                 channels = $8,
                 recipients = $9,
                 cooldown = COALESCE($10, cooldown),
                 updated_by = $11,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $12 RETURNING *`,
      [
        data.rule_name,
        data.metric,
        data.threshold,
        data.operator,
        data.duration,
        data.level,
        data.enabled !== undefined ? data.enabled : null,
        data.channels !== undefined
          ? data.channels
            ? JSON.stringify(data.channels)
            : null
          : null,
        data.recipients !== undefined
          ? data.recipients
            ? JSON.stringify(data.recipients)
            : null
          : null,
        data.cooldown,
        operatorId,
        id,
      ]
    );
    if (result.rows.length === 0) throw new Error('预警规则不存在');
    return result.rows[0];
  }

  async deleteRule(id) {
    await pool.query(`DELETE FROM alert_rule WHERE id = $1`, [id]);
  }

  // ==================== 预警记录管理 ====================

  async getRecordList(filters = {}, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    let query = `SELECT ar.*, au.username as resolved_by_name 
                     FROM alert_record ar 
                     LEFT JOIN sys_user au ON ar.resolved_by = au.id WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (filters.rule_id) {
      query += ` AND ar.rule_id = $${paramIndex++}`;
      params.push(filters.rule_id);
    }

    if (filters.level) {
      query += ` AND ar.level = $${paramIndex++}`;
      params.push(filters.level);
    }

    if (filters.status) {
      query += ` AND ar.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.start_date) {
      query += ` AND ar.triggered_at >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND ar.triggered_at <= $${paramIndex++}`;
      params.push(filters.end_date + ' 23:59:59');
    }

    query += ` ORDER BY ar.triggered_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);
    const countQuery = query
      .replace(/SELECT.*FROM/i, 'SELECT COUNT(*) FROM')
      .replace(/ORDER.*$/i, '');
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return { list: result.rows, total, page, pageSize };
  }

  async getRecordDetail(id) {
    const result = await pool.query(
      `SELECT ar.*, au.username as resolved_by_name 
             FROM alert_record ar 
             LEFT JOIN sys_user au ON ar.resolved_by = au.id WHERE ar.id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('预警记录不存在');
    return result.rows[0];
  }

  async createRecord(data, io) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO alert_record 
                 (rule_id, metric, value, threshold, level, title, content, data) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          data.rule_id,
          data.metric,
          data.value,
          data.threshold,
          data.level,
          data.title,
          data.content,
          data.data ? JSON.stringify(data.data) : null,
        ]
      );
      const record = result.rows[0];

      if (data.channels) {
        for (const channel of data.channels) {
          await client.query(
            `INSERT INTO alert_push_log (alert_id, channel, status) VALUES ($1, $2, 'PENDING')`,
            [record.id, channel]
          );
        }
      }

      await client.query('COMMIT');

      if (io) {
        io.emit('alert', {
          type: 'new',
          data: {
            id: record.id,
            title: record.title,
            content: record.content,
            level: record.level,
            triggered_at: record.triggered_at,
          },
        });
      }
      return record;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async markAsRead(id) {
    const result = await pool.query(
      `UPDATE alert_record SET status = 'READ', read_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('预警记录不存在');
    return result.rows[0];
  }

  async resolveRecord(id, operatorId, note) {
    const result = await pool.query(
      `UPDATE alert_record 
             SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, 
                 resolved_by = $1, resolved_note = $2 
             WHERE id = $3 RETURNING *`,
      [operatorId, note, id]
    );
    if (result.rows.length === 0) throw new Error('预警记录不存在');
    return result.rows[0];
  }

  async ignoreRecord(id) {
    const result = await pool.query(
      `UPDATE alert_record SET status = 'IGNORED' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) throw new Error('预警记录不存在');
    return result.rows[0];
  }

  async getOverviewStats() {
    const totalResult = await pool.query(`SELECT COUNT(*) FROM alert_record`);
    const unreadResult = await pool.query(
      `SELECT COUNT(*) FROM alert_record WHERE status = 'UNREAD'`
    );
    const levelResult = await pool.query(
      `SELECT level, COUNT(*) as count FROM alert_record GROUP BY level`
    );

    const levelStats = {};
    levelResult.rows.forEach((r) => (levelStats[r.level] = parseInt(r.count)));

    return {
      total: parseInt(totalResult.rows[0].count),
      unread: parseInt(unreadResult.rows[0].count),
      levels: levelStats,
    };
  }

  async triggerDemoAlert(io) {
    const levels = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const metrics = [
      'CPU_USAGE',
      'MEMORY_USAGE',
      'DISK_USAGE',
      'API_ERROR_RATE',
    ];
    const metric = metrics[Math.floor(Math.random() * metrics.length)];

    const data = {
      rule_id: Math.floor(Math.random() * 10) + 1,
      metric,
      value: Math.floor(Math.random() * 100),
      threshold: 80,
      level,
      title: `测试预警 - ${metric}`,
      content: `${metric} 当前值为 ${Math.floor(Math.random() * 100)}%，超过阈值 80%`,
      channels: ['WEB'],
    };

    return await this.createRecord(data, io);
  }
}

module.exports = new AlertService();
