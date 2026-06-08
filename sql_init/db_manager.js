#! /usr/bin/env node

/**
 * 文件名：db_manager.js
 * 作者：Trae AI
 * 日期：2026-06-07
 * 版本：v4.72.1
 * 功能描述：交互式数据库管理脚本 - 完整功能版本
 * 更新记录：
 *   2026-06-07 - v4.72.1 - 补充缺失的schema 34-45和数据16-18，更新drop表列表
 *   2026-05-25 - v4.60.1 - 同步项目版本号，统一内部版本号，表总数更新为69张
 *   2026-05-23 - v4.53.0 - 移除旧版system_config表，统一使用game_config，更新表总数为69张
 *   2026-05-22 - v4.50.0 - 添加缺失的3个数据文件，统一版本号，修复数据完整性问题
 *   2026-05-14 - v4.0.0 - 重大更新：添加备份恢复、命令行参数、8种操作模式
 *   2026-05-14 - v3.0.0 - 初始版本创建，支持3种重置级别
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// 尝试加载环境变量
try {
  const dotenv = require('dotenv');
  const backendEnvPath = path.join(__dirname, '../backend/.env');
  const localEnvPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
  } else if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }
} catch (error) {
  // 忽略
}

// 配置
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'happy_farm'
};

// 日志文件
const logFile = path.join(__dirname, 'db_operations.log');
const backupDir = process.env.BACKUP_DIR || path.join(__dirname, 'backups');

// 命令行参数解析
const args = process.argv.slice(2);
let force = false;
let verbose = false;
let mode = null;
let backupFile = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--force') force = true;
  else if (arg === '--verbose') verbose = true;
  else if (arg === '--mode' && args[i + 1]) mode = args[++i];
  else if (arg === '--file' && args[i + 1]) backupFile = args[++i];
  else if (arg === '--help') {
    showHelp();
    process.exit(0);
  }
}

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 日志记录
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // 写入日志文件
  try {
    fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
  } catch (error) {
    // 忽略日志写入错误
  }
}

// 详细日志
function debug(message) {
  if (verbose) {
    log(message, 'DEBUG');
  }
}

// 询问用户
function ask(question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()));
  });
}

// 显示帮助
function showHelp() {
  console.log(`
🎮 开心农场 数据库管理工具 v4.60.1

使用方式:
  node db_manager.js [选项]

选项:
  --mode <mode>        直接执行指定模式，不进入交互菜单
                        可选值: reset, create-db, create-tables, init-data,
                               clear-data, backup, restore, status
  --file <path>        指定恢复用的备份文件（仅用于restore模式）
  --force              跳过确认提示
  --verbose            显示详细执行日志
  --help               显示此帮助信息

示例:
  node db_manager.js                          # 进入交互菜单
  node db_manager.js --mode reset --force     # 强制重置数据库
  node db_manager.js --mode backup            # 备份数据库
  node db_manager.js --mode restore --file backup_20260514_210000.sql
`);
}

// 显示菜单
async function showMenu() {
  console.log('\n' + '='.repeat(70));
  console.log('          🎮 开心农场 数据库管理系统 v4.60.1');
  console.log('='.repeat(70));
  console.log('\n请选择操作：');
  console.log('\n[1] 完整重置数据库');
  console.log('    ⚠️  危险：删除现有数据库 → 创建新数据库 → 创建表结构 → 导入初始数据');
  console.log('\n[2] 仅创建数据库');
  console.log('    ℹ️  不删除现有数据库，不存在则创建');
  console.log('\n[3] 仅创建表结构');
  console.log('    ℹ️  数据库已存在时使用');
  console.log('\n[4] 仅导入初始数据');
  console.log('    ℹ️  表结构已存在时使用');
  console.log('\n[5] 清空所有表数据');
  console.log('    ⚠️  保留表结构，只清空数据');
  console.log('\n[6] 备份现有数据库');
  console.log('    📦 生成带时间戳的SQL备份文件');
  console.log('\n[7] 从指定备份文件恢复');
  console.log('    🔄 从备份文件恢复数据库');
  console.log('\n[8] 查看当前状态');
  console.log('    📊 显示数据库表和数据量');
  console.log('\n[0] 退出脚本');
  console.log('');
  
  const choice = await ask('请输入选项 (0-8): ');
  return choice;
}

// SQL文件执行顺序
const sqlFiles = {
  database: ['01_database/01_create_database.sql'],
  extensions: ['04_extensions/01_enable_pgcrypto.sql'],
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
    '02_schema/33_game_event_system.sql',
    '02_schema/34_config_change_log.sql',
    '02_schema/35_player_shop_daily_limit.sql',
    '02_schema/36_player_level_config.sql',
    '02_schema/37_daily_task_config.sql',
    '02_schema/38_item_drop_config.sql',
    '02_schema/39_player_daily_task.sql',
    '02_schema/40_player_item_usage_log.sql',
    '02_schema/41_player_combo_tracker.sql',
    '02_schema/42_daily_discount_goods.sql',
    '02_schema/43_player_skin_record.sql',
    '02_schema/44_farm_decoration.sql',
    '02_schema/45_log_cleanup.sql'
  ],
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
    '03_data/15_game_event_data.sql',
    '03_data/16_player_level_config_data.sql',
    '03_data/17_daily_task_config_data.sql',
    '03_data/18_item_drop_config_data.sql'
  ]
};

// 核心配置表（保留数据用）
const coreTables = [
  'world_level', 'farm_level', 'land_quality', 'farm_land', 'crop',
  'currency_config', 'item_config', 'shop_goods',
  'sys_user', 'sys_role', 'sys_permission',
  'achievement_definition', 'announcement_category', 'game_config'
];

// 删除表顺序
const dropTablesOrder = [
  'v_retention_analysis', 'v_revenue_stats', 'v_crop_stats', 'v_dau_stats',
  // 日志归档表
  'game_activity_log_archive_2026_09', 'game_activity_log_archive_2026_08',
  'game_activity_log_archive_2026_07', 'game_activity_log_archive_2026_06',
  'game_activity_log_archive',
  'player_currency_log_archive_2026_09', 'player_currency_log_archive_2026_08',
  'player_currency_log_archive_2026_07', 'player_currency_log_archive_2026_06',
  'player_currency_log_archive',
  // 日志分区子表
  'game_activity_log_2026_09', 'game_activity_log_2026_08',
  'game_activity_log_2026_07', 'game_activity_log_2026_06',
  'player_currency_log_2026_09', 'player_currency_log_2026_08',
  'player_currency_log_2026_07', 'player_currency_log_2026_06',
  // 游戏中后期优化表
  'game_event_task_logs', 'game_event_scheduled_tasks',
  'game_event_template_variables', 'game_event_template_versions',
  // 游戏活动短期优化表
  'game_event_funnel', 'game_event_stats',
  'game_event_trigger_logs', 'game_event_triggers',
  'game_event_rewards', 'player_event_progress', 'game_event_tasks', 'game_events', 'game_event_templates',
  'fact_daily_revenue', 'fact_crop_planting', 'fact_daily_transactions', 'fact_daily_active_players',
  'dim_crop', 'dim_player', 'dim_date',
  // 农场装饰表
  'farm_beauty_record', 'farm_decoration_placement', 'player_decoration_inventory',
  // 皮肤/组合/折扣表
  'player_skin_record', 'player_combo_tracker', 'daily_discount_goods',
  // 每日任务/道具记录表
  'player_item_usage_log', 'player_daily_task', 'item_drop_config',
  'daily_task_config', 'player_level_config', 'player_shop_daily_limit',
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

// 执行SQL文件
async function executeSqlFile(client, relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  if (!fs.existsSync(fullPath)) {
    log(`文件不存在: ${relativePath}`, 'WARN');
    return false;
  }
  
  debug(`执行: ${relativePath}`);
  let sql = fs.readFileSync(fullPath, 'utf8');
  
  // 过滤psql命令
  sql = sql.split('\n')
    .filter(line => !line.trim().startsWith('\\'))
    .join('\n');
  
  await client.query(sql);
  debug(`完成: ${relativePath}`);
  return true;
}

// 生成备份文件名
function generateBackupFilename() {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  return path.join(backupDir, `backup_${timestamp}.sql`);
}

// 列出可用的备份文件
function listBackupFiles() {
  if (!fs.existsSync(backupDir)) {
    return [];
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      stat: fs.statSync(path.join(backupDir, f))
    }))
    .sort((a, b) => b.stat.mtime - a.stat.mtime);
  
  return files;
}

// 备份数据库
async function backupDatabase(client) {
  log('开始备份数据库...');
  
  const backupPath = generateBackupFilename();
  log(`备份文件: ${backupPath}`);
  
  try {
    const pgDumpPath = 'pg_dump';
    const env = {
      ...process.env,
      PGPASSWORD: config.password
    };
    
    const cmd = [
      pgDumpPath,
      '-h', config.host,
      '-p', config.port.toString(),
      '-U', config.user,
      config.database
    ];
    
    debug(`执行命令: ${cmd.join(' ')}`);
    
    const dumpContent = execSync(cmd.join(' '), { 
      env: env,
      encoding: 'utf8'
    });
    
    fs.writeFileSync(backupPath, dumpContent, 'utf8');
    log(`✅ 备份完成！文件大小: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`, 'SUCCESS');
    
    return backupPath;
  } catch (error) {
    log(`❌ 备份失败: ${error.message}`, 'ERROR');
    debug(`详细错误: ${error.stack}`);
    return null;
  }
}

// 恢复数据库
async function restoreDatabase(client, backupFilePath) {
  log(`开始从备份恢复: ${backupFilePath}`);
  
  if (!fs.existsSync(backupFilePath)) {
    log(`❌ 备份文件不存在: ${backupFilePath}`, 'ERROR');
    return false;
  }
  
  // 恢复前先备份
  log('恢复前自动备份当前数据库...');
  const preBackupPath = await backupDatabase(client);
  if (preBackupPath) {
    log(`✅ 已保存恢复前备份: ${preBackupPath}`);
  }
  
  try {
    const psqlPath = 'psql';
    const env = {
      ...process.env,
      PGPASSWORD: config.password
    };
    
    const cmd = [
      psqlPath,
      '-h', config.host,
      '-p', config.port.toString(),
      '-U', config.user,
      '-d', config.database,
      '-f', backupFilePath
    ];
    
    debug(`执行命令: ${cmd.join(' ')}`);
    
    execSync(cmd.join(' '), { 
      env: env,
      stdio: 'ignore'
    });
    
    log('✅ 恢复完成！', 'SUCCESS');
    return true;
  } catch (error) {
    log(`❌ 恢复失败: ${error.message}`, 'ERROR');
    debug(`详细错误: ${error.stack}`);
    return false;
  }
}

// 选项1：完整重置
async function fullReset(client) {
  log('开始完全重置...', 'WARN');
  
  // 删除所有表
  log('删除旧表...');
  for (const table of dropTablesOrder) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      debug(`已删除表: ${table}`);
    } catch (error) {
      debug(`删除表失败: ${table} - ${error.message}`);
    }
  }
  
  // 删除所有函数
  log('删除旧函数...');
  const functions = [
    'update_updated_at_column()', 'gen_uuid_v7()', 'sp_daily_currency_reconciliation()',
    'sp_check_production_consumption_ratio()', 'sp_check_player_abnormal_behavior()',
    'sp_reset_daily_stats()', 'sp_emergency_inflation_control(VARCHAR)',
    'sp_emergency_deflation_control(VARCHAR)', 'sp_enable_circuit_breaker(VARCHAR)',
    'sp_disable_circuit_breaker(VARCHAR)', 'sp_fix_player_data()',
    'sp_get_player_summary(VARCHAR)', 'sp_get_system_summary()'
  ];
  
  for (const func of functions) {
    try {
      await client.query(`DROP FUNCTION IF EXISTS ${func} CASCADE`);
      debug(`已删除函数: ${func}`);
    } catch (error) {
      debug(`删除函数失败: ${func} - ${error.message}`);
    }
  }
  
  // 重新创建
  log('启用扩展...');
  for (const file of sqlFiles.extensions) {
    await executeSqlFile(client, file);
  }
  
  log('创建表结构...');
  for (const file of sqlFiles.schema) {
    await executeSqlFile(client, file);
  }
  
  log('插入初始数据...');
  for (const file of sqlFiles.data) {
    await executeSqlFile(client, file);
  }
  
  log('✅ 完全重置完成！', 'SUCCESS');
}

// 选项2：仅创建数据库
async function createDatabaseOnly() {
  log('仅创建数据库...');
  
  // 连接到默认数据库
  const defaultClient = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres'
  });
  
  try {
    await defaultClient.connect();
    debug('连接到默认数据库成功');
    
    // 检查数据库是否存在
    const checkResult = await defaultClient.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [config.database]);
    
    if (checkResult.rows.length > 0) {
      log(`数据库 "${config.database}" 已存在，跳过创建`, 'WARN');
    } else {
      log(`创建数据库 "${config.database}"...`);
      await defaultClient.query(`CREATE DATABASE ${config.database}`);
      log('✅ 数据库创建成功！', 'SUCCESS');
    }
    
    await defaultClient.end();
    return true;
  } catch (error) {
    log(`❌ 创建数据库失败: ${error.message}`, 'ERROR');
    debug(`详细错误: ${error.stack}`);
    return false;
  }
}

// 选项3：仅创建表结构
async function createTablesOnly(client) {
  log('仅创建表结构...');
  
  log('启用扩展...');
  for (const file of sqlFiles.extensions) {
    await executeSqlFile(client, file);
  }
  
  log('创建表结构...');
  let successCount = 0;
  let failCount = 0;
  
  for (const file of sqlFiles.schema) {
    try {
      await executeSqlFile(client, file);
      successCount++;
    } catch (error) {
      log(`执行失败: ${file} - ${error.message}`, 'ERROR');
      failCount++;
    }
  }
  
  log(`✅ 表结构创建完成！成功: ${successCount}, 失败: ${failCount}`, 'SUCCESS');
}

// 选项4：仅导入初始数据
async function importDataOnly(client) {
  log('仅导入初始数据...');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of sqlFiles.data) {
    try {
      await executeSqlFile(client, file);
      successCount++;
    } catch (error) {
      log(`导入失败: ${file} - ${error.message}`, 'ERROR');
      failCount++;
    }
  }
  
  log(`✅ 数据导入完成！成功: ${successCount}, 失败: ${failCount}`, 'SUCCESS');
}

// 选项5：清空所有表数据
async function clearDataKeepSchema(client) {
  log('开始清除数据（保留结构）...');
  
  // 获取所有表
  const result = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  `);
  
  const tables = result.rows.map(r => r.tablename);
  
  // 按依赖反序删除数据
  let successCount = 0;
  let failCount = 0;
  
  for (const table of dropTablesOrder) {
    if (tables.includes(table)) {
      try {
        await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        debug(`已清除数据: ${table}`);
        successCount++;
      } catch (error) {
        log(`清除失败: ${table} - ${error.message}`, 'WARN');
        failCount++;
      }
    }
  }
  
  // 重新插入数据
  log('重新插入初始数据...');
  for (const file of sqlFiles.data) {
    try {
      await executeSqlFile(client, file);
    } catch (error) {
      log(`导入失败: ${file} - ${error.message}`, 'ERROR');
    }
  }
  
  log(`✅ 数据清除完成！清除表数: ${successCount}`, 'SUCCESS');
}

// 查看状态
async function showStatus(client) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 数据库状态检查');
  console.log('='.repeat(70));
  
  // 检查连接
  console.log(`\n🗄️  数据库信息:`);
  console.log(`   主机: ${config.host}:${config.port}`);
  console.log(`   数据库: ${config.database}`);
  console.log(`   用户: ${config.user}`);
  
  // 检查表
  const tablesResult = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  
  console.log(`\n📋 表数量: ${tablesResult.rows.length}`);
  
  // 检查数据量
  console.log('\n📈 核心表数据量:');
  for (const table of coreTables) {
    try {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table}: ${result.rows[0].count} 条`);
    } catch (error) {
      console.log(`   ${table}: (表不存在)`);
    }
  }
  
  // 检查备份文件
  const backupFiles = listBackupFiles();
  console.log(`\n📦 备份文件: ${backupFiles.length} 个`);
  if (backupFiles.length > 0) {
    console.log('   最新备份:');
    backupFiles.slice(0, 5).forEach(f => {
      const size = (f.stat.size / 1024).toFixed(2);
      const date = f.stat.mtime.toLocaleString();
      console.log(`      - ${f.name} (${size} KB, ${date})`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
}

// 执行模式
async function executeMode(mode, client) {
  switch (mode) {
    case 'reset':
      if (!force) {
        const confirm = await ask('\n⚠️  确定要完全重置吗？这将删除所有内容！(yes/no): ');
        if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
          log('操作已取消');
          return;
        }
      }
      await fullReset(client);
      break;
      
    case 'create-db':
      await createDatabaseOnly();
      break;
      
    case 'create-tables':
      await createTablesOnly(client);
      break;
      
    case 'init-data':
      await importDataOnly(client);
      break;
      
    case 'clear-data':
      if (!force) {
        const confirm = await ask('\n⚠️  确定要清除所有数据吗？(yes/no): ');
        if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
          log('操作已取消');
          return;
        }
      }
      await clearDataKeepSchema(client);
      break;
      
    case 'backup':
      await backupDatabase(client);
      break;
      
    case 'restore':
      if (!backupFile) {
        // 显示备份文件列表让用户选择
        const files = listBackupFiles();
        if (files.length === 0) {
          log('没有找到备份文件', 'ERROR');
          return;
        }
        
        console.log('\n可用的备份文件:');
        files.forEach((f, i) => {
          const size = (f.stat.size / 1024).toFixed(2);
          console.log(`  [${i + 1}] ${f.name} (${size} KB)`);
        });
        
        const choice = await ask('\n请选择要恢复的备份文件编号: ');
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < files.length) {
          backupFile = files[index].path;
        } else {
          log('无效选择', 'ERROR');
          return;
        }
      }
      
      if (!force) {
        const confirm = await ask(`\n⚠️  确定要从 "${path.basename(backupFile)}" 恢复吗？(yes/no): `);
        if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
          log('操作已取消');
          return;
        }
      }
      await restoreDatabase(client, backupFile);
      break;
      
    case 'status':
      await showStatus(client);
      break;
      
    default:
      log(`未知模式: ${mode}`, 'ERROR');
  }
}

// 主函数
async function main() {
  log('='.repeat(70));
  log('🎮 开心农场 数据库管理系统 v4.60.1 启动');
  log('='.repeat(70));
  
  let client;
  
  try {
    // 连接数据库
    client = new Client(config);
    await client.connect();
    log('✅ 数据库连接成功');
    
    if (mode) {
      // 命令行模式
      debug(`执行模式: ${mode}`);
      await executeMode(mode, client);
    } else {
      // 交互菜单模式
      while (true) {
        const choice = await showMenu();
        
        if (choice === '1') {
          if (!force) {
            const confirm = await ask('\n⚠️  确定要完全重置吗？这将删除所有内容！(yes/no): ');
            if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
              log('操作已取消');
              continue;
            }
          }
          await fullReset(client);
        } else if (choice === '2') {
          await createDatabaseOnly();
        } else if (choice === '3') {
          await createTablesOnly(client);
        } else if (choice === '4') {
          await importDataOnly(client);
        } else if (choice === '5') {
          if (!force) {
            const confirm = await ask('\n⚠️  确定要清除所有数据吗？(yes/no): ');
            if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
              log('操作已取消');
              continue;
            }
          }
          await clearDataKeepSchema(client);
        } else if (choice === '6') {
          await backupDatabase(client);
        } else if (choice === '7') {
          const files = listBackupFiles();
          if (files.length === 0) {
            log('没有找到备份文件', 'ERROR');
            continue;
          }
          
          console.log('\n可用的备份文件:');
          files.forEach((f, i) => {
            const size = (f.stat.size / 1024).toFixed(2);
            console.log(`  [${i + 1}] ${f.name} (${size} KB)`);
          });
          
          const fileChoice = await ask('\n请选择要恢复的备份文件编号: ');
          const index = parseInt(fileChoice) - 1;
          if (index >= 0 && index < files.length) {
            if (!force) {
              const confirm = await ask(`\n⚠️  确定要从 "${files[index].name}" 恢复吗？(yes/no): `);
              if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
                log('操作已取消');
                continue;
              }
            }
            await restoreDatabase(client, files[index].path);
          } else {
            log('无效选择', 'ERROR');
          }
        } else if (choice === '8') {
          await showStatus(client);
        } else if (choice === '0') {
          log('👋 再见！');
          break;
        } else {
          log('无效选项，请重试', 'ERROR');
        }
      }
    }
    
  } catch (error) {
    log(`错误: ${error.message}`, 'ERROR');
    if (verbose) console.error(error);
  } finally {
    if (client) {
      await client.end();
    }
    rl.close();
  }
}

// 检查pg库
try {
  require('pg');
  main();
} catch (error) {
  console.error('❌ 找不到pg库，请先安装pg库');
  console.error('请运行：npm install pg');
  process.exit(1);
}
