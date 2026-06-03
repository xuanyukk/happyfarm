# 开心农场 (Happy Farm)

> 一个基于 Node.js + Vue 3 + PostgreSQL 开发的完整农场模拟游戏项目，支持多人在线互动、实时数据同步和完整的后台管理系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-green.svg)](https://nodejs.org)
[![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-20.10+-blue.svg)](https://www.docker.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green.svg)](.github/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-v4.71.7-blue.svg)](CHANGELOG.md)

---

## ✨ 功能特性

- 🌾 **完整的农场系统**：50 块地块管理，8 档品质覆盖，5 星级升级体系
- 🌱 **丰富的作物系统**：84 种作物，4 大分类（基础/经济/稀有/顶级），完整的生长周期
- 🏪 **商店系统**：种子购买、道具交易、每日限购
- 🏆 **成就系统**：82 条成就，14 大分类，5 级稀有度
- 💰 **多货币体系**：农场币 + 宝石币双货币，支持万/亿格式化显示
- 👥 **用户系统**：完整的注册/登录/权限管理，支持设备管理和强制下线
- 📊 **后台管理**：完整的可视化后台，支持数据监控、用户管理、系统配置
- 🎮 **游戏活动**：支持限时活动、签到系统、任务系统
- 🔧 **运维体系**：完整的监控告警、日志分析、性能监控
- 🐳 **Docker 支持**：一键部署，支持开发/生产环境

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.x | JavaScript 运行时 |
| PostgreSQL | >= 13 | 关系型数据库 |
| Redis | >= 6.x | 缓存服务 |
| Docker | >= 20.10 | 容器化部署（可选） |
| Python | >= 3.8 | 部署脚本支持 |

### 一键启动（推荐）

```bash
# 使用 Python 启动脚本（支持中英双语菜单）
python start.py
```

### Docker 部署

```bash
# 使用 Docker Compose 一键部署
docker-compose up -d
```

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
node sql_init/init_db.js

# 3. 启动开发服务器
npm run dev
```

**访问地址**：
- 前端开发服务器：http://localhost:5173
- 后端 API 服务：http://localhost:3001
- API 文档（Swagger）：http://localhost:3001/api-docs

---

## 📁 项目目录结构

```
happy-farm/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── routes/         # API 路由（45+ 个模块）
│   │   ├── services/       # 业务逻辑层
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试用例（255+ 个）
│   └── ecosystem.config.js # PM2 配置
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 公共组件
│   │   ├── stores/         # Pinia 状态管理
│   │   └── utils/          # 工具函数
│   └── tests/              # 测试用例（49+ 个）
├── sql_init/               # 数据库初始化
│   ├── 01_data/           # 基础数据
│   └── 02_schema/         # 表结构（84 张表）
├── docs-website/           # VitePress 文档网站
├── scripts/                # 工具脚本
└── logs/                   # 部署日志
```

---

## 🛠️ 技术栈

### 后端
- **Runtime**: Node.js 18+ + Express.js
- **Database**: PostgreSQL 16 + Redis 6
- **ORM**: 自定义数据访问层
- **Auth**: JWT + bcrypt
- **Docs**: Swagger/OpenAPI 3.0
- **Process**: PM2

### 前端
- **Framework**: Vue 3 + Vite 5
- **State**: Pinia
- **UI**: 自定义组件库
- **Charts**: ECharts
- **Icons**: 自定义 AI 生成图标

### 运维
- **Container**: Docker + Docker Compose
- **Monitor**: Grafana + Loki + Promtail
- **CI/CD**: GitHub Actions

---

## 📚 文档网站

详细文档请查看我们的 **VitePress 文档网站**：

```bash
# 启动文档网站
npm run docs:dev
```

访问地址：http://localhost:5174

### 文档内容

- [快速开始指南](docs-website/guide/getting-started.md)
- [功能特性详解](docs-website/features/overview.md)
- [API 文档](docs-website/api/overview.md)
- [部署指南](docs-website/deployment/docker.md)
- [开发者指南](docs-website/dev-guide/code-standards.md)
- [架构设计](docs-website/architecture/system.md)

---

## 📊 项目状态

- ✅ 核心功能开发完成
- ✅ 扩展功能开发完成
- ✅ 数据库优化完成（84 张表，255+ 测试用例）
- ✅ 前端优化完成（49+ 测试用例）
- ✅ 运维体系完善（监控/日志/告警）
- ✅ 文档体系完善（VitePress 文档网站）

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](docs-website/dev-guide/contributing.md) 了解如何参与项目开发。

### 快速贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📝 更新日志

详细更新日志请查看 [CHANGELOG.md](CHANGELOG.md)

### 最近更新

- **v4.71.7** (2026-06-02) - 文档全面检查与修复完成
- **v4.71.6** (2026-06-01) - 文档全面审查报告完成
- **v4.68.0** (2026-05-30) - 新增图片批量处理工具，文档优化

---

## 🌐 服务端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API（本地开发） | 3001 | 主要业务服务 |
| 后端 API（Docker） | 3000 | Docker 生产环境映射端口 |
| 前端开发服务器 | 5173 | Vite 开发环境 |
| 前端（Docker 生产） | 80 | Nginx 生产环境 |
| 文档网站（本地开发） | 5174 | VitePress 文档 |
| 文档网站（Docker 生产） | 8080 | Nginx 生产环境 |
| PostgreSQL（容器内部） | 5432 | 数据库容器内端口 |
| PostgreSQL（Docker 外部） | 5433 | 宿主机映射端口 |
| Redis | 6379 | 缓存服务 |
| Grafana | 3001 | 监控仪表板 |

---

## ❓ 常见问题

### 启动问题

**Q: 启动时提示 "node_modules 不存在"？**

A: 请先执行 `npm install` 安装依赖，然后再启动项目。

**Q: 数据库连接失败？**

A: 请检查 PostgreSQL 是否已启动，并确认 `.env` 文件中的数据库配置正确。

**Q: Docker 部署时端口冲突？**

A: 请检查本地是否有其他服务占用了 3000/5173/5432 等端口，或修改 docker-compose.yml 中的端口映射。

### 开发问题

**Q: 如何重置数据库？**

A: 执行 `node sql_init/init_db.js` 即可重新初始化数据库。

**Q: 如何查看 API 文档？**

A: 启动后端服务后，访问 http://localhost:3001/api-docs 查看 Swagger 文档。

**Q: 如何添加新作物？**

A: 请参考 [作物系统设计文档](docs-website/features/crop-system.md) 了解完整的作物添加流程。

更多问题请查看 [FAQ 文档](docs-website/faq/index.md) 或提交 Issue。

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！

Made with ❤️ by HappyFarm Team

</div>
