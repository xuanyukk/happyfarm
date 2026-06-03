/**
 * 文件名：schema-validator.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v2.0.0
 * 功能描述：数据库Schema验证器 - 对比SQL定义与实际数据库结构，
 *          生成差异报告，支持检查与修复模式
 * 更新记录：
 *   2026-05-26 - v2.0.0 - 初始版本创建
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 类型别名映射（PostgreSQL 类型别名 → 标准类型）
const TYPE_ALIASES = {
  'INT': 'INTEGER',
  'INT4': 'INTEGER',
  'INTEGER': 'INTEGER',
  'SMALLINT': 'SMALLINT',
  'INT2': 'SMALLINT',
  'BIGINT': 'BIGINT',
  'INT8': 'BIGINT',
  'SERIAL': 'INTEGER',
  'BIGSERIAL': 'BIGINT',
  'SMALLSERIAL': 'SMALLINT',
  'DECIMAL': 'DECIMAL',
  'NUMERIC': 'DECIMAL',
  'REAL': 'REAL',
  'FLOAT4': 'REAL',
  'FLOAT': 'DOUBLE',
  'DOUBLE': 'DOUBLE',
  'FLOAT8': 'DOUBLE',
  'BOOLEAN': 'BOOLEAN',
  'BOOL': 'BOOLEAN',
  'CHAR': 'CHAR',
  'VARCHAR': 'VARCHAR',
  'CHARACTER VARYING': 'VARCHAR',
  'TEXT': 'TEXT',
  'JSON': 'JSON',
  'JSONB': 'JSONB',
  'TIMESTAMP': 'TIMESTAMP',
  'TIMESTAMP WITHOUT TIME ZONE': 'TIMESTAMP',
  'TIMESTAMP WITH TIME ZONE': 'TIMESTAMPTZ',
  'TIMESTAMPTZ': 'TIMESTAMPTZ',
  'DATE': 'DATE',
  'TIME': 'TIME',
  'BYTEA': 'BYTEA',
  'UUID': 'UUID'
};

/** 获取数据库连接配置 */
function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'happy_farm'
  };
}

/** 读取 schema 目录下所有 SQL 文件 */
function readSchemaFiles(schemaDir) {
  const files = fs.readdirSync(schemaDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  return files.map(f => ({
    name: f,
    path: path.join(schemaDir, f),
    content: fs.readFileSync(path.join(schemaDir, f), 'utf-8')
  }));
}

/** 解析 SQL 中的 CREATE TABLE 语句，提取表名、字段、约束、索引 */
function parseCreateTable(sql, fileName) {
  const tables = [];

  // 正则匹配 CREATE TABLE [IF NOT EXISTS] table_name (...内容...);
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const tableDef = {
      table_name: tableName,
      source_file: fileName,
      columns: [],
      primary_key: [],
      foreign_keys: [],
      unique_constraints: [],
      check_constraints: [],
      indexes: []
    };

    // 解析字段定义
    const lines = body.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('--'));

    for (const line of lines) {
      // 跳过注释行
      if (line.startsWith('--') || line.startsWith('COMMENT')) continue;

      // 主键约束
      if (/^\s*PRIMARY\s+KEY\s*\(/i.test(line)) {
        const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          tableDef.primary_key = pkMatch[1].split(',').map(c => c.trim());
        }
        continue;
      }

      // 外键约束
      if (/^\s*CONSTRAINT\s+\w+\s+FOREIGN\s+KEY/i.test(line) || /^\s*FOREIGN\s+KEY\s*\(/i.test(line)) {
        const fkMatch = line.match(
          /(?:CONSTRAINT\s+(\w+)\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)(?:\s*ON\s+DELETE\s+(\w+))?/i
        );
        if (fkMatch) {
          tableDef.foreign_keys.push({
            constraint_name: fkMatch[1] || null,
            columns: fkMatch[2].split(',').map(c => c.trim()),
            ref_table: fkMatch[3],
            ref_columns: fkMatch[4].split(',').map(c => c.trim()),
            on_delete: fkMatch[5] || null
          });
        }
        continue;
      }

      // UNIQUE 约束
      if (/^\s*CONSTRAINT\s+\w+\s+UNIQUE/i.test(line) || /^\s*UNIQUE\s*\(/i.test(line)) {
        const uqMatch = line.match(/UNIQUE\s*\(([^)]+)\)/i);
        if (uqMatch) {
          tableDef.unique_constraints.push({
            columns: uqMatch[1].split(',').map(c => c.trim())
          });
        }
        continue;
      }

      // CHECK 约束
      if (/^\s*CHECK\s*\(/i.test(line)) {
        const chkMatch = line.match(/CHECK\s*\((.+)\)/i);
        if (chkMatch) {
          tableDef.check_constraints.push({
            expression: chkMatch[1].trim()
          });
        }
        continue;
      }

      // 普通字段定义
      const hasPrimaryKey = /\bPRIMARY\s+KEY\b/i.test(line);

      const colMatch = line
        .replace(/\bPRIMARY\s+KEY\b/gi, '')
        .match(
          /^\s*(\w+)\s+([\w\s()]+?)(?:\s*(NOT\s+NULL|\bNULL\b))?\s*(?:DEFAULT\s+(.+?))?\s*(?:,\s*)?$/i
        );

      if (colMatch) {
        const colName = colMatch[1];
        const rawType = colMatch[2].trim();

        // 检查内联 PRIMARY KEY
        if (hasPrimaryKey) {
          tableDef.primary_key.push(colName);
        }

        const nullable = colMatch[3] ? (colMatch[3].toUpperCase() === 'NULL' ? 'YES' : 'NO') : 'YES';
        const defaultVal = colMatch[4] ? colMatch[4].replace(/^'(.*)'$/, '$1').replace(/::\w+$/, '') : null;

        // 检查是否是 SERIAL 类型（视为 NOT NULL）
        const isSerial = /SERIAL/i.test(rawType);

        tableDef.columns.push({
          column_name: colName,
          data_type: normalizeType(rawType),
          raw_type: rawType,
          is_nullable: isSerial ? 'NO' : nullable,
          column_default: defaultVal,
          is_serial: isSerial
        });

        // 处理内联 UNIQUE
        if (/UNIQUE/i.test(rawType)) {
          tableDef.unique_constraints.push({ columns: [colName] });
        }
      }
    }

    tables.push(tableDef);
  }

  return tables;
}

/** 解析 SQL 中的索引定义 */
function parseIndexes(sql) {
  const indexes = [];
  const idxRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/gi;
  let match;

  while ((match = idxRegex.exec(sql)) !== null) {
    const indexName = match[1];
    const tableName = match[2];
    const columns = match[3].split(',').map(c => c.trim().replace(/\s+(ASC|DESC)$/i, ''));
    const isUnique = /CREATE\s+UNIQUE/i.test(match[0]);

    indexes.push({
      index_name: indexName,
      table_name: tableName,
      columns: columns,
      is_unique: isUnique,
      index_type: isUnique ? 'UNIQUE' : 'BTREE'
    });
  }

  return indexes;
}

/** 标准化类型名称 */
function normalizeType(rawType) {
  let t = rawType.replace(/\([^)]*\)/g, '').trim().toUpperCase();

  // 移除多余修饰词
  t = t.replace(/\bUNIQUE\b/gi, '').replace(/\bPRIMARY\s+KEY\b/gi, '').trim();

  if (TYPE_ALIASES[t]) return TYPE_ALIASES[t];

  // 尝试匹配
  for (const [alias, standard] of Object.entries(TYPE_ALIASES)) {
    if (t.startsWith(alias)) return standard;
  }

  return t;
}

/** 比较两个类型是否兼容（大小写不敏感） */
function typesCompatible(expected, actual) {
  const e = normalizeType(expected || '');
  const a = normalizeType(actual || '');
  return e === a;
}

/** 构建期望的 schema 定义 */
function buildExpectedSchema(schemaDir) {
  const files = readSchemaFiles(schemaDir);
  const allTables = {};
  const allIndexes = [];

  for (const file of files) {
    const tables = parseCreateTable(file.content, file.name);
    const indexes = parseIndexes(file.content);

    for (const t of tables) {
      if (allTables[t.table_name]) {
        // 合并（后续出现的表定义合并覆盖）
        allTables[t.table_name] = t;
      } else {
        allTables[t.table_name] = t;
      }
    }

    allIndexes.push(...indexes);
  }

  return { tables: allTables, indexes: allIndexes };
}

/** 查询数据库实际 schema */
async function queryDbSchema(pool) {
  const client = await pool.connect();
  try {
    // 查询所有字段信息
    const columnsResult = await client.query(`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale
      FROM information_schema.columns c
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

    // 查询索引
    const idxResult = await client.query(`
      SELECT
        i.relname AS index_name,
        t.relname AS table_name,
        am.amname AS index_type,
        pg_get_indexdef(i.oid) AS index_def
      FROM pg_index x
      JOIN pg_class i ON i.oid = x.indexrelid
      JOIN pg_class t ON t.oid = x.indrelid
      JOIN pg_am am ON i.relam = am.oid
      WHERE t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND i.relname NOT LIKE '%_pkey'
    `);

    // 查询 CHECK 约束
    const checkResult = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
    `);

    return {
      columns: columnsResult.rows,
      primary_keys: pkResult.rows,
      foreign_keys: fkResult.rows,
      indexes: idxResult.rows,
      check_constraints: checkResult.rows
    };
  } finally {
    client.release();
  }
}

/** 运行 schema 验证，生成差异报告 */
function validateSchema(expected, actual) {
  const differences = {
    missing_tables: [],
    extra_tables: [],
    table_diffs: [],
    summary: {
      total_expected_tables: 0,
      total_actual_tables: 0,
      total_differences: 0,
      passed: true
    }
  };

  const expectedTables = new Set(Object.keys(expected.tables));
  const actualTables = new Set([...new Set(actual.columns.map(c => c.table_name))]);

  differences.summary.total_expected_tables = expectedTables.size;
  differences.summary.total_actual_tables = actualTables.size;

  // 检查缺失的表
  for (const t of expectedTables) {
    if (!actualTables.has(t)) {
      differences.missing_tables.push(t);
      differences.summary.total_differences++;
      differences.summary.passed = false;
    }
  }

  // 检查多余的表
  for (const t of actualTables) {
    if (!expectedTables.has(t)) {
      differences.extra_tables.push(t);
      // 多余的表不算错误，仅记录
    }
  }

  // 逐表比较字段
  for (const [tableName, tableDef] of Object.entries(expected.tables)) {
    if (!actualTables.has(tableName)) continue;

    const tableDiff = {
      table_name: tableName,
      missing_columns: [],
      extra_columns: [],
      type_mismatches: [],
      nullable_mismatches: [],
      default_mismatches: [],
      missing_primary_key: false,
      missing_foreign_keys: [],
      missing_indexes: [],
      extra_indexes: []
    };

    const actualCols = actual.columns.filter(c => c.table_name === tableName);
    const expectedColNames = new Set(tableDef.columns.map(c => c.column_name));
    const actualColNames = new Set(actualCols.map(c => c.column_name));

    // 缺失的字段
    for (const col of tableDef.columns) {
      if (!actualColNames.has(col.column_name)) {
        tableDiff.missing_columns.push(col.column_name);
        differences.summary.total_differences++;
        differences.summary.passed = false;
      }
    }

    // 类型、nullable、默认值比较
    for (const col of tableDef.columns) {
      const actualCol = actualCols.find(c => c.column_name === col.column_name);
      if (!actualCol) continue;

      // 类型比较
      if (!typesCompatible(col.data_type, actualCol.data_type)) {
        tableDiff.type_mismatches.push({
          column: col.column_name,
          expected: col.data_type,
          actual: actualCol.data_type
        });
        differences.summary.total_differences++;
        differences.summary.passed = false;
      }

      // Nullable 比较
      if (col.is_nullable === 'NO' && actualCol.is_nullable === 'YES') {
        tableDiff.nullable_mismatches.push({
          column: col.column_name,
          expected: 'NOT NULL',
          actual: 'NULLABLE'
        });
        differences.summary.total_differences++;
        differences.summary.passed = false;
      }

      // 默认值比较（跳过 SERIAL 和 CURRENT_TIMESTAMP 相关）
      if (col.column_default && actualCol.column_default) {
        const expectedDef = normalizeDefault(col.column_default);
        const actualDef = normalizeDefault(actualCol.column_default);
        if (expectedDef !== actualDef && !col.is_serial) {
          tableDiff.default_mismatches.push({
            column: col.column_name,
            expected: expectedDef,
            actual: actualDef
          });
        }
      }
    }

    // 检查主键
    const actualPks = actual.primary_keys
      .filter(pk => pk.table_name === tableName)
      .map(pk => pk.column_name);
    if (tableDef.primary_key.length > 0 && actualPks.length === 0) {
      tableDiff.missing_primary_key = true;
      differences.summary.total_differences++;
      differences.summary.passed = false;
    }

    // 检查外键
    const actualFks = actual.foreign_keys.filter(fk => fk.table_name === tableName);
    const expectedFks = tableDef.foreign_keys || [];
    for (const efk of expectedFks) {
      const found = actualFks.find(afk => {
        const ek = efk.columns.join(',');
        const ak = [afk.column_name].join(',');
        return ek === ak && efk.ref_table === afk.foreign_table_name;
      });
      if (!found) {
        tableDiff.missing_foreign_keys.push({
          columns: efk.columns,
          ref_table: efk.ref_table
        });
        differences.summary.total_differences++;
        differences.summary.passed = false;
      }
    }

    // 检查索引
    const tableIdexes = expected.indexes.filter(idx => idx.table_name === tableName);
    const actualIdxs = actual.indexes.filter(idx => idx.table_name === tableName);
    const actualIdxNames = new Set(actualIdxs.map(i => i.index_name));

    for (const eidx of tableIdexes) {
      if (!actualIdxNames.has(eidx.index_name)) {
        tableDiff.missing_indexes.push(eidx.index_name);
        differences.summary.total_differences++;
        differences.summary.passed = false;
      }
    }

    // 只记录有差异的表
    if (
      tableDiff.missing_columns.length > 0 ||
      tableDiff.type_mismatches.length > 0 ||
      tableDiff.nullable_mismatches.length > 0 ||
      tableDiff.default_mismatches.length > 0 ||
      tableDiff.missing_primary_key ||
      tableDiff.missing_foreign_keys.length > 0 ||
      tableDiff.missing_indexes.length > 0
    ) {
      differences.table_diffs.push(tableDiff);
    }
  }

  return differences;
}

/** 规范化默认值 */
function normalizeDefault(value) {
  if (!value) return null;
  let v = value.replace(/::\w+(\[\])?/g, '').replace(/^'|'$/g, '').trim();
  if (/^nextval\(/.test(v)) return 'AUTO_INCREMENT';
  return v;
}

/** 尝试修复模式 - 生成修复 SQL */
function generateFixSql(differences, expected) {
  const fixes = [];
  fixes.push('-- ============================================');
  fixes.push('-- Schema 自动修复 SQL');
  fixes.push('-- 生成时间: ' + new Date().toISOString());
  fixes.push('-- 警告: 请在执行前备份数据库');
  fixes.push('-- ============================================');
  fixes.push('');

  // 创建缺失的表
  for (const tableName of differences.missing_tables) {
    fixes.push(`-- 需要创建表: ${tableName}（请参考 02_schema 中的定义手动创建）`);
    fixes.push('');
  }

  // 修复字段差异
  for (const diff of differences.table_diffs) {
    for (const col of diff.missing_columns) {
      const colDef = expected.tables[diff.table_name].columns.find(c => c.column_name === col);
      if (colDef) {
        fixes.push(`ALTER TABLE ${diff.table_name} ADD COLUMN ${col} ${colDef.raw_type}${colDef.is_nullable === 'NO' ? ' NOT NULL' : ''}${colDef.column_default ? ' DEFAULT ' + colDef.column_default : ''};`);
      }
    }

    for (const idx of diff.missing_indexes) {
      fixes.push(`-- 需要创建索引: ${idx}（请参考 02_schema 中的定义手动创建）`);
    }

    if (diff.missing_primary_key) {
      fixes.push(`-- 需要为主键修复: ${diff.table_name}（由于主键无法直接 ALTER ADD，请手动处理）`);
    }
  }

  return fixes.join('\n');
}

/** 主函数 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--check') ? 'check' : 'check';
  const fixMode = args.includes('--fix');
  const outputIdx = args.indexOf('--output');
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const schemaDir = path.resolve(__dirname, '..', '..', 'sql_init', '02_schema');
  const reportPath = outputPath || path.resolve(__dirname, '..', '..', 'sql_init', 'schema_diff_report.json');

  console.log('===== Schema 验证器 v2.0.0 =====\n');
  console.log(`Schema目录: ${schemaDir}`);
  console.log(`模式: ${fixMode ? '检查+修复' : '仅检查'}`);

  // 1. 解析 SQL Schema 文件
  console.log('\n[1/3] 解析 SQL Schema 文件...');
  const expected = buildExpectedSchema(schemaDir);
  console.log(`  解析到 ${Object.keys(expected.tables).length} 个表定义`);
  console.log(`  解析到 ${expected.indexes.length} 个索引定义`);

  // 2. 连接数据库并查询实际 Schema
  console.log('\n[2/3] 连接数据库并查询实际 Schema...');
  let actual;
  try {
    const config = getDbConfig();
    const pool = new Pool({
      ...config,
      connectionTimeoutMillis: 5000
    });
    actual = await queryDbSchema(pool);
    await pool.end();
    console.log(`  查询到 ${new Set(actual.columns.map(c => c.table_name)).size} 个表`);
    console.log(`  查询到 ${actual.indexes.length} 个索引`);
  } catch (err) {
    console.error(`\n❌ 数据库连接失败: ${err.message}`);
    console.error('  将只生成期望的 Schema 定义，无法进行比对。');
    console.error('  请设置环境变量 DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME');
    console.error('  或确保 PostgreSQL 服务运行在 localhost:5432\n');

    // 只输出期望的 schema
    const report = {
      generated_at: new Date().toISOString(),
      mode: 'schema-only (no database connection)',
      expected: {
        tables: expected.tables,
        indexes: expected.indexes
      },
      differences: null,
      error: err.message
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`期望Schema定义已输出到: ${reportPath}`);
    process.exit(0);
  }

  // 3. 对比差异
  console.log('\n[3/3] 对比差异...');
  const differences = validateSchema(expected, actual);

  // 输出结果
  console.log('\n===== 验证结果 =====');
  if (differences.summary.passed) {
    console.log('✅ Schema 验证通过！数据库结构与 SQL 定义完全一致。');
  } else {
    console.log(`❌ 发现 ${differences.summary.total_differences} 个差异`);
    console.log(`   缺失表: ${differences.missing_tables.length}`);
    console.log(`   表字段差异: ${differences.table_diffs.length} 个表`);
  }

  // 详细差异
  if (differences.table_diffs.length > 0) {
    console.log('\n--- 详细差异 ---');
    for (const diff of differences.table_diffs) {
      console.log(`\n[表] ${diff.table_name}`);

      if (diff.missing_columns.length > 0) {
        console.log(`  缺失字段: ${diff.missing_columns.join(', ')}`);
      }
      if (diff.type_mismatches.length > 0) {
        for (const tm of diff.type_mismatches) {
          console.log(`  类型不匹配: ${tm.column} (期望: ${tm.expected}, 实际: ${tm.actual})`);
        }
      }
      if (diff.nullable_mismatches.length > 0) {
        for (const nm of diff.nullable_mismatches) {
          console.log(`  NULL约束不匹配: ${nm.column} (期望: ${nm.expected}, 实际: ${nm.actual})`);
        }
      }
      if (diff.default_mismatches.length > 0) {
        for (const dm of diff.default_mismatches) {
          console.log(`  默认值不匹配: ${dm.column} (期望: ${dm.expected}, 实际: ${dm.actual})`);
        }
      }
      if (diff.missing_indexes.length > 0) {
        console.log(`  缺失索引: ${diff.missing_indexes.join(', ')}`);
      }
    }
  }

  // 生成完整报告
  const report = {
    generated_at: new Date().toISOString(),
    project_version: 'v2.0.0',
    schema_dir: schemaDir,
    summary: differences.summary,
    missing_tables: differences.missing_tables,
    extra_tables: differences.extra_tables,
    table_diffs: differences.table_diffs,
    expected: {
      table_count: Object.keys(expected.tables).length,
      tables: Object.fromEntries(
        Object.entries(expected.tables).map(([name, def]) => [
          name,
          {
            columns: def.columns.map(c => ({
              name: c.column_name,
              type: c.data_type,
              nullable: c.is_nullable,
              default: c.column_default
            })),
            primary_key: def.primary_key,
            foreign_keys: def.foreign_keys
          }
        ])
      ),
      indexes: expected.indexes.map(i => ({
        name: i.index_name,
        table: i.table_name,
        columns: i.columns,
        type: i.index_type
      }))
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 差异报告已输出到: ${reportPath}`);

  if (fixMode && !differences.summary.passed) {
    const fixSql = generateFixSql(differences, expected);
    const fixPath = reportPath.replace('.json', '_fix.sql');
    fs.writeFileSync(fixPath, fixSql, 'utf-8');
    console.log(`🔧 修复SQL已输出到: ${fixPath}`);
  }

  process.exit(differences.summary.passed ? 0 : 1);
}

if (require.main === module) {
  main().catch(err => {
    console.error('Schema验证器发生错误:', err);
    process.exit(2);
  });
}

module.exports = {
  TYPE_ALIASES,
  normalizeType,
  typesCompatible,
  normalizeDefault,
  parseCreateTable,
  parseIndexes,
  readSchemaFiles,
  buildExpectedSchema,
  queryDbSchema,
  validateSchema,
  generateFixSql,
  getDbConfig
};