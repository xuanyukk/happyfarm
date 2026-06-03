/**
 * 文件名：database-migration.js
 * 作者：开发团队
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：数据库迁移管理工具
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

/**
 * @typedef {Object} Migration
 * @property {number} id - 迁移ID
 * @property {string} name - 迁移名称
 * @property {string} up - 升级SQL
 * @property {string} down - 降级SQL
 * @property {Date} appliedAt - 执行时间
 */

class DatabaseMigration {
  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'happy_farm',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT) || 5432,
    });
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  /**
   * 初始化迁移表
   * @returns {Promise<void>}
   */
  async initializeMigrationTable() {
    const client = await this.pool.connect();
    try {
      const checkTable = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'schema_migrations'
        );
      `;
      const result = await client.query(checkTable);
      const tableExists = result.rows[0].exists;

      if (!tableExists) {
        const createTable = `
          CREATE TABLE schema_migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await client.query(createTable);
        console.log('✅ schema_migrations 表创建成功');
      }
    } finally {
      client.release();
    }
  }

  /**
   * 获取已执行的迁移
   * @returns {Promise<string[]>}
   */
  async getAppliedMigrations() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT name FROM schema_migrations ORDER BY id'
      );
      return result.rows.map(row => row.name);
    } finally {
      client.release();
    }
  }

  /**
   * 获取所有可用的迁移
   * @returns {Promise<string[]>}
   */
  getAvailableMigrations() {
    if (!fs.existsSync(this.migrationsDir)) {
      return [];
    }
    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * 执行迁移升级
   * @param {string} migrationName - 迁移文件名
   * @returns {Promise<void>}
   */
  async applyMigration(migrationName) {
    const migrationPath = path.join(this.migrationsDir, migrationName);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [migrationName]
      );
      await client.query('COMMIT');
      console.log(`✅ 迁移执行成功: ${migrationName}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ 迁移执行失败: ${migrationName}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 执行所有未执行的迁移
   * @returns {Promise<void>}
   */
  async migrateUp() {
    await this.initializeMigrationTable();
    const applied = await this.getAppliedMigrations();
    const available = this.getAvailableMigrations();
    const pending = available.filter(name => !applied.includes(name));

    if (pending.length === 0) {
      console.log('✅ 数据库已是最新状态');
      return;
    }

    console.log(`📦 待执行迁移: ${pending.length} 个`);
    for (const migration of pending) {
      await this.applyMigration(migration);
    }
    console.log('🎉 所有迁移执行完成');
  }

  /**
   * 创建新迁移
   * @param {string} name - 迁移名称
   * @returns {void}
   */
  createMigration(name) {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `-- 文件名: ${filename}
-- 描述: ${name}
-- 创建时间: ${new Date().toISOString()}

-- 升级 SQL
BEGIN;

-- TODO: 添加升级 SQL

COMMIT;
`;

    fs.writeFileSync(filepath, template);
    console.log(`✅ 迁移文件已创建: ${filepath}`);
  }

  /**
   * 显示迁移状态
   * @returns {Promise<void>}
   */
  async status() {
    await this.initializeMigrationTable();
    const applied = await this.getAppliedMigrations();
    const available = this.getAvailableMigrations();

    console.log('\n📊 数据库迁移状态\n');
    console.log('已执行的迁移:');
    for (const migration of applied) {
      console.log(`  ✅ ${migration}`);
    }
    console.log('\n待执行的迁移:');
    const pending = available.filter(name => !applied.includes(name));
    if (pending.length === 0) {
      console.log('  无待执行迁移');
    } else {
      for (const migration of pending) {
        console.log(`  ⏳ ${migration}`);
      }
    }
  }
}

const cli = new DatabaseMigration();
const command = process.argv[2];

async function main() {
  switch (command) {
    case 'status':
      await cli.status();
      break;
    case 'up':
      await cli.migrateUp();
      break;
    case 'create':
      const name = process.argv[3];
      if (!name) {
        console.error('❌ 请提供迁移名称: node database-migration create migration-name');
        process.exit(1);
      }
      cli.createMigration(name);
      break;
    default:
      console.log(`
📦 开心农场数据库迁移工具

用法:
  node database-migration status     # 查看迁移状态
  node database-migration up         # 执行所有待执行的迁移
  node database-migration create <name>  # 创建新迁移
      `);
  }
}

main().catch(console.error);
