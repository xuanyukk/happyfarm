/**
 * 文件名：generate-keys.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：用于生成安全的随机密钥的工具
 */

const crypto = require("crypto");

console.log("🎯 开心农场项目 - 密钥生成工具");
console.log("=".repeat(60));
console.log("说明：");
console.log("1. 复制以下密钥到您的 .env 文件中");
console.log("2. 不要将这些密钥提交到版本控制系统");
console.log("3. 生产环境必须使用这些强随机密钥");
console.log("=".repeat(60));
console.log();

// 生成JWT密钥（64字节）
const jwtSecret = crypto.randomBytes(64).toString("hex");
console.log("JWT_SECRET=\"" + jwtSecret + "\"");

// 生成加密密钥（32字节）
const encryptionKey = crypto.randomBytes(32).toString("hex");
console.log("ENCRYPTION_KEY=\"" + encryptionKey + "\"");

console.log();
console.log("=".repeat(60));
console.log("✅ 密钥生成完成！");
console.log("请复制上面的密钥到您的 .env 文件中");
