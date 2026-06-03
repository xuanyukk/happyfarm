// 文件名：health.test.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.1.0
// 功能描述：健康检查接口测试

const request = require('supertest');
const express = require('express');

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

describe('健康检查接口', () => {
  test('GET /health 应该返回200状态码', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
  });

  test('GET /health 应该返回正确的JSON响应', async () => {
    const response = await request(app).get('/health');
    expect(response.body).toEqual({ status: 'ok' });
  });
});
