# 后台管理系统

## 概述

开心农场后台管理系统是基于 Node.js + Vue 3 + PostgreSQL 构建的游戏运营管理平台，提供数据监控、用户管理、系统配置、内容管理等核心功能。

系统采用前后端分离架构，前端使用 Vue 3 + Pinia + Vite，后端基于 Express 框架，数据层使用 PostgreSQL + Redis 缓存。

**主要特性：**
- 完善的权限控制（RBAC 角色权限管理）
- 28 个功能页面，覆盖游戏运营管理全场景
- 实时预警推送（WebSocket）
- 丰富的数据可视化图表

## 核心功能模块

系统基于后端路由划分为以下核心模块：

### adminAchievement — 成就管理

- 成就配置管理（创建、编辑、删除成就条目）
- 奖励配置（金币、道具、经验等奖励类型）
- 成就条件定义和进度追踪

### adminCrop — 作物管理

- 作物配置管理（名称、生长周期、产出、品质等）
- 作物种子数据维护
- 与商店系统价格同步

### adminDatabase — 数据库管理

- 数据库健康状态监控（连接状态、索引统计、缓存状态）
- 索引管理（使用统计、未使用索引检测）
- 表分析（大小统计、操作统计、元组统计）
- 慢查询分析（依赖 `pg_stat_statements` 扩展，阈值 100ms）
- 缓存管理（状态监控、手动清除）

### adminFarmLevel — 农场配置

- 农场等级配置（升级所需经验、解锁内容）
- 土地品质管理（品质等级、升级费用）
- 等级奖励配置

### adminGameConfig — 游戏参数配置

- 参数分类管理（玩家系统、农场系统、经济系统、活动系统、系统设置）
- 多数据类型支持（STRING、INTEGER、FLOAT、BOOLEAN、ENUM、JSON、ARRAY）
- 参数验证规则配置
- 版本管理（变更历史、版本对比、版本回滚）
- 审批流程（关键参数变更需要审批）
- 配置导出/导入（JSON/YAML 格式）
- 配置热更新（缓存状态监控、批量编辑）

### adminItem — 道具管理

- 道具配置管理（名称、类型、效果、使用方式等）
- 道具分类维护
- 道具与商店商品关联

### adminMail — 邮件系统

- 系统邮件发送（单发、群发）
- 邮件模板管理
- 邮件状态追踪（已读/未读）

### adminManagement — 管理后台

- 仪表板（核心数据概览：总玩家数、待处理预警、待审批请求、今日操作）
- 玩家管理（列表、详情、状态管理，支持用户名/等级/状态筛选和分页）
- 审批流程（创建审批、审批列表、通过/拒绝操作）
- 操作日志（多维度筛选：时间、类型、操作人）
- 系统监控（CPU、内存、磁盘、数据库连接、API 响应时间）
- 预警中心（预警分级、状态管理、处理记录）
- 货币调控（流通数据查询、收入/支出趋势、异常检测）
- 数据统计（玩家统计、经济统计、游戏行为统计，支持日/周/月/年维度）
- 角色权限管理（RBAC 模型：用户-角色-权限三级架构）
- 公告系统（富文本编辑、分类管理、定时发布、阅读跟踪）
- 批量操作（批量删除/状态更新/分配/导出，支持异步处理）
- 游戏活动管理（活动创建、任务配置、进度追踪、奖励发放）
- 备份与恢复（自动定时备份、手动备份、数据恢复）

### adminShop — 商店管理

- 商店商品配置（上架/下架管理）
- 商品价格和库存管理
- 商品分类维护

## 扩展功能

系统包含 12 个已实现的扩展功能模块：

| 模块 | 说明 | 上线版本 |
|------|------|---------|
| 角色权限精细化管理（RBAC） | 用户-角色-权限三级架构，功能/操作/数据级权限控制 | v2.2.0 |
| 游戏公告发布系统 | 富文本编辑、分类管理、定时发布、阅读状态跟踪 | v2.2.1 |
| 游戏参数配置管理 | 参数分类、多数据类型支持、版本管理、审批流程 | v2.2.2 |
| 批量操作功能 | 列表勾选、批量操作、Excel 导入导出、异步处理 | v2.2.3 |
| 实时预警推送（WebSocket） | WebSocket 长连接、预警规则配置、定向推送、处理记录 | v2.3.0 |
| 系统健康检查 | 系统状态监控、健康检查仪表盘 | v4.0.0 |
| 备份与恢复系统 | 自动定时备份、手动备份、数据恢复、备份管理 | v4.1.0 |
| 系统配置热更新 | 配置缓存管理、批量编辑、导入导出、缓存状态监控 | v4.1.0 |
| 日志分析与可视化 | 日志查询、统计分析、可视化图表、实时监控 | v4.1.0 |
| 游戏活动管理系统 | 活动创建、任务配置、进度追踪、奖励发放、统计监控 | v4.2.0 |
| 数据库性能管理系统 | 索引优化、表分析、慢查询、缓存管理、健康检查 | v4.17.0 |
| 缓存系统全面升级 | 缓存预热、击穿防护、穿透防护、统计管理 | v4.18.0 |

## API 端点说明

### 管理后台核心 API

| API 路径 | 方法 | 功能 |
|---------|------|------|
| `/api/admin/dashboard` | GET | 获取仪表板数据概览 |
| `/api/admin/players` | GET | 获取玩家列表（支持筛选、排序、分页） |
| `/api/admin/players/:id` | GET | 获取玩家详情 |
| `/api/admin/players/:id/status` | PUT | 更新玩家状态（启用/禁用） |
| `/api/admin/approvals` | GET | 获取审批请求列表 |
| `/api/admin/approvals` | POST | 创建审批请求 |
| `/api/admin/approvals/:id` | PUT | 审批操作（通过/拒绝） |
| `/api/admin/logs` | GET | 获取操作日志 |
| `/api/admin/alerts` | GET | 获取预警列表 |
| `/api/admin/alerts/:id` | PUT | 处理预警 |
| `/api/admin/currency` | GET | 货币平衡数据查询 |
| `/api/admin/statistics` | GET | 多维度数据统计 |

### 游戏内容管理 API

| API 路径 | 方法 | 功能 |
|---------|------|------|
| `/api/admin/crops/*` | CRUD | 作物配置管理 |
| `/api/admin/items/*` | CRUD | 道具配置管理 |
| `/api/admin/shop/*` | CRUD | 商店商品管理 |
| `/api/admin/achievements/*` | CRUD | 成就配置管理 |
| `/api/admin/farm-level/*` | CRUD | 农场等级和土地品质管理 |

### 配置与系统管理 API

| API 路径 | 方法 | 功能 |
|---------|------|------|
| `/api/admin/configs/*` | CRUD | 游戏参数配置管理 |
| `/api/admin/configs/:key/history` | GET | 配置变更历史 |
| `/api/admin/configs/:key/restore` | POST | 配置版本回滚 |
| `/api/admin/mails/*` | CRUD | 邮件系统管理 |
| `/api/admin/database/health` | GET | 数据库健康状态 |
| `/api/admin/database/indexes` | GET | 索引统计信息 |
| `/api/admin/database/tables` | GET | 表大小统计 |
| `/api/admin/database/cache/stats` | GET | 缓存统计信息 |
| `/api/admin/cache/prewarm` | POST | 手动触发缓存预热 |

### 扩展功能 API

| API 路径 | 方法 | 功能 |
|---------|------|------|
| `/api/admin/roles/*` | CRUD | 角色管理 |
| `/api/admin/permissions/*` | CRUD | 权限管理 |
| `/api/admin/announcements/*` | CRUD | 公告管理 |
| `/api/admin/batch/*` | POST | 批量操作 |
| `/api/admin/alerts/rules/*` | CRUD | 预警规则配置 |
| `/api/admin/events/*` | CRUD | 游戏活动管理 |
| `/api/admin/backups/*` | CRUD | 备份与恢复 |

## 权限控制说明

### 角色体系

| 角色 | 说明 | 权限范围 |
|------|------|---------|
| 超级管理员 | 最高权限 | 所有功能 |
| 普通管理员 | 基础管理 | 部分功能 |
| 运营专员 | 日常运营 | 玩家管理、公告发布 |
| 数据分析师 | 数据分析 | 数据统计、报表导出 |
| 客服专员 | 客户服务 | 玩家查询、日志查看 |
| 技术运维 | 系统维护 | 监控、配置、备份 |

### 权限粒度

系统支持三级权限控制：

1. **功能级**：菜单可见性、模块访问权限
2. **操作级**：增删改查操作权限
3. **数据级**：可访问的数据范围（ALL / DEPARTMENT / OWN / CUSTOM）

### 权限树结构

```
系统管理
├── 用户管理 (sys:user:view, sys:user:create, sys:user:update)
└── 角色管理 (sys:role:view, sys:role:config)
玩家管理
├── 玩家查看 (player:view)
├── 玩家禁用 (player:disable)
└── 玩家信息修改 (player:modify)
游戏运营
├── 公告管理 (game:announcement)
├── 活动配置 (game:activity)
└── 参数配置 (game:config)
```

### 后端权限验证

所有管理 API 通过中间件链进行权限验证：

1. `authMiddleware` — JWT Token 认证
2. `checkAdminPermission` — 管理员身份验证
3. `checkPermission(code)` — 细粒度权限检查

### 前端权限控制

- 路由守卫：基于 `meta.requiresPermission` 自动拦截无权限页面
- 指令级控制：`v-permission` 指令自动移除无权限的 DOM 元素
- Pinia Store：`usePermissionStore` 提供 `hasPermission` 和 `hasAnyPermission` 方法

### 审计日志

所有管理操作均记录审计日志，包含：
- 操作人 ID 和用户名
- 操作类型和模块
- 操作详情（变更前后数据）
- IP 地址和 User-Agent
- 操作时间戳

### 安全特性

- JWT Token 认证 + Token 过期自动刷新
- SQL 注入防护（参数化查询）
- XSS 防护（输入验证 + URL 白名单）
- CSRF 保护
- 敏感信息脱敏
- 参数验证（类型检查、范围验证）
