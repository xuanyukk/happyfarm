/**
 * 文件名：docsAuthController.js
 * 作者：Trae AI
 * 日期：2026-06-05
 * 版本：v1.0.0
 * 功能描述：文档系统认证控制器，验证用户token并返回文档访问角色
 * 更新记录：
 *   2026-06-05 - v1.0.0 - 初始版本，提供文档系统角色验证接口
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const logger = require('../config/logger');
require('dotenv').config();

/**
 * 验证文档系统访问权限
 * 功能：接收JWT token，验证有效性，返回用户的文档访问角色
 * @param {Object} req - 请求对象，body.token 为JWT令牌
 * @param {Object} res - 响应对象
 * @returns {Object} { valid, role, username, message }
 */
exports.verifyDocsAccess = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        valid: false,
        role: 'guest',
        message: '缺少认证令牌',
      });
    }

    // 验证JWT令牌
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        valid: false,
        role: 'guest',
        message: '令牌无效或已过期',
      });
    }

    // 查询用户信息
    const query = `
      SELECT id, username, email, is_active, is_admin
      FROM sys_user
      WHERE id = $1
    `;
    const result = await pool.query(query, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        role: 'guest',
        message: '用户不存在',
      });
    }

    const user = result.rows[0];

    // 检查用户是否被禁用
    if (!user.is_active) {
      return res.status(403).json({
        valid: false,
        role: 'guest',
        message: '账号已被禁用',
      });
    }

    // 确定文档访问角色
    const docsRole = user.is_admin ? 'dev' : 'player';

    logger.info('文档系统访问验证成功', {
      userId: user.id,
      username: user.username,
      role: docsRole,
    });

    return res.status(200).json({
      valid: true,
      role: docsRole,
      username: user.username,
      message: '验证成功',
    });
  } catch (err) {
    logger.error('文档系统访问验证失败', {
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      valid: false,
      role: 'guest',
      message: '服务器错误',
    });
  }
};
