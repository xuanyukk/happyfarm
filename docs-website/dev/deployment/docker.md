# Docker 部署

本文档介绍如何使用 Docker 部署开心农场项目。

## 一键启动（推荐）

双击项目根目录的 **start.bat**，或运行：

```powershell
python start.py
```

## 前置条件

- Docker >= 20.10
- Docker Compose >= 2.0

## 命令行部署

```powershell
# 进入项目目录
cd g:\youxi\ceshi\happy-farm

# 一键启动所有服务（自动生成部署日志到 logs/ 目录）
docker-compose up -d
```

> **推荐**：通过 `python start.py` 交互式菜单管理 Docker 部署，每次会话生成 3 个日志文件（主日志/错误日志/JSON），启动时自动清理 30 天前的过期日志。

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端应用（生产）| http://localhost |
| 后端 API | http://localhost:3001/api |
| API 文档（Swagger）| http://localhost:3001/api-docs |
| Grafana（监控）| http://localhost:3001 |
| 文档网站 | http://localhost:8080 |
| PostgreSQL 数据库 | localhost:5433 |
| Redis | localhost:6379 |

## 环境变量配置

在启动项目前，请先配置环境变量：

1. 复制 `.env.docker.example` 为 `.env`
2. 修改 `.env` 中的敏感配置（密码、密钥等）
3. 特别是修改以下重要配置：
   - `POSTGRES_PASSWORD`：数据库密码
   - `JWT_SECRET`：JWT 密钥
   - `ENCRYPTION_KEY`：数据加密密钥
   - `GF_SECURITY_ADMIN_PASSWORD`：Grafana 管理员密码

## 默认账号

| 类型 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 应用管理员 | admin | 123456 | 可在后台管理系统中修改 |
| Grafana | admin | your_grafana_password | 通过 `.env` 文件中的 `GF_SECURITY_ADMIN_PASSWORD` 配置 |

## 更多信息

完整的项目文档请查看其他页面：
- [完整 Docker 部署指南](/deployment/docker-full)
- [本地部署](/deployment/local)
- [环境配置](/deployment/environment)
