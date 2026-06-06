/**
 * 文件名：docsAuthRoutes.js
 * 作者：Trae AI
 * 日期：2026-06-05
 * 版本：v1.0.0
 * 功能描述：文档系统认证路由，提供文档访问权限验证接口
 * 更新记录：
 *   2026-06-05 - v1.0.0 - 初始版本
 */

const express = require('express');
const { verifyDocsAccess } = require('../controllers/docsAuthController');
const router = express.Router();

/**
 * @swagger
 * /api/docs/auth/verify:
 *   post:
 *     summary: 验证文档系统访问权限
 *     description: 接收JWT令牌，验证有效性并返回用户的文档访问角色
 *     tags: [文档系统]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT访问令牌
 *     responses:
 *       200:
 *         description: 验证成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 role:
 *                   type: string
 *                   enum: [guest, player, dev]
 *                 username:
 *                   type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: 令牌无效
 *       500:
 *         description: 服务器错误
 */
router.post('/verify', verifyDocsAccess);

module.exports = router;
