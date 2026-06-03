/**
 * 文件名：012_create_admin_tables.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：创建后台管理相关数据库表
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始版本创建
 */

const fs = require('fs');
const path = require('path');
const pool = require('../../backend/src/config/db');
const logger = require('../../backend/src/config/logger');

async function migrate() {
  console.log('开始执行后台管理表创建迁移...');
  
  try {
    const sqlPath = path.join(__dirname, '../schema/admin_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const statement of statements) {
        if (!statement.startsWith('--')) {
          await client.query(statement);
        }
      }
      
      await client.query('COMMIT');
      console.log('后台管理表创建成功！');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    logger.error('后台管理表迁移失败', { error: error.message, stack: error.stack });
    console.error('迁移失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0));
}

module.exports = migrate;
