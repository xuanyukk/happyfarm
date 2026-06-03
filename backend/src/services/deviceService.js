// 文件名：deviceService.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：用户设备管理服务

const pool = require('../config/db');
const logger = require('../config/logger');
const crypto = require('crypto');

const deviceService = {
  generateDeviceId() {
    return crypto.randomUUID();
  },

  parseUserAgent(userAgent) {
    const result = {
      device_type: 'unknown',
      browser: 'unknown',
      os: 'unknown',
    };

    if (!userAgent) return result;

    if (/mobile/i.test(userAgent)) {
      result.device_type = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      result.device_type = 'tablet';
    } else {
      result.device_type = 'desktop';
    }

    if (/Chrome/i.test(userAgent)) {
      result.browser = 'Chrome';
    } else if (/Firefox/i.test(userAgent)) {
      result.browser = 'Firefox';
    } else if (/Safari/i.test(userAgent)) {
      result.browser = 'Safari';
    } else if (/Edge/i.test(userAgent)) {
      result.browser = 'Edge';
    }

    if (/Windows/i.test(userAgent)) {
      result.os = 'Windows';
    } else if (/Mac/i.test(userAgent)) {
      result.os = 'macOS';
    } else if (/Linux/i.test(userAgent)) {
      result.os = 'Linux';
    } else if (/Android/i.test(userAgent)) {
      result.os = 'Android';
    } else if (/iOS/i.test(userAgent) || /iPhone|iPad|iPod/i.test(userAgent)) {
      result.os = 'iOS';
    }

    return result;
  },

  async registerDevice({ userId, deviceId, deviceName, userAgent, ipAddress }) {
    const client = await pool.connect();
    try {
      const uaInfo = this.parseUserAgent(userAgent);

      const query = `
        INSERT INTO user_devices (
          user_id, device_id, device_name, device_type,
          browser, os, ip_address, last_active_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, device_id) DO UPDATE SET
          last_active_at = CURRENT_TIMESTAMP,
          ip_address = $7,
          is_revoked = FALSE,
          revoked_at = NULL
        RETURNING *
      `;

      const values = [
        userId,
        deviceId,
        deviceName || `${uaInfo.browser} on ${uaInfo.os}`,
        uaInfo.device_type,
        uaInfo.browser,
        uaInfo.os,
        ipAddress,
      ];

      const result = await client.query(query, values);

      logger.info('设备注册成功', {
        userId,
        deviceId,
        deviceType: uaInfo.device_type,
      });

      return result.rows[0];
    } catch (error) {
      logger.error('设备注册失败', {
        error: error.message,
        userId,
        deviceId,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  async getUserDevices(userId, includeRevoked = false) {
    try {
      let query = `
        SELECT * FROM user_devices
        WHERE user_id = $1
      `;
      const values = [userId];

      if (!includeRevoked) {
        query += ` AND is_revoked = FALSE`;
      }

      query += ` ORDER BY last_active_at DESC`;

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error('获取用户设备列表失败', {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  async getDevice(userId, deviceId) {
    try {
      const query = `
        SELECT * FROM user_devices
        WHERE user_id = $1 AND device_id = $2
      `;
      const result = await pool.query(query, [userId, deviceId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('获取设备信息失败', {
        error: error.message,
        userId,
        deviceId,
      });
      throw error;
    }
  },

  async updateDeviceActivity(userId, deviceId, ipAddress) {
    try {
      const query = `
        UPDATE user_devices
        SET last_active_at = CURRENT_TIMESTAMP,
            ip_address = $3
        WHERE user_id = $1 AND device_id = $2
        RETURNING *
      `;
      const result = await pool.query(query, [userId, deviceId, ipAddress]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('更新设备活跃时间失败', {
        error: error.message,
        userId,
        deviceId,
      });
      throw error;
    }
  },

  async revokeDevice(userId, deviceId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE user_devices
        SET is_revoked = TRUE,
            revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND device_id = $2
        RETURNING *
      `;
      const result = await client.query(query, [userId, deviceId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('COMMIT');

      logger.info('设备已撤销', {
        userId,
        deviceId,
      });

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('撤销设备失败', {
        error: error.message,
        userId,
        deviceId,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  async revokeAllOtherDevices(userId, excludeDeviceId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE user_devices
        SET is_revoked = TRUE,
            revoked_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND device_id != $2 AND is_revoked = FALSE
        RETURNING *
      `;
      const result = await client.query(query, [userId, excludeDeviceId]);

      await client.query('COMMIT');

      logger.info('已撤销其他所有设备', {
        userId,
        excludeDeviceId,
        revokedCount: result.rows.length,
      });

      return result.rows;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('撤销其他设备失败', {
        error: error.message,
        userId,
        excludeDeviceId,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  async isDeviceRevoked(userId, deviceId) {
    try {
      const query = `
        SELECT is_revoked FROM user_devices
        WHERE user_id = $1 AND device_id = $2
      `;
      const result = await pool.query(query, [userId, deviceId]);

      if (result.rows.length === 0) {
        return true;
      }

      return result.rows[0].is_revoked;
    } catch (error) {
      logger.error('检查设备状态失败', {
        error: error.message,
        userId,
        deviceId,
      });
      return true;
    }
  },
};

module.exports = deviceService;
