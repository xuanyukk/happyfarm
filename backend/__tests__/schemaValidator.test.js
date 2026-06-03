/**
 * 文件名：schemaValidator.test.js
 * 作者：开发者
 * 日期：2026-05-26
 * 版本：v2.0.0
 * 功能描述：Schema验证器单元测试 - 测试SQL解析、类型比对、
 *          约束验证、索引验证和差异报告生成
 * 更新记录：
 *   2026-05-26 - v2.0.0 - 初始版本创建
 */

const {
  normalizeType,
  typesCompatible,
  parseCreateTable,
  parseIndexes,
  validateSchema
} = require('../scripts/schema-validator');

// ============================================================
// 测试套件
// ============================================================

describe('Schema Validator', () => {
  // ==========================================================
  // 测试 1: 类型标准化
  // ==========================================================
  describe('类型标准化 (normalizeType)', () => {
    test('INTEGER 别名统一映射', () => {
      expect(normalizeType('INT')).toBe('INTEGER');
      expect(normalizeType('INT4')).toBe('INTEGER');
      expect(normalizeType('INTEGER')).toBe('INTEGER');
    });

    test('SERIAL 映射为基础 INTEGER 类型', () => {
      expect(normalizeType('SERIAL')).toBe('INTEGER');
      expect(normalizeType('BIGSERIAL')).toBe('BIGINT');
      expect(normalizeType('SMALLSERIAL')).toBe('SMALLINT');
    });

    test('BOOLEAN 别名统一映射', () => {
      expect(normalizeType('BOOLEAN')).toBe('BOOLEAN');
      expect(normalizeType('BOOL')).toBe('BOOLEAN');
    });

    test('TIMESTAMP 变体处理', () => {
      expect(normalizeType('TIMESTAMP')).toBe('TIMESTAMP');
      expect(normalizeType('TIMESTAMP WITHOUT TIME ZONE')).toBe('TIMESTAMP');
      expect(normalizeType('TIMESTAMP WITH TIME ZONE')).toBe('TIMESTAMPTZ');
      expect(normalizeType('TIMESTAMPTZ')).toBe('TIMESTAMPTZ');
    });

    test('带参数的类型 (如 VARCHAR(50)) 应去除括号', () => {
      expect(normalizeType('VARCHAR(50)')).toBe('VARCHAR');
      expect(normalizeType('CHARACTER VARYING')).toBe('VARCHAR');
    });
  });

  // ==========================================================
  // 测试 2: 类型兼容性比较
  // ==========================================================
  describe('类型兼容性比较 (typesCompatible)', () => {
    test('相同的标准类型应兼容', () => {
      expect(typesCompatible('INTEGER', 'INTEGER')).toBe(true);
      expect(typesCompatible('VARCHAR', 'VARCHAR')).toBe(true);
      expect(typesCompatible('BOOLEAN', 'BOOLEAN')).toBe(true);
    });

    test('类型别名应互相兼容', () => {
      expect(typesCompatible('INT', 'INTEGER')).toBe(true);
      expect(typesCompatible('INTEGER', 'INT4')).toBe(true);
      expect(typesCompatible('BOOL', 'BOOLEAN')).toBe(true);
    });

    test('SERIAL → INTEGER 兼容性', () => {
      expect(typesCompatible('SERIAL', 'INTEGER')).toBe(true);
      expect(typesCompatible('BIGSERIAL', 'BIGINT')).toBe(true);
    });

    test('TIMESTAMP / TIMESTAMPTZ 不应混同', () => {
      expect(typesCompatible('TIMESTAMP', 'TIMESTAMPTZ')).toBe(false);
      expect(typesCompatible('TIMESTAMP WITH TIME ZONE', 'TIMESTAMP')).toBe(false);
    });

    test('完全不相关的类型不应兼容', () => {
      expect(typesCompatible('VARCHAR', 'INTEGER')).toBe(false);
      expect(typesCompatible('TEXT', 'BOOLEAN')).toBe(false);
      expect(typesCompatible('JSONB', 'BIGINT')).toBe(false);
    });
  });

  // ==========================================================
  // 测试 3: SQL 表定义解析
  // ==========================================================
  describe('SQL 表定义解析 (parseCreateTable)', () => {
    test('解析简单表定义（字段、类型、NOT NULL）', () => {
      const sql = `
        CREATE TABLE test_table (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          score INTEGER DEFAULT 0
        );
      `;
      const tables = parseCreateTable(sql, 'test.sql');
      expect(tables.length).toBe(1);
      expect(tables[0].table_name).toBe('test_table');
      expect(tables[0].columns.length).toBe(3);

      const nameCol = tables[0].columns.find(c => c.column_name === 'name');
      expect(nameCol).toBeDefined();
      expect(nameCol.data_type).toBe('VARCHAR');
      expect(nameCol.is_nullable).toBe('NO');

      const scoreCol = tables[0].columns.find(c => c.column_name === 'score');
      expect(scoreCol.column_default).toBe('0');
    });

    test('解析 SERIAL 类型为主键', () => {
      const sql = `
        CREATE TABLE test_serial (
          id SERIAL PRIMARY KEY,
          data TEXT
        );
      `;
      const tables = parseCreateTable(sql, 'test.sql');
      expect(tables[0].primary_key).toEqual(['id']);
      expect(tables[0].columns[0].is_serial).toBe(true);
      expect(tables[0].columns[0].is_nullable).toBe('NO');
    });

    test('解析外键约束', () => {
      const sql = `
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;
      const tables = parseCreateTable(sql, 'test.sql');
      expect(tables[0].foreign_keys.length).toBe(1);
      expect(tables[0].foreign_keys[0].ref_table).toBe('users');
      expect(tables[0].foreign_keys[0].on_delete).toBe('CASCADE');
    });

    test('解析 CHECK 约束', () => {
      const sql = `
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          price DECIMAL NOT NULL,
          CHECK (price > 0),
          CHECK (price <= 10000)
        );
      `;
      const tables = parseCreateTable(sql, 'test.sql');
      expect(tables[0].check_constraints.length).toBe(2);
      expect(tables[0].check_constraints[0].expression).toContain('price > 0');
    });

    test('解析多个表的 SQL 文件', () => {
      const sql = `
        CREATE TABLE table_a (id SERIAL PRIMARY KEY, name TEXT);
        CREATE TABLE table_b (id SERIAL PRIMARY KEY, value INTEGER);
      `;
      const tables = parseCreateTable(sql, 'multi.sql');
      expect(tables.length).toBe(2);
      expect(tables[0].table_name).toBe('table_a');
      expect(tables[1].table_name).toBe('table_b');
    });
  });

  // ==========================================================
  // 测试 4: 索引解析
  // ==========================================================
  describe('索引解析 (parseIndexes)', () => {
    test('解析普通索引', () => {
      const sql = 'CREATE INDEX idx_name ON users (name);';
      const indexes = parseIndexes(sql);
      expect(indexes.length).toBe(1);
      expect(indexes[0].index_name).toBe('idx_name');
      expect(indexes[0].table_name).toBe('users');
      expect(indexes[0].columns).toEqual(['name']);
      expect(indexes[0].is_unique).toBe(false);
    });

    test('解析唯一索引', () => {
      const sql = 'CREATE UNIQUE INDEX idx_email ON users (email);';
      const indexes = parseIndexes(sql);
      expect(indexes[0].is_unique).toBe(true);
      expect(indexes[0].index_type).toBe('UNIQUE');
    });

    test('解析 IF NOT EXISTS 索引', () => {
      const sql = 'CREATE INDEX IF NOT EXISTS idx_user_id ON orders (user_id);';
      const indexes = parseIndexes(sql);
      expect(indexes.length).toBe(1);
      expect(indexes[0].index_name).toBe('idx_user_id');
    });

    test('解析复合索引（多字段）', () => {
      const sql = 'CREATE INDEX idx_composite ON logs (user_id, action, created_at DESC);';
      const indexes = parseIndexes(sql);
      expect(indexes[0].columns.length).toBe(3);
      expect(indexes[0].columns[0]).toBe('user_id');
      expect(indexes[0].columns[2]).toBe('created_at');
    });
  });

  // ==========================================================
  // 测试 5: Schema 差异验证
  // ==========================================================
  describe('Schema 差异验证 (validateSchema)', () => {
    test('完全匹配的 schema 应该通过', () => {
      const expected = {
        tables: {
          users: {
            table_name: 'users',
            columns: [
              { column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' },
              { column_name: 'name', data_type: 'VARCHAR', is_nullable: 'YES' }
            ],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          }
        },
        indexes: []
      };

      const actual = {
        columns: [
          { table_name: 'users', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
          { table_name: 'users', column_name: 'name', data_type: 'character varying', is_nullable: 'YES' }
        ],
        primary_keys: [
          { table_name: 'users', column_name: 'id' }
        ],
        foreign_keys: [],
        indexes: []
      };

      const result = validateSchema(expected, actual);
      expect(result.summary.passed).toBe(true);
      expect(result.summary.total_differences).toBe(0);
    });

    test('缺失字段应被检测到', () => {
      const expected = {
        tables: {
          users: {
            table_name: 'users',
            columns: [
              { column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' },
              { column_name: 'email', data_type: 'VARCHAR', is_nullable: 'YES' }
            ],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          }
        },
        indexes: []
      };

      const actual = {
        columns: [
          { table_name: 'users', column_name: 'id', data_type: 'integer', is_nullable: 'NO' }
        ],
        primary_keys: [
          { table_name: 'users', column_name: 'id' }
        ],
        foreign_keys: [],
        indexes: []
      };

      const result = validateSchema(expected, actual);
      expect(result.summary.passed).toBe(false);
      expect(result.table_diffs.length).toBeGreaterThan(0);
      expect(result.table_diffs[0].missing_columns).toContain('email');
    });

    test('类型不匹配应被检测到', () => {
      const expected = {
        tables: {
          users: {
            table_name: 'users',
            columns: [
              { column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' },
              { column_name: 'score', data_type: 'INTEGER', is_nullable: 'YES' }
            ],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          }
        },
        indexes: []
      };

      const actual = {
        columns: [
          { table_name: 'users', column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
          { table_name: 'users', column_name: 'score', data_type: 'text', is_nullable: 'YES' }
        ],
        primary_keys: [
          { table_name: 'users', column_name: 'id' }
        ],
        foreign_keys: [],
        indexes: []
      };

      const result = validateSchema(expected, actual);
      expect(result.summary.passed).toBe(false);
      expect(result.table_diffs[0].type_mismatches.length).toBeGreaterThan(0);
      const tm = result.table_diffs[0].type_mismatches[0];
      expect(tm.column).toBe('score');
      expect(tm.expected).toBe('INTEGER');
    });

    test('NOT NULL 约束不匹配应被检测到', () => {
      const expected = {
        tables: {
          users: {
            table_name: 'users',
            columns: [
              { column_name: 'username', data_type: 'VARCHAR', is_nullable: 'NO' }
            ],
            primary_key: [],
            foreign_keys: [],
            check_constraints: []
          }
        },
        indexes: []
      };

      const actual = {
        columns: [
          { table_name: 'users', column_name: 'username', data_type: 'character varying', is_nullable: 'YES' }
        ],
        primary_keys: [],
        foreign_keys: [],
        indexes: []
      };

      const result = validateSchema(expected, actual);
      expect(result.summary.passed).toBe(false);
      expect(result.table_diffs[0].nullable_mismatches.length).toBeGreaterThan(0);
    });

    test('缺失表应被检测到', () => {
      const expected = {
        tables: {
          users: {
            table_name: 'users',
            columns: [{ column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' }],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          },
          orders: {
            table_name: 'orders',
            columns: [{ column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' }],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          }
        },
        indexes: []
      };

      const actual = {
        columns: [
          { table_name: 'users', column_name: 'id', data_type: 'integer', is_nullable: 'NO' }
        ],
        primary_keys: [
          { table_name: 'users', column_name: 'id' }
        ],
        foreign_keys: [],
        indexes: []
      };

      const result = validateSchema(expected, actual);
      expect(result.summary.passed).toBe(false);
      expect(result.missing_tables).toContain('orders');
    });

    test('缺少主键应被检测到', () => {
      const expected = {
        tables: {
          users: {
            table_name: 'users',
            columns: [{ column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' }],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          }
        },
        indexes: []
      };

      const actual = {
        columns: [
          { table_name: 'users', column_name: 'id', data_type: 'integer', is_nullable: 'NO' }
        ],
        primary_keys: [],
        foreign_keys: [],
        indexes: []
      };

      const result = validateSchema(expected, actual);
      expect(result.summary.passed).toBe(false);
      expect(result.table_diffs[0].missing_primary_key).toBe(true);
    });

    test('差异报告应包含正确的摘要信息', () => {
      const expected = {
        tables: {
          t1: {
            table_name: 't1',
            columns: [{ column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' }],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          },
          t2: {
            table_name: 't2',
            columns: [{ column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' }],
            primary_key: ['id'],
            foreign_keys: [],
            check_constraints: []
          }
        },
        indexes: []
      };

      const actual = {
        columns: [
          { table_name: 't1', column_name: 'id', data_type: 'integer', is_nullable: 'NO' }
        ],
        primary_keys: [
          { table_name: 't1', column_name: 'id' }
        ],
        foreign_keys: [],
        indexes: []
      };

      const result = validateSchema(expected, actual);
      expect(result.summary.total_expected_tables).toBe(2);
      expect(result.summary.total_actual_tables).toBe(1);
      expect(result.summary.total_differences).toBeGreaterThan(0);
    });
  });
});