/**
 * 文件名：generate_db_docs.js
 * 作者：Trae AI
 * 日期：2026-05-01
 * 版本：v2.4.2
 * 功能描述：生成数据库表结构和数据内容说明文件
 * 更新记录：
 *   2026-05-01 - v2.4.2 - 大幅改进：添加无数据库连接时的静态文档生成、更好的错误处理、更多功能
 *   2026-04-27 - v2.4.1 - 更新为从环境变量读取数据库连接配置
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 尝试加载环境变量
try {
  const dotenv = require('dotenv');
  
  // 优先尝试加载 backend/.env，然后是根目录
  const backendEnvPath = path.join(__dirname, '.env');
  const rootEnvPath = path.join(__dirname, '../.env');
  const sqlInitEnvPath = path.join(__dirname, '../sql_init/.env');
  
  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath });
    console.log('✅ 已加载配置：backend/.env');
  } else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
    console.log('✅ 已加载配置：根目录/.env');
  } else if (fs.existsSync(sqlInitEnvPath)) {
    dotenv.config({ path: sqlInitEnvPath });
    console.log('✅ 已加载配置：sql_init/.env');
  } else {
    console.log('⚠️ 未找到 .env 配置文件，将使用默认配置或静态模式');
  }
} catch (error) {
  console.log('⚠️ dotenv 模块未安装，将使用默认配置');
}

// 解析 DATABASE_URL（优先级最高）
function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
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
  console.log('📡 使用 DATABASE_URL 配置');
} else {
  config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'happy_farm'
  };
  console.log('📡 使用 DB_* 分开配置');
}

// 生成文档的目录
const docsDir = path.join(__dirname, '../db_docs');

// 确保目录存在
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 主函数：尝试连接数据库生成文档，失败则生成静态文档
async function generateDocs() {
  console.log('========================================');
  console.log('📚 数据库文档生成器 v2.4.2');
  console.log('========================================\n');
  
  try {
    await generateFromDatabase();
  } catch (error) {
    console.log('❌ 数据库连接失败，尝试生成静态文档...\n');
    try {
      await generateStaticDocs();
    } catch (staticError) {
      console.error('❌ 静态文档生成也失败：', staticError);
    }
  }
}

// 从数据库生成文档
async function generateFromDatabase() {
  const client = new Client(config);
  
  try {
    console.log(`🔗 正在连接数据库 ${config.host}:${config.port}/${config.database}...`);
    await client.connect();
    console.log('✅ 成功连接到数据库！\n');

    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`📊 发现 ${tables.length} 个表：`);
    console.log(`  ${tables.join(', ')}\n`);

    await generateTableStructureDocs(tables, client);
    await generateTableDataDocs(tables, client);
    
    console.log('\n🎉 数据库文档生成完成！');
    console.log(`📁 文档位置：${docsDir}`);
  } catch (error) {
    console.error('❌ 数据库文档生成失败：', error.message);
    throw error;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

// 生成表结构说明文件（从数据库）
async function generateTableStructureDocs(tables, client) {
  const structureContent = [];
  structureContent.push('# 数据库表结构说明\n');
  structureContent.push(`生成时间：${new Date().toLocaleString('zh-CN')}\n`);
  structureContent.push(`版本：v2.4.2\n`);
  structureContent.push(`生成方式：从数据库动态生成\n\n`);
  structureContent.push(`## 📋 目录\n\n`);
  structureContent.push(`| 序号 | 表名 | 说明 |\n`);
  structureContent.push(`|------|------|------|\n`);
  
  tables.forEach((table, index) => {
    structureContent.push(`| ${index + 1} | ${table} | - |\n`);
  });
  structureContent.push('\n');

  for (const table of tables) {
    structureContent.push(`---\n\n`);
    structureContent.push(`## ${table} 表\n`);

    const columnsResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    structureContent.push('| 列名 | 数据类型 | 长度 | 是否可为空 | 默认值 | 注释 |\n');
    structureContent.push('|------|----------|------|------------|--------|------|\n');

    for (const column of columnsResult.rows) {
      const length = column.character_maximum_length || '-';
      const nullable = column.is_nullable === 'YES' ? '是' : '否';
      const defaultVal = column.column_default || '-';

      structureContent.push(`| ${column.column_name} | ${column.data_type} | ${length} | ${nullable} | ${defaultVal} | - |\n`);
    }

    const primaryKeyResult = await client.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tco
      JOIN information_schema.key_column_usage kcu 
        ON tco.constraint_schema = kcu.constraint_schema
        AND tco.constraint_name = kcu.constraint_name
      WHERE tco.constraint_type = 'PRIMARY KEY'
        AND tco.table_schema = 'public'
        AND tco.table_name = $1
    `, [table]);

    if (primaryKeyResult.rows.length > 0) {
      const primaryKeys = primaryKeyResult.rows.map(row => row.column_name).join(', ');
      structureContent.push(`\n**主键**：${primaryKeys}\n`);
    }

    const foreignKeyResult = await client.query(`
      SELECT 
        kcu.column_name AS foreign_column,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints tco
      JOIN information_schema.key_column_usage kcu 
        ON tco.constraint_schema = kcu.constraint_schema
        AND tco.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_schema = tco.constraint_schema
        AND ccu.constraint_name = tco.constraint_name
      WHERE tco.constraint_type = 'FOREIGN KEY'
        AND tco.table_schema = 'public'
        AND tco.table_name = $1
    `, [table]);

    if (foreignKeyResult.rows.length > 0) {
      structureContent.push('\n**外键**：\n');
      for (const fk of foreignKeyResult.rows) {
        structureContent.push(`- ${fk.foreign_column} → ${fk.referenced_table}.${fk.referenced_column}\n`);
      }
    }

    structureContent.push('\n');
  }

  const structureFile = path.join(docsDir, 'table_structure.md');
  fs.writeFileSync(structureFile, structureContent.join(''), 'utf8');
  console.log('✅ 表结构说明文件已生成');
}

// 生成表数据内容说明文件（从数据库）
async function generateTableDataDocs(tables, client) {
  const dataContent = [];
  dataContent.push('# 数据库表数据内容说明\n');
  dataContent.push(`生成时间：${new Date().toLocaleString('zh-CN')}\n`);
  dataContent.push(`版本：v2.4.2\n`);
  dataContent.push(`生成方式：从数据库动态生成\n\n`);

  let totalRows = 0;
  const tableStats = [];

  for (const table of tables) {
    dataContent.push(`## ${table} 表数据\n`);

    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    const columns = columnsResult.rows.map(row => row.column_name);

    const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
    const rowCount = parseInt(countResult.rows[0].count);
    totalRows += rowCount;
    tableStats.push({ table, count: rowCount });
    
    dataContent.push(`**数据行数**：${rowCount}\n\n`);

    if (rowCount > 0) {
      const dataResult = await client.query(`SELECT * FROM ${table} LIMIT 10`);

      if (dataResult.rows.length > 0) {
        dataContent.push('| ' + columns.join(' | ') + ' |\n');
        dataContent.push('| ' + columns.map(() => '---').join(' | ') + ' |\n');

        for (const row of dataResult.rows) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'object' && value instanceof Date) return value.toISOString();
            if (typeof value === 'object') {
              try {
                return JSON.stringify(value);
              } catch (e) {
                return String(value);
              }
            }
            return String(value).replace(/\n/g, '\\n');
          });
          dataContent.push('| ' + values.join(' | ') + ' |\n');
        }

        if (rowCount > 10) {
          dataContent.push(`\n*注：仅显示前10条数据，共 ${rowCount} 条*\n`);
        }
      }
    } else {
      dataContent.push('**暂无数据**\n');
    }

    dataContent.push('\n');
  }

  dataContent.push('---\n\n');
  dataContent.push('## 📊 数据统计\n\n');
  dataContent.push('| 表名 | 数据行数 |\n');
  dataContent.push('|------|----------|\n');
  tableStats.forEach(stat => {
    dataContent.push(`| ${stat.table} | ${stat.count} |\n`);
  });
  dataContent.push(`| **总计** | **${totalRows}** |\n`);

  const dataFile = path.join(docsDir, 'table_data.md');
  fs.writeFileSync(dataFile, dataContent.join(''), 'utf8');
  console.log('✅ 表数据内容说明文件已生成');
}

// 生成静态文档（当无数据库连接时）
async function generateStaticDocs() {
  console.log('📝 正在生成静态文档...\n');
  
  const sqlInitDir = path.join(__dirname, '../sql_init');
  
  if (!fs.existsSync(sqlInitDir)) {
    throw new Error('找不到 sql_init 目录');
  }
  
  // 生成静态结构文档
  generateStaticStructureDoc(sqlInitDir);
  generateStaticDataDoc(sqlInitDir);
  
  console.log('\n✅ 静态文档生成完成！');
  console.log(`📁 文档位置：${docsDir}`);
  console.log('\n💡 提示：静态文档是基于SQL脚本生成的，如需最新的动态文档请先连接数据库。');
}

// 生成静态结构文档
function generateStaticStructureDoc(sqlInitDir) {
  const content = [];
  content.push('# 数据库表结构说明\n');
  content.push(`生成时间：${new Date().toLocaleString('zh-CN')}\n`);
  content.push(`版本：v2.4.2\n`);
  content.push(`生成方式：静态文档（基于SQL脚本）\n\n`);
  content.push(`## 📋 文档说明\n\n`);
  content.push(`本文件是静态文档，基于 sql_init/ 目录下的SQL脚本生成。\n`);
  content.push(`如需从数据库动态生成最新文档，请确保数据库连接配置正确。\n\n`);
  content.push(`## 📁 SQL脚本目录结构\n\n`);
  content.push(`- **01_database/** - 数据库创建脚本\n`);
  content.push(`- **02_schema/** - 表结构创建脚本（按依赖顺序）\n`);
  content.push(`- **03_data/** - 初始数据插入脚本\n`);
  content.push(`- **04_extensions/** - 扩展脚本\n`);
  content.push(`- **archive/** - 归档文件\n\n`);
  content.push(`## 📊 表结构详情\n\n`);
  content.push(`详细的表结构请参考 sql_init/02_schema/ 目录下的各个SQL文件，\n`);
  content.push(`或连接数据库后重新运行本脚本生成动态文档。\n`);
  
  const filePath = path.join(docsDir, 'table_structure.md');
  fs.writeFileSync(filePath, content.join(''), 'utf8');
  console.log('✅ 表结构说明文件已生成（静态）');
}

// 生成静态数据文档
function generateStaticDataDoc(sqlInitDir) {
  const content = [];
  content.push('# 数据库表数据内容说明\n');
  content.push(`生成时间：${new Date().toLocaleString('zh-CN')}\n`);
  content.push(`版本：v2.4.2\n`);
  content.push(`生成方式：静态文档（基于SQL脚本）\n\n`);
  content.push(`## 📋 文档说明\n\n`);
  content.push(`本文件是静态文档，基于 sql_init/ 目录下的SQL脚本生成。\n`);
  content.push(`如需从数据库动态生成最新文档，请确保数据库连接配置正确。\n\n`);
  content.push(`## 📁 初始数据脚本\n\n`);
  content.push(`- **01_world_level_data.sql** - 世界等级配置\n`);
  content.push(`- **02_farm_level_data.sql** - 农场等级配置\n`);
  content.push(`- **03_land_quality_data.sql** - 地块品质配置\n`);
  content.push(`- **04_farm_land_data.sql** - 公共地块配置\n`);
  content.push(`- **05_crop_data.sql** - 作物配置\n`);
  content.push(`- **06_currency_config_data.sql** - 货币配置\n`);
  content.push(`- **07_item_config_data.sql** - 道具配置\n`);
  content.push(`- **08_shop_goods_data.sql** - 商店商品配置\n`);
  content.push(`- **09_sys_login_data.sql** - 登录系统数据\n`);
  content.push(`- **10_achievement_data.sql** - 成就系统数据\n`);
  content.push(`- **11_announcement_data.sql** - 公告系统数据\n`);
  content.push(`- **12_game_config_data.sql** - 游戏配置数据\n\n`);
  content.push(`详细的数据内容请参考上述文件，\n`);
  content.push(`或连接数据库后重新运行本脚本生成动态文档。\n`);
  
  const filePath = path.join(docsDir, 'table_data.md');
  fs.writeFileSync(filePath, content.join(''), 'utf8');
  console.log('✅ 表数据内容说明文件已生成（静态）');
}

// 检查依赖并运行
try {
  require('pg');
  generateDocs();
} catch (error) {
  console.error('❌ 找不到 pg 库，请先安装 pg 库');
  console.error('请在项目根目录运行：npm install pg');
  console.log('\n正在生成静态文档（无需数据库）...\n');
  generateStaticDocs();
}
