/**
 * 文件名：authController.js
 * 作者：开发者
 * 日期：2026-03-18
 * 版本：v1.2.2
 * 功能描述：认证控制器，处理用户注册、登录、JWT刷新、密码重置等功能
 * 更新记录：
 *   2026-03-22 - v1.2.1 - 添加玩家初始化失败容错处理
 *   2026-03-22 - v1.2.2 - 优化Token有效期配置，提升游戏用户体验
 */

const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const logger = require('../config/logger');
const { sendPasswordResetEmail } = require('../services/emailService');
const { ensurePlayerInitialized } = require('../services/initService');

// 生成JWT访问令牌
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
};

// 生成JWT刷新令牌
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

// 生成随机令牌
const generateRandomToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * 安全延迟辅助函数 - 防止基于响应时间的用户名枚举攻击
 * 在登录失败场景中添加 50-200ms 随机延迟，统一响应时间
 */
const securityDelay = () => {
  const delay = 50 + Math.floor(Math.random() * 150); // 50-200ms
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// 计算过期时间
const calculateExpiresAt = (expiresIn) => {
  const now = new Date();
  const match = expiresIn.match(/^(\d+)([mhd])$/);
  if (!match) return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
};

// 保存刷新令牌到数据库
const saveRefreshToken = async (userId, token, req) => {
  const expiresAt = calculateExpiresAt(
    process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  );
  const ipAddress = req.ip;
  const userAgent = req.get('user-agent');

  const query = `
    INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  await pool.query(query, [userId, token, expiresAt, ipAddress, userAgent]);
};

// 撤销用户的所有刷新令牌
const revokeAllUserTokens = async (userId) => {
  const query = `
    UPDATE refresh_tokens 
    SET revoked_at = CURRENT_TIMESTAMP 
    WHERE user_id = $1 AND revoked_at IS NULL
  `;
  await pool.query(query, [userId]);
};

// 注册接口
exports.register = async (req, res) => {
  try {
    // 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('注册参数验证失败', {
        errors: errors.array(),
        ip: req.ip,
      });
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { username, email, password } = req.body;

    logger.info('用户注册请求', { username, email, ip: req.ip });

    // 检查用户名是否已存在
    const usernameQuery = 'SELECT id FROM sys_user WHERE username = $1';
    const usernameResult = await pool.query(usernameQuery, [username]);
    if (usernameResult.rows.length > 0) {
      logger.warn('用户名已存在', { username, ip: req.ip });
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    if (email) {
      const emailQuery = 'SELECT id FROM sys_user WHERE email = $1';
      const emailResult = await pool.query(emailQuery, [email]);
      if (emailResult.rows.length > 0) {
        logger.warn('邮箱已被注册', { email, ip: req.ip });
        return res.status(400).json({ message: '邮箱已被注册' });
      }
    }

    // 加密密码
    const hashedPwd = await bcrypt.hash(password, 10);

    // 创建用户
    const insertQuery = `
      INSERT INTO sys_user (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email
    `;
    const result = await pool.query(insertQuery, [username, email, hashedPwd]);
    const user = result.rows[0];

    logger.info('用户注册成功', {
      userId: user.id,
      username,
      email,
      ip: req.ip,
    });

    // 生成访问令牌和刷新令牌
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 保存刷新令牌到数据库
    await saveRefreshToken(user.id, refreshToken, req);

    // 初始化玩家数据（容错处理，失败不影响注册）
    try {
      await ensurePlayerInitialized(user.id.toString(), username);
    } catch (initError) {
      logger.warn('玩家数据初始化失败，但注册继续', {
        userId: user.id,
        username,
        error: initError.message,
      });
    }

    // 返回Token和用户信息
    res.status(201).json({
      message: '注册成功',
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error('注册失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 登录接口
exports.login = async (req, res) => {
  try {
    // 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('登录参数验证失败', {
        errors: errors.array(),
        ip: req.ip,
      });
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { identifier, password } = req.body;

    logger.info('用户登录请求', { identifier, ip: req.ip });

    // 查找用户（支持用户名或邮箱登录）
    const query = `
      SELECT id, username, email, password_hash, is_active
      FROM sys_user
      WHERE username = $1 OR email = $1
    `;
    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      logger.warn('登录失败：用户不存在', { identifier, ip: req.ip });
      await securityDelay(); // 安全延迟，防止用户名枚举
      return res.status(401).json({ message: '用户名/邮箱或密码错误' });
    }

    const user = result.rows[0];

    // 检查账号是否激活
    if (!user.is_active) {
      logger.warn('登录失败：账号已被禁用', {
        userId: user.id,
        username: user.username,
        ip: req.ip,
      });
      await securityDelay(); // 安全延迟，防止状态枚举
      return res.status(403).json({ message: '账号已被禁用' });
    }

    // 验证密码
    const isPwdValid = await bcrypt.compare(password, user.password_hash);
    if (!isPwdValid) {
      logger.warn('登录失败：密码错误', {
        userId: user.id,
        username: user.username,
        ip: req.ip,
      });
      await securityDelay(); // 安全延迟，防止用户名枚举
      return res.status(401).json({ message: '用户名/邮箱或密码错误' });
    }

    // 撤销用户之前的所有刷新令牌
    await revokeAllUserTokens(user.id);

    // 更新最后登录时间
    await pool.query(
      'UPDATE sys_user SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    logger.info('用户登录成功', {
      userId: user.id,
      username: user.username,
      email: user.email,
      ip: req.ip,
    });

    // 生成访问令牌和刷新令牌
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 保存刷新令牌到数据库
    await saveRefreshToken(user.id, refreshToken, req);

    // 初始化玩家数据（如果尚未初始化）（容错处理，失败不影响登录）
    try {
      await ensurePlayerInitialized(user.id.toString(), user.username);
    } catch (initError) {
      logger.warn('玩家数据初始化失败，但登录继续', {
        userId: user.id,
        username: user.username,
        error: initError.message,
      });
    }

    // 返回Token和用户信息
    res.status(200).json({
      message: '登录成功',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error('登录失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 刷新令牌接口
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('刷新令牌请求失败：缺少刷新令牌', { ip: req.ip });
      return res.status(400).json({ message: '缺少刷新令牌' });
    }

    logger.debug('刷新令牌请求', { ip: req.ip });

    // 验证刷新令牌
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (err) {
      logger.warn('刷新令牌无效', { error: err.message, ip: req.ip });
      return res.status(401).json({ message: '无效的刷新令牌' });
    }

    if (decoded.type !== 'refresh') {
      logger.warn('刷新令牌类型错误', { ip: req.ip });
      return res.status(401).json({ message: '无效的刷新令牌' });
    }

    // 检查数据库中的刷新令牌
    const tokenQuery = `
      SELECT rt.*, u.is_active 
      FROM refresh_tokens rt
      JOIN sys_user u ON rt.user_id = u.id
      WHERE rt.token = $1 AND rt.revoked_at IS NULL AND rt.expires_at > CURRENT_TIMESTAMP
    `;
    const tokenResult = await pool.query(tokenQuery, [refreshToken]);

    if (tokenResult.rows.length === 0) {
      logger.warn('刷新令牌不存在或已失效', {
        userId: decoded.userId,
        ip: req.ip,
      });
      return res.status(401).json({ message: '刷新令牌已失效' });
    }

    const tokenData = tokenResult.rows[0];

    if (!tokenData.is_active) {
      logger.warn('刷新令牌请求失败：账号已被禁用', {
        userId: tokenData.user_id,
        ip: req.ip,
      });
      return res.status(403).json({ message: '账号已被禁用' });
    }

    // 撤销当前刷新令牌
    const revokeQuery = `
      UPDATE refresh_tokens 
      SET revoked_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await pool.query(revokeQuery, [tokenData.id]);

    // 生成新的访问令牌和刷新令牌
    const newAccessToken = generateAccessToken(tokenData.user_id);
    const newRefreshToken = generateRefreshToken(tokenData.user_id);

    // 保存新的刷新令牌
    await saveRefreshToken(tokenData.user_id, newRefreshToken, req);

    logger.info('刷新令牌成功', { userId: tokenData.user_id, ip: req.ip });

    res.status(200).json({
      message: '刷新令牌成功',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    logger.error('刷新令牌失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 退出登录接口
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.id;

    if (refreshToken) {
      // 撤销指定的刷新令牌
      const revokeQuery = `
        UPDATE refresh_tokens 
        SET revoked_at = CURRENT_TIMESTAMP 
        WHERE token = $1
      `;
      await pool.query(revokeQuery, [refreshToken]);
    }

    if (userId) {
      // 撤销用户的所有刷新令牌
      await revokeAllUserTokens(userId);
      logger.info('用户退出登录', { userId, ip: req.ip });
    }

    res.status(200).json({ message: '退出登录成功' });
  } catch (err) {
    logger.error('退出登录失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户信息（需认证）
exports.getCurrentUser = async (req, res) => {
  try {
    logger.debug('获取当前用户信息', {
      userId: req.user?.id,
      username: req.user?.username,
      ip: req.ip,
    });
    res.status(200).json({ user: req.user });
  } catch (err) {
    logger.error('获取当前用户信息失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 验证规则
exports.registerValidation = [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('email').optional().isEmail().withMessage('邮箱格式错误'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6位'),
];

exports.loginValidation = [
  body('identifier').notEmpty().withMessage('用户名/邮箱不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
];

// 请求重置密码接口
exports.requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('请求重置密码参数验证失败', {
        errors: errors.array(),
        ip: req.ip,
      });
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email } = req.body;

    logger.info('请求重置密码', { email, ip: req.ip });

    // 查找用户
    const userQuery =
      'SELECT id, username, email FROM sys_user WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      logger.warn('请求重置密码：邮箱不存在', { email, ip: req.ip });
      return res.status(200).json({
        message: '如果邮箱存在，重置链接已发送到您的邮箱',
      });
    }

    const user = userResult.rows[0];

    // 撤销该用户之前的所有重置令牌
    const revokeQuery = `
      UPDATE password_reset_tokens 
      SET used_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND used_at IS NULL
    `;
    await pool.query(revokeQuery, [user.id]);

    // 生成新的重置令牌
    const resetToken = generateRandomToken();
    const expiresInMinutes = parseInt(
      process.env.PASSWORD_RESET_TOKEN_EXPIRES || 30
    );
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // 保存重置令牌到数据库
    const insertQuery = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    await pool.query(insertQuery, [user.id, resetToken, expiresAt, req.ip]);

    // 发送重置邮件
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.username);
      logger.info('密码重置邮件发送成功', {
        userId: user.id,
        email,
        ip: req.ip,
      });
    } catch (emailError) {
      logger.error('密码重置邮件发送失败', {
        userId: user.id,
        email,
        error: emailError.message,
        ip: req.ip,
      });
    }

    res.status(200).json({
      message: '如果邮箱存在，重置链接已发送到您的邮箱',
    });
  } catch (err) {
    logger.error('请求重置密码失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 验证重置令牌接口
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    logger.debug('验证重置令牌', { ip: req.ip });

    // 查找重置令牌
    const tokenQuery = `
      SELECT prt.*, u.username, u.email 
      FROM password_reset_tokens prt
      JOIN sys_user u ON prt.user_id = u.id
      WHERE prt.token = $1 
        AND prt.used_at IS NULL 
        AND prt.expires_at > CURRENT_TIMESTAMP
    `;
    const tokenResult = await pool.query(tokenQuery, [token]);

    if (tokenResult.rows.length === 0) {
      logger.warn('验证重置令牌失败：令牌无效或已过期', { ip: req.ip });
      return res.status(400).json({ message: '重置链接无效或已过期' });
    }

    const tokenData = tokenResult.rows[0];

    logger.info('验证重置令牌成功', { userId: tokenData.user_id, ip: req.ip });

    res.status(200).json({
      valid: true,
      username: tokenData.username,
      email: tokenData.email,
    });
  } catch (err) {
    logger.error('验证重置令牌失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 重置密码接口
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('重置密码参数验证失败', {
        errors: errors.array(),
        ip: req.ip,
      });
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { token, password } = req.body;

    logger.info('重置密码请求', { ip: req.ip });

    // 查找重置令牌
    const tokenQuery = `
      SELECT prt.* 
      FROM password_reset_tokens prt
      WHERE prt.token = $1 
        AND prt.used_at IS NULL 
        AND prt.expires_at > CURRENT_TIMESTAMP
    `;
    const tokenResult = await pool.query(tokenQuery, [token]);

    if (tokenResult.rows.length === 0) {
      logger.warn('重置密码失败：令牌无效或已过期', { ip: req.ip });
      return res.status(400).json({ message: '重置链接无效或已过期' });
    }

    const tokenData = tokenResult.rows[0];

    // 加密新密码
    const hashedPwd = await bcrypt.hash(password, 10);

    // 更新用户密码
    const updateUserQuery =
      'UPDATE sys_user SET password_hash = $1 WHERE id = $2';
    await pool.query(updateUserQuery, [hashedPwd, tokenData.user_id]);

    // 标记重置令牌为已使用
    const updateTokenQuery = `
      UPDATE password_reset_tokens 
      SET used_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await pool.query(updateTokenQuery, [tokenData.id]);

    // 撤销用户的所有刷新令牌
    await revokeAllUserTokens(tokenData.user_id);

    logger.info('重置密码成功', { userId: tokenData.user_id, ip: req.ip });

    res.status(200).json({ message: '密码重置成功，请使用新密码登录' });
  } catch (err) {
    logger.error('重置密码失败', {
      error: err.message,
      stack: err.stack,
      ip: req.ip,
    });
    res.status(500).json({ message: '服务器错误' });
  }
};

// 验证规则
exports.requestPasswordResetValidation = [
  body('email').isEmail().withMessage('邮箱格式错误'),
];

exports.resetPasswordValidation = [
  body('token').notEmpty().withMessage('重置令牌不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6位'),
];
