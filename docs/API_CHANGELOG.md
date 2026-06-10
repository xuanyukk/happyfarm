# API 变更日志

本文档记录开心农场项目所有 API 的破坏性变更和重要更新。

## v4.x 版本

### v4.79.0 (2026-06-11)

#### 认证 API
- **统一 JWT 密钥体系**：access_token 和 refresh_token 改用分离密钥（`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`），旧版统一密钥签发 token 在过期前仍可验证（过渡期兼容）

### v4.78.0 (2026-06-11)

#### 认证 API
- **refreshToken**：旧 access_token 现在自动加入黑名单，刷新后不能继续使用
- **logout**：退出登录同时将令牌加入 Redis 黑名单

### v4.77.0 (2026-06-11)

#### 认证 API
- **authMiddleware**：新增 token 类型校验，refresh_token 不能再通过 API 认证

## API 版本化策略

- 所有 API 路由前缀：`/api/`
- 向后兼容原则：非必要不做破坏性变更
- 破坏性变更至少提前一个次版本号通知（通过 `CHANGELOG.md`）
- 过渡期新旧接口并行运行至少一个版本周期

## 参考

- [CHANGELOG.md](../CHANGELOG.md) — 完整版本变更记录
- [docs-website](https://happy-farm.dev/) — 在线 API 文档