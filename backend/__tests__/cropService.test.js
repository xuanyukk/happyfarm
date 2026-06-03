/**
 * 文件名：cropService.test.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：作物服务单元测试
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，测试工具函数
 */

// 提取需要测试的函数进行独立测试
const calculateRandomYield = function(minYield, maxYield) {
  const safeMin = Math.max(1, parseInt(minYield) || 1);
  const safeMax = Math.max(safeMin, parseInt(maxYield) || safeMin);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};

describe('作物服务测试', () => {
  describe('calculateRandomYield 函数', () => {
    test('应该返回在最小和最大产量之间的随机数', () => {
      const min = 5;
      const max = 10;
      
      for (let i = 0; i < 100; i++) {
        const result = calculateRandomYield(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    test('当最小值大于最大值时，应该使用最小值作为两者', () => {
      const result = calculateRandomYield(10, 5);
      expect(result).toBe(10);
    });

    test('当参数不是数字时，应该使用默认值1', () => {
      const result = calculateRandomYield('abc', 'def');
      expect(result).toBe(1);
    });

    test('当最小值小于1时，应该使用1作为最小值', () => {
      const result = calculateRandomYield(-5, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
    });

    test('当最大值为空时，应该使用最小值', () => {
      const result = calculateRandomYield(5, null);
      expect(result).toBe(5);
    });
  });
});
