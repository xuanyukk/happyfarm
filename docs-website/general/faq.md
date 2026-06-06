# 常见问题 FAQ

**文档版本：** v1.44.0  
**最后更新：** 2026-05-18

---

## 开发相关

### Q: 如何设置本地开发环境？

**A:** 请按照以下步骤操作：
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/happy-farm.git

# 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 3. 配置环境变量
cd ../backend && cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息

# 4. 初始化数据库
cd ../sql_init && node init_db.js

# 5. 启动服务
cd ../backend && npm run dev
cd ../frontend && npm run dev
```

### Q: 项目使用什么 Node.js 版本？

**A:** 推荐 Node.js 18 LTS 或更高版本。确保 package.json 中的 engines 设置已检查。

### Q: 前端访问后端 API 时跨域怎么办？

**A:** 前端已配置 Vite 代理，开发环境中使用 `/api` 前缀即可，Vite 会自动代理到 `http://localhost:3001`。

---

## 数据库相关

### Q: 数据库初始化失败怎么办？

**A:** 检查以下几点：
1. 确认 PostgreSQL 已启动
2. 检查 .env 中数据库连接配置正确
3. 查看详细错误日志
4. 如仍失败，尝试使用 `DATABASE_URL` 完整连接字符串

### Q: 如何执行数据库迁移？

**A:** 使用迁移工具：
```bash
cd backend
# 查看迁移状态
node database-migration status

# 创建新迁移
node database-migration create add-feature

# 执行迁移
node database-migration up
```

### Q: 如何重置数据库？

**A:** 
```bash
cd sql_init
node init_db.js --reset
```
⚠️ 警告：这将删除所有数据！

---

## 安全相关

### Q: 生产环境密钥如何设置？

**A:** 
1. 使用 `backend/scripts/generate-keys.js` 生成密钥
2. 不在代码仓库中提交密钥
3. 使用环境变量或密钥管理服务
4. 定期轮换密钥

### Q: JWT Token 过期时间是多久？

**A:** 默认配置：
- Access Token: 1 小时
- Refresh Token: 7 天
可在 .env 中调整。

### Q: CORS 配置如何设置？

**A:** 在 `backend/src/config/cors.js` 中配置，只允许信任的域名。

---

## 部署相关

### Q: 如何部署到生产环境？

**A:** 请参考部署文档，主要步骤：
1. 设置生产环境配置
2. 构建前端
3. 启动后端服务
4. 配置反向代理（如 Nginx）
5. 设置 HTTPS

### Q: 推荐什么云服务器？

**A:** 主流云服务提供商均可：
- 阿里云 / 腾讯云
- AWS / Google Cloud / Azure
建议至少 2 核 4GB 配置。

### Q: 如何备份数据？

**A:** 
- 使用 backupService 定期备份
- 手动备份：`pg_dump`
- 云数据库通常有自动备份功能

---

## 缓存相关

### Q: Redis 连接失败怎么办？

**A:** 
1. 确认 Redis 服务已启动
2. 检查连接地址和端口
3. 查看 Redis 日志
4. 本地测试可使用 `redis-cli ping`

### Q: 缓存数据不一致怎么办？

**A:** 
- 检查缓存失效策略
- 使用事务保障一致性
- 必要时清除缓存重新加载

### Q: 如何监控 Redis 性能？

**A:** 
- 使用提供的 redis-monitor 工具
- 查看监控指标：命中率、内存使用、键数
- 触发告警时及时处理

---

## 性能相关

### Q: 前端加载慢怎么办？

**A:** 
- 使用生产构建：`npm run build`
- 启用 CDN 加速静态资源
- 图片懒加载
- 检查网络请求

### Q: 后端 API 响应慢怎么办？

**A:** 
- 检查数据库索引
- 使用 Redis 缓存热点数据
- 分析慢查询日志
- 检查服务器资源使用

---

## 测试相关

### Q: 如何运行测试？

**A:** 
```bash
# 后端测试
cd backend && npm run test

# 前端测试
cd frontend && npm run test

# 覆盖率报告
npm run test:coverage
```

### Q: 测试数据如何准备？

**A:** 
- 使用测试数据库（独立于开发数据库）
- 在测试中使用 fixtures 或 mock
- 测试结束后清理数据

---

## CI/CD 相关

### Q: GitHub Actions 如何运行？

**A:** 
- Push 到 main 分支或创建 PR 会自动触发
- 可以在 Actions 标签页查看执行状态
- 失败时查看详细日志排查

### Q: CI 失败了怎么办？

**A:** 
1. 查看 Actions 日志找出失败原因
2. 本地运行检查： `npm run lint && npm run test`
3. 修复问题后重新提交

---

## 其他

### Q: 项目有哪些功能模块？

**A:** 请参考 README，主要包括：
- 用户系统
- 农场管理
- 作物种植
- 经济系统
- 成就系统
- 后台管理

### Q: 如何获取帮助？

**A:** 
- 查看项目文档
- 查看 README
- 提交 GitHub Issue
- 联系开发团队

### Q: 如何贡献代码？

**A:** 请参考 [贡献指南](../dev-guide/contributing)

---

## 监控告警系统常见问题

### Q: 如何开启/关闭告警通知？

**A:** 在 `.env` 文件中设置 `ALERT_ENABLED=true` 开启告警，设置为 `false` 关闭告警。

### Q: 告警级别如何设置？

**A:** 在 `.env` 文件中设置 `ALERT_LEVEL=P2`，可选值：P0、P1、P2、P3。设置为某个级别后，该级别及更高级别的告警都会触发。

### Q: 企业微信告警如何配置？

**A:** 需要在 `.env` 文件中配置企业微信机器人的 webhook 地址：

```bash
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your-key
```

### Q: 如何自定义告警阈值？

**A:** 编辑 `backend/src/config/alertThresholds.js` 文件，修改各项指标的警告和严重阈值。

### Q: 告警通知延迟怎么办？

**A:** 检查以下几点：
1. 确认告警检查间隔配置合理（默认5分钟）
2. 检查网络连接是否正常
3. 检查通知渠道的API调用是否正常
4. 查看应用日志定位问题

---

## 业务指标监控常见问题

### Q: 业务指标数据不更新怎么办？

**A:** 检查以下几点：
1. 确认 Redis 服务正常运行
2. 检查指标采集间隔配置
3. 查看应用日志是否有错误信息
4. 调用 `/api/business-metrics` 检查API是否正常

### Q: 如何注册自定义业务指标？

**A:** 使用 POST 请求调用 `/api/business-metrics/custom/register` 接口：

```bash
curl -X POST http://localhost:3001/api/business-metrics/custom/register \
  -H "Content-Type: application/json" \
  -d '{"name": "custom_metric", "description": "自定义指标描述", "unit": "次"}'
```

### Q: 趋势预测功能如何使用？

**A:** 调用 `/api/business-metrics/predict` 接口，支持以下参数：
- `metricType`: 指标类型
- `hours`: 预测小时数（默认24小时）

示例：
```bash
curl "http://localhost:3001/api/business-metrics/predict?metricType=onlineUsers&hours=24"
```

### Q: 如何获取历史指标数据？

**A:** 调用 `/api/business-metrics/history` 接口，支持以下参数：
- `metricType`: 指标类型（可选）
- `startTime`: 开始时间
- `endTime`: 结束时间

示例：
```bash
curl "http://localhost:3001/api/business-metrics/history?startTime=2026-05-01T00:00:00&endTime=2026-05-02T00:00:00"
```

### Q: 业务指标数据存储在哪里？

**A:** 实时指标存储在内存中，历史数据缓存到 Redis 中，默认保留24小时。

---

## 扩展功能相关

### Q: 如何管理游戏活动？

**A:** 
1. 登录后台管理系统
2. 进入「游戏活动」页面
3. 可以创建、编辑、删除活动
4. 配置活动任务和奖励
5. 监控活动进度和参与情况

### Q: 游戏活动有哪些类型？

**A:** 系统支持以下活动类型：
- 日常活动 - 短期、高频率的活动
- 周常活动 - 每周一次的活动
- 月常活动 - 每月一次的大型活动
- 特殊活动 - 不定期的主题活动
- 节日活动 - 节日相关的活动

### Q: 如何查看系统日志？

**A:** 
1. 登录后台管理系统
2. 进入「日志分析」页面
3. 可以按日志级别（错误/警告/信息/调试）筛选
4. 支持关键词搜索和时间范围筛选
5. 可以查看统计图表和慢速请求分析

### Q: 配置热更新如何使用？

**A:** 
1. 进入后台管理的「配置热更新」页面
2. 查看当前配置缓存状态
3. 可以批量修改配置参数
4. 修改后立即生效，无需重启服务
5. 支持配置导出和导入

### Q: 如何进行数据备份和恢复？

**A:** 
1. 进入后台管理的「备份与恢复」页面
2. 可以手动触发数据备份
3. 系统会自动定时备份
4. 可以从备份文件恢复数据
5. 建议定期备份重要数据

### Q: 系统健康检查在哪里查看？

**A:** 
1. 进入后台管理的「系统状态」页面
2. 可以查看 CPU、内存、磁盘使用情况
3. 查看数据库连接状态
4. 查看后端服务健康状况
5. 查看性能监控数据

---

## 游戏活动常见问题

### Q: 活动任务有哪些类型？

**A:** 支持以下任务类型：
- 收获任务 - 收获指定作物
- 种植任务 - 种植指定作物
- 收集任务 - 收集指定数量的物品
- 交易任务 - 出售指定数量的作物
- 社交任务 - 与其他玩家互动
- 自定义任务 - 根据需求自定义

### Q: 活动奖励如何发放？

**A:** 
- 任务完成后自动发放奖励
- 支持多种奖励类型（农场币、道具、经验）
- 奖励发放有失败重试机制
- 可以在后台查看奖励发放记录

### Q: 玩家如何参与活动？

**A:** 
1. 查看当前进行中的活动
2. 活动会自动开始或需要手动报名
3. 根据任务要求完成目标
4. 自动获得进度记录
5. 任务完成后自动领取奖励

---

## 相关文档

- [Docker 部署指南](../deployment/docker-full)
- [本地部署指南](../deployment/local-full)
- [开发规范](../dev-guide/code-standards)
- [贡献指南](../dev-guide/contributing)

---

*文档最后更新: 2026-05-16*
