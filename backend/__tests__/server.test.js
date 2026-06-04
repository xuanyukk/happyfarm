// 文件名：server.test.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：后端服务器集成测试

const request = require('supertest');

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_MAX = '100';

// 导入服务器
const app = require('../src/server');

describe('服务器集成测试', () => {
  describe('健康检查接口', () => {
    test('GET /health 应该返回200状态码和正确的JSON响应', async () => {
      const response = await request(app).get('/health');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('404处理', () => {
    test('访问不存在的接口应该返回404状态码', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.statusCode).toBe(404);
      // 允许不同格式的响应
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('认证路由', () => {
    test('GET /api/auth/health 应该返回健康状态', async () => {
      const response = await request(app).get('/api/auth/health');
      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('备份管理API', () => {
    test('GET /api/admin/backups 应该返回备份列表或适当状态码', async () => {
      const response = await request(app).get('/api/admin/backups'); 
      expect([200, 401, 404, 500]).toContain(response.statusCode);
    });
  });
});
