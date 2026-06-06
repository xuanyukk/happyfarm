# 快速开始

本指南将帮助你在几分钟内启动开心农场项目。

## 前置条件

根据你的部署方式，需要准备相应的环境：

### Docker 部署
- Docker >= 20.10
- Docker Compose >= 2.0

### 本地部署
- Node.js >= 18.x（推荐 20.x LTS）
- PostgreSQL >= 13
- Redis >= 7
- npm >= 8 或 pnpm >= 7
- Python 3.7+（用于部署工具）

## 方式一：Docker 一键部署（推荐）

最简单、最一致的部署方式。

```powershell
# 使用 Python 启动脚本（中英双语菜单，自动生成部署日志）
python start.py

# 或直接使用 Docker Compose
docker-compose up -d
```

## 方式二：本地部署

适用于本地开发和调试。

```powershell
# 方式 A：完整本地部署工具（环境准备+验证+部署+报告+回滚）
python local_deploy.py

# 方式 B：快速部署（中英双语菜单，自动生成部署日志）
python start.py

# 或手动操作
npm install           # 安装依赖
node sql_init/init_db.js  # 初始化数据库（首次使用）
npm run dev           # 启动开发服务器
```

### 部署日志

`python start.py` 执行部署时每次会话自动生成 3 个日志文件：

- **主日志**：`deployment_YYYYMMDD_HHMMSS_ffffff_PID.log`（纯文本）
- **错误日志**：同名 `_error.log`（仅 ERROR/WARN 级别）
- **JSON 日志**：同名 `.json`（结构化，便于机器分析）
- **自动清理**：启动时删除 30 天前过期日志，单文件 >10MB 触发轮转
- 查看：主菜单 `[L]` 选项

## （可选）生成游戏图标

项目提供 AI 图标生成工具，可一键生成全部 640 张游戏资源：

```bash
cd frontend/scripts/generate-icons/

# 复制配置模板
copy .env.example .env

# 编辑 .env，填入火山引擎方舟 API Key
# ARK_API_KEY=your-api-key-here

# 查看模型状态
node model-status.cjs

# 快速生成（推荐）
node kolors-generate-crops.cjs --type all  # 生成 204 张基础作物生长图+成品
node flux-generate-effects.cjs --type all  # 生成 300 张特效作物
node generateIcons.cjs --type all         # 生成 220 张 UI 图标
```

详细使用说明请查看：[图标生成工具文档](../../frontend/scripts/generate-icons/README.md)

## 下一步

部署完成后，请查看 [访问地址](/api/access-addresses) 获取服务访问信息。
