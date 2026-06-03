#!/usr/bin/env node

// 开心农场 成就系统数据库迁移脚本
// 作者：开发者
// 日期：2026-03-27
// 版本：v1.0.0
// 功能描述：创建成就系统相关的表结构

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 配置参数
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_db_password',
    database: process.env.DB_NAME || 'happy_farm'
};

// 连接数据库
const client = new Client(config);

async function runAchievementMigration() {
    try {
        console.log('===== 开心农场 成就系统数据库迁移开始 ======');
        
        // 连接数据库
        console.log('1. 连接数据库...');
        await client.connect();
        console.log('✅ 数据库连接成功');
        
        // 执行成就系统表结构创建
        console.log('\n2. 创建成就系统表结构...');
        
        // 读取并执行成就系统的SQL文件
        const achievementSqlPath = path.join(__dirname, '011_create_achievement_tables.sql');
        if (fs.existsSync(achievementSqlPath)) {
            console.log(`  执行: 011_create_achievement_tables.sql`);
            const sql = fs.readFileSync(achievementSqlPath, 'utf8');
            await client.query(sql);
            console.log(`  ✅ 执行完成：011_create_achievement_tables.sql`);
        } else {
            console.log(`  ❌ 文件不存在：011_create_achievement_tables.sql`);
            process.exit(1);
        }
        
        // 验证成就系统表是否创建成功
        console.log('\n3. 验证成就系统表结构...');
        
        const checkTables = [
            'achievement_definition', 
            'player_achievement', 
            'achievement_unlock_log'
        ];
        
        for (const table of checkTables) {
            const tableCheck = await client.query(
                `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
                `,
                [table]
            );
            if (tableCheck.rows[0].exists) {
                console.log(`  ✅ 表存在：${table}`);
            } else {
                console.log(`  ❌ 表缺失：${table}`);
            }
        }
        
        // 检查初始成就数据
        const achievementResult = await client.query('SELECT COUNT(*) FROM achievement_definition');
        console.log(`  ✅ 初始成就数据：${achievementResult.rows[0].count} 条`);
        
        // 完成提示
        console.log('\n==========================================');
        console.log('🎉 开心农场 成就系统数据库迁移完成！');
        console.log('✅ 成就系统表结构已创建');
        console.log('✅ 初始成就数据已导入');
        console.log('==========================================');
        
    } catch (error) {
        console.error('❌ 数据库操作失败:', error.message);
        process.exit(1);
    } finally {
        // 关闭数据库连接
        await client.end();
        console.log('\n数据库连接已关闭');
    }
}

// 检查是否安装了pg库
try {
    require('pg');
    runAchievementMigration();
} catch (error) {
    console.error('❌ 找不到pg库，请先安装pg库');
    console.error('请在根目录运行命令：npm install pg');
    process.exit(1);
}