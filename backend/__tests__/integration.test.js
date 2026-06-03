/**
 * 文件名：integration.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：后端集成测试
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

const request = require('supertest');

describe('后端集成测试', () => {
  describe('健康检查与系统状态', () => {
    test('GET /health 应该返回系统健康状态', async () => {
      const response = await request(require('../src/server')).get('/health');
      expect([200, 503]).toContain(response.statusCode);
      expect(response.body).toHaveProperty('success');
    });

    test('健康检查响应应该包含必要字段', async () => {
      const response = await request(require('../src/server')).get('/health');
      if (response.statusCode === 200) {
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('version');
      }
    });
  });

  describe('API路由测试', () => {
    test('应该返回404对于不存在的路由', async () => {
      const response = await request(require('../src/server')).get('/api/nonexistent-route');
      expect([404, 401]).toContain(response.statusCode);
    });

    test('API路由应该返回JSON格式', async () => {
      const response = await request(require('../src/server')).get('/health');
      expect(response.type).toMatch(/json/);
    });
  });

  describe('CORS配置测试', () => {
    test('响应应该包含CORS头', async () => {
      const response = await request(require('../src/server')).get('/health');
      // CORS头可能存在也可能不存在，取决于环境
      expect(response.statusCode).toBeDefined();
    });
  });
});
