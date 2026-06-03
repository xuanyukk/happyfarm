# 业务指标监控

本文档介绍开心农场项目的业务指标监控系统。

## 概述

业务指标监控系统提供关键业务指标的实时采集、处理、存储、可视化展示及异常告警功能，支持自定义指标配置、多维度数据分析、历史数据查询及趋势预测。

## 核心功能

### 交易成功率监控

- **登录成功率**：监控用户登录操作的成功率
- **支付成功率**：监控支付操作的成功率
- **数据保存成功率**：监控数据保存操作的成功率
- **实时告警**：当成功率低于阈值时自动触发告警

### 用户活跃度监控

- **在线用户数**：实时在线用户数统计
- **日活跃用户**：每日活跃用户数统计
- **峰值在线**：峰值在线用户数及时间戳记录
- **异常检测**：在线用户数异常降低时触发告警

### 游戏业务指标

- **活跃玩家数**：活跃玩家统计
- **作物收获次数**：作物收获操作统计
- **游戏内交易次数**：游戏内交易次数统计
- **商店访问量**：商店访问次数统计

### 性能指标监控

- **平均响应时间**：API 响应时间监控
- **请求每秒（QPS）**：系统吞吐量
- **错误率**：请求错误率监控

### 自定义指标支持

- 支持注册自定义业务指标
- 支持自定义指标值更新
- 支持自定义指标历史查询

### 多维度分析

- 综合所有业务指标的统一视图
- 支持按类型分类查看指标
- 支持历史数据趋势分析

### 趋势预测

- 基于历史数据的简单线性回归预测
- 支持预测未来指定时间范围的指标变化
- 提供预测置信度信息

## API 接口

业务指标监控系统提供完整的 RESTful API：

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/business-metrics` | GET | 获取所有业务指标 |
| `/api/business-metrics/transaction-success` | GET | 获取交易成功率指标 |
| `/api/business-metrics/user-activity` | GET | 获取用户活跃度指标 |
| `/api/business-metrics/game-activity` | GET | 获取游戏业务指标 |
| `/api/business-metrics/performance` | GET | 获取性能指标 |
| `/api/business-metrics/history` | GET | 获取历史指标数据 |
| `/api/business-metrics/analysis` | GET | 获取多维度分析数据 |
| `/api/business-metrics/predict` | GET | 趋势预测 |
| `/api/business-metrics/alerts/thresholds` | GET/PUT | 获取/更新告警阈值 |
| `/api/business-metrics/alerts/check` | GET | 检查告警 |
| `/api/business-metrics/event` | POST | 记录业务事件 |
| `/api/business-metrics/custom/register` | POST | 注册自定义指标 |
| `/api/business-metrics/custom/update` | POST | 更新自定义指标值 |
| `/api/business-metrics/reset` | POST | 重置业务指标 |

## 告警策略

| 指标 | 警告阈值 | 严重阈值 |
|------|----------|----------|
| 登录成功率 | 99% | 95% |
| 支付成功率 | 98% | 95% |
| 数据保存成功率 | 99.5% | 98% |
| 在线用户数异常 | 100人 | - |
| 峰值容量率 | 80% | 95% |

## 配置说明

### Redis 配置

业务指标监控系统使用 Redis 缓存存储实时指标数据：

```env
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=farm:metrics
```

### 指标采集配置

配置文件位于 `backend/src/config/metricsConfig.js`：

```javascript
module.exports = {
  collectionInterval: 60000, // 采集间隔，单位毫秒
  historyRetention: 86400000, // 历史数据保留时间，单位毫秒
  alertCheckInterval: 300000 // 告警检查间隔，单位毫秒
};
```

## 使用示例

### 获取所有业务指标

```bash
curl http://localhost:3001/api/business-metrics
```

### 注册自定义指标

```bash
curl -X POST http://localhost:3001/api/business-metrics/custom/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_metric",
    "description": "自定义指标描述",
    "unit": "次"
  }'
```

### 更新自定义指标值

```bash
curl -X POST http://localhost:3001/api/business-metrics/custom/update \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_metric",
    "value": 100
  }'
```

### 趋势预测

```bash
curl "http://localhost:3001/api/business-metrics/predict?metricType=onlineUsers&hours=24"
```

### 获取历史数据

```bash
curl "http://localhost:3001/api/business-metrics/history?startTime=2026-05-01T00:00:00&endTime=2026-05-02T00:00:00"
```

## 技术实现

### 数据存储

- **实时指标**：存储在内存中，快速访问
- **历史数据**：缓存到 Redis 中，默认保留 24 小时
- **告警信息**：存储在数据库中，便于查询和统计

### 监控面板

业务指标监控已集成 Grafana + Loki + Promtail 完整监控栈：

**Grafana 业务指标面板**
- 登录成功率监控
- 支付成功率监控
- 在线用户数监控
- 作物收获量趋势分析
- 商店访问量趋势分析
- API 响应时间监控
- 请求速率监控
- 系统错误率监控

**Loki 日志聚合**
- 容器日志自动采集
- 日志查询和分析
- 日志保留策略配置

**Promtail 日志采集**
- 容器日志采集
- 日志标签配置
- 自动发送到 Loki

### 核心文件

- `backend/src/services/businessMetricsService.js` - 核心业务逻辑
- `backend/src/controllers/businessMetricsController.js` - API 控制器
- `backend/src/routes/businessMetricsRoutes.js` - 路由配置
- `grafana/provisioning/dashboards/json/happy-farm-business-metrics.json` - Grafana 业务指标面板配置
- `docker-compose.yml` - 监控栈服务配置

## 最佳实践

1. **定期检查**：定期检查业务指标，发现异常及时处理
2. **阈值调优**：根据业务实际情况调整告警阈值
3. **历史分析**：定期分析历史数据，发现趋势和规律
4. **自定义指标**：根据业务需求注册合适的自定义指标
5. **趋势预测**：利用趋势预测功能，提前发现潜在问题
