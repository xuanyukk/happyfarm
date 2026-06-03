
// 文件名：migrate-user-devices.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：执行用户设备管理表迁移脚本

const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../sql_init/migrations/005_add_user_devices_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('开始执行迁移脚本：005_add_user_devices_table.sql');
    
    await pool.query(sql);
    
    console.log('✅ 迁移脚本执行成功！');
    console.log('用户设备管理表已创建');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移脚本执行失败：', error);
    process.exit(1);
  }
}

runMigration();

