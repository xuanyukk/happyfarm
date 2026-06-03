/**
 * 文件名：logger.test.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.1.0
 * 功能描述：日志服务测试
 * 更新记录：
 *   2026-03-19 - v1.0.0 - 初始版本
 *   2026-03-29 - v1.1.0 - 修复测试，使用正确的console方法
 */

import { describe, it, expect, vi } from 'vitest';
import logger from '@/services/logger';

describe('日志服务', () => {
  it('应该能够记录信息日志', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation();
    logger.info('测试信息');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('应该能够记录警告日志', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
    logger.warn('测试警告');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('应该能够记录错误日志', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
    logger.error('测试错误');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
