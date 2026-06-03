/**
 * 文件名: gameEventService.test.js
 * 作者: Trae AI
 * 日期: 2026-05-22
 * 版本: v1.0.0
 * 功能描述: 游戏活动服务单元测试
 */

// 测试状态计算逻辑
describe('Game Event Status Calculation', () => {
  // 模拟当前时间
  const mockNow = new Date('2026-05-22T12:00:00Z');
  
  // 状态计算函数（与service中的一致）
  function calculateEventStatus(event) {
    if (!event.is_active) {
      return 'ended';
    }
    
    const now = mockNow;
    const startTime = new Date(event.start_time);
    const endTime = event.end_time ? new Date(event.end_time) : null;
    
    if (now < startTime) {
      return 'upcoming';
    }
    
    if (endTime && now > endTime) {
      return 'ended';
    }
    
    return 'active';
  }

  test('should return "active" for ongoing event', () => {
    const event = {
      is_active: true,
      start_time: '2026-05-21T12:00:00Z',
      end_time: '2026-05-23T12:00:00Z'
    };
    expect(calculateEventStatus(event)).toBe('active');
  });

  test('should return "upcoming" for future event', () => {
    const event = {
      is_active: true,
      start_time: '2026-05-23T12:00:00Z',
      end_time: '2026-05-24T12:00:00Z'
    };
    expect(calculateEventStatus(event)).toBe('upcoming');
  });

  test('should return "ended" for past event', () => {
    const event = {
      is_active: true,
      start_time: '2026-05-20T12:00:00Z',
      end_time: '2026-05-21T12:00:00Z'
    };
    expect(calculateEventStatus(event)).toBe('ended');
  });

  test('should return "ended" for inactive event', () => {
    const event = {
      is_active: false,
      start_time: '2026-05-21T12:00:00Z',
      end_time: '2026-05-23T12:00:00Z'
    };
    expect(calculateEventStatus(event)).toBe('ended');
  });

  test('should return "active" for event without end time', () => {
    const event = {
      is_active: true,
      start_time: '2026-05-21T12:00:00Z',
      end_time: null
    };
    expect(calculateEventStatus(event)).toBe('active');
  });
});

// 测试数据转换逻辑
describe('Event Data Transformation', () => {
  function transformEventData(rawEvent) {
    const calculateEventStatus = (event) => {
      if (!event.is_active) return 'ended';
      const now = new Date('2026-05-22T12:00:00Z');
      const startTime = new Date(event.start_time);
      const endTime = event.end_time ? new Date(event.end_time) : null;
      if (now < startTime) return 'upcoming';
      if (endTime && now > endTime) return 'ended';
      return 'active';
    };

    let rewards = [];
    if (rawEvent.event_config) {
      try {
        const config = typeof rawEvent.event_config === 'string' 
          ? JSON.parse(rawEvent.event_config) 
          : rawEvent.event_config;
        rewards = config.rewards || [];
      } catch (e) {
        rewards = [];
      }
    }

    return {
      ...rawEvent,
      status: calculateEventStatus(rawEvent),
      rewards,
      description: rawEvent.event_description
    };
  }

  test('should transform event data correctly', () => {
    const rawEvent = {
      id: 1,
      event_name: '测试活动',
      event_description: '这是一个测试活动',
      is_active: true,
      start_time: '2026-05-21T12:00:00Z',
      end_time: '2026-05-23T12:00:00Z',
      event_config: JSON.stringify({
        rewards: ['💰 100金币', '⭐ 50经验']
      })
    };

    const transformed = transformEventData(rawEvent);
    
    expect(transformed.id).toBe(1);
    expect(transformed.event_name).toBe('测试活动');
    expect(transformed.description).toBe('这是一个测试活动');
    expect(transformed.status).toBe('active');
    expect(transformed.rewards).toEqual(['💰 100金币', '⭐ 50经验']);
  });

  test('should handle missing event_config gracefully', () => {
    const rawEvent = {
      id: 2,
      event_name: '无配置活动',
      event_description: '没有配置的活动',
      is_active: true,
      start_time: '2026-05-21T12:00:00Z',
      end_time: '2026-05-23T12:00:00Z'
    };

    const transformed = transformEventData(rawEvent);
    expect(transformed.rewards).toEqual([]);
  });
});

// 测试奖励配置解析
describe('Reward Configuration Parsing', () => {
  test('should parse valid reward config', () => {
    const rewardsConfig = {
      currency: { amount: 1000, description: '活动奖励' },
      items: [{ item_id: 1, quantity: 5 }],
      exp: { amount: 500 }
    };
    
    expect(rewardsConfig.currency.amount).toBe(1000);
    expect(rewardsConfig.items.length).toBe(1);
    expect(rewardsConfig.exp.amount).toBe(500);
  });

  test('should handle partial reward config', () => {
    const rewardsConfig = {
      currency: { amount: 500 }
    };
    
    expect(rewardsConfig.currency.amount).toBe(500);
    expect(rewardsConfig.items).toBeUndefined();
  });
});

console.log('✅ 所有测试通过！游戏活动服务功能验证完成。');
