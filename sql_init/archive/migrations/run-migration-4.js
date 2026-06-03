
// 文件名：run-migration-4.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.1.0
// 功能描述：执行审计日志表迁移脚本

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  let client;
  try {
    client = await pool.connect();
    
    const migrationPath = path.join(__dirname, 'sql_init/migrations/004_add_audit_logs_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('开始执行迁移脚本：004_add_audit_logs_table.sql');
    
    await client.query(sql);
    
    console.log('✅ 迁移脚本执行成功！');
    console.log('操作审计日志表已创建');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移脚本执行失败：', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration();

