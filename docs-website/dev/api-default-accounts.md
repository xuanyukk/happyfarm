# 默认账户与访问地址

**文档版本：** v4.71.9  
**最后更新：** 2026-06-02  
**适用版本：** 开心农场 v4.71.9+

---

## 📋 目录

- [系统访问地址](#系统访问地址)
- [应用账户](#应用账户)
- [数据库账户](#数据库账户)
- [监控平台账户](#监控平台账户)
- [安全建议](#安全建议)

---

## 🌐 系统访问地址

### Docker 部署访问地址

| 服务 | 访问地址 | 说明 |
|------|---------|------|
| **前端应用** | http://localhost | 主应用界面，玩家入口 |
| **后端 API** | http://localhost:3000/api | RESTful API 接口 |
| **API 文档** | http://localhost:3000/api-docs | Swagger 接口文档 |
| **Grafana** | http://localhost:3001 | 监控与日志分析平台 |
| **文档网站** | http://localhost:8080 | 项目文档网站 |
| **Loki** | http://localhost:3100 | 日志存储服务（API） |
| **PostgreSQL（外部）** | localhost:5433 | 数据库（外部客户端连接） |
| **PostgreSQL（内部）** | localhost:5432 | 数据库（容器内部） |
| **Redis（外部）** | localhost:6380 | 缓存服务（外部客户端连接） |
| **Redis（内部）** | localhost:6379 | 缓存服务（容器内部） |

### 本地开发访问地址

| 服务 | 访问地址 | 说明 |
|------|---------|------|
| **前端应用** | http://localhost:5173 | Vite 开发服务器 |
| **后端 API** | http://localhost:3000/api | 本地后端服务 |
| **API 文档** | http://localhost:3000/api-docs | 本地 Swagger 文档 |
| **文档网站** | http://localhost:5174 | 本地文档网站 |
| **PostgreSQL** | localhost:5432 | 数据库 |
| **Redis** | localhost:6379 | 缓存服务 |

---

## 👤 应用账户

### 管理员账户

| 项目 | 值 |
|------|-----|
| **用户名** | admin |
| **密码** | 123456 |
| **权限** | 系统管理员，可访问后台管理系统 |
| **用途** | 管理用户、配置系统、查看统计数据 |

### 测试玩家账户

| 项目 | 值 |
|------|-----|
| **用户名** | player1 |
| **密码** | 123456 |
| **权限** | 普通玩家，可玩游戏 |
| **用途** | 测试游戏功能 |

### 账户使用说明

1. **登录方式**
   - 访问前端应用 http://localhost
   - 输入用户名和密码登录
   - 管理员账户登录后可进入后台管理

2. **创建新用户**
   - 管理员可在后台创建新用户
   - 或通过注册功能创建新玩家账户

---

## 🗄️ 数据库账户

### PostgreSQL 数据库

| 项目 | 值 |
|------|-----|
| **主机** | localhost（Docker）或 127.0.0.1（本地） |
| **端口（外部）** | 5433 |
| **端口（内部）** | 5432 |
| **数据库名** | happy_farm |
| **用户名** | happy_farm |
| **密码** | happy_farm_password |

### 连接数据库

#### 使用 psql 命令行（Docker）

```powershell
# 进入 PostgreSQL 容器
docker-compose exec postgres psql -U happy_farm -d happy_farm
```

#### 使用 pgAdmin 或其他客户端

- **主机**：localhost
- **端口**：5433（外部访问）
- **数据库**：happy_farm
- **用户名**：happy_farm
- **密码**：happy_farm_password

### Redis 缓存

| 项目 | 值 |
|------|-----|
| **主机** | localhost |
| **端口（外部）** | 6380 |
| **端口（内部）** | 6379 |
| **密码** | （无密码，默认配置） |

---

## 📊 监控平台账户

### Grafana 监控平台

| 部署方式 | 用户名 | 密码 | 访问地址 |
|---------|--------|------|---------|
| **Docker** | admin | your_grafana_password | http://localhost:3001 |
| **本地** | admin | admin | http://localhost:3001 |

**重要提示**：Docker 部署时，Grafana 密码通过 `.env` 文件中的 `GF_SECURITY_ADMIN_PASSWORD` 环境变量配置。如未配置，默认值为 `happyfarm123`。生产环境请务必修改为强密码！

### Grafana 功能

1. **业务指标监控**
   - 用户活跃度统计
   - 货币系统数据
   - API 性能监控
   - 错误率追踪

2. **日志查询**
   - 使用 LogQL 查询应用日志
   - 按时间范围过滤
   - 按服务、级别筛选

3. **仪表板**
   - 开心农场业务概览
   - 系统资源使用情况
   - 链路追踪面板

---

## 🔒 安全建议

::: danger 重要安全提示
1. **首次登录立即修改密码！**
   - 应用管理员密码
   - 数据库密码
   - Grafana 密码

2. **生产环境安全配置**
   - 使用强密码（建议 12 位以上，包含大小写、数字、特殊字符）
   - 定期轮换密码（建议每 90 天）
   - 限制数据库访问 IP
   - 启用 HTTPS
   - 配置防火墙规则

3. **密码修改建议**
   ```env
   # 强密码示例
   POSTGRES_PASSWORD=H@ppyF@rm2026!Pr0d
   GF_SECURITY_ADMIN_PASSWORD=Gr@fanaM0n!t0r2026
   ```
:::

### 修改密码的步骤

#### 修改应用管理员密码

1. 登录后台管理系统
2. 进入用户管理
3. 选择 admin 用户
4. 修改密码并保存

#### 修改数据库密码

1. 编辑 `.env` 文件
2. 修改 `POSTGRES_PASSWORD`
3. 重启服务（⚠️ 会删除并重新初始化数据库）
   ```powershell
   docker-compose down -v
   docker-compose up -d
   ```

#### 修改 Grafana 密码

1. 编辑 `.env` 文件
2. 修改 `GF_SECURITY_ADMIN_PASSWORD`
3. 重启 Grafana 服务
   ```powershell
   docker-compose restart grafana
   ```

---

## 📞 获取帮助

如有问题，请查看：
- [部署指南](../deployment/docker-full)
- [常见问题 FAQ](../faq)
- 查看服务日志

---

**请务必修改默认密码！** 🔐
