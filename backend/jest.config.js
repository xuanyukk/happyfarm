/**
 * 文件名：jest.config.js
 * 作者：开发者
 * 日期：2026-05-10
 * 版本：v1.0.0
 * 功能描述：Jest测试配置文件
 */

module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js'
  ],
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  verbose: true
};
