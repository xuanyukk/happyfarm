# 日志系统

本文档介绍开心农场项目的完整日志系统架构、配置和使用。

**文档版本：** v2.0.0  
**最后更新：** 2026-05-28  
**适用版本：** 开心农场 v4.71.7+

---

## 一、系统概览

项目采用**多层日志体系**，覆盖开发、部署、运行、监控全生命周期：

| 层级 | 组件 | 技术 | 用途 |
|------|------|------|------|
| 部署日志 | start.py DeployLogger v2.0 | Python 文件 I/O | 记录部署过程、自动轮转清理 |
| 后端日志 | Winston + DailyRotateFile | Node.js | 7 类日志分级存储 |
| 前端日志 | Logger 服务 | 浏览器 JS | 内存缓存 + 远程上报 |
| 日志聚合 | Loki + Promtail | Docker 容器 | 集中收集、存储、查询 |
| 可视监控 | Grafana | Docker 容器 | 仪表板、告警 |

---

## 二、部署日志（DeployLogger v2.0）

### 文件命名

每次部署生成 3 个文件：
- **主日志**：`deployment_YYYYMMDD_HHMMSS_ffffff_PID.log`（纯文本，完整记录）
- **错误日志**：`deployment_YYYYMMDD_HHMMSS_ffffff_PID_error.log`（仅 ERROR/WARN）
- **JSON 日志**：`deployment_YYYYMMDD_HHMMSS_ffffff_PID.json`（结构化，便于机器分析）

### 自动清理

- 启动时自动删除 **30 天前**的过期日志
- 单文件超过 **10 MB** 时触发轮转截断
- 可通过 `LOG_RETENTION_DAYS` 和 `LOG_MAX_SIZE_MB` 配置

### 日志级别

| 级别 | 说明 | 示例 |
|------|------|------|
| STEP | 阶段步骤 | `[阶段 1] 检查Docker环境` |
| INFO | 普通信息 | `依赖安装完成` |
| CMD | 执行命令 | `docker-compose up -d` |
| DONE | 成功完成 | `部署完成` |
| SKIP | 跳过操作 | `已安装，跳过` |
| WARN | 警告 | `端口被占用` |
| ERROR | 错误 | `数据库连接失败` |

---

## 三、后端日志系统

### 日志类型（7 类分文件存储）

| 类型 | 文件名模式 | 保留期限 | 说明 |
|------|-----------|---------|------|
| ERROR | `error-YYYY-MM-DD.log` | 30天 | 错误日志（5MB 触发轮转） |
| SYSTEM | `system-YYYY-MM-DD.log` | 30天 | 系统运行日志（10MB） |
| ACCESS | `access-YYYY-MM-DD.log` | 60天 | API 访问日志（15MB） |
| BUSINESS | `business-YYYY-MM-DD.log` | 90天 | 业务操作日志（10MB） |
| SECURITY | `security-YYYY-MM-DD.log` | 90天 | 安全事件日志（5MB） |
| PERFORMANCE | `performance-YYYY-MM-DD.log` | 30天 | 性能数据日志（10MB） |
| AUDIT | `audit-YYYY-MM-DD.log` | 180天 | 审计日志（10MB） |
| COMBINED | `combined-YYYY-MM-DD.log` | 30天 | 综合日志（所有级别，20MB） |

### 日志级别

`error(0)` > `warn(1)` > `info(2)` > `debug(3)` > `verbose(4)`

### 功能特性

- **日志轮转**：DailyRotateFile 按日期 + 大小双重轮转，自动 gzip 压缩
- **日志采样**：访问日志默认 50% 采样率，安全/审计/错误日志 100% 记录
- **敏感脱敏**：自动脱敏密码、token、手机号、邮箱、身份证、银行卡
- **错误解释**：内置 20+ 常见错误的中文原因解释和解决方案
- **告警机制**：1 分钟内 5 个 error 触发告警（支持 Console/Email/Webhook/Slack/企业微信）
- **链路追踪**：RequestTracer 记录完整请求链路（>1s 自动标记慢请求）
- **异步写入**：AsyncLogWriter 批量缓冲写入，减少 I/O 开销
- **性能指标**：LogMetrics 统计写入速率、错误率、延迟

### 使用示例

```js
const { systemLogger, businessLogger, securityLogger } = require('./config/logger');

systemLogger.info('服务启动完成', { port: 3000 });
businessLogger.info('玩家收获作物', { userId: 42, cropId: 7, reward: 150 });
securityLogger.warn('登录失败', { ip: '192.168.1.1', username: 'test' });
```

---

## 四、前端日志系统

### 功能特性

- **内存缓存**：保留最近 500 条日志
- **远程上报**：error/warn 自动 POST 到 `/api/client-logs`
- **批量上报**：每 30 秒批量 POST 到 `/api/client-logs/batch`
- **离线持久化**：未上报成功的日志保存在 localStorage
- **全局错误捕获**：`window.onerror` + `unhandledrejection`
- **日志导出**：支持 JSON 格式导出和下载
- **控制台分级**：error/warn/info/debug 不同颜色标识

### 使用示例

```js
import logger from './services/logger';

logger.info('页面加载完成', { page: 'Home' });
logger.error('API 请求失败', { error: err, url: '/api/crops' });
logger.userAction('收获作物', { cropId: 7 });
logger.performance('页面渲染', 250, { component: 'LandGrid' });
```

---

## 五、日志聚合平台（Loki + Promtail + Grafana）

### 组件架构

```
应用日志（backend/logs/）
    ↓
Promtail（日志收集代理，端口 9080）
    ↓
Loki（日志存储引擎，端口 3100）
    ↓
Grafana（可视化查询，端口 3001）
```

### Promtail 收集配置

| Job | 日志路径 | 标签 |
|-----|---------|------|
| backend-logs | `/data/logs/backend/*log` | job=happy-farm-backend |
| error-logs | `/data/logs/backend/error*log` | job=error-logs |
| security-logs | `/data/logs/backend/security*log` | job=security-logs |
| performance-logs | `/data/logs/backend/performance*log` | job=performance-logs |
| audit-logs | `/data/logs/backend/audit*log` | job=audit-logs |
| business-logs | `/data/logs/backend/business*log` | job=business-logs |
| access-logs | `/data/logs/backend/access*log` | job=access-logs |
| system-syslog | `/var/log/syslog` | job=system-syslog |

### Loki 保留策略

- **保留期限**：30 天（`retention_period: 720h`）
- **自动删除**：`retention_deletes_enabled: true`
- **流控限制**：每流 16MB/s

### LogQL 查询

```logql
# 查询后端错误
{job="error-logs"} |= "error"

# 查询特定路径的慢请求
{job="access-logs"} | json | durationMs > 1000

# 统计错误率
sum(rate({job="error-logs"}[5m])) by (level)
```

### Grafana 预配置仪表板

| 仪表板 | 内容 |
|--------|------|
| 系统资源监控 | CPU/内存/磁盘/网络 |
| 数据库性能 | 连接池/查询延迟/慢查询 |
| Redis 监控 | 命中率/内存/连接数 |
| 业务指标 | 用户活跃/货币流动/操作统计 |
| 链路追踪 | 请求链路/错误追踪/性能瓶颈 |

---

## 六、日志安全与合规

### 敏感数据脱敏

所有日志输出前自动脱敏以下信息：
- **密码/密钥**：完全替换为 `***`
- **Token/JWT**：完全替换为 `***`
- **手机号**：`138****1234`
- **邮箱**：`a****@example.com`
- **身份证**：`110***********1234`
- **银行卡**：`6222************1234`

### 审计合规

- 审计日志保留 **180 天**
- 记录所有管理操作的用户、时间、路径、IP
- 通过 `auditMiddleware` 自动拦截

---

## 七、相关文档

- [Docker 部署指南](../deployment/docker-full)
- [本地部署指南](../deployment/local)
- [性能优化](./performance)
- [监控告警](./monitoring)
