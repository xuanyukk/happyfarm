// 文件名：simple.test.js
// 作者：开发者
// 日期：2026-03-19
// 版本：v1.0.0
// 功能描述：简单集成测试示例

const request = require('supertest');
const express = require('express');

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

test('GET /health returns 200', async () => {
  const response = await request(app).get('/health');
  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});
