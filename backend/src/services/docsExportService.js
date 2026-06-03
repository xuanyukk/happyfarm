/**
 * 文件名：docsExportService.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：数据库文档导出服务，提供从API导出文档的功能
 * 更新记录：
 *   2026-05-01 - v1.0.0 - 初始版本创建
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class DocsExportService {
  constructor() {
    this.pool = null;
    this.docsDir = path.join(__dirname, '../../db_docs');

    // 确保文档目录存在
    if (!fs.existsSync(this.docsDir)) {
      fs.mkdirSync(this.docsDir, { recursive: true });
    }
  }

  /**
   * 初始化数据库连接
   */
  async initPool() {
    if (!this.pool) {
      // 从环境变量获取配置
      const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'happy_farm',
      };

      this.pool = new Pool(config);
    }
  }

  /**
   * 获取所有表名
   */
  async getTables() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      return result.rows.map((row) => row.table_name);
    } finally {
      client.release();
    }
  }

  /**
   * 生成表结构文档（返回内容）
   */
  async generateTableStructureContent() {
    const client = await this.pool.connect();
    try {
      const tables = await this.getTables();
      const content = [];

      content.push('# 数据库表结构说明\n');
      content.push(`生成时间：${new Date().toLocaleString('zh-CN')}\n`);
      content.push(`版本：v1.0.0\n`);
      content.push(`生成方式：后台API动态生成\n\n`);

      content.push('## 📋 目录\n\n');
      content.push('| 序号 | 表名 | 说明 |\n');
      content.push('|------|------|------|\n');

      tables.forEach((table, index) => {
        content.push(`| ${index + 1} | ${table} | - |\n`);
      });
      content.push('\n');

      for (const table of tables) {
        content.push('---\n\n');
        content.push(`## ${table} 表\n`);

        const columnsResult = await client.query(
          `
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
        `,
          [table]
        );

        content.push(
          '| 列名 | 数据类型 | 长度 | 是否可为空 | 默认值 | 注释 |\n'
        );
        content.push(
          '|------|----------|------|------------|--------|------|\n'
        );

        for (const column of columnsResult.rows) {
          const length = column.character_maximum_length || '-';
          const nullable = column.is_nullable === 'YES' ? '是' : '否';
          const defaultVal = column.column_default || '-';

          content.push(
            `| ${column.column_name} | ${column.data_type} | ${length} | ${nullable} | ${defaultVal} | - |\n`
          );
        }

        // 获取主键信息
        const primaryKeyResult = await client.query(
          `
          SELECT kcu.column_name
          FROM information_schema.table_constraints tco
          JOIN information_schema.key_column_usage kcu 
            ON tco.constraint_schema = kcu.constraint_schema
            AND tco.constraint_name = kcu.constraint_name
          WHERE tco.constraint_type = 'PRIMARY KEY'
            AND tco.table_schema = 'public'
            AND tco.table_name = $1
        `,
          [table]
        );

        if (primaryKeyResult.rows.length > 0) {
          const primaryKeys = primaryKeyResult.rows
            .map((row) => row.column_name)
            .join(', ');
          content.push(`\n**主键**：${primaryKeys}\n`);
        }

        // 获取外键信息
        const foreignKeyResult = await client.query(
          `
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
        `,
          [table]
        );

        if (foreignKeyResult.rows.length > 0) {
          content.push('\n**外键**：\n');
          for (const fk of foreignKeyResult.rows) {
            content.push(
              `- ${fk.foreign_column} → ${fk.referenced_table}.${fk.referenced_column}\n`
            );
          }
        }

        content.push('\n');
      }

      return content.join('');
    } finally {
      client.release();
    }
  }

  /**
   * 生成表数据文档（返回内容）
   */
  async generateTableDataContent() {
    const client = await this.pool.connect();
    try {
      const tables = await this.getTables();
      const content = [];

      content.push('# 数据库表数据内容说明\n');
      content.push(`生成时间：${new Date().toLocaleString('zh-CN')}\n`);
      content.push(`版本：v1.0.0\n`);
      content.push(`生成方式：后台API动态生成\n\n`);

      let totalRows = 0;
      const tableStats = [];

      for (const table of tables) {
        content.push(`## ${table} 表数据\n`);

        const columnsResult = await client.query(
          `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `,
          [table]
        );

        const columns = columnsResult.rows.map((row) => row.column_name);

        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const rowCount = parseInt(countResult.rows[0].count);
        totalRows += rowCount;
        tableStats.push({ table, count: rowCount });

        content.push(`**数据行数**：${rowCount}\n\n`);

        if (rowCount > 0) {
          const dataResult = await client.query(
            `SELECT * FROM ${table} LIMIT 10`
          );

          if (dataResult.rows.length > 0) {
            content.push('| ' + columns.join(' | ') + ' |\n');
            content.push('| ' + columns.map(() => '---').join(' | ') + ' |\n');

            for (const row of dataResult.rows) {
              const values = columns.map((col) => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (typeof value === 'object' && value instanceof Date)
                  return value.toISOString();
                if (typeof value === 'object') {
                  try {
                    return JSON.stringify(value);
                  } catch (e) {
                    return String(value);
                  }
                }
                return String(value).replace(/\n/g, '\\n');
              });
              content.push('| ' + values.join(' | ') + ' |\n');
            }

            if (rowCount > 10) {
              content.push(`\n*注：仅显示前10条数据，共 ${rowCount} 条*\n`);
            }
          }
        } else {
          content.push('**暂无数据**\n');
        }

        content.push('\n');
      }

      // 添加统计信息
      content.push('---\n\n');
      content.push('## 📊 数据统计\n\n');
      content.push('| 表名 | 数据行数 |\n');
      content.push('|------|----------|\n');
      tableStats.forEach((stat) => {
        content.push(`| ${stat.table} | ${stat.count} |\n`);
      });
      content.push(`| **总计** | **${totalRows}** |\n`);

      return content.join('');
    } finally {
      client.release();
    }
  }

  /**
   * 导出文档（保存到文件）
   */
  async exportDocs() {
    await this.initPool();

    const structureContent = await this.generateTableStructureContent();
    const dataContent = await this.generateTableDataContent();

    const structureFile = path.join(this.docsDir, 'table_structure.md');
    const dataFile = path.join(this.docsDir, 'table_data.md');

    fs.writeFileSync(structureFile, structureContent, 'utf8');
    fs.writeFileSync(dataFile, dataContent, 'utf8');

    return {
      success: true,
      structureFile: 'db_docs/table_structure.md',
      dataFile: 'db_docs/table_data.md',
    };
  }

  /**
   * 获取文档内容（用于直接返回）
   */
  async getDocContent(type) {
    await this.initPool();

    if (type === 'structure') {
      return await this.generateTableStructureContent();
    } else if (type === 'data') {
      return await this.generateTableDataContent();
    }

    throw new Error('无效的文档类型');
  }
}

module.exports = new DocsExportService();
