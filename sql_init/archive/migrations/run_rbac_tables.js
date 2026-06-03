/**
 * RBAC权限管理系统表结构迁移脚本
 * 作者: Trae AI
 * 日期: 2026-04-30
 * 版本: v1.0.0
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env.example') });

// 数据库连接配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'happy_farm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('开始执行RBAC权限管理系统表结构迁移...');
    
    const sqlPath = path.join(__dirname, '013_create_rbac_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('执行SQL脚本...');
    
    await client.query(sql);
    
    console.log('✅ RBAC权限管理系统表结构迁移完成！');
    console.log('');
    console.log('迁移内容：');
    console.log('  1. 创建 admin_role 表');
    console.log('  2. 创建 admin_permission 表');
    console.log('  3. 创建 role_permission 表');
    console.log('  4. 创建 user_role 表');
    console.log('  5. 创建 data_permission 表');
    console.log('  6. 创建 permission_audit_log 表');
    console.log('  7. 初始化系统内置角色');
    console.log('  8. 初始化系统权限');
    console.log('  9. 为超级管理员分配权限');
  } catch (error) {
    console.error('❌ RBAC权限管理系统表结构迁移失败！');
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
