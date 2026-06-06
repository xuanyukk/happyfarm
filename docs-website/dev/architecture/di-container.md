# DI 容器



本文档介绍开心农场项目的依赖注入容器设计。

## 概述

项目使用自定义的 DI（依赖注入）容器来管理服务的生命周期和依赖关系。

## 核心概念

### 服务注册
服务在启动时注册到容器中，可以按不同的生命周期注册。

### 生命周期类型
- **Singleton** - 单例模式，全局唯一实例
- **Transient** - 每次请求创建新实例
- **Scoped** - 每个请求范围一个实例

## 主要服务

### 核心服务
- `DatabaseService` - 数据库服务
- `CacheService` - 缓存服务
- `LoggerService` - 日志服务

### 业务服务
- `PlayerService` - 玩家服务
- `FarmService` - 农场服务
- `CropService` - 作物服务
- `ShopService` - 商店服务
- `AchievementService` - 成就服务

### 管理服务
- `AdminService` - 管理员服务
- `RBACService` - 权限控制服务
- `AuditService` - 审计服务

## 使用方式

### 获取服务
```javascript
const playerService = container.get('PlayerService');
```

### 注册服务
```javascript
container.register('PlayerService', PlayerService, 'singleton');
```

## 相关文档

- [系统架构](./system)
