# 监控告警体系

本文档介绍开心农场项目的监控告警体系。

## 概述

监控告警体系是运维体系的重要组成部分，提供服务器资源监控、应用性能监控、业务指标监控和告警通知功能。

## 核心功能

### 服务器资源监控

- **CPU 使用率**：实时监控 CPU 使用率，超过阈值触发告警
- **内存使用率**：监控内存使用情况，防止内存泄漏
- **磁盘使用率**：监控磁盘空间，及时清理
- **网络流量**：监控入站和出站流量

### 告警分级策略

| 级别 | 标识 | 定义 | 响应时间 | 通知渠道 |
|------|------|------|----------|----------|
| P0 | 🔥 | 系统崩溃/数据丢失 | 立即（5分钟内）| 短信 + 电话 + 企业微信 + 邮件 |
| P1 | 🚨 | 服务不可用/严重性能问题 | 15分钟内 | 短信 + 企业微信 + 邮件 |
| P2 | ⚠️ | 性能下降/部分功能异常 | 1小时内 | 企业微信 + 邮件 |
| P3 | ℹ️ | 轻微异常/预警信息 | 4小时内 | 邮件 |

### 多渠道告警通知

- **控制台**：实时显示告警信息
- **邮件**：发送告警邮件到指定地址
- **企业微信**：通过企业微信机器人推送
- **钉钉**：通过钉钉机器人推送（可选）
- **短信**：P0/P1 级告警发送短信通知

### 告警阈值配置

告警阈值可通过配置文件动态调整：

```javascript
module.exports = {
  cpu: { warning: 80, critical: 95 },
  memory: { warning: 85, critical: 95 },
  disk: { warning: 80, critical: 95 },
  network: { warning: 100, critical: 200 },
  responseTime: { warning: 500, critical: 2000 },
  errorRate: { warning: 1, critical: 5 }
};
```

### 告警闭环管理

- **告警触发**：自动检测异常并触发告警
- **告警确认**：运维人员确认收到告警
- **问题处理**：定位并解决问题
- **告警关闭**：验证修复后关闭告警
- **复盘归档**：记录问题和解决方案

## API 接口

监控告警系统提供完整的 RESTful API：

- `GET /api/monitoring/health` - 健康检查
- `GET /api/monitoring/metrics` - 获取监控指标
- `GET /api/monitoring/alerts` - 获取告警列表
- `POST /api/monitoring/alerts/{id}/acknowledge` - 确认告警
- `POST /api/monitoring/alerts/{id}/resolve` - 解决告警
- `GET /api/monitoring/alerts/thresholds` - 获取告警阈值
- `PUT /api/monitoring/alerts/thresholds` - 更新告警阈值

## 配置说明

在 `.env` 文件中配置告警通知：

```env
# 告警配置
ALERT_ENABLED=true
ALERT_LEVEL=P2

# 企业微信告警配置（可选）
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your-key

# 邮件告警配置（可选）
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
```

## 最佳实践

1. **定期检查**：定期检查监控数据，发现潜在问题
2. **阈值调优**：根据实际情况调整告警阈值
3. **告警降噪**：避免重复告警和虚假告警
4. **响应及时**：及时响应和处理告警
5. **复盘总结**：定期复盘告警，优化系统
