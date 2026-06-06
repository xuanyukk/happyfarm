# 系统架构

本文档介绍开心农场项目的整体架构设计。

## 文档信息

- **版本**：v1.2.0
- **日期**：2026-05-21
- **项目版本**：v4.50.0

---

## 概述

开心农场采用前后端分离的架构设计，使用现代化的技术栈构建。

## 整体架构

### 系统架构图

```mermaid
graph TB
    subgraph 前端层
        A[Vue 3 前端应用]
        B[Pinia 状态管理]
        C[Vite 构建工具]
        D[WebSocket Client]
    end

    subgraph API 网关层
        E[Express Server]
        F[API Version Control]
        G[Rate Limiter]
    end

    subgraph 中间件层
        H[Auth Middleware]
        I[Cache Middleware]
        J[Audit Middleware]
        K[CSRF Middleware]
    end

    subgraph 控制层
        L[Controllers]
    end

    subgraph 服务层
        M[Crop Service]
        N[Farm Service]
        O[Player Service]
        P[Economy Service]
        Q[Item Service]
        R[RBAC Service]
        S[Queue Service]
    end

    subgraph 基础设施层
        T[PostgreSQL]
        U[Redis]
        V[BullMQ Queue]
        W[WebSocket Server]
    end

    A --> E
    D --> W
    E --> H
    E --> I
    E --> J
    E --> K
    H --> L
    I --> L
    J --> L
    K --> L
    L --> M
    L --> N
    L --> O
    L --> P
    L --> Q
    L --> R
    L --> S
    M --> T
    N --> T
    O --> T
    P --> T
    Q --> T
    R --> T
    S --> V
    S --> U
    M --> U
    N --> U
```

### 前后端数据流图

```mermaid
flowchart LR
    A[用户] -->|操作| B[前端Vue组件]
    B -->|API调用| C[Axios HTTP Client]
    C -->|HTTP请求| D[Express Server]
    D -->|认证| E[Auth Middleware]
    E -->|路由| F[Controller]
    F -->|业务逻辑| G[Service]
    G -->|查询| H[(PostgreSQL)]
    G -->|缓存| I[(Redis)]
    G -->|异步任务| J[BullMQ Queue]
    G -->|实时推送| K[WebSocket]
    K -->|更新| B
```

### 分层架构说明

本项目采用经典的前后端分离架构，主要分为以下几层：

| 层级 | 技术栈 | 职责 |
|------|--------|------|
| **前端层** | Vue 3 + Vite + Pinia | 用户界面、状态管理、路由 |
| **API 网关层** | Express 5 | 路由分发、API版本控制、限流 |
| **中间件层** | Express Middleware | 认证、缓存、审计、CSRF防护 |
| **控制层** | Controllers | 请求处理、参数验证、响应格式化 |
| **服务层** | Services | 业务逻辑、数据处理、事务管理 |
| **基础设施层** | PostgreSQL + Redis + BullMQ | 数据存储、缓存、队列、实时通信 |

---

## 模块交互流程

### HTTP API 请求流程

```mermaid
sequenceDiagram
    participant Client as 前端客户端
    participant Server as Express服务器
    participant Middleware as 中间件链
    participant Controller as 控制器
    participant Service as 服务层
    participant Cache as Redis缓存
    participant DB as PostgreSQL数据库

    Client->>Server: HTTP Request
    activate Server
    
    Server->>Middleware: Rate Limiter
    activate Middleware
    Middleware-->>Server: 继续/拒绝
    deactivate Middleware

    Server->>Middleware: CSRF检查
    activate Middleware
    Middleware-->>Server: 通过/失败
    deactivate Middleware

    Server->>Middleware: Auth验证
    activate Middleware
    Middleware->>Cache: 查询用户缓存
    Cache-->>Middleware: 用户信息(缓存)
    alt 缓存未命中
        Middleware->>DB: 查询用户信息
        DB-->>Middleware: 用户信息
        Middleware->>Cache: 写入缓存
    end
    Middleware-->>Server: req.user设置
    deactivate Middleware

    Server->>Controller: 路由分发
    activate Controller

    Controller->>Service: 调用服务
    activate Service

    Service->>Cache: 尝试查询缓存
    alt 缓存命中
        Cache-->>Service: 返回缓存数据
    else 缓存未命中
        Service->>DB: 执行SQL查询
        DB-->>Service: 返回数据
        Service->>Cache: 写入缓存
    end

    Service-->>Controller: 返回业务结果
    deactivate Service

    Controller-->>Client: JSON响应
    deactivate Controller
    deactivate Server
```

### 种植-收获流程

```mermaid
flowchart TD
    A[用户选择地块] --> B[选择作物]
    B --> C[点击种植]
    C --> D[发送POST /api/crops/plant]
    D --> E{认证检查}
    E -->|通过| F{参数验证}
    E -->|失败| Z[返回401错误]
    F -->|通过| G[调用cropService.plantCrop]
    F -->|失败| Y[返回400错误]
    
    G --> H[开始数据库事务]
    H --> I[查询玩家余额]
    I --> J[查询地块状态]
    J --> K{验证条件}
    K -->|失败| L[回滚事务]
    L --> Z
    K -->|通过| M[扣除种子]
    M --> N[更新地块状态]
    N --> O[记录种植时间]
    O --> P[记录审计日志]
    P --> Q[提交事务]
    Q --> R[WebSocket推送更新]
    R --> S[返回成功响应]
```

### 队列任务处理流程

```mermaid
sequenceDiagram
    participant API as API服务器
    participant Queue as BullMQ队列
    participant Worker as Worker处理器
    participant Service as 业务服务

    API->>Queue: 添加任务(job)
    Queue->>Queue: 持久化到Redis
    
    Worker->>Queue: 取待处理任务
    Queue-->>Worker: 返回job
    
    alt 邮件任务
        Worker->>Service: 调用emailService
        Service-->>Worker: 发送邮件
    else 通知任务
        Worker->>Service: 调用websocketService
        Service-->>Worker: 推送通知
    else 备份任务
        Worker->>Service: 调用backupService
        Service-->>Worker: 执行备份
    else 缓存失效
        Worker->>Service: 调用cacheService
        Service-->>Worker: 清除缓存
    end
    
    Worker-->>Queue: 标记完成/失败
```

### 认证与授权流程

```mermaid
flowchart TD
    A[用户登录] --> B[发送登录请求]
    B --> C[验证用户名密码]
    C --> D{验证结果}
    D -->|成功| E[生成JWT Token]
    D -->|失败| F[返回401错误]
    E --> G[返回Token给用户]
    
    H[后续API请求] --> I[携带Token]
    I --> J[验证Token]
    J --> K{验证结果}
    K -->|成功| L[获取用户信息]
    L --> M[检查用户权限]
    M --> N{权限检查}
    N -->|通过| O[处理请求]
    N -->|拒绝| P[返回403错误]
    K -->|失败| Q[Token刷新]
```

---

## 技术栈

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >=18 | 运行环境 |
| Express | ^5.2.1 | Web框架 |
| PostgreSQL | >=14 | 关系型数据库 |
| Redis | >=7 | 缓存/队列存储 |
| BullMQ | ^5.13.0 | 任务队列 |
| Winston | ^3.11.0 | 日志系统 |
| JWT | ^9.0.3 | 认证令牌 |
| Bcrypt | ^6.0.0 | 密码加密 |

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | ^3.5.30 | 前端框架 |
| Vite | ^8.0.0 | 构建工具 |
| Pinia | ^2.1.7 | 状态管理 |
| Vue Router | ^4.2.5 | 路由 |
| Axios | ^1.13.6 | HTTP客户端 |

### DevOps
- **Docker** - 容器化
- **Docker Compose** - 服务编排
- **GitHub Actions** - CI/CD

---

## 部署架构

### 部署架构图

```mermaid
graph TD
    subgraph 客户端层
        A[Web浏览器]
        B[移动端浏览器]
    end

    subgraph CDN层
        C[CDN加速]
    end

    subgraph 负载均衡层
        D[Nginx]
    end

    subgraph 应用层
        E[App Server 1]
        F[App Server 2]
    end

    subgraph 数据层
        G[(PostgreSQL Primary)]
        H[(PostgreSQL Replica)]
        I[(Redis Cluster)]
    end

    A --> C
    B --> C
    C --> D
    D --> E
    D --> F
    E --> G
    E --> I
    F --> H
    F --> I
```

---

## 扩展性设计

### 水平扩展

- **应用层**：无状态设计，支持横向扩展
- **数据层**：PostgreSQL读写分离 + Redis Cluster
- **缓存层**：Redis分片 + 一致性哈希

### 模块扩展

- **新功能**：新增Controller + Service，遵循现有规范
- **新队列**：在queueService中添加新的处理器
- **新权限**：在RBAC系统中定义新权限

---

## 监控与运维

### 监控指标

- **性能指标**：API响应时间、数据库连接池、Redis命中率
- **业务指标**：在线用户数、农场活跃度、经济数据
- **系统指标**：CPU、内存、磁盘使用率

### 日志系统

使用Winston分级日志：
- error：错误日志
- warn：警告日志
- info：一般信息
- debug：调试信息

---

## 主要模块

### 用户模块
- 用户注册/登录
- JWT 认证
- 双因素认证
- 会话管理

### 农场模块
- 地块管理
- 作物种植
- 收获操作
- 品质提升

### 经济模块
- 货币系统
- 商店功能
- 背包管理

### 成就模块
- 成就检测
- 奖励发放
- 进度追踪

---

## 相关文档

- [数据库设计](./database)
- [DI 容器](./di-container)
- [数据库ER图](./database)
- [Redis监控告警](../tech/monitoring)
- [性能优化](../tech/performance)
