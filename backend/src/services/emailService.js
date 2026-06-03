// 文件名：emailService.js
// 作者：开发者
// 日期：2026-03-18
// 版本：v1.0.0
// 功能描述：邮件服务，用于发送密码重置邮件等

const logger = require('../config/logger');
require('dotenv').config();

// 发送邮件
const sendEmail = async (to, subject, html) => {
  const smtpEnabled = process.env.SMTP_ENABLED === 'true';

  if (!smtpEnabled) {
    logger.info('模拟发送邮件', { to, subject, html });
    return true;
  }

  try {
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('邮件发送成功', { to, messageId: info.messageId });
    return true;
  } catch (error) {
    logger.error('邮件发送失败', {
      error: error.message,
      stack: error.stack,
      to,
    });
    throw error;
  }
};

// 发送密码重置邮件
const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `${process.env.CORS_ORIGIN.split(',')[0]}/reset-password?token=${resetToken}`;

  const subject = '开心农场 - 密码重置';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>密码重置</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #007bff;">密码重置请求</h2>
        <p>亲爱的 ${username}，</p>
        <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            重置密码
          </a>
        </p>
        <p>如果上面的链接无法点击，请复制以下地址到浏览器地址栏：</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${resetUrl}</p>
        <p><strong>注意：</strong>此链接将在 ${process.env.PASSWORD_RESET_TOKEN_EXPIRES || 30} 分钟后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件，您的密码不会被更改。</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">此邮件由开心农场系统自动发送，请勿回复。</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(email, subject, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
