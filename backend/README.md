/**
 * 文件名：README.md
 * 作者：TraeAI、xuanyukk
 * 日期：2026-06-01
 * 版本：v4.71.6
 * 功能描述：开心农场后端服务说明文档
 * 更新记录：
 *   2026-05-21 - v4.50.0 - 初始创建
 *   2026-06-01 - v4.71.6 - 同步最新版本
 */

# 开心农场 - 后端

开心农场项目的后端服务，基于 Node.js + Express + PostgreSQL + Redis 构建。

## 技术栈

- **运行时**：Node.js >= 18.x
- **Web框架**：Express 5.x
- **数据库**：PostgreSQL 13+
- **缓存**：Redis 7+
- **ORM/查询**：原生 SQL + 连接池
- **认证**：JWT (Access Token + Refresh Token)
- **API文档**：Swagger (swagger-jsdoc + swagger-ui-express)
- **日志**：Winston + Daily Rotate File
- **WebSocket**：Socket.io
- **任务队列**：BullMQ
- **进程管理**：PM2
- **测试框架**：Jest
- **代码规范**：ESLint + Prettier
- **Git钩子**：Husky

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 13.x
- Redis >= 7.x

### 安装依赖

```bash
cd backend
npm install
```

### 环境配置

复制项目根目录的 `.env.example` 为 `.env` 并根据需要修改。

> 📖 **完整配置说明**：项目根目录的 `.env` 文件包含完整的 380+ 行环境变量配置，涵盖数据库、缓存、安全、监控、告警、备份等所有功能。请参考根目录配置进行实际部署。

### 核心配置（最小示例）

```env
# 服务器配置
NODE_ENV=development
PORT=3001

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=happy_farm

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=3

# API限流配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# 其他配置
SAFETY_CONFIRM=true
BACKUP_DIR=./backups
BACKUP_COMPRESS=true
```

> ⚠️ 生产环境必须修改所有默认密码和密钥！完整的配置列表请参考项目根目录的 `环境变量配置说明.md`

### 数据库初始化

使用项目根目录的 `sql_init/` 中的脚本初始化数据库：

```bash
# 方式1：使用 Node.js 脚本
cd ../sql_init
node init_db.js

# 方式2：使用交互式管理工具
node db_manager.js

# 方式3：手动执行 SQL
psql -U postgres -d postgres -f 01_database/01_create_database.sql
psql -U postgres -d happy_farm -f full_init.sql
```

### 启动服务

#### 开发模式

```bash
npm run dev
```

服务将在 http://localhost:3000 启动

#### 生产模式 (PM2)

```bash
# 启动服务
npm run start

# 或
npm run start:prod

# 停止服务
npm run stop

# 重启服务
npm run restart

# 删除服务
npm run delete

# 查看日志
npm run logs

# 监控面板
npm run monit
```

### 运行测试

```bash
# 运行测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 代码检查

```bash
# ESLint检查
npm run lint

# 自动修复
npm run lint:fix

# Prettier格式化
npm run format
```

## 项目结构

```
backend/
├── src/
│   ├── config/             # 配置文件
│   │   ├── apiVersion.js
│   │   ├── db.js
│   │   ├── diContainer.js
│   │   ├── index.js
│   │   ├── logger.js
│   │   ├── queueConfig.js
│   │   ├── redis.js
│   │   ├── serviceProvider.js
│   │   ├── services.js
│   │   └── swagger.js
│   ├── controllers/        # 控制器
│   │   ├── achievementController.js
│   │   ├── adminController.js
│   │   ├── alertController.js
│   │   ├── announcementController.js
│   │   ├── authController.js
│   │   ├── backupController.js
│   │   ├── batchController.js
│   │   ├── businessMetricsController.js
│   │   ├── clientLogController.js
│   │   ├── configController.js
│   │   ├── cropController.js
│   │   ├── dataWarehouseController.js
│   │   ├── economyController.js
│   │   ├── farmController.example.js
│   │   ├── farmController.js
│   │   ├── gameActivityController.js
│   │   ├── gameEventController.js
│   │   ├── healthCheck.js
│   │   ├── incrementalController.js
│   │   ├── itemController.js
│   │   ├── logAnalysisController.js
│   │   ├── logCleanupController.js
│   │   ├── monitoringController.js
│   │   ├── performanceController.js
│   │   ├── playerController.js
│   │   ├── queueController.js
│   │   ├── rbacController.js
│   │   ├── shopController.js
│   │   └── traceController.js
│   ├── middleware/         # 中间件
│   │   ├── auditMiddleware.js
│   │   ├── authMiddleware.js
│   │   ├── cacheMiddleware.js
│   │   ├── csrfMiddleware.js
│   │   ├── permissionMiddleware.js
│   │   ├── rateLimiter.js
│   │   ├── requestLogger.js
│   │   └── responseTime.js
│   ├── routes/             # 路由
│   │   ├── achievementRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── alertRoutes.js
│   │   ├── announcementRoutes.js
│   │   ├── authRoutes.js
│   │   ├── backupRoutes.js
│   │   ├── batchRoutes.js
│   │   ├── businessMetricsRoutes.js
│   │   ├── clientLogRoutes.js
│   │   ├── configRoutes.js
│   │   ├── cropRoutes.js
│   │   ├── dataWarehouseRoutes.js
│   │   ├── economyRoutes.js
│   │   ├── farmRoutes.js
│   │   ├── gameActivityRoutes.js
│   │   ├── gameEventRoutes.js
│   │   ├── healthRoutes.js
│   │   ├── itemRoutes.js
│   │   ├── logAnalysisRoutes.js
│   │   ├── logCleanupRoutes.js
│   │   ├── monitoringRoutes.js
│   │   ├── performanceRoutes.js
│   │   ├── playerRoutes.js
│   │   ├── queueRoutes.js
│   │   ├── rbacRoutes.js
│   │   ├── shopRoutes.js
│   │   └── traceRoutes.js
│   ├── services/           # 业务逻辑服务
│   │   ├── achievementService.js
│   │   ├── adminService.js
│   │   ├── alertNotificationService.js
│   │   ├── alertService.js
│   │   ├── announcementService.js
│   │   ├── auditService.js
│   │   ├── backupService.js
│   │   ├── batchService.js
│   │   ├── businessMetricsService.js
│   │   ├── cacheService.js
│   │   ├── configService.js
│   │   ├── cropMonitorService.js
│   │   ├── cropService.js
│   │   ├── dataWarehouseService.js
│   │   ├── deviceService.js
│   │   ├── docsExportService.js
│   │   ├── economyService.js
│   │   ├── emailService.js
│   │   ├── encryptionService.js
│   │   ├── eventService.js
│   │   ├── farmService.js
│   │   ├── gameActivityService.js
│   │   ├── gameEventService.js
│   │   ├── initService.js
│   │   ├── itemService.js
│   │   ├── logAnalysisService.js
│   │   ├── logCleanupService.js
│   │   ├── monitoringService.js
│   │   ├── playerService.js
│   │   ├── queueService.js
│   │   ├── rbacService.js
│   │   ├── schedulerService.js
│   │   ├── shopService.js
│   │   ├── tokenService.js
│   │   ├── traceService.js
│   │   ├── twoFactorService.js
│   │   └── websocketService.js
│   ├── types/              # TypeScript类型定义
│   │   └── index.d.ts
│   ├── utils/              # 工具函数
│   │   ├── constants.js
│   │   ├── errors.js
│   │   ├── logger-advanced.js
│   │   ├── response.js
│   │   └── security.js
│   └── server.js           # 应用入口
├── __tests__/              # 测试文件
│   ├── achievementService.test.js
│   ├── adminController.test.js
│   ├── adminFlow.test.js
│   ├── adminService.test.js
│   ├── announcementService.test.js
│   ├── authMiddleware.test.js
│   ├── backupService.test.js
│   ├── cacheService.test.js
│   ├── configService.test.js
│   ├── cropService.test.js
│   ├── dbPerformance.test.js
│   ├── diContainer.test.js
│   ├── economyService.test.js
│   ├── farmService.test.js
│   ├── gameCoreFlow.test.js
│   ├── health.test.js
│   ├── integration.test.js
│   ├── itemService.test.js
│   ├── performance.test.js
│   ├── playerService.test.js
│   ├── queueService.test.js
│   ├── rbacService.test.js
│   ├── security.test.js
│   ├── server.test.js
│   ├── setup.js
│   ├── simple.test.js
│   ├── utils.test.js
│   └── websocketService.test.js
├── scripts/                # 脚本
│   └── generate-keys.js
├── .env.example            # 环境变量示例
├── .eslintrc.js            # ESLint配置
├── .gitignore
├── .prettierrc             # Prettier配置
├── Dockerfile              # Docker配置
├── ecosystem.config.js     # PM2配置
├── jest.config.js          # Jest配置
├── jsconfig.json
├── package.json
├── redis-monitor.js
└── tsconfig.json
```

## 主要功能

### 核心游戏功能

- **用户认证**：注册、登录、JWT认证、密码重置、双因素认证
- **玩家管理**：玩家信息、等级、经验
- **农场系统**：土地管理、作物种植、收获、升级
- **作物系统**：84种作物，成长计算、解锁机制
- **经济系统**：多货币、商店、交易、流水记录
- **道具系统**：道具使用、效果管理
- **成就系统**：成就检测、进度追踪、奖励发放
- **活动日志**：玩家操作记录

### 扩展功能

- **RBAC权限管理**：用户-角色-权限三级架构
- **公告系统**：富文本公告、分类管理、定时发布
- **游戏配置**：热更新配置、版本管理
- **批量操作**：批量处理、异步任务
- **实时推送**：WebSocket实时通知
- **备份恢复**：自动备份、手动备份、数据恢复
- **日志分析**：日志查询、统计分析、可视化
- **游戏活动**：活动创建、任务配置、进度追踪、奖励发放

### 运维监控

- **健康检查**：系统健康状态监控
- **性能监控**：API响应时间、QPS、错误率
- **服务器监控**：CPU、内存、磁盘、网络
- **告警系统**：分级告警、多渠道通知
- **业务指标**：交易成功率、用户活跃度、游戏指标
- **链路追踪**：请求追踪、性能分析
- **日志清理**：差异化保留策略、自动清理
- **数据仓库**：BI分析、聚合视图、趋势预测

### 安全特性

- **JWT双令牌**：Access Token + Refresh Token
- **API限流**：IP+用户维度限流、Redis+内存降级
- **CSRF防护**：跨站请求伪造防护
- **XSS防护**：输入过滤、输出编码
- **SQL注入防护**：参数化查询、输入验证
- **权限验证**：RBAC权限控制、数据权限
- **敏感数据脱敏**：日志自动脱敏
- **密码加密**：bcrypt加密存储

## API文档

启动服务后访问 Swagger 文档：

http://localhost:3000/api-docs

### 主要API端点

#### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重置密码

#### 玩家
- `GET /api/players/profile` - 获取玩家信息
- `PUT /api/players/profile` - 更新玩家信息
- `GET /api/players/currency` - 获取货币信息
- `GET /api/players/achievements` - 获取成就进度

#### 农场
- `GET /api/farm/lands` - 获取农场土地
- `POST /api/farm/plant` - 种植作物
- `POST /api/farm/harvest` - 收获作物
- `POST /api/farm/upgrade` - 升级土地

#### 作物
- `GET /api/crops` - 获取作物列表
- `GET /api/crops/:id` - 获取作物详情
- `GET /api/crops/unlocked` - 获取已解锁作物

#### 商店
- `GET /api/shop/items` - 获取商店物品
- `POST /api/shop/buy` - 购买物品

#### 背包
- `GET /api/inventory` - 获取背包物品
- `POST /api/inventory/use` - 使用道具
- `POST /api/inventory/sell` - 出售物品

#### 管理员
- `GET /api/admin/users` - 用户管理
- `GET /api/admin/statistics` - 数据统计
- `GET /api/admin/config` - 系统配置
- `POST /api/admin/backup` - 数据备份
- `GET /api/admin/logs` - 日志分析
- `GET /api/admin/monitoring` - 监控数据
- `GET /api/admin/metrics` - 业务指标

更多API详情请查看 Swagger 文档。

## 数据库

### 数据表

项目包含约62个数据表，主要分为：

- **核心表**：用户、农场、作物、物品、商店、成就等
- **认证表**：登录、令牌、双因素认证、设备管理
- **日志表**：审计日志、游戏活动日志
- **管理表**：公告、配置、游戏活动、RBAC权限
- **监控表**：性能监控、告警、链路追踪
- **数据仓库**：日期维度、玩家维度、作物维度、事实表、聚合视图

### 连接池配置

数据库连接池配置在 `src/config/db.js`：

```javascript
{
  max: 25,              // 最大连接数
  min: 5,               // 最小连接数
  idleTimeoutMillis: 30000,  // 空闲超时
  connectionTimeoutMillis: 2000,  // 连接超时
}
```

## 缓存

Redis缓存服务配置在 `src/config/redis.js`，主要用于：

- **热点数据缓存**：配置信息、作物数据等
- **会话存储**：JWT令牌黑名单
- **API限流**：限流计数器
- **任务队列**：BullMQ队列存储
- **实时数据**：WebSocket会话管理

缓存服务特性：
- 自动预热机制
- 多种TTL配置
- 缓存装饰器简化使用
- 击穿/穿透防护

## 性能优化

- **数据库索引**：优化查询性能的索引设计
- **查询缓存**：热点数据Redis缓存
- **连接池**：数据库和Redis连接池
- **API限流**：防止过载保护
- **PM2集群**：多核利用
- **压缩**：Gzip响应压缩
- **异步处理**：耗时任务异步化

## 部署

### Docker部署

使用项目根目录的 `docker-compose.yml`：

```bash
cd ..
docker-compose up -d
```

### 传统部署

1. 确保 PostgreSQL 和 Redis 已安装并运行
2. 配置环境变量
3. 初始化数据库
4. 启动服务：

```bash
cd backend
npm install
npm run start:prod
```

### PM2配置

`ecosystem.config.js` 包含完整的PM2配置，支持：
- 集群模式（instances: max）
- 日志轮转
- 自动重启
- 环境变量管理

## 测试

项目包含255个Jest测试用例，覆盖：
- 单元测试
- 集成测试
- API端点测试
- 认证和权限测试
- 安全测试

## 相关文档

更多详细文档请参考：
- 项目根目录 `docs/` - 内部开发文档
- 项目根目录 `docs-website/` - 官方文档网站
- `sql_init/README.md` - 数据库初始化文档

## 版本

v4.71.7

## 许可证

MIT License
