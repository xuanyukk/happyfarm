// 文件名：encryptionService.js
// 作者：开发者
// 日期：2026-03-18
// 版本：v1.0.0
// 功能描述：加密服务，用于敏感数据的加密和解密

const crypto = require('crypto');
const logger = require('../config/logger');
require('dotenv').config();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const getEncryptionKey = () => {
  let key = process.env.ENCRYPTION_KEY;
  if (!key) {
    logger.warn('ENCRYPTION_KEY 未设置，使用默认密钥（生产环境请务必修改！）');
    key = 'happy_farm_default_encryption_key_2026';
  }
  return crypto.createHash('sha256').update(key).digest();
};

const encrypt = (plaintext) => {
  try {
    if (!plaintext) return plaintext;

    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('加密失败', { error: error.message });
    throw error;
  }
};

const decrypt = (encryptedText) => {
  try {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText;
    }

    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('解密失败', { error: error.message });
    throw error;
  }
};

module.exports = {
  encrypt,
  decrypt,
};
