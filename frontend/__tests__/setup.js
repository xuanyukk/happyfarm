/**
 * 文件名：setup.js
 * 作者：开发者
 * 日期：2026-05-10
 * 版本：v1.0.0
 * 功能描述：Vitest测试设置和清理
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:3001/api';
process.env.VITE_ENABLE_LOG_CONSOLE = 'true';
process.env.VITE_LOG_LEVEL = 'debug';

// 在所有测试前执行
beforeAll(() => {
  // 禁用日志输出
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.debug = vi.fn();
});

// 在每个测试前执行
beforeEach(() => {
  // 清除所有模拟
  vi.clearAllMocks();
  // 清除定时器
  vi.useFakeTimers();
});

// 在每个测试后执行
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// 在所有测试后执行
afterAll(() => {
  vi.resetAllMocks();
});
