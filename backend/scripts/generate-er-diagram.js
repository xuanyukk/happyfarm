/**
 * 文件名：generate-er-diagram.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v2.0.0
 * 功能描述：数据库ER图自动生成器 - 从PostgreSQL information_schema
 *          提取元数据，生成 Mermaid/HTML 格式的ER图
 * 更新记录：
 *   2026-05-26 - v2.0.0 - 初始版本创建
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/** 获取数据库连接配置 */
function getDbConfig(args) {
  const cfg = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'happy_farm'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--db-host': cfg.host = args[++i]; break;
      case '--db-port': cfg.port = parseInt(args[++i], 10); break;
      case '--db-user': cfg.user = args[++i]; break;
      case '--db-pass': cfg.password = args[++i]; break;
      case '--db-name': cfg.database = args[++i]; break;
    }
  }

  // 环境变量覆盖
  if (process.env.DB_HOST) cfg.host = process.env.DB_HOST;
  if (process.env.DB_PORT) cfg.port = parseInt(process.env.DB_PORT, 10);
  if (process.env.DB_USER) cfg.user = process.env.DB_USER;
  if (process.env.DB_PASS) cfg.password = process.env.DB_PASS;
  if (process.env.DB_NAME) cfg.database = process.env.DB_NAME;

  return cfg;
}

/** 获取输出格式 */
function getFormat(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format') {
      const fmt = args[++i];
      if (['mermaid', 'html', 'both'].includes(fmt)) return fmt;
    }
  }
  return 'both';
}

/** 查询数据库元数据 */
async function queryMetadata(pool) {
  const client = await pool.connect();
  try {
    // 查询所有表及注释
    const tablesResult = await client.query(`
      SELECT
        t.table_name,
        obj_description(pc.oid, 'pg_class') AS table_comment
      FROM information_schema.tables t
      JOIN pg_class pc ON pc.relname = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);

    // 查询所有字段
    const colsResult = await client.query(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        pgd.description AS column_comment,
        c.ordinal_position
      FROM information_schema.columns c
      LEFT JOIN pg_catalog.pg_description pgd
        ON pgd.objoid = (
          SELECT oid FROM pg_class WHERE relname = c.table_name
        )
        AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position
    `);

    // 查询主键
    const pkResult = await client.query(`
      SELECT
        kc.table_name,
        kc.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kc
        ON tc.constraint_name = kc.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      ORDER BY kc.table_name, kc.ordinal_position
    `);

    // 查询外键
    const fkResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    return {
      tables: tablesResult.rows,
      columns: colsResult.rows,
      primary_keys: pkResult.rows,
      foreign_keys: fkResult.rows
    };
  } finally {
    client.release();
  }
}

/** 生成 Mermaid ER 图 */
function generateMermaid(metadata) {
  let mermaid = '# 开心农场数据库 ER 图 (Mermaid)\n\n';
  mermaid += `> 生成时间: ${new Date().toISOString()}\n`;
  mermaid += `> 项目版本: v2.0.0\n`;
  mermaid += `> 表数量: ${metadata.tables.length}\n`;
  mermaid += `> 字段数量: ${metadata.columns.length}\n`;
  mermaid += `> 外键关系数量: ${metadata.foreign_keys.length}\n\n`;
  mermaid += '```mermaid\nerDiagram\n';

  // 收集主键信息
  const pkMap = {};
  for (const pk of metadata.primary_keys) {
    if (!pkMap[pk.table_name]) pkMap[pk.table_name] = [];
    pkMap[pk.table_name].push(pk.column_name);
  }

  // 输出表定义
  for (const table of metadata.tables) {
    mermaid += `  ${table.table_name} {\n`;

    const cols = metadata.columns.filter(c => c.table_name === table.table_name);
    const pks = pkMap[table.table_name] || [];

    for (const col of cols) {
      let typeName = col.data_type;
      if (col.character_maximum_length) {
        typeName += `(${col.character_maximum_length})`;
      }
      const pkMark = pks.includes(col.column_name) ? ' PK' : '';
      const fkMark = metadata.foreign_keys.some(
        fk => fk.table_name === table.table_name && fk.column_name === col.column_name
      ) ? ' FK' : '';
      mermaid += `    ${typeName} ${col.column_name}${pkMark}${fkMark}\n`;
    }

    mermaid += '  }\n';
  }

  // 输出外键关系
  for (const fk of metadata.foreign_keys) {
    mermaid += `  ${fk.table_name} ||--o{ ${fk.foreign_table_name} : "${fk.column_name} → ${fk.foreign_column_name}"\n`;
  }

  mermaid += '```\n';

  return mermaid;
}

/** 生成 HTML ER 图（可视化） */
function generateHtml(metadata) {
  // 收集表信息
  const tableData = {};
  for (const table of metadata.tables) {
    const cols = metadata.columns.filter(c => c.table_name === table.table_name);
    tableData[table.table_name] = {
      name: table.table_name,
      comment: table.table_comment || '',
      columns: cols.map(c => ({
        name: c.column_name,
        type: c.data_type + (c.character_maximum_length ? `(${c.character_maximum_length})` : ''),
        nullable: c.is_nullable === 'YES',
        comment: c.column_comment || '',
        defaultValue: c.column_default || ''
      }))
    };
  }

  // 主键标记
  const pkSet = new Set();
  for (const pk of metadata.primary_keys) {
    pkSet.add(`${pk.table_name}.${pk.column_name}`);
  }

  // 外键标记
  const fkSet = new Set();
  for (const fk of metadata.foreign_keys) {
    fkSet.add(`${fk.table_name}.${fk.column_name}`);
  }

  const tablesHtml = Object.values(tableData).map(table => {
    const rows = table.columns.map(col => {
      const isPk = pkSet.has(`${table.name}.${col.name}`);
      const isFk = fkSet.has(`${table.name}.${col.name}`);
      let klass = '';
      if (isPk) klass += ' pk';
      if (isFk) klass += ' fk';

      return `<tr class="${klass}">
        <td class="col-name">${isPk ? '🔑 ' : ''}${col.name}</td>
        <td class="col-type">${col.type}</td>
        <td class="col-null">${col.nullable ? 'YES' : 'NO'}</td>
        <td class="col-comment">${escapeHtml(col.comment)}</td>
      </tr>`;
    }).join('');

    return `<div class="table-card">
      <div class="table-header">
        <h3>${table.name}</h3>
        <span class="table-stats">${table.columns.length} fields</span>
      </div>
      <p class="table-comment">${escapeHtml(table.comment)}</p>
      <table class="column-table">
        <thead><tr>
          <th>字段名</th><th>类型</th><th>可空</th><th>注释</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('\n');

  // 外键关系可视化
  const fkRelations = metadata.foreign_keys.map(fk => {
    return `<div class="fk-relation">
      <span class="fk-source">${fk.table_name}.${fk.column_name}</span>
      <span class="fk-arrow">→</span>
      <span class="fk-target">${fk.foreign_table_name}.${fk.foreign_column_name}</span>
      <span class="fk-rule">${fk.delete_rule}</span>
    </div>`;
  }).join('\n');

  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D5F5E3'
  ];

  let tableIndex = 0;
  const relationSvgLines = metadata.foreign_keys.map((fk, i) => {
    const color = colorPalette[(i + 1) % colorPalette.length];
    return `<line x1="0" y1="${20 + i * 22}" x2="40" y2="${20 + i * 22}"
      stroke="${color}" stroke-width="2" marker-end="url(#arrowhead)"/>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>开心农场 - 数据库 ER 图</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
      background: #f5f7fa;
      color: #333;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header .meta { font-size: 14px; opacity: 0.9; }
    .header .stats {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 16px;
    }
    .stat-item {
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
      padding: 12px 24px;
    }
    .stat-item .number { font-size: 24px; font-weight: bold; display: block; }
    .stat-item .label { font-size: 12px; opacity: 0.8; }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }
    .section-title {
      font-size: 20px;
      margin: 24px 0 16px;
      padding-bottom: 8px;
      border-bottom: 3px solid #667eea;
      color: #444;
    }
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 20px;
    }
    .table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .table-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }
    .table-header {
      background: #667eea;
      color: white;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header h3 { font-size: 16px; }
    .table-stats { font-size: 12px; opacity: 0.9; }
    .table-comment { padding: 8px 16px; font-size: 13px; color: #666; border-bottom: 1px solid #eee; }
    .column-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .column-table th {
      background: #f8f9fa;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      color: #555;
      border-bottom: 2px solid #dee2e6;
    }
    .column-table td {
      padding: 6px 12px;
      border-bottom: 1px solid #f0f0f0;
    }
    .column-table tr.pk { background: #fff8e1; }
    .column-table tr.fk { background: #e3f2fd; }
    .column-table tr.pk.fk { background: #f0f4c3; }
    .col-name { font-weight: 500; }
    .col-type {
      font-family: 'Consolas', 'Monaco', monospace;
      color: #e74c3c;
      font-size: 12px;
    }
    .col-null { color: #888; font-size: 12px; text-align: center; }
    .col-comment { color: #666; font-size: 12px; }
    .fk-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      padding: 20px;
      margin-top: 20px;
    }
    .fk-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .fk-relation {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', monospace;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .fk-source { color: #667eea; font-weight: 600; }
    .fk-arrow { color: #999; }
    .fk-target { color: #764ba2; font-weight: 600; }
    .fk-rule {
      background: #e8e8e8;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      color: #666;
    }
    .footer {
      text-align: center;
      padding: 40px;
      color: #999;
      font-size: 13px;
    }
    .legend {
      display: flex;
      gap: 20px;
      margin-bottom: 16px;
      font-size: 13px;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot {
      width: 14px; height: 14px; border-radius: 3px;
    }
    .legend-dot.pk { background: #fff8e1; border: 1px solid #ffc107; }
    .legend-dot.fk { background: #e3f2fd; border: 1px solid #2196f3; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌾 开心农场 - 数据库 ER 图</h1>
    <p class="meta">生成时间: ${new Date().toISOString()} | 项目版本: v2.0.0</p>
    <div class="stats">
      <div class="stat-item">
        <span class="number">${metadata.tables.length}</span>
        <span class="label">数据表</span>
      </div>
      <div class="stat-item">
        <span class="number">${metadata.columns.length}</span>
        <span class="label">字段总数</span>
      </div>
      <div class="stat-item">
        <span class="number">${metadata.foreign_keys.length}</span>
        <span class="label">外键关系</span>
      </div>
      <div class="stat-item">
        <span class="number">${metadata.primary_keys.length}</span>
        <span class="label">主键字段</span>
      </div>
    </div>
  </div>

  <div class="container">
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot pk"></div>
        <span>🔑 主键 (PRIMARY KEY)</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot fk"></div>
        <span>外键 (FOREIGN KEY)</span>
      </div>
    </div>

    <h2 class="section-title">📊 数据表详情 (${metadata.tables.length} 个表)</h2>
    <div class="tables-grid">
      ${tablesHtml}
    </div>

    <h2 class="section-title">🔗 外键关系 (${metadata.foreign_keys.length} 个关系)</h2>
    <div class="fk-section">
      <div class="fk-list">
        ${fkRelations}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>开心农场 © 2026 | 数据库 ER 图自动生成器 v2.0.0</p>
    <p>由 generate-er-diagram.js 自动生成</p>
  </div>
</body>
</html>`;
}

/** HTML 转义 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 主函数 */
async function main() {
  const args = process.argv.slice(2);
  const format = getFormat(args);

  console.log('===== 数据库 ER 图生成器 v2.0.0 =====\n');

  // 获取配置
  const config = getDbConfig(args);
  console.log(`数据库: ${config.host}:${config.port}/${config.database}`);
  console.log(`输出格式: ${format}`);

  // 连接数据库
  console.log('\n[1/2] 连接数据库并提取元数据...');
  let metadata;
  try {
    const pool = new Pool({
      ...config,
      connectionTimeoutMillis: 10000
    });
    metadata = await queryMetadata(pool);
    await pool.end();
    console.log(`  提取到 ${metadata.tables.length} 个表`);
    console.log(`  提取到 ${metadata.columns.length} 个字段`);
    console.log(`  提取到 ${metadata.foreign_keys.length} 个外键`);
  } catch (err) {
    console.error(`\n❌ 数据库连接失败: ${err.message}`);
    console.error('  请设置正确的数据库连接参数');
    console.error('  用法: node generate-er-diagram.js --db-host <host> --db-port <port> --db-user <user> --db-pass <pass> --db-name <name> --format <mermaid|html|both>');
    process.exit(1);
  }

  // 生成输出
  console.log('\n[2/2] 生成 ER 图...');
  const outputDir = path.resolve(__dirname, '..', '..', 'sql_init');

  if (format === 'mermaid' || format === 'both') {
    const mermaidContent = generateMermaid(metadata);
    const mermaidPath = path.join(outputDir, 'database_er_diagram.md');
    fs.writeFileSync(mermaidPath, mermaidContent, 'utf-8');
    console.log(`✅ Mermaid ER图已生成: ${mermaidPath}`);
  }

  if (format === 'html' || format === 'both') {
    const htmlContent = generateHtml(metadata);
    const htmlPath = path.join(outputDir, 'database_er_diagram.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`✅ HTML ER图已生成: ${htmlPath}`);
  }

  console.log('\n🎉 ER图生成完成！');
}

main().catch(err => {
  console.error('ER图生成器发生错误:', err);
  process.exit(2);
});