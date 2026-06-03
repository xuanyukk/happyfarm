// 文件名：twoFactorService.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：双因素认证服务

const pool = require('../config/db');
const logger = require('../config/logger');
const crypto = require('crypto');
const emailService = require('./emailService');

const twoFactorService = {
  generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
  },

  async sendVerificationCode(userId, email, type = 'email') {
    try {
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const query = `
        INSERT INTO two_factor_verification_codes (
          user_id, code, type, expires_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await pool.query(query, [userId, code, type, expiresAt]);

      if (type === 'email') {
        try {
          await emailService.sendEmail({
            to: email,
            subject: '您的验证码',
            text: `您的验证码是: ${code}，10分钟内有效。`,
          });
        } catch (emailError) {
          logger.warn('发送验证码邮件失败，使用日志记录', {
            userId,
            code,
            emailError: emailError.message,
          });
        }
      }

      logger.info('验证码已发送', { userId, type });
      return { success: true, codeId: result.rows[0].id };
    } catch (error) {
      logger.error('发送验证码失败', {
        error: error.message,
        userId,
        type,
      });
      throw error;
    }
  },

  async verifyCode(userId, code) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        SELECT * FROM two_factor_verification_codes
        WHERE user_id = $1 AND code = $2 AND is_used = FALSE
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await client.query(query, [userId, code]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: '验证码无效' };
      }

      const verificationCode = result.rows[0];

      if (new Date() > verificationCode.expires_at) {
        await client.query('ROLLBACK');
        return { success: false, message: '验证码已过期' };
      }

      await client.query(
        'UPDATE two_factor_verification_codes SET is_used = TRUE WHERE id = $1',
        [verificationCode.id]
      );

      await client.query('COMMIT');

      logger.info('验证码验证成功', { userId });
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('验证验证码失败', {
        error: error.message,
        userId,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  async enableTwoFactor(userId) {
    try {
      const query = `
        INSERT INTO two_factor_auth (user_id, is_enabled, updated_at)
        VALUES ($1, TRUE, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
          is_enabled = TRUE,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await pool.query(query, [userId]);
      logger.info('双因素认证已启用', { userId });
      return result.rows[0];
    } catch (error) {
      logger.error('启用双因素认证失败', {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  async disableTwoFactor(userId) {
    try {
      const query = `
        UPDATE two_factor_auth
        SET is_enabled = FALSE,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [userId]);
      logger.info('双因素认证已禁用', { userId });
      return result.rows[0];
    } catch (error) {
      logger.error('禁用双因素认证失败', {
        error: error.message,
        userId,
      });
      throw error;
    }
  },

  async isTwoFactorEnabled(userId) {
    try {
      const query = `
        SELECT is_enabled FROM two_factor_auth
        WHERE user_id = $1
      `;
      const result = await pool.query(query, [userId]);
      return result.rows.length > 0 && result.rows[0].is_enabled;
    } catch (error) {
      logger.error('检查双因素认证状态失败', {
        error: error.message,
        userId,
      });
      return false;
    }
  },
};

module.exports = twoFactorService;
