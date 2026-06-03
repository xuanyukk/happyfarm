// 文件名：authRoutes.js
// 作者：开发者
// 日期：2026-03-18
// 版本：v1.2.0
// 功能描述：认证路由，处理用户注册、登录、JWT刷新、密码重置等接口

const express = require('express');
const {
  register,
  login,
  getCurrentUser,
  refreshToken,
  logout,
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  registerValidation,
  loginValidation,
  requestPasswordResetValidation,
  resetPasswordValidation,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 用户注册
 *     description: 创建新用户账号
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     description: 用户登录获取访问令牌
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 认证失败
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginValidation, login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 刷新访问令牌
 *     description: 使用刷新令牌获取新的访问令牌
 *     tags: [认证]
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *       401:
 *         description: 刷新令牌无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/password-reset/request:
 *   post:
 *     summary: 请求密码重置
 *     description: 发送密码重置邮件到用户邮箱
 *     tags: [认证]
 *     responses:
 *       200:
 *         description: 重置邮件已发送
 *       404:
 *         description: 邮箱不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/password-reset/request',
  requestPasswordResetValidation,
  requestPasswordReset
);

/**
 * @swagger
 * /api/auth/password-reset/verify/{token}:
 *   get:
 *     summary: 验证重置令牌
 *     description: 验证密码重置令牌是否有效
 *     tags: [认证]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: 密码重置令牌
 *     responses:
 *       200:
 *         description: 令牌有效
 *       400:
 *         description: 令牌无效或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/password-reset/verify/:token', verifyResetToken);

/**
 * @swagger
 * /api/auth/password-reset/reset:
 *   post:
 *     summary: 重置密码
 *     description: 使用有效令牌重置用户密码
 *     tags: [认证]
 *     responses:
 *       200:
 *         description: 密码重置成功
 *       400:
 *         description: 令牌无效或参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/password-reset/reset', resetPasswordValidation, resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     description: 获取当前登录用户的详细信息
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 用户信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authMiddleware, getCurrentUser);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 用户登出
 *     description: 登出当前用户并使令牌失效
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *       401:
 *         description: 未授权
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authMiddleware, logout);

module.exports = router;
