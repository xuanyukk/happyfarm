/**
 * 游戏公告发布系统表结构迁移脚本
 * 作者: Trae AI
 * 日期: 2026-04-30
 * 版本: v1.0.0
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.example') });

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
        console.log('开始执行游戏公告发布系统表结构迁移...');

        const sqlPath = path.join(__dirname, '014_create_announcement_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('执行SQL脚本...');
        await client.query(sql);

        console.log('✅ 游戏公告发布系统表结构迁移完成！');
        console.log('');
        console.log('迁移内容：');
        console.log('  1. 创建 announcement 表（公告主表）');
        console.log('  2. 创建 announcement_read 表（阅读记录表）');
        console.log('  3. 创建 announcement_category 表（分类表）');
        console.log('  4. 创建 announcement_draft 表（草稿表）');
        console.log('  5. 初始化公告分类数据');
        console.log('  6. 插入示例公告');
    } catch (error) {
        console.error('❌ 游戏公告发布系统表结构迁移失败！');
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
