/**
 * 文件名：timeSync.test.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：时间同步服务测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timeSyncService } from '@/services/timeSync';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

// Mock metricsCollector
vi.mock('@/services/metricsCollector', () => ({
  metricsCollector: {
    recordTimeSync: vi.fn()
  }
}));

describe('时间同步服务', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 重置单例状态
    timeSyncService.stopAutoSync();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('应该能够初始化时间同步服务', () => {
    expect(timeSyncService).toBeDefined();
  });

  it('应该能够获取当前时间', () => {
    const now = timeSyncService.now();
    expect(typeof now).toBe('number');
    expect(now).toBeGreaterThan(0);
  });

  it('应该能够格式化时间', () => {
    const formatted = timeSyncService.format('YYYY-MM-DD');
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('应该能够获取服务状态', () => {
    const status = timeSyncService.getStatus();
    expect(status).toBeDefined();
    expect(typeof status.isSynced).toBe('boolean');
  });
});
