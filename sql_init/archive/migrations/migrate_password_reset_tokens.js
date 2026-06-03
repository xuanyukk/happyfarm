// 文件名：migrate_password_reset_tokens.js
// 作者：开发者
// 日期：2026-03-18
// 版本：v1.0.0
// 功能描述：执行添加密码重置令牌表的数据库迁移

const pool = require('../../backend/src/config/db');
const logger = require('../../backend/src/config/logger');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    logger.info('开始执行数据库迁移：添加密码重置令牌表');

    const sqlPath = path.join(__dirname, '002_add_password_reset_tokens_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 分割SQL语句并执行
    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement);
      }
    }

    logger.info('数据库迁移完成：密码重置令牌表已创建');
    process.exit(0);
  } catch (err) {
    logger.error('数据库迁移失败', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

migrate();
