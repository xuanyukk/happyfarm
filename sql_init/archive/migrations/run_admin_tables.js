
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 从环境变量或默认值获取配置
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your_db_password',
    database: process.env.DB_NAME || 'happy_farm'
};

const client = new Client(config);

async function runAdminTablesMigration() {
    try {
        console.log('===== 后台管理系统数据库迁移开始 ======');
        
        console.log('1. 连接数据库...');
        await client.connect();
        console.log('✅ 数据库连接成功');
        
        console.log('\n2. 创建后台管理表结构...');
        
        const adminSqlPath = path.join(__dirname, '../schema/admin_tables.sql');
        if (fs.existsSync(adminSqlPath)) {
            console.log(`  执行: admin_tables.sql`);
            const sql = fs.readFileSync(adminSqlPath, 'utf8');
            
            const statements = sql
                .split(';')
                .map(s =&gt; s.trim())
                .filter(s =&gt; s.length &gt; 0 &amp;&amp; !s.startsWith('--'));
            
            for (const statement of statements) {
                try {
                    await client.query(statement);
                } catch (e) {
                    if (e.message.includes('already exists')) {
                        console.log(`  ⓘ  表已存在，跳过`);
                    } else {
                        throw e;
                    }
                }
            }
            console.log(`  ✅ 执行完成：admin_tables.sql`);
        } else {
            console.log(`  ❌ 文件不存在：admin_tables.sql`);
            process.exit(1);
        }
        
        console.log('\n3. 验证后台管理表结构...');
        
        const checkTables = [
            'admin_operation_log',
            'system_monitoring',
            'alert_config',
            'alert_record',
            'operation_approval',
            'currency_control_log',
            'currency_release_strategy',
            'data_statistics',
            'currency_balance_monitor',
            'system_notification'
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
        
        console.log('\n==========================================');
        console.log('🎉 后台管理系统数据库迁移完成！');
        console.log('✅ 后台管理表结构已创建');
        console.log('==========================================');
        
    } catch (error) {
        console.error('❌ 数据库操作失败:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n数据库连接已关闭');
    }
}

try {
    require('pg');
    runAdminTablesMigration();
} catch (error) {
    console.error('❌ 找不到pg库，请先安装pg库');
    console.error('请在根目录运行命令：npm install pg');
    process.exit(1);
}

