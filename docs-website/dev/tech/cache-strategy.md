# 缓存失效策略

## 概述

本文档说明开心农场项目的缓存失效策略，帮助开发者正确处理缓存失效，避免数据不一致。

项目使用 Redis 作为缓存层，缓存数据库查询结果和热点数据以提升响应速度。

## 当前缓存策略

### 已实现的缓存

| 缓存键前缀 | 内容 | 过期时间 | 失效触发 |
|-----------|------|---------|---------|
| `crop:` | 作物配置 | 1 小时 | 作物配置更新 |
| `user:` | 用户信息 | 30 分钟 | 用户信息修改 |
| `land:` | 地块状态 | 5 分钟 | 地块状态变更 |

## 缓存失效策略

### 1. 立即失效（Write-Through）

**适用场景：**
- 用户信息变更
- 农场状态更新
- 配置修改

**实现示例：**

```javascript
async function updateUser(userId, data) {
  // 1. 更新数据库
  await db.update('users', data).where('id', userId);

  // 2. 立即失效缓存
  await cache.del(`user:${userId}`);

  // 3. 可选：预加载新数据
  const updated = await db.getUser(userId);
  await cache.set(`user:${userId}`, updated);
}
```

### 2. 延迟失效（Time-Based）

**适用场景：**
- 排行榜
- 统计数据
- 非实时要求高的内容

**实现方式：**
- 设置合理的 TTL（过期时间）
- 到期自动失效

### 3. 批量失效（Pattern Deletion）

**适用场景：**
- 模块级别的数据变更
- 批量操作后

**实现示例：**

```javascript
async function deleteCrop(cropId) {
  // 1. 更新数据库
  await db.delete('crops').where('id', cropId);

  // 2. 批量失效相关缓存
  await cache.delPattern('crop:*');
  await cache.delPattern(`land:*:crop:${cropId}`);
}
```

### 4. 版本号失效

**适用场景：**
- 配置版本管理
- 数据有明确版本

**实现示例：**

```javascript
// 键包含版本号
const cacheKey = `config:v2:game`;

// 更新时版本号+1
async function updateConfig() {
  const newVersion = currentVersion + 1;
  await cache.set(`config:v${newVersion}:game`, data);
  // 旧版本自动过期
}
```

## 热点数据缓存建议

### 农场主页面

**建议缓存：**
- 玩家基础信息
- 农场状态
- 作物列表
- 成就进度

**失效策略：**
- 玩家操作后立即失效相关键
- 后台更新时批量失效

### 排行榜

**建议缓存：**
- 排行榜数据（5 分钟缓存）
- 缓存过期时间错开，避免同时失效

**失效策略：**
- 定时刷新
- 事件触发刷新

### 配置数据

**建议缓存：**
- 游戏配置（1 小时）
- 作物配置（长时间缓存）
- 价格配置

**失效策略：**
- 配置更新时立即失效
- 版本号管理

## 缓存防护机制

### 缓存击穿防护

防止热点数据失效时大量请求同时打到数据库：

- **互斥加载**：同一 Key 同一时间只有一个请求加载，其他请求等待或返回旧数据
- **超时保护**：防止死锁
- **热点数据预加载**：服务器启动时自动预热关键数据

### 缓存穿透防护

防止恶意请求查询不存在的数据穿透到数据库：

- **空值缓存**：查询不存在的 Key 也缓存空结果（较短过期时间）
- **布隆过滤器**：可选方案，拦截不存在的 Key

### 缓存雪崩防护

防止大量缓存同时失效导致数据库压力骤增：

- **随机化过期时间**：在基础 TTL 上增加随机偏移
- **多级缓存**：本地缓存 + Redis 缓存
- **降级方案**：缓存不可用时的兜底策略

## 常见问题

### 如何避免缓存击穿？

- 缓存空值
- 互斥锁保护
- 热点数据预加载

### 缓存与数据库不一致怎么办？

- 优先保证数据库正确性
- 失效相关缓存让其重新加载
- 使用双删策略（先删缓存 → 更新数据库 → 再删缓存）

### 缓存雪崩如何处理？

- 随机化过期时间
- 多级缓存
- 降级方案

## 与现有代码的集成

在 `farmService` 中使用 `cacheService` 进行缓存管理：

```javascript
const { invalidateUserCache, invalidateLandCache } = cacheService;

// 在种植、收获等操作后调用
await invalidateLandCache(playerId, landNum);
```

## 性能建议

- 缓存失效操作本身很轻量，主要影响是下次请求需要重新生成缓存
- 避开流量高峰执行批量失效
- 预热关键缓存（系统配置、游戏参数、作物数据、世界等级数据、公告数据）

## 相关文档

- [性能优化](./performance.md)
- [监控系统](./monitoring.md)
