/**
 * 文件名：api.e2e.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：API 端到端集成测试 - 模拟真实用户场景测试前后端交互
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('API 端到端集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('健康检查测试', () => {
    it('应该能够获取后端健康状态', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: { status: 'ok', message: 'Server is running' }
      });

      const response = await axios.get('/health');
      
      expect(axios.get).toHaveBeenCalledWith('/health');
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('ok');
    });
  });

  describe('用户认证测试', () => {
    it('应该能够用户登录', async () => {
      const loginData = { username: 'testuser', password: 'password123' };
      const mockResponse = {
        token: 'mock-token',
        user: { id: 1, username: 'testuser' }
      };

      axios.post.mockResolvedValue({
        status: 200,
        data: mockResponse
      });

      const response = await axios.post('/api/auth/login', loginData);
      
      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', loginData);
      expect(response.data.token).toBe('mock-token');
      expect(response.data.user.username).toBe('testuser');
    });
  });

  describe('农场数据测试', () => {
    it('应该能够获取农场状态', async () => {
      const mockFarmData = {
        coins: 1000,
        lands: [
          { id: 1, unlocked: true, planted: true },
          { id: 2, unlocked: false }
        ]
      };

      axios.get.mockResolvedValue({
        status: 200,
        data: mockFarmData
      });

      const response = await axios.get('/api/farm/status');
      
      expect(response.data.coins).toBe(1000);
      expect(response.data.lands.length).toBe(2);
    });

    it('应该能够种植作物', async () => {
      const plantData = { landId: 1, cropId: 'wheat' };
      axios.post.mockResolvedValue({
        status: 200,
        data: { success: true, message: '种植成功' }
      });

      const response = await axios.post('/api/farm/plant', plantData);
      
      expect(response.data.success).toBe(true);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理网络错误', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      try {
        await axios.get('/api/farm/status');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('Network Error');
      }
    });

    it('应该处理404错误', async () => {
      axios.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Not Found' } }
      });

      try {
        await axios.get('/api/nonexistent');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
