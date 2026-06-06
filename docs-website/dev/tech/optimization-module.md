# 优化模块使用指南

**文档版本：** v3.0.0  
**最后更新：** 2026-05-08  
**适用项目：** 开心农场 (Happy Farm)

---

## 概述

本文档介绍项目中优化模块的使用方法，已适配最新的 DI 容器架构！

---

## 项目状态说明

开心农场项目优化工作已全部完成！（v4.50.0）
- ✅ 第一阶段：缓存服务、限流、JWT、数据重排、监控
- ✅ 第二阶段：代码规范、测试、PM2、CI/CD
- ✅ 第三阶段：路由懒加载、虚拟滚动、骨架屏、HMR
- ✅ 第四阶段：keep-alive 缓存、响应式优化
- ✅ 第五阶段：打包与静态资源优化

---

## 后端优化模块

### 1. 统一错误处理 (`utils/errors.js`)

#### 使用示例
```javascript
const { 
  ValidationError, 
  NotFoundError, 
  asyncHandler 
} = require('../utils/errors');

// 在控制器中使用
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('用户不存在', 'USER_NOT_FOUND');
  }
  
  if (!req.body.name) {
    throw new ValidationError('用户名为必填');
  }
});
```

#### 错误类型说明
- `AppError` - 基础错误类
- `ValidationError` - 验证错误 (400)
- `NotFoundError` - 未找到错误 (404)
- `UnauthorizedError` - 未授权错误 (401)
- `ForbiddenError` - 禁止访问错误 (403)
- `ConflictError` - 冲突错误 (409)

---

### 2. 统一响应格式 (`utils/response.js`)

#### 使用示例
```javascript
const { success, error, paginate } = require('../utils/response');

// 成功响应
res.json(success({ user: user }, '获取用户成功'));

// 错误响应
res.status(400).json(error('参数错误', 'INVALID_PARAMS'));

// 分页响应
res.json(paginate({ items: users, total: 100, page: 1, limit: 10 }));
```

---

### 3. 缓存服务 (`services/cacheService.js`)

#### 使用示例
```javascript
const { cacheService } = require('../container');

// 设置缓存
await cacheService.set('key', value, 3600); // 1小时过期

// 获取缓存
const value = await cacheService.get('key');

// 删除缓存
await cacheService.del('key');

// 使用缓存包装函数
const data = await cacheService.wrap(
  'cache_key',
  async () => expensiveDatabaseQuery(),
  3600
);
```

---

### 4. 限流中间件 (`middleware/rateLimiter.js`)

#### 使用方式
```javascript
const { rateLimiter } = require('../container');

// 限制每个IP每分钟最多60次请求
app.use('/api', rateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: '请求过于频繁，请稍后再试'
}));
```

---

### 5. JWT 令牌服务 (`services/tokenService.js`)

#### 使用示例
```javascript
const { tokenService } = require('../container');

// 生成令牌
const { accessToken, refreshToken } = await tokenService.generateTokens(user);

// 验证令牌
const user = await tokenService.verifyAccessToken(accessToken);

// 刷新令牌
const newTokens = await tokenService.refreshTokens(refreshToken);
```

---

## 与 DI 容器集成使用

### 服务定位模式
```javascript
const { 
  cacheService, 
  tokenService, 
  rbacService 
} = require('../container');

// 直接使用服务
const cached = await cacheService.get('key');
```

### 中间件模式
```javascript
// 从容器中获取中间件
const { authMiddleware, permissionMiddleware } = require('../container');

router.get('/users', 
  authMiddleware,
  permissionMiddleware('admin:users:read'),
  userController.getUsers
);
```

---

## 新增优化模块

### 1. 日志分析平台

#### 使用示例
```javascript
const { logAnalysisService } = require('../container');

// 查询日志
const logs = await logAnalysisService.searchLogs({
  level: 'error',
  startDate: new Date(Date.now() - 86400000),
  keyword: '数据库'
});

// 获取统计
const stats = await logAnalysisService.getStats();
```

---

### 2. 备份恢复服务

#### 使用示例
```javascript
const { backupService } = require('../container');

// 创建备份
const backupPath = await backupService.createBackup();

// 恢复备份
await backupService.restoreBackup(backupPath);

// 列出备份
const backups = await backupService.listBackups();
```

---

### 3. 配置热更新

#### 使用示例
```javascript
const { configService } = require('../container');

// 获取配置
const config = await configService.get('key');

// 更新配置
await configService.set('key', 'value');

// 重新加载配置
await configService.reload();
```

---

## 监控和告警

### 系统健康检查

```javascript
const { healthCheckService } = require('../container');

const health = await healthCheckService.checkAll();
/*
{
  status: 'ok',
  postgres: 'ok',
  redis: 'ok',
  memory: 'ok'
}
*/
```

---

## 相关文档

- [性能优化](../tech/performance.md)
- [监控告警](../tech/monitoring.md)
- [RBAC 权限控制](../tech/rbac.md)
- [WebSocket](../tech/websocket.md)

---

*文档最后更新: 2026-05-21*
