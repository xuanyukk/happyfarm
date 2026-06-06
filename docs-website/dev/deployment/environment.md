# 环境配置

本文档介绍如何配置开心农场项目的环境变量。

## 使用配置工具

项目提供了交互式配置工具，在开始部署之前可以使用：

```bash
node setup-env.js
```

配置工具支持：
- 🎮 交互式菜单：清晰的界面，易于使用
- 💻 双重模式：本地开发或 Docker 部署任选
- 🔐 自动密钥生成：一键生成安全的 JWT 和加密密钥
- 🛡️ 自动备份：自动备份现有配置，防止误操作

## 环境变量文件

项目提供以下环境变量示例文件：

- `.env.docker.example - Docker 环境变量示例
- `backend/.env.example` - 后端环境变量示例
- `frontend/.env.example` - 前端环境变量示例

## 更多信息

完整的项目文档请查看其他页面：
- [Docker 部署](/deployment/docker)
- [本地部署](/deployment/local)
