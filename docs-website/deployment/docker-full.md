# Docker 部署指南

**文档版本：** v4.71.9  
**最后更新：** 2026-06-02  
**适用版本：** 开心农场 v4.71.9+  


---

## 📋 目录

- [前置条件](#前置条件)
- [快速开始](#快速开始)
- [完整部署](#完整部署)
- [配置文件说明](#配置文件说明)
- [环境变量配置](#环境变量配置)
- [日志聚合平台](#日志聚合平台)
- [常用命令](#常用命令)
- [访问地址](#访问地址)
- [故障排查](#故障排查)

---

## 📦 前置条件

### 必需软件

1. **Docker**
   - 下载地址：https://www.docker.com/products/docker-desktop/
   - Windows 版本：Docker Desktop for Windows
   - 系统要求：Windows 10/11 专业版/企业版（64位）

2. **Docker Compose**
   - Docker Desktop 已包含，无需单独安装

### 验证安装

打开 PowerShell 或 CMD，执行：

```powershell
# 验证 Docker 安装
docker --version

# 验证 Docker Compose 安装
docker-compose --version
```

---

## 🚀 快速开始

### 一键启动（推荐）

双击项目根目录的 **start.bat**，或运行：

```powershell
python start.py
```

### 命令行部署

```powershell
# 进入项目目录
cd g:\youxi\ceshi\happy-farm

# 一键启动所有服务
docker-compose up -d
```

> **推荐**：通过 `python start.py` 交互式菜单管理 Docker 部署，每次会话生成 3 个日志文件（主日志/错误日志/JSON），启动时自动清理 30 天前的过期日志。日志记录内容包括开始/结束时间、各阶段执行状态、命令输出及错误信息。

---

## 🔧 完整部署步骤

### 1️⃣ 环境准备

```powershell
# 进入项目根目录
cd g:\youxi\ceshi\happy-farm

# 检查 Docker 状态
docker info
```

### 2️⃣ 配置环境变量

```powershell
# 复制环境变量示例文件
copy .env.docker.example .env
```

编辑 `.env` 文件（通常保持默认即可）：

```env
# 如需自定义，可修改以下配置
POSTGRES_DB=happy_farm
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
```

### 3️⃣ 启动所有服务

```powershell
# 启动所有服务（包含完整监控日志平台）
docker-compose up -d
```

### 4️⃣ 查看服务状态

```powershell
# 查看容器状态
docker-compose ps

# 查看启动日志
docker-compose logs -f
```

---

## ⚙️ 配置文件说明

### 项目配置文件清单

| 配置文件 | 位置 | 说明 | 是否需要修改 |
|----------|------|------|-------------|
| `docker-compose.yml` | 项目根目录 | Docker 服务编排配置 | 按需修改端口等 |
| `.env` | 项目根目录 | 环境变量配置 | 首次部署需配置 |
| `.env.docker.example` | 项目根目录 | 环境变量模板 | 参考用，无需修改 |
| `docs-website/nginx.conf` | docs-website/ | 文档网站 Nginx 配置 | 按需修改 |

### docker-compose.yml 配置说明

#### 主要服务配置项

```yaml
# 数据库服务
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: happy_farm        # 数据库名
    POSTGRES_USER: your_db_user    # 数据库用户
    POSTGRES_PASSWORD: your_db_password  # 数据库密码
  ports:
    - "5433:5432"                  # 数据库端口映射（本地 5433 → 容器 5432）

# Redis 缓存
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"                  # Redis 端口

# 后端服务
backend:
  build: ./backend
  ports:
    - "3000:3000"                  # 后端 API 端口
  environment:
    - NODE_ENV=production
    - DB_HOST=postgres
    - DB_PORT=5432

# 前端服务
frontend:
  build: ./frontend
  ports:
    - "80:80"                      # 前端访问端口

# 监控平台
grafana:
  image: grafana/grafana:latest
  ports:
    - "3001:3000"                  # Grafana 端口

# 文档网站
docs-website:
  build: ./docs-website
  ports:
    - "8080:80"                    # 文档网站端口
```

#### 修改配置项的方法

1. **修改端口映射**
   - 编辑 `docker-compose.yml` 中的 `ports` 配置
   - 格式：`"主机端口:容器端口"`
   - 注意：确保主机端口未被占用

2. **修改环境变量**
   - 使用 `.env` 文件配置（推荐）
   - 或直接在 `docker-compose.yml` 的 `environment` 中修改

3. **应用配置更改**
   ```powershell
   # 修改配置后重启服务
   docker-compose down
   docker-compose up -d
   ```

#### ⚠️ 配置修改注意事项

- 修改端口后需要同步更新访问地址文档
- 数据库密码修改后需要重新初始化数据库（会丢失数据）
- 生产环境建议修改所有默认密码
- 修改配置前建议备份原文件

---

## 🔐 环境变量配置

### 环境变量文件

项目使用 `.env` 文件管理环境变量，位于项目根目录。

#### 创建环境变量文件

```powershell
# 从模板复制
copy .env.docker.example .env
```

### 环境变量配置项详解

#### 数据库配置

| 变量名 | 默认值 | 说明 | 修改建议 |
|--------|--------|------|---------|
| `POSTGRES_DB` | `happy_farm` | 数据库名称 | 生产环境可自定义 |
| `POSTGRES_USER` | `your_db_user` | 数据库用户名 | 生产环境建议修改 |
| `POSTGRES_PASSWORD` | `your_db_password` | 数据库密码 | **必须修改为强密码** |

#### 后端服务配置

| 变量名 | 默认值 | 说明 | 修改建议 |
|--------|--------|------|---------|
| `NODE_ENV` | `production` | 运行环境 | 开发环境改为 `development` |
| `DB_HOST` | `postgres` | 数据库主机名 | Docker 部署保持默认 |
| `DB_PORT` | `5432` | 数据库端口 | 如有修改需同步 |
| `REDIS_HOST` | `redis` | Redis 主机名 | Docker 部署保持默认 |
| `REDIS_PORT` | `6379` | Redis 端口 | 如有修改需同步 |

#### Grafana 配置

| 变量名 | 默认值 | 说明 | 修改建议 |
|--------|--------|------|---------|
| `GF_SECURITY_ADMIN_USER` | `admin` | Grafana 管理员用户 | 生产环境建议修改 |
| `GF_SECURITY_ADMIN_PASSWORD` | `your_grafana_password` | Grafana 管理员密码 | **必须修改为强密码** |

### 示例 .env 文件

```env
# ========================================
# 数据库配置
# ========================================
POSTGRES_DB=happy_farm
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password

# ========================================
# 后端服务配置
# ========================================
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379

# ========================================
# Grafana 配置
# ========================================
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=your_grafana_password
```

### 修改环境变量的步骤

1. **编辑 .env 文件**
   - 使用文本编辑器打开 `.env`
   - 修改相应配置项
   - 保存文件

2. **重启服务应用更改**
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

3. **验证配置生效**
   ```powershell
   # 检查服务状态
   docker-compose ps
   
   # 查看日志确认
   docker-compose logs backend
   ```

---

## 📊 监控与日志平台

### 监控平台包含

- **Grafana** - 可视化和告警平台（业务指标、链路追踪）
- **Loki** - 日志存储和查询引擎
- **Promtail** - 日志收集代理

### 访问 Grafana

- **地址：** http://localhost:3001
- **默认用户：** admin
- **默认密码：** your_grafana_password

### 功能说明

1. **日志查询** - 在 Explore 页面使用 LogQL 查询日志
2. **预配置仪表板** 
   - 开心农场业务指标监控（用户活跃度、货币系统、API性能）
   - 链路追踪面板（请求统计、错误追踪）
3. **告警规则** - 系统自动监控并通知异常情况

---

## 🛠️ 常用命令

### 服务管理

```powershell
# 启动所有服务
docker-compose up -d

# 停止所有服务（保留数据）
docker-compose down

# 停止并删除所有数据（⚠️ 慎重使用）
docker-compose down -v

# 重启服务
docker-compose restart
```

### 查看日志

```powershell
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f grafana
docker-compose logs -f loki
docker-compose logs -f promtail

# 查看最近 100 条日志
docker-compose logs --tail=100
```

### 容器管理

```powershell
# 进入容器
docker-compose exec backend sh
docker-compose exec postgres psql -U your_db_user -d happy_farm

# 查看容器资源使用情况
docker stats
```

---

## 🌐 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost | 主应用界面 |
| **后端 API** | http://localhost:3000/api | API 接口 |
| **API 文档** | http://localhost:3000/api-docs | Swagger 文档 |
| **Grafana** | http://localhost:3001 | 监控与日志分析平台 |
| **文档网站** | http://localhost:8080 | 项目文档网站 |
| **Loki** | http://localhost:3100 | 日志存储服务 |
| **PostgreSQL** | localhost:5433 | 数据库（外部访问） |
| **Redis** | localhost:6379 | 缓存服务 |

### 默认账号

| 类型 | 用户名 | 密码 |
|------|--------|------|
| **应用管理员** | admin | 123456 |
| **应用玩家** | player1 | 123456 |
| **Grafana** | admin | your_grafana_password |
| **PostgreSQL** | your_db_user | your_db_password |

---

## 🔍 故障排查

### 容器无法启动

```powershell
# 查看具体服务日志
docker-compose logs backend
docker-compose logs postgres

# 检查端口占用
netstat -ano | findstr ":5433"
netstat -ano | findstr ":6379"
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"
```

### 数据库初始化失败

```powershell
# 查看数据库日志
docker-compose logs postgres

# 删除数据卷重新初始化（⚠️ 会丢失所有数据）
docker-compose down -v
docker-compose up -d
```

### 后端无法连接数据库

```powershell
# 检查数据库容器是否健康
docker-compose ps

# 查看后端日志
docker-compose logs backend
```

### Grafana 无法访问

```powershell
# 检查 Grafana 容器状态
docker-compose ps

# 查看 Grafana 日志
docker-compose logs grafana

# 检查端口 3001 是否被占用
netstat -ano | findstr ":3001"
```

---

## 💡 高级配置

### 修改端口

编辑 `docker-compose.yml` 中的 `ports` 配置。

### 持久化数据

所有数据已通过 Docker volumes 自动持久化：
- `postgres_data` - 数据库数据
- `redis_data` - Redis 缓存数据  
- `grafana_data` - Grafana 数据

### 自定义配置

如需修改配置，编辑对应服务的配置文件或环境变量，然后重启服务：

```powershell
docker-compose restart
```

---

## 📚 相关文档

- [本地部署指南](../deployment/local)
- [日志系统完整指南](./logging)
- [数据库管理完整指南](./database)

---

## 📞 获取帮助

如有问题，请查看：
1. [常见问题FAQ](../faq)
2. 项目 Issues
3. 查看服务日志

---

**祝您部署顺利！** 🎉
