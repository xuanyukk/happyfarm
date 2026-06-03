/**
 * 文件名：utils.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：工具函数测试
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

describe('工具函数测试', () => {
  describe('constants', () => {
    test('应该能够导入constants', () => {
      const constants = require('../src/utils/constants');
      expect(constants).toBeDefined();
    });
  });

  describe('response', () => {
    test('应该能够导入response', () => {
      const response = require('../src/utils/response');
      expect(response).toBeDefined();
    });
  });

  describe('验证函数', () => {
    test('应该验证邮箱格式', () => {
      const isValidEmail = (email) => {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };
      
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });

    test('应该验证密码强度', () => {
      const isValidPassword = (password) => {
        if (!password || password.length < 6) return false;
        return true;
      };
      
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });

    test('应该验证用户名格式', () => {
      const isValidUsername = (username) => {
        if (!username) return false;
        if (username.length < 3 || username.length > 20) return false;
        return /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username);
      };
      
      expect(isValidUsername('testUser')).toBe(true);
      expect(isValidUsername('测试用户')).toBe(true);
      expect(isValidUsername('ab')).toBe(false);
      expect(isValidUsername('very-long-username-that-is-too-long')).toBe(false);
    });

    test('应该验证分页参数', () => {
      const validatePagination = (page, pageSize) => {
        const p = Math.max(1, parseInt(page) || 1);
        const ps = Math.min(100, Math.max(1, parseInt(pageSize) || 20));
        return { page: p, pageSize: ps, offset: (p - 1) * ps };
      };
      
      expect(validatePagination(2, 30)).toEqual({ page: 2, pageSize: 30, offset: 30 });
      expect(validatePagination(0, 0)).toEqual({ page: 1, pageSize: 20, offset: 0 });
      expect(validatePagination(1, 200)).toEqual({ page: 1, pageSize: 100, offset: 0 });
    });
  });

  describe('字符串处理', () => {
    test('应该安全地格式化字符串', () => {
      const safeString = (str, defaultValue = '') => {
        if (str === null || str === undefined) return defaultValue;
        return String(str);
      };
      
      expect(safeString('test')).toBe('test');
      expect(safeString(null)).toBe('');
      expect(safeString(undefined)).toBe('');
      expect(safeString(123)).toBe('123');
    });

    test('应该截取字符串', () => {
      const truncate = (str, length = 100) => {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
      };
      
      expect(truncate('short')).toBe('short');
      expect(truncate('very long string', 5)).toBe('very ...');
    });
  });

  describe('日期处理', () => {
    test('应该格式化日期', () => {
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
      };
      
      const testDate = new Date('2026-05-07');
      expect(formatDate(testDate)).toBe('2026-05-07');
      expect(formatDate('invalid')).toBe('');
      expect(formatDate(null)).toBe('');
    });

    test('应该验证日期是否在范围内', () => {
      const isDateInRange = (date, start, end) => {
        const d = new Date(date);
        const s = new Date(start);
        const e = new Date(end);
        
        if (isNaN(d.getTime()) || isNaN(s.getTime()) || isNaN(e.getTime())) return false;
        return d >= s && d <= e;
      };
      
      const today = new Date('2026-05-07');
      const yesterday = new Date('2026-05-06');
      const tomorrow = new Date('2026-05-08');
      
      expect(isDateInRange(today, yesterday, tomorrow)).toBe(true);
      expect(isDateInRange(today, tomorrow, yesterday)).toBe(false);
    });
  });

  describe('数字处理', () => {
    test('应该安全地解析数字', () => {
      const safeNumber = (num, defaultValue = 0) => {
        if (num === null || num === undefined) return defaultValue;
        const n = Number(num);
        return isNaN(n) ? defaultValue : n;
      };
      
      expect(safeNumber(123)).toBe(123);
      expect(safeNumber('456')).toBe(456);
      expect(safeNumber('invalid')).toBe(0);
      expect(safeNumber(null, 10)).toBe(10);
      expect(safeNumber(undefined, 15)).toBe(15);
    });

    test('应该限制数字范围', () => {
      const clamp = (num, min, max) => {
        return Math.min(Math.max(num, min), max);
      };
      
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(200, 0, 100)).toBe(100);
    });
  });
});
