/**
 * 文件名：cacheService.test.js
 * 作者：开发者
 * 日期：2026-05-12
 * 版本：v1.0.0
 * 功能描述：缓存服务单元测试
 * 更新记录：
 *   2026-05-12 - v1.0.0 - 初始版本创建
 */

describe('缓存服务测试', () => {
  let cacheService;
  
  // 模拟依赖
  const mockRedisClient = {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    flushdb: jest.fn(),
    info: jest.fn(),
  };
  
  const mockPool = {
    query: jest.fn(),
  };
  
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  
  // 在每个测试前重置模块
  beforeEach(() => {
    jest.resetModules();
    
    // 模拟依赖
    jest.doMock('../src/config/redis', () => mockRedisClient);
    jest.doMock('../src/config/logger', () => mockLogger);
    jest.doMock('../src/config/db', () => mockPool);
    
    // 清除所有模拟调用
    jest.clearAllMocks();
    
    // 导入模块
    cacheService = require('../src/services/cacheService');
  });
  
  describe('基础缓存操作', () => {
    test('应该能够设置和获取缓存', async () => {
      const key = 'test:key';
      const value = { data: 'test' };
      
      await cacheService.set(key, value);
      
      // 模拟Redis返回值
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));
      
      const result = await cacheService.get(key);
      expect(result).toEqual(value);
    });
    
    test('应该能够删除缓存', async () => {
      const key = 'test:delete';
      
      await cacheService.del(key);
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
    
    test('应该支持空值缓存（防缓存穿透）', async () => {
      const key = 'test:null';
      
      await cacheService.set(key, null);
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });
  });
  
  describe('缓存包装功能', () => {
    test('应该能够使用wrap包装函数缓存结果', async () => {
      const key = 'test:wrap';
      const mockFn = jest.fn().mockResolvedValue({ wrapped: true });
      
      const result1 = await cacheService.wrap(key, mockFn);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual({ wrapped: true });
    });
  });
  
  describe('缓存统计', () => {
    test('应该能够获取缓存统计信息', async () => {
      mockRedisClient.info.mockResolvedValueOnce('memory info');
      
      const stats = await cacheService.getStats();
      expect(stats).toBeDefined();
      expect(stats.memoryCacheSize).toBeDefined();
      expect(stats.redisConnected).toBeDefined();
    });
  });
  
  describe('批量缓存操作', () => {
    test('应该能够按模式删除缓存', async () => {
      const pattern = 'test:pattern:*';
      mockRedisClient.keys.mockResolvedValueOnce(['test:pattern:1', 'test:pattern:2']);
      
      await cacheService.delPattern(pattern);
      expect(mockRedisClient.keys).toHaveBeenCalledWith(pattern);
    });
    
    test('应该能够清空所有缓存', async () => {
      await cacheService.clear();
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });
  });
  
  describe('常量检查', () => {
    test('应该正确导出TTL常量', () => {
      expect(cacheService.TTL).toBeDefined();
      expect(cacheService.TTL.SHORT).toBe(60);
      expect(cacheService.TTL.DEFAULT).toBe(300);
    });
    
    test('应该正确导出CACHE_KEYS常量', () => {
      expect(cacheService.CACHE_KEYS).toBeDefined();
      expect(cacheService.CACHE_KEYS.USER).toBe('user:info:');
      expect(cacheService.CACHE_KEYS.CROP).toBe('crop:');
    });
  });
});
