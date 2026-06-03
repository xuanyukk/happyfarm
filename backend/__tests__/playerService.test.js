/**
 * 文件名：playerService.test.js
 * 作者：开发者
 * 日期：2026-05-01
 * 版本：v1.0.0
 * 功能描述：playerService单元测试
 */

const {
  calculateLevelExp,
  calculatePlayerExpByCrop,
  calculateFarmExpByCrop,
  calculateWorldExpByCrop,
  getCropTypeWeight,
  calculatePlayerExp,
  calculateFarmExp,
  calculateWorldExp,
} = require('../src/services/playerService');

describe('PlayerService', () => {
  describe('calculateLevelExp', () => {
    it('should return 0 for level 1', () => {
      expect(calculateLevelExp(1)).toBe(0);
    });

    it('should return correct exp for level 2', () => {
      expect(calculateLevelExp(2)).toBe(115); // 100 * 1.15^1 = 115
    });

    it('should return correct exp for level 5', () => {
      expect(calculateLevelExp(5)).toBe(174); // 100 * 1.15^4 ≈ 174.90 → 174
    });

    it('should handle invalid level values', () => {
      expect(calculateLevelExp(0)).toBe(0);
      expect(calculateLevelExp(-10)).toBe(0);
      expect(calculateLevelExp(null)).toBe(0);
      expect(calculateLevelExp(undefined)).toBe(0);
      expect(calculateLevelExp('abc')).toBe(0);
    });
  });

  describe('calculatePlayerExpByCrop', () => {
    it('should calculate basic exp for quality 1', () => {
      const result = calculatePlayerExpByCrop(100, 10, 1);
      expect(result).toBe(1000); // 100 * 10 * 1.0 = 1000
    });

    it('should apply quality coefficients correctly', () => {
      expect(calculatePlayerExpByCrop(100, 10, 2)).toBe(1200); // 1.2x
      expect(calculatePlayerExpByCrop(100, 10, 3)).toBe(1500); // 1.5x
      expect(calculatePlayerExpByCrop(100, 10, 4)).toBe(2000); // 2.0x
      expect(calculatePlayerExpByCrop(100, 10, 5)).toBe(2500); // 2.5x
    });

    it('should handle invalid inputs gracefully', () => {
      expect(calculatePlayerExpByCrop(null, null, null)).toBeGreaterThan(0);
      expect(calculatePlayerExpByCrop(-100, -10, -1)).toBeGreaterThan(0);
    });

    it('should never return 0 or negative', () => {
      expect(calculatePlayerExpByCrop(0, 0, 0)).toBeGreaterThan(0);
      expect(calculatePlayerExpByCrop(0, 0, 1)).toBeGreaterThan(0);
    });
  });

  describe('calculateFarmExpByCrop', () => {
    it('should calculate farm exp correctly', () => {
      const result = calculateFarmExpByCrop(100, 10);
      expect(result).toBe(1000); // 100 * 10 = 1000
    });

    it('should handle invalid inputs gracefully', () => {
      expect(calculateFarmExpByCrop(null, null)).toBeGreaterThan(0);
      expect(calculateFarmExpByCrop(-100, -10)).toBeGreaterThan(0);
    });
  });

  describe('calculateWorldExpByCrop', () => {
    it('should calculate world exp with world level bonus', () => {
      // World level 1: 1.0 + (1*0.02) = 1.02x
      const result1 = calculateWorldExpByCrop(100, 10, 1);
      expect(result1).toBe(1020); // 100*10*1.02 = 1020
    });

    it('should apply higher bonus for higher world levels', () => {
      // World level 5: 1.0 + (5*0.02) = 1.10x
      const result5 = calculateWorldExpByCrop(100, 10, 5);
      expect(result5).toBe(1100); // 100*10*1.10 = 1100
    });
  });

  describe('getCropTypeWeight', () => {
    it('should return correct weights for crop types', () => {
      expect(getCropTypeWeight('basic')).toBe(1.0);
      expect(getCropTypeWeight('economic')).toBe(1.5);
      expect(getCropTypeWeight('rare')).toBe(2.5);
      expect(getCropTypeWeight('top')).toBe(5.0);
    });

    it('should return default weight for unknown types', () => {
      expect(getCropTypeWeight('unknown')).toBe(1.0);
      expect(getCropTypeWeight(null)).toBe(1.0);
      expect(getCropTypeWeight(undefined)).toBe(1.0);
    });
  });

  describe('calculatePlayerExp', () => {
    it('should calculate player exp correctly for basic crop', () => {
      const result = calculatePlayerExp(1, 1, 'basic', 10, 10);
      expect(result).toBeGreaterThan(0);
    });

    it('should apply quality and type weights', () => {
      const basic = calculatePlayerExp(1, 1, 'basic', 10, 10);
      const rare = calculatePlayerExp(1, 1, 'rare', 10, 10);
      const quality5 = calculatePlayerExp(1, 5, 'basic', 10, 10);

      expect(rare).toBeGreaterThan(basic); // 稀有作物应该经验更多
      expect(quality5).toBeGreaterThan(basic); // 高品应该经验更多
    });
  });

  describe('calculateFarmExp and calculateWorldExp', () => {
    it('should calculate farm exp correctly', () => {
      const result = calculateFarmExp('basic', 10, 1, 10);
      expect(result).toBeGreaterThan(0);
    });

    it('should calculate world exp correctly', () => {
      const result = calculateWorldExp('basic', 10, 1, 10, 1);
      expect(result).toBeGreaterThan(0);
    });

    it('should handle invalid inputs gracefully', () => {
      expect(calculateFarmExp(null, null, null, null)).toBeGreaterThan(0);
      expect(calculateWorldExp(null, null, null, null, null)).toBeGreaterThan(0);
    });
  });
});
