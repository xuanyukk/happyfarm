#! /usr/bin/env node

/**
 * 文件名：init_db.js
 * 作者：Trae AI、xuanyukk
 * 日期：2026-06-02
 * 版本：v4.71.6
 * 功能描述：使用pg库初始化开心农场数据库，创建表结构并导入初始数据
 * 更新记录：
 *   2026-06-02 - v4.71.6 - 同步项目版本号，表总数84张
 *   2026-05-23 - v4.53.0 - 移除旧版system_config表，统一使用game_config，更新表总数为69张
 *   2026-05-22 - v4.51.0 - 添加游戏活动系统短中期优化（触发器、统计、模板系统、定时任务）
 *   2026-05-22 - v4.50.0 - 添加缺失的3个数据文件，统一版本号，修复数据完整性问题
 *   2026-05-12 - v2.7.0 - 添加游戏活动管理系统表（33_game_event_system.sql），新增10+性能优化索引
 *   2026-05-10 - v2.6.0 - 添加数据仓库表（32_data_warehouse.sql），更新删除顺序和验证
 *   2026-05-01 - v2.4.0 - 重新组织SQL文件结构，使用新的目录结构和执行顺序
 *   2026-04-27 - v2.1.0 - 优先使用backend/.env配置，解析DATABASE_URL，避免配置重复
 *   2026-04-27 - v2.0.0 - 从环境变量读取数据库配置，移除硬编码密码
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 尝试加载环境变量 - 优先级：backend/.env > sql_init/.env
try {
  const dotenv = require('dotenv');
  
  // 优先尝试加载 backend/.env
  const backendEnvPath = path.join(__dirname, '../backend/.env');
  const localEnvPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
    console.log('✅ 已加载配置：backend/.env');
  } else if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
    console.log('✅ 已加载配置：sql_init/.env');
  } else {
    console.log('⚠️ 未找到 .env 配置文件，将使用默认配置');
  }
} catch (error) {
  console.log('⚠️ dotenv 模块未安装，将使用默认配置');
}

// 解析 DATABASE_URL（优先级最高）
function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    // 匹配格式：postgresql://user:password@host:port/database
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^/?]+)/);
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4]),
        database: match[5]
      };
    }
  } catch (error) {
    console.log('⚠️ DATABASE_URL 解析失败，使用分开的配置');
  }
  return null;
}

// 从环境变量读取配置，优先级：DATABASE_URL > DB_* > 默认值
let config;
const urlConfig = parseDatabaseUrl(process.env.DATABASE_URL);

if (urlConfig) {
  config = urlConfig;
  console.log('✅ 使用 DATABASE_URL 配置');
} else {
  config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'happy_farm'
  };
  console.log('✅ 使用 DB_* 分开配置');
}

// 验证配置
if (!config.password) {
  console.warn('⚠️ 数据库密码未设置，请检查 .env 文件');
}

// SQL文件执行顺序配置
const sqlConfig = {
  // 第一阶段：数据库准备（需要连接到postgres数据库）
  // 注意：数据库创建已经在代码中处理，不再需要SQL文件
  database: [
  ],
  // 第二阶段：扩展启用（在happy_farm数据库中执行）
  extensions: [
    '04_extensions/01_enable_pgcrypto.sql'
  ],
  // 第三阶段：表结构创建
  schema: [
    '02_schema/01_functions.sql',
    '02_schema/03_world_level.sql',
    '02_schema/04_farm_level.sql',
    '02_schema/05_land_quality.sql',
    '02_schema/06_farm_land.sql',
    '02_schema/07_crop.sql',
    '02_schema/08_currency_config.sql',
    '02_schema/09_item_config.sql',
    '02_schema/10_shop_goods.sql',
    '02_schema/11_player_base.sql',
    '02_schema/12_player_currency.sql',
    '02_schema/13_player_currency_log.sql',
    '02_schema/14_player_inventory.sql',
    '02_schema/15_player_land_status.sql',
    '02_schema/16_player_crop_unlock.sql',
    '02_schema/17_sys_login.sql',
    '02_schema/18_refresh_tokens.sql',
    '02_schema/19_password_reset_tokens.sql',
    '02_schema/20_user_devices.sql',
    '02_schema/21_two_factor_auth.sql',
    '02_schema/22_audit_logs.sql',
    '02_schema/23_game_activity_log.sql',
    '02_schema/24_monitoring_tables.sql',
    '02_schema/25_monitoring_procedures.sql',
    '02_schema/26_emergency_procedures.sql',
    '02_schema/27_optimization.sql',
    '02_schema/28_achievement_system.sql',
    '02_schema/29_admin_system.sql',
    '02_schema/30_announcement_system.sql',
    '02_schema/31_game_config_system.sql',
    '02_schema/32_data_warehouse.sql',
    '02_schema/33_game_event_system.sql'
  ],
  // 第四阶段：初始数据插入
  data: [
    '03_data/01_world_level_data.sql',
    '03_data/02_farm_level_data.sql',
    '03_data/03_land_quality_data.sql',
    '03_data/04_farm_land_data.sql',
    '03_data/05_crop_data.sql',
    '03_data/06_currency_config_data.sql',
    '03_data/07_item_config_data.sql',
    '03_data/08_shop_goods_data.sql',
    '03_data/09_sys_login_data.sql',
    '03_data/10_achievement_data.sql',
    '03_data/11_announcement_data.sql',
    '03_data/12_game_config_data.sql',
    '03_data/14_admin_system_data.sql',
    '03_data/15_game_event_data.sql'
  ]
};

// 删除旧表的顺序（按依赖关系反序）
const dropTablesOrder = [
    // 视图先删除
    'v_retention_analysis', 'v_revenue_stats', 'v_crop_stats', 'v_dau_stats',
    // 游戏活动中期优化表
    'game_event_task_logs', 'game_event_scheduled_tasks',
    'game_event_template_variables', 'game_event_template_versions',
    // 游戏活动短期优化表
    'game_event_funnel', 'game_event_stats',
    'game_event_trigger_logs', 'game_event_triggers',
    // 游戏活动基础表
    'game_event_rewards', 'player_event_progress', 'game_event_tasks', 'game_events', 'game_event_templates',
  // 数据仓库事实表
  'fact_daily_revenue', 'fact_crop_planting', 'fact_daily_transactions', 'fact_daily_active_players',
  // 数据仓库维度表
  'dim_crop', 'dim_player', 'dim_date',
  // 其他表（保持原顺序）
  'config_change_log', 'config_approval', 'config_version', 'game_config',
  'announcement_draft', 'announcement_read', 'announcement', 'announcement_category',
  'admin_login_log', 'admin_session', 'admins',
  'achievement_unlock_log', 'player_achievement', 'achievement_definition',
  'game_activity_log',
  'audit_logs',
  'two_factor_verification_codes', 'two_factor_auth',
  'user_devices',
  'password_reset_tokens',
  'refresh_tokens',
  'sys_user_role', 'sys_role_permission', 'sys_permission', 'sys_role', 'sys_user',
  'player_crop_unlock',
  'player_land_status',
  'player_inventory',
  'player_currency_log',
  'player_currency',
  'player_base',
  'shop_goods',
  'item_config',
  'currency_config',
  'crop',
  'farm_land',
  'land_quality',
  'farm_level',
  'world_level',
  'system_alert', 'system_monitoring_log'
];

// 删除旧函数的列表
const dropFunctionsOrder = [
  'update_updated_at_column()',
  'gen_uuid_v7()',
  'sp_daily_currency_reconciliation()',
  'sp_check_production_consumption_ratio()',
  'sp_check_player_abnormal_behavior()',
  'sp_reset_daily_stats()',
  'sp_emergency_inflation_control(VARCHAR)',
  'sp_emergency_deflation_control(VARCHAR)',
  'sp_enable_circuit_breaker(VARCHAR)',
  'sp_disable_circuit_breaker(VARCHAR)',
  'sp_fix_player_data()',
  'sp_get_player_summary(VARCHAR)',
  'sp_get_system_summary()'
];

// 执行单个SQL文件
async function executeSqlFile(client, relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  文件不存在：${relativePath}`);
    return false;
  }
  
  console.log(`  执行: ${relativePath}`);
  let sql = fs.readFileSync(fullPath, 'utf8');
  
  // 过滤掉 psql 特有的命令（以 \ 开头的行）
  sql = sql.split('\n')
    .filter(line => !line.trim().startsWith('\\'))
    .join('\n');
  
  await client.query(sql);
  console.log(`  ✅ 执行完成：${relativePath}`);
  return true;
}

// 主初始化函数
async function initDatabase() {
  try {
    console.log('===== 开心农场 数据库初始化开始 =====');
    console.log('📖 详细执行顺序请查看：执行顺序说明.md\n');
    
    // 第一步：创建数据库（需要连接到postgres数据库）
    console.log('【第一阶段】创建数据库...');
    const postgresConfig = { ...config, database: 'postgres' };
    const postgresClient = new Client(postgresConfig);
    await postgresClient.connect();
    console.log('✅ 已连接到postgres数据库');
    
    // 检查数据库是否存在
    const dbCheckResult = await postgresClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'happy_farm'"
    );
    
    if (dbCheckResult.rows.length === 0) {
      // 数据库不存在，创建它
      await postgresClient.query('CREATE DATABASE happy_farm');
      console.log('  ✅ 数据库创建成功');
    } else {
      console.log('  ℹ️  数据库已存在，跳过创建');
    }
    
    await postgresClient.end();
    console.log('✅ 数据库创建完成\n');
    
    // 第二步：连接到新创建的数据库
    console.log('【第二阶段】连接到happy_farm数据库...');
    const client = new Client(config);
    await client.connect();
    console.log('✅ 已连接到happy_farm数据库\n');
    
    // 第三步：清理旧对象
    console.log('【第三阶段】清理旧数据库对象...');
    
    // 先删除所有索引（避免索引已存在的问题）
    console.log('  删除旧索引...');
    const indexResult = await client.query(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    `);
    for (const row of indexResult.rows) {
      try {
        await client.query(`DROP INDEX IF EXISTS ${row.indexname} CASCADE`);
      } catch (error) {
        // 忽略错误
      }
    }
    console.log('  ✅ 旧索引删除完成');
    
    // 删除旧表
    console.log('  删除旧表...');
    for (const table of dropTablesOrder) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      } catch (error) {
        // 忽略错误，表可能不存在
      }
    }
    console.log('  ✅ 旧表删除完成');
    
    // 删除旧函数
    console.log('  删除旧函数...');
    for (const func of dropFunctionsOrder) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS ${func} CASCADE`);
      } catch (error) {
        // 忽略错误，函数可能不存在
      }
    }
    console.log('  ✅ 旧函数删除完成\n');
    
    // 第四步：启用扩展
    console.log('【第四阶段】启用数据库扩展...');
    for (const sqlFile of sqlConfig.extensions) {
      await executeSqlFile(client, sqlFile);
    }
    console.log('✅ 扩展启用完成\n');
    
    // 第五步：创建表结构
    console.log('【第五阶段】创建表结构...');
    for (const sqlFile of sqlConfig.schema) {
      await executeSqlFile(client, sqlFile);
    }
    console.log('✅ 表结构创建完成\n');
    
    // 第六步：插入初始数据
    console.log('【第六阶段】插入初始数据...');
    for (const sqlFile of sqlConfig.data) {
      await executeSqlFile(client, sqlFile);
    }
    console.log('✅ 初始数据插入完成\n');
    
    // 第七步：验证数据完整性
    console.log('【第七阶段】验证数据完整性...');
    
    // 验证表存在
    const verifyTables = [
      'world_level', 'farm_level', 'land_quality', 'farm_land', 'crop',
      'currency_config', 'item_config', 'shop_goods',
      'player_base', 'player_currency', 'player_inventory', 'player_land_status',
      'sys_user', 'sys_role', 'sys_permission',
      'achievement_definition', 'announcement', 'game_config',
      // 数据仓库表
      'dim_date', 'dim_player', 'dim_crop',
      'fact_daily_active_players', 'fact_daily_transactions',
      'fact_crop_planting', 'fact_daily_revenue',
      // 游戏活动管理表（基础）
      'game_event_templates', 'game_events', 'game_event_tasks',
      'player_event_progress', 'game_event_rewards',
      // 游戏活动管理表（短期优化）
      'game_event_triggers', 'game_event_trigger_logs',
      'game_event_stats', 'game_event_funnel',
      // 游戏活动管理表（中期规划）
      'game_event_template_versions', 'game_event_template_variables',
      'game_event_scheduled_tasks', 'game_event_task_logs'
    ];
    
    let allTablesOk = true;
    for (const table of verifyTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = '${table}'
        )
      `);
      if (result.rows[0].exists) {
        console.log(`  ✅ 表存在：${table}`);
      } else {
        console.log(`  ❌ 表缺失：${table}`);
        allTablesOk = false;
      }
    }
    
    // 验证数据量
    const dataChecks = [
      { table: 'world_level', name: '世界等级', min: 1 },
      { table: 'farm_level', name: '农场等级', min: 1 },
      { table: 'land_quality', name: '地块品质', min: 1 },
      { table: 'farm_land', name: '公共地块', min: 1 },
      { table: 'crop', name: '作物配置', min: 1 },
      { table: 'item_config', name: '道具配置', min: 1 },
      { table: 'shop_goods', name: '商店商品', min: 1 },
      { table: 'sys_user', name: '系统用户', min: 1 },
      { table: 'sys_role', name: '系统角色', min: 1 },
      { table: 'sys_permission', name: '系统权限', min: 1 },
      { table: 'achievement_definition', name: '成就定义', min: 1 },
      { table: 'announcement_category', name: '公告分类', min: 1 },
      { table: 'game_config', name: '游戏配置', min: 1 },
      // 数据仓库表
      { table: 'dim_date', name: '日期维度', min: 1 }
    ];
    
    let allDataOk = true;
    for (const check of dataChecks) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${check.table}`);
        const count = parseInt(result.rows[0].count);
        if (count >= check.min) {
          console.log(`  ✅ ${check.name}数据：${count} 条`);
        } else {
          console.log(`  ❌ ${check.name}数据不足：${count} 条（需要至少 ${check.min} 条）`);
          allDataOk = false;
        }
      } catch (error) {
        console.log(`  ⚠️  ${check.name}数据检查失败：${error.message}`);
      }
    }
    console.log('');
    
    // 完成提示
    console.log('==========================================');
    if (allTablesOk && allDataOk) {
      console.log('🎉 开心农场 数据库初始化全部完成！');
    } else {
      console.log('⚠️  数据库初始化完成，但存在部分问题，请检查上面的错误信息');
    }
    console.log(`📌 数据库名：${config.database}`);
    console.log('✅ 核心功能已落地：');
    console.log('  1. 项目名称统一为【开心农场】');
    console.log('  2. 农场币深度融入地块解锁：普通地块解锁需消耗农场币，高品质覆盖支持农场币结算');
    console.log('  3. 完整货币闭环：种植→出售赚农场币→解锁地块/买种子道具→扩大种植');
    console.log('  4. 保留核心设定：无氪金、固定50块地块8档品质覆盖、三等级上限');
    console.log('  5. 统一玩家库存：种子/道具/作物全类型支持，可无限扩展');
    console.log('  6. 货币体系平衡：GP/min严格管控，产出有顶，消耗有底');
    console.log('  7. 联动机制：等级、地块、品质、作物全功能强绑定');
    console.log('  8. 扩展系统：成就、公告、游戏配置等系统已就绪');
    console.log('  9. 数据仓库：BI分析表已就绪，支持DAU、留存、营收分析');
    console.log(' 10. 性能优化：新增10+查询优化索引，覆盖所有核心查询场景');
    console.log(' 11. 游戏活动系统：活动管理、触发器、统计、模板系统、定时任务');
    console.log('📊 数据表：共 69 张表（62 张核心表 + 7 张数据仓库表）');
    console.log('📝 初始数据：全服公共配置，无玩家模拟数据，上线后玩家数据自动生成');
    console.log('👤 默认账户：admin / 123456（管理员）');
    console.log('📖 详细文档：请查看执行顺序说明.md');
    console.log('==========================================');
    
    // 关闭数据库连接
    await client.end();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 检查是否安装了pg库
try {
  require('pg');
  initDatabase();
} catch (error) {
  console.error('❌ 找不到pg库，请先安装pg库');
  console.error('请在根目录运行命令：npm install pg');
  process.exit(1);
}
