/**
 * 文件名：economyService.test.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：economyService单元测试
 */

const serviceProvider = require('../src/config/serviceProvider');

describe('EconomyService', () => {
  beforeAll(() => {
    serviceProvider.registerAll();
  });

  it('should have economyService registered', () => {
    const economyService = serviceProvider.get('economyService');
    expect(economyService).toBeDefined();
  });

  it('should have getCurrencyLogs function', () => {
    const economyService = serviceProvider.get('economyService');
    expect(typeof economyService.getCurrencyLogs).toBe('function');
  });

  it('should handle page and limit parameters correctly', async () => {
    const economyService = serviceProvider.get('economyService');
    
    const testPlayerId = 'test-player-123';
    
    // 基本分页测试（可能没有数据，但至少不应崩溃）
    const result1 = await economyService.getCurrencyLogs(testPlayerId, 1, 10);
    expect(result1).toBeDefined();
    
    // 带类型筛选的测试
    const result2 = await economyService.getCurrencyLogs(testPlayerId, 1, 10, 'earn');
    expect(result2).toBeDefined();
  });
});
