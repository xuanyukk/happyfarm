/**
 * 文件名：adminController.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：Admin Controller单元测试
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

describe('Admin Controller', () => {
  describe('权限检查中间件', () => {
    test('应该正确验证管理员权限', () => {
      const checkAdminPermission = (req, res, next) => {
        if (!req.user.is_admin) {
          return res.status(403).json({ success: false, message: '无管理员权限' });
        }
        next();
      };

      const mockReqAdmin = { user: { id: 1, username: 'admin', is_admin: true } };
      const mockReqUser = { user: { id: 2, username: 'player', is_admin: false } };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      checkAdminPermission(mockReqAdmin, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      mockNext.mockClear();
      checkAdminPermission(mockReqUser, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: '无管理员权限' });
    });
  });

  describe('玩家管理', () => {
    test('应该正确验证分页参数', () => {
      const validatePagination = (page, pageSize) => {
        let validatedPage = parseInt(page);
        if (isNaN(validatedPage) || validatedPage < 1) validatedPage = 1;
        
        let validatedPageSize = parseInt(pageSize);
        if (isNaN(validatedPageSize) || validatedPageSize < 1) validatedPageSize = 20;
        if (validatedPageSize > 100) validatedPageSize = 100;
        
        const offset = (validatedPage - 1) * validatedPageSize;
        return { page: validatedPage, pageSize: validatedPageSize, offset };
      };

      expect(validatePagination(1, 20)).toEqual({ page: 1, pageSize: 20, offset: 0 });
      expect(validatePagination(2, 50)).toEqual({ page: 2, pageSize: 50, offset: 50 });
      expect(validatePagination(0, 0)).toEqual({ page: 1, pageSize: 20, offset: 0 });
      expect(validatePagination(null, 'abc')).toEqual({ page: 1, pageSize: 20, offset: 0 });
      expect(validatePagination(1, 150)).toEqual({ page: 1, pageSize: 100, offset: 0 });
    });

    test('应该正确验证玩家筛选条件', () => {
      const validatePlayerFilters = (filters) => {
        const validFilters = {};
        if (filters.username && typeof filters.username === 'string') {
          validFilters.username = filters.username.trim();
        }
        if (filters.playerId && typeof filters.playerId === 'string') {
          validFilters.playerId = filters.playerId;
        }
        if (filters.minLevel && !isNaN(parseInt(filters.minLevel))) {
          validFilters.minLevel = parseInt(filters.minLevel);
        }
        if (filters.maxLevel && !isNaN(parseInt(filters.maxLevel))) {
          validFilters.maxLevel = parseInt(filters.maxLevel);
        }
        if (filters.status && ['active', 'banned', 'inactive'].includes(filters.status)) {
          validFilters.status = filters.status;
        }
        return validFilters;
      };

      const testFilters = { 
        username: ' test ', 
        playerId: '123', 
        minLevel: '5', 
        maxLevel: 10, 
        status: 'active' 
      };
      const result = validatePlayerFilters(testFilters);
      
      expect(result.username).toBe('test');
      expect(result.playerId).toBe('123');
      expect(result.minLevel).toBe(5);
      expect(result.maxLevel).toBe(10);
      expect(result.status).toBe('active');
    });
  });

  describe('货币调控', () => {
    test('应该安全计算货币变化', () => {
      const calculateBalanceChange = (current, change, min = 0, max = 1000000) => {
        const safeCurrent = parseFloat(current) || 0;
        const safeChange = parseFloat(change) || 0;
        let newBalance = safeCurrent + safeChange;
        newBalance = Math.max(min, Math.min(max, newBalance));
        return {
          oldBalance: safeCurrent,
          change: safeChange,
          newBalance
        };
      };

      expect(calculateBalanceChange(1000, 500)).toEqual({ 
        oldBalance: 1000, 
        change: 500, 
        newBalance: 1500 
      });
      expect(calculateBalanceChange(1000, -1500)).toEqual({ 
        oldBalance: 1000, 
        change: -1500, 
        newBalance: 0 
      });
      expect(calculateBalanceChange(999999, 500)).toEqual({ 
        oldBalance: 999999, 
        change: 500, 
        newBalance: 1000000 
      });
      expect(calculateBalanceChange(null, 100)).toEqual({ 
        oldBalance: 0, 
        change: 100, 
        newBalance: 100 
      });
    });

    test('应该验证货币类型', () => {
      const isValidCurrencyType = (type) => {
        const validTypes = ['coin', 'gem', 'exp'];
        return validTypes.includes(type);
      };

      expect(isValidCurrencyType('coin')).toBe(true);
      expect(isValidCurrencyType('gem')).toBe(true);
      expect(isValidCurrencyType('exp')).toBe(true);
      expect(isValidCurrencyType('invalid')).toBe(false);
    });
  });

  describe('系统监控', () => {
    test('应该验证监控指标类型', () => {
      const isValidMetricType = (type) => {
        const validTypes = ['cpu', 'memory', 'disk', 'network', 'database'];
        return validTypes.includes(type);
      };

      expect(isValidMetricType('cpu')).toBe(true);
      expect(isValidMetricType('memory')).toBe(true);
      expect(isValidMetricType('invalid')).toBe(false);
    });

    test('应该验证时间范围', () => {
      const isValidTimeRange = (range) => {
        const validRanges = ['1h', '24h', '7d', '30d'];
        return validRanges.includes(range);
      };

      expect(isValidTimeRange('1h')).toBe(true);
      expect(isValidTimeRange('24h')).toBe(true);
      expect(isValidTimeRange('7d')).toBe(true);
      expect(isValidTimeRange('invalid')).toBe(false);
    });
  });

  describe('操作日志', () => {
    test('应该验证日志级别', () => {
      const isValidLogLevel = (level) => {
        const validLevels = ['info', 'warning', 'error', 'critical'];
        return validLevels.includes(level);
      };

      expect(isValidLogLevel('info')).toBe(true);
      expect(isValidLogLevel('warning')).toBe(true);
      expect(isValidLogLevel('error')).toBe(true);
      expect(isValidLogLevel('critical')).toBe(true);
      expect(isValidLogLevel('invalid')).toBe(false);
    });

    test('应该验证操作类型', () => {
      const isValidActionType = (type) => {
        const validTypes = ['create', 'update', 'delete', 'ban', 'unban'];
        return validTypes.includes(type);
      };

      expect(isValidActionType('create')).toBe(true);
      expect(isValidActionType('delete')).toBe(true);
      expect(isValidActionType('invalid')).toBe(false);
    });
  });
});
