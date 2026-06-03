// 文件名：auditService.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：审计日志服务，记录用户关键操作

const pool = require('../config/db');
const logger = require('../config/logger');
const crypto = require('crypto');

const auditService = {
  generateRequestId() {
    return crypto.randomUUID();
  },

  async logAction({
    userId,
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
    requestId,
    status = 'success',
  }) {
    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id,
          old_values, new_values, ip_address, user_agent,
          request_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const values = [
        userId,
        action,
        resourceType,
        resourceId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent,
        requestId,
        status,
      ];

      const result = await pool.query(query, values);
      logger.info('审计日志记录成功', {
        auditLogId: result.rows[0].id,
        action,
        userId,
      });

      return result.rows[0].id;
    } catch (error) {
      logger.error('审计日志记录失败', {
        error: error.message,
        action,
        userId,
      });
      throw error;
    }
  },

  async getUserAuditLogs(userId, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM audit_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('获取用户审计日志失败', {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  async getAuditLogs(filters = {}, limit = 100, offset = 0) {
    try {
      let query = `SELECT * FROM audit_logs WHERE 1=1`;
      const values = [];
      let paramIndex = 1;

      if (filters.action) {
        query += ` AND action = $${paramIndex}`;
        values.push(filters.action);
        paramIndex++;
      }

      if (filters.userId) {
        query += ` AND user_id = $${paramIndex}`;
        values.push(filters.userId);
        paramIndex++;
      }

      if (filters.startDate) {
        query += ` AND created_at >= $${paramIndex}`;
        values.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        query += ` AND created_at <= $${paramIndex}`;
        values.push(filters.endDate);
        paramIndex++;
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('获取审计日志失败', {
        error: error.message,
        filters,
      });
      throw error;
    }
  },
};

module.exports = auditService;
