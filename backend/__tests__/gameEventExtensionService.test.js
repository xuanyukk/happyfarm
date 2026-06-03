/**
 * 文件名: gameEventExtensionService.test.js
 * 作者: Trae AI
 * 日期: 2026-05-22
 * 版本: v1.0.0
 * 功能描述: 游戏活动扩展服务测试
 */

const gameEventWebSocketService = require('../src/services/gameEventWebSocketService');

describe('Game Event WebSocket Service', () => {
  describe('getQueueStats', () => {
    it('should return initial queue stats with no messages', () => {
      const stats = gameEventWebSocketService.getQueueStats();
      expect(stats).toEqual({
        totalUsers: 0,
        totalMessages: 0,
        queues: {}
      });
    });
  });

  describe('getQueueSize', () => {
    it('should return 0 for non-existent user', () => {
      const size = gameEventWebSocketService.getQueueSize('nonexistent_user');
      expect(size).toBe(0);
    });
  });
});

describe('Service Structure Validation', () => {
  it('should export all required services', () => {
    expect(gameEventWebSocketService).toHaveProperty('broadcastEventStatusChange');
    expect(gameEventWebSocketService).toHaveProperty('pushUserProgressUpdate');
    expect(gameEventWebSocketService).toHaveProperty('pushRewardClaimed');
    expect(gameEventWebSocketService).toHaveProperty('pushNewEvent');
    expect(gameEventWebSocketService).toHaveProperty('handleUserReconnect');
    expect(gameEventWebSocketService).toHaveProperty('getQueueSize');
    expect(gameEventWebSocketService).toHaveProperty('getQueueStats');
  });
});
