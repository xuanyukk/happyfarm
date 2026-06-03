/**
 * 文件名：setup.js
 * 作者：开发者
 * 日期：2026-05-10
 * 版本：v1.0.0
 * 功能描述：Jest测试设置和清理
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.REDIS_ENABLED = 'false';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_MAX = '1000';

// 在所有测试前执行
beforeAll(() => {
  // 禁用日志输出，保持测试输出清洁
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
});

// 在每个测试前执行
beforeEach(() => {
  // 清除所有模拟
  jest.clearAllMocks();
});

// 在每个测试后执行
afterEach(() => {
  // 清理定时器
  jest.clearAllTimers();
});

// 在所有测试后执行
afterAll(() => {
  // 清理所有资源
  jest.restoreAllMocks();
});
