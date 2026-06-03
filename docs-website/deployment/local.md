# 本地部署

本文档介绍如何在本地环境部署开心农场项目。

## 前置条件

- Node.js >= 18.x（推荐 20.x LTS）
- PostgreSQL >= 13
- Redis >= 7
- npm >= 8 或 pnpm >= 7
- Python 3.7+（用于部署工具）

## 快速部署

### 方式一：完整本地部署工具（推荐）

提供环境准备、依赖验证、分步部署、断点续传、部署后验证和一键回滚功能。

```powershell
# 直接运行本地部署工具
python local_deploy.py

# 或通过 start.py 进入后选择 [2] 本地部署 → [F] 高级部署工具
python start.py
```

### 方式二：快速部署

```powershell
# 使用 Python 启动脚本（中英双语菜单，自动生成部署日志）
python start.py

# 或手动操作
npm install           # 安装依赖
node sql_init/init_db.js  # 初始化数据库（首次使用）
npm run dev           # 启动开发服务器
```

> 通过 `python start.py` 部署时，每次会话生成 3 个日志文件：主日志（`.log`）、错误日志（`_error.log`）、JSON 结构化日志（`.json`）。启动时自动清理 30 天前的过期日志，单文件超过 10MB 触发轮转。

## 访问地址

| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:5173 |
| 后端 API | http://localhost:3001/api |
| API 文档（Swagger）| http://localhost:3001/api-docs |

## 更多信息

完整的项目文档请查看其他页面：
- [Docker 部署](/deployment/docker)
- [环境配置](/deployment/environment)
