/**
 * 文件名：dbPerformance.test.js
 * 作者：开发者
 * 日期：2026-05-12
 * 版本：v1.0.0
 * 功能描述：数据库性能管理系统单元测试
 * 更新记录：
 *   2026-05-12 - v1.0.0 - 初始版本创建
 */

describe('数据库性能管理系统测试', () => {
  let pool;
  let mockOriginalQuery;
  
  // 模拟依赖
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  
  // 在每个测试前重置模块
  beforeEach(() => {
    jest.resetModules();
    
    // 模拟原始查询函数
    mockOriginalQuery = jest.fn();
    
    // 模拟依赖
    jest.doMock('../src/config/logger', () => mockLogger);
    
    // 清除所有模拟调用
    jest.clearAllMocks();
    
    // 导入模块
    pool = require('../src/config/db');
    
    // 替换原始查询函数
    pool.__originalQuery = mockOriginalQuery;
  });
  
  describe('查询缓存功能', () => {
    test('应该能够获取缓存统计信息', () => {
      const stats = pool.cache.getStats();
      expect(stats).toBeDefined();
      expect(stats.size).toBeDefined();
      expect(stats.maxSize).toBeDefined();
      expect(stats.enabled).toBeDefined();
    });
    
    test('应该能够清空查询缓存', () => {
      pool.cache.clear();
      expect(mockLogger.info).toHaveBeenCalledWith('查询缓存已清空');
    });
  });
  
  describe('索引管理器', () => {
    test('应该能够获取索引统计信息', async () => {
      const mockIndexStats = [
        {
          schemaname: 'public',
          tablename: 'test',
          indexname: 'test_idx',
          indexdef: 'CREATE INDEX',
          idx_scan: 100,
          idx_tup_read: 1000,
          idx_tup_fetch: 800,
          index_size: '8192 bytes'
        }
      ];
      
      mockOriginalQuery.mockResolvedValueOnce({ rows: mockIndexStats });
      
      const result = await pool.indexManager.getIndexStats();
      expect(result).toEqual(mockIndexStats);
    });
    
    test('应该能够获取未使用索引', async () => {
      const mockUnusedIndexes = [
        {
          schemaname: 'public',
          tablename: 'unused_table',
          indexname: 'unused_idx',
          indexdef: 'CREATE INDEX',
          index_size: '16384 bytes'
        }
      ];
      
      mockOriginalQuery.mockResolvedValueOnce({ rows: mockUnusedIndexes });
      
      const result = await pool.indexManager.getUnusedIndexes();
      expect(result).toEqual(mockUnusedIndexes);
    });
    
    test('应该能够获取表大小统计', async () => {
      const mockTableSizes = [
        {
          schemaname: 'public',
          tablename: 'test_table',
          total_size: '1 MB',
          table_size: '819 KB',
          index_size: '204 KB',
          n_tup_ins: 1000,
          n_tup_upd: 50,
          n_tup_del: 10,
          n_live_tup: 990,
          n_dead_tup: 10
        }
      ];
      
      mockOriginalQuery.mockResolvedValueOnce({ rows: mockTableSizes });
      
      const result = await pool.indexManager.getTableSizes();
      expect(result).toEqual(mockTableSizes);
    });
    
    test('应该能够获取慢查询统计', async () => {
      const mockSlowQueries = [
        {
          queryid: 12345,
          query: 'SELECT * FROM test',
          calls: 100,
          total_time: 5000,
          mean_time: 50,
          rows: 1000
        }
      ];
      
      mockOriginalQuery.mockResolvedValueOnce({ rows: mockSlowQueries });
      
      const result = await pool.indexManager.getSlowQueries();
      expect(result).toEqual(mockSlowQueries);
    });
    
    test('应该能够获取数据库健康状态汇总', async () => {
      const mockIndexStats = [];
      const mockTableSizes = [];
      const mockSlowQueries = [];
      
      mockOriginalQuery
        .mockResolvedValueOnce({ rows: mockIndexStats })
        .mockResolvedValueOnce({ rows: mockTableSizes })
        .mockResolvedValueOnce({ rows: mockSlowQueries });
      
      const result = await pool.indexManager.getHealthStatus();
      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.indexes).toBeDefined();
      expect(result.tables).toBeDefined();
      expect(result.slowQueries).toBeDefined();
    });
  });
});
