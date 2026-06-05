/**
 * 文件名：db.js
 * 作者：开发者
 * 日期：2026-05-12
 * 版本：v1.4.0
 * 功能描述：数据库连接配置，包含连接池优化、查询缓存、慢查询监控、索引优化支持
 * 更新记录：
 *   2026-03-19 - v1.1.0 - 数据库连接配置，包含连接池优化
 *   2026-05-07 - v1.2.0 - 添加查询缓存、慢查询监控、连接池优化增强
 *   2026-05-12 - v1.3.0 - 添加索引优化管理功能、数据库性能分析功能
 *   2026-05-24 - v1.4.0 - 缓存管理器新增invalidateTable方法，支持写操作后主动失效缓存
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const logger = require('./logger');
const crypto = require('crypto');

// 加载环境变量
dotenv.config({
  debug: process.env.NODE_ENV === 'development',
});

// 打印环境变量信息
logger.debug('环境变量加载情况', {
  databaseUrl: process.env.DATABASE_URL,
  databaseUrlType: typeof process.env.DATABASE_URL,
});

// 数据库连接池配置 - 优化版
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Docker环境中禁用SSL

  // 连接池大小配置 - 根据并发负载优化
  max: parseInt(process.env.DB_POOL_MAX) || 25, // 增加最大连接数，提高并发能力
  min: parseInt(process.env.DB_POOL_MIN) || 5, // 增加最小连接数，减少连接开销
  idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 60000, // 空闲连接超时（60秒）
  connectionTimeoutMillis:
    parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT) || 5000, // 连接超时（5秒）
  statement_timeout: parseInt(process.env.DB_POOL_STATEMENT_TIMEOUT) || 60000, // 语句超时（60秒）

  // 连接生命周期管理
  maxUses: parseInt(process.env.DB_POOL_MAX_USES) || 10000, // 连接最大使用次数
  maxLifetimeSeconds: parseInt(process.env.DB_POOL_MAX_LIFETIME) || 7200, // 连接最大生命周期（2小时）

  // 性能优化配置
  keepAlive: true, // 保持连接活跃
  keepAliveInitialDelayMillis: 30000, // 30秒后开始保持活跃
};

const pool = new Pool(poolConfig);

// 查询缓存配置
const queryCache = new Map();
const CACHE_ENABLED = process.env.DB_CACHE_ENABLED !== 'false';
const CACHE_TTL = parseInt(process.env.DB_CACHE_TTL) || 30000; // 默认30秒缓存
const CACHE_MAX_SIZE = parseInt(process.env.DB_CACHE_MAX_SIZE) || 1000; // 最大缓存1000条

// 慢查询监控配置
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000; // 1秒以上视为慢查询

// 生成查询缓存键
function generateCacheKey(query, params) {
  const hash = crypto.createHash('md5');
  hash.update(query + JSON.stringify(params || []));
  return hash.digest('hex');
}

// 查询缓存管理器
const cacheManager = {
  get(key) {
    if (!CACHE_ENABLED) return null;
    const cached = queryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      queryCache.delete(key);
      return null;
    }

    return cached.data;
  },

  set(key, data, ttl = CACHE_TTL) {
    if (!CACHE_ENABLED) return;

    // 清理过期缓存
    if (queryCache.size >= CACHE_MAX_SIZE) {
      const now = Date.now();
      for (const [k, v] of queryCache.entries()) {
        if (now > v.expiresAt) {
          queryCache.delete(k);
        }
      }
      // 如果还满，删除最早的
      if (queryCache.size >= CACHE_MAX_SIZE) {
        const firstKey = queryCache.keys().next().value;
        queryCache.delete(firstKey);
      }
    }

    queryCache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  },

  clear() {
    queryCache.clear();
    logger.info('查询缓存已清空');
  },

  // 按表名模式清除缓存（用于写操作后失效相关缓存）
  // 优先按表名前缀精确清除，回退到全量清除
  invalidateTable(tableName) {
    if (!CACHE_ENABLED) return 0;
    let count = 0;

    if (tableName) {
      // 按表名前缀精确清除关联缓存
      const prefix = `query:${tableName}`;
      for (const [key] of queryCache.entries()) {
        if (key.startsWith(prefix)) {
          queryCache.delete(key);
          count++;
        }
      }
      if (count > 0) {
        logger.debug('缓存精确失效', { tableName, clearedCount: count });
      }
    }

    // 如果精确清除没有命中，或未指定表名，执行全量清除
    if (count === 0) {
      for (const [key] of queryCache.entries()) {
        queryCache.delete(key);
        count++;
      }
      logger.debug('缓存全量失效', { tableName: tableName || 'unknown', clearedCount: count });
    }

    return count;
  },

  getStats() {
    return {
      size: queryCache.size,
      maxSize: CACHE_MAX_SIZE,
      enabled: CACHE_ENABLED,
    };
  },
};

// 监听数据库连接错误
pool.on('error', (err) => {
  logger.error('数据库连接错误', { error: err.message, stack: err.stack });
});

// 监听连接获取
pool.on('acquire', (client) => {
  logger.debug('获取数据库连接', { clientId: client?.processID || 'unknown' });
});

// 监听连接释放
pool.on('release', (client) => {
  logger.debug('释放数据库连接', { clientId: client?.processID || 'unknown' });
});

// 测试数据库连接
pool.connect((err, client, release) => {
  if (err) {
    logger.error('数据库连接失败', { error: err.message, stack: err.stack });
    return;
  }
  logger.info('数据库连接成功');
  release();
});

// 包装查询函数，添加日志、缓存、慢查询监控
const originalQuery = pool.query;
pool.query = async function (...args) {
  const start = Date.now();
  const query = args[0];
  const params = args[1];

  // 检查是否是SELECT查询且应该缓存
  const isSelect =
    typeof query === 'string' &&
    query.trim().toUpperCase().startsWith('SELECT');
  const shouldCache =
    isSelect && CACHE_ENABLED && !query.includes('FOR UPDATE');

  // 尝试从缓存获取
  if (shouldCache) {
    const cacheKey = generateCacheKey(query, params);
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      const duration = Date.now() - start;
      logger.debug('数据库查询命中缓存', {
        duration: `${duration}ms`,
        query: query.substring(0, 100),
      });
      return cached;
    }
  }

  try {
    logger.debug('数据库查询开始', {
      query:
        typeof query === 'string'
          ? query.substring(0, 100)
          : 'prepared statement',
    });

    const result = await originalQuery.apply(pool, args);
    const duration = Date.now() - start;

    // 慢查询监控
    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn('慢查询检测', {
        duration: `${duration}ms`,
        query:
          typeof query === 'string'
            ? query.substring(0, 200)
            : 'prepared statement',
        rows: result.rowCount,
        threshold: `${SLOW_QUERY_THRESHOLD}ms`,
      });
    } else {
      logger.debug('数据库查询完成', {
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    // 缓存结果
    if (shouldCache) {
      const cacheKey = generateCacheKey(query, params);
      cacheManager.set(cacheKey, result);
    }

    return result;
  } catch (err) {
    const duration = Date.now() - start;
    logger.error('数据库查询失败', {
      duration: `${duration}ms`,
      error: err.message,
      stack: err.stack,
      query:
        typeof query === 'string'
          ? query.substring(0, 100)
          : 'prepared statement',
    });
    throw err;
  }
};

// 索引优化管理功能
const indexManager = {
  // 获取所有索引信息
  async getIndexStats() {
    try {
      const result = await originalQuery.apply(pool, [
        `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(schemaname || '.' || indexname)) as index_size
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
      `,
      ]);
      return result.rows;
    } catch (err) {
      logger.error('获取索引统计信息失败', { error: err.message });
      throw err;
    }
  },

  // 获取未使用的索引
  async getUnusedIndexes() {
    try {
      const result = await originalQuery.apply(pool, [
        `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef,
          pg_size_pretty(pg_relation_size(schemaname || '.' || indexname)) as index_size
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        ORDER BY pg_relation_size(schemaname || '.' || indexname) DESC
      `,
      ]);
      return result.rows;
    } catch (err) {
      logger.error('获取未使用索引失败', { error: err.message });
      throw err;
    }
  },

  // 获取表大小统计
  async getTableSizes() {
    try {
      const result = await originalQuery.apply(pool, [
        `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
          pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) as index_size,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
      `,
      ]);
      return result.rows;
    } catch (err) {
      logger.error('获取表大小统计失败', { error: err.message });
      throw err;
    }
  },

  // 获取慢查询统计（需要开启pg_stat_statements扩展）
  async getSlowQueries() {
    try {
      const result = await originalQuery.apply(pool, [
        `
        SELECT 
          queryid,
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 20
      `,
      ]);
      return result.rows;
    } catch (err) {
      logger.warn('获取慢查询统计失败（可能需要pg_stat_statements扩展）', {
        error: err.message,
      });
      return [];
    }
  },

  // 获取数据库健康状态汇总
  async getHealthStatus() {
    try {
      const [indexStats, tableSizes, slowQueries] = await Promise.all([
        this.getIndexStats(),
        this.getTableSizes(),
        this.getSlowQueries(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        indexes: {
          total: indexStats.length,
          unused: indexStats.filter((i) => i.idx_scan === 0).length,
          topUsed: indexStats.slice(0, 10),
        },
        tables: tableSizes,
        slowQueries: slowQueries,
      };
    } catch (err) {
      logger.error('获取数据库健康状态失败', { error: err.message });
      throw err;
    }
  },
};

// 导出缓存管理器和索引管理器
pool.cache = cacheManager;
pool.indexManager = indexManager;

module.exports = pool;
