# WebSocket 优化

本文档介绍开心农场项目的 WebSocket 实时推送系统优化。

## 概述

WebSocket 提供实时双向通信，用于游戏事件推送、实时通知等功能。

## 核心功能

### 实时推送
- 游戏事件通知
- 成就达成提示
- 系统公告
- 实时预警

### 连接管理
- 连接认证
- 心跳检测
- 断线重连
- 连接池管理

## 优化方案

### 1. 连接认证
- 使用 JWT 认证
- 验证用户身份
- 权限检查

### 2. 消息路由
- 按用户分组
- 按频道订阅
- 消息过滤

### 3. 性能优化
- 连接复用
- 消息压缩
- 批量发送
- 离线消息

## WebSocket 事件

### 游戏事件
- `crop_ready` - 作物成熟
- `achievement_unlocked` - 成就解锁
- `level_up` - 等级提升

### 系统事件
- `announcement` - 系统公告
- `alert` - 预警通知
- `maintenance` - 维护通知

## 使用示例

### 前端连接
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## 相关文档

- [系统架构](../architecture/system)
- [日志分析平台](./logging)
