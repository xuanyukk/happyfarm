/**
 * 文件名: adminDatabaseService.js
 * 作者: Trae AI
 * 日期: 2026-05-31
 * 版本: v1.0.0
 * 功能描述: 管理后台数据库管理服务，提供数据库状态查询和索引分析
 * 更新记录:
 *   2026-05-31 - v1.0.0 - 初始版本创建
 */

const pool = require('../config/db');
const logger = require('../config/logger');

/**
 * 获取数据库基本信息
 * @returns {Object} 数据库信息
 */
async function getDatabaseInfo() {
  try {
    const versionQuery = 'SELECT version()';
    const versionResult = await pool.query(versionQuery);

    const sizeQuery = `
      SELECT
        schemaname AS schema_name,
        pg_size_pretty(pg_database_size(current_database())) AS database_size,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS table_count,
        (SELECT COUNT(*) FROM pg_stat_activity) AS active_connections
    `;
    const sizeResult = await pool.query(sizeQuery);

    const activityQuery = `
      SELECT pid, usename, application_name, client_addr, state, query_start
      FROM pg_stat_activity
      WHERE state IS NOT NULL
      ORDER BY query_start DESC
      LIMIT 20
    `;
    const activityResult = await pool.query(activityQuery);

    return {
      version: versionResult.rows[0].version,
      size: sizeResult.rows[0],
      connections: activityResult.rows,
    };
  } catch (error) {
    logger.error('获取数据库信息失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取数据库表信息
 * @returns {Array} 表列表
 */
async function getDbTables() {
  try {
    const query = `
      SELECT
        schemaname AS schema_name,
        tablename AS table_name,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
        n_live_tup AS estimated_rows
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
      LIMIT 50
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('获取数据表信息失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取索引信息
 * @returns {Array} 索引列表
 */
async function getDbIndexes() {
  try {
    const query = `
      SELECT
        schemaname AS schema_name,
        tablename AS table_name,
        indexname AS index_name,
        indexdef AS index_definition,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
        idx_scan AS scans,
        idx_tup_read AS tuples_read,
        idx_tup_fetch AS tuples_fetched
      FROM pg_stat_user_indexes
      JOIN pg_index ON indexrelid = indexrelid
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 50
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('获取索引信息失败', { error: error.message });
    throw error;
  }
}

/**
 * 获取未使用的索引
 * @returns {Array} 未使用索引列表
 */
async function getDbUnusedIndexes() {
  try {
    const query = `
      SELECT
        schemaname AS schema_name,
        tablename AS table_name,
        indexname AS index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
        idx_scan AS scans,
        idx_tup_read AS tuples_read
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      ORDER BY pg_relation_size(indexrelid) DESC
      LIMIT 50
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    logger.error('获取未使用索引失败', { error: error.message });
    throw error;
  }
}

module.exports = {
  getDatabaseInfo,
  getDbTables,
  getDbIndexes,
  getDbUnusedIndexes,
};
