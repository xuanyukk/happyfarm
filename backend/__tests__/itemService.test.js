/**
 * 文件名：itemService.test.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：itemService单元测试
 */

const serviceProvider = require('../src/config/serviceProvider');

describe('ItemService', () => {
  beforeAll(() => {
    serviceProvider.registerAll();
  });

  it('should have itemService registered', () => {
    const itemService = serviceProvider.get('itemService');
    expect(itemService).toBeDefined();
  });

  it('should have useItem function', () => {
    const itemService = serviceProvider.get('itemService');
    expect(typeof itemService.useItem).toBe('function');
  });

  it('should have getItemInventory function', () => {
    const itemService = serviceProvider.get('itemService');
    expect(typeof itemService.getItemInventory).toBe('function');
  });
});
