// 文件名: run_config_tables.js
// 作者: Trae AI
// 日期: 2026-04-30
// 功能描述: 执行游戏参数配置管理系统的数据库迁移
// 更新记录:
//   2026-04-30 - v1.0.0 - 初始版本创建

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '..', 'backend', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'happy_farm'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 开始执行游戏参数配置管理系统数据库迁移...');

    const sqlPath = path.join(__dirname, '015_create_game_config_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 执行SQL
    await client.query(sqlContent);
    console.log('✅ 游戏参数配置管理系统数据库表创建成功！');

    console.log('\n📊 创建的表:');
    console.log('  - game_config: 游戏参数配置表');
    console.log('  - config_version: 配置版本表');
    console.log('  - config_approval: 配置审批表');
    console.log('  - config_change_log: 配置变更日志表');

    console.log('\n🎉 迁移完成！');
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = runMigration;
