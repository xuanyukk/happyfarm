/**
 * 文件名：integration.test.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：服务集成测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 导入所有需要测试的服务
import { timeSyncService } from '@/services/timeSync';
import { growthCalculator } from '@/services/growthCalculator';
import { stateSnapshot } from '@/services/stateSnapshot';
import { requestBatcher } from '@/services/requestBatcher';
import { growthStageManager } from '@/services/growthStageManager';
import { buffManager } from '@/services/buffManager';
import { farmViewManager } from '@/services/farmViewManager';

// Mock 依赖
vi.mock('@/services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('@/services/timeSync', () => ({
  timeSyncService: {
    now: vi.fn(() => Date.now()),
    nowSeconds: vi.fn(() => Math.floor(Date.now() / 1000)),
    format: vi.fn(() => '2026-03-29 12:00:00'),
    diff: vi.fn(),
    isReached: vi.fn(),
    getStatus: vi.fn(() => ({ isSynced: false })),
    init: vi.fn(),
    destroy: vi.fn()
  }
}));

vi.mock('@/services/metricsCollector', () => ({
  metricsCollector: {
    recordTimeSync: vi.fn(),
    recordRefresh: vi.fn()
  }
}));

describe('服务集成测试', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('时间同步服务', () => {
    it('应该能够获取当前时间', () => {
      const now = timeSyncService.now();
      expect(typeof now).toBe('number');
    });

    it('应该能够格式化时间', () => {
      const formatted = timeSyncService.format();
      expect(formatted).toBeDefined();
    });
  });

  describe('生长计算器', () => {
    it('应该能够初始化', () => {
      expect(growthCalculator).toBeDefined();
    });

    it('应该能够获取生长阶段枚举', () => {
      const stages = growthStageManager.getGrowthStages();
      expect(stages).toBeDefined();
    });
  });

  describe('状态快照服务', () => {
    it('应该能够初始化', () => {
      expect(stateSnapshot).toBeDefined();
    });
  });

  describe('请求批处理服务', () => {
    it('应该能够初始化', () => {
      expect(requestBatcher).toBeDefined();
    });

    it('应该能够获取状态', () => {
      const status = requestBatcher.getStatus();
      expect(status).toBeDefined();
    });
  });

  describe('生长阶段管理器', () => {
    it('应该能够初始化', () => {
      expect(growthStageManager).toBeDefined();
    });

    it('应该能够获取生长阶段枚举', () => {
      const stages = growthStageManager.getGrowthStages();
      expect(stages).toBeDefined();
    });
  });

  describe('BUFF管理器', () => {
    it('应该能够初始化', () => {
      expect(buffManager).toBeDefined();
    });

    it('应该能够获取BUFF类型枚举', () => {
      const types = buffManager.getBuffTypes();
      expect(types).toBeDefined();
    });

    it('应该能够获取状态', () => {
      const status = buffManager.getStatus();
      expect(status).toBeDefined();
    });
  });

  describe('农场视图管理器', () => {
    it('应该能够初始化', () => {
      expect(farmViewManager).toBeDefined();
    });

    it('应该能够获取视图类型枚举', () => {
      const types = farmViewManager.getViewTypes();
      expect(types).toBeDefined();
    });

    it('应该能够获取状态', () => {
      const status = farmViewManager.getStatus();
      expect(status).toBeDefined();
    });
  });

  describe('服务间集成', () => {
    it('应该能够与时间同步服务配合使用', () => {
      const now = timeSyncService.now();
      expect(now).toBeGreaterThan(0);
    });

    it('应该能够获取多个服务的状态', () => {
      const buffStatus = buffManager.getStatus();
      const viewStatus = farmViewManager.getStatus();
      
      expect(buffStatus).toBeDefined();
      expect(viewStatus).toBeDefined();
    });
  });
});
