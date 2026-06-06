# 项目结构

本文档介绍开心农场项目的整体目录结构。

```
happy-farm/
├── backend/                    # 后端服务
│   ├── src/                   # 后端源代码
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # 路由
│   │   ├── services/          # 服务层
│   │   ├── utils/             # 工具函数
│   │   └── server.js          # 服务器入口
│   ├── __tests__/             # 后端测试
│   └── package.json
├── frontend/                  # 前端项目
│   ├── src/                   # 前端源代码
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   ├── stores/            # 状态管理
│   │   ├── services/          # 服务
│   │   └── main.js            # 应用入口
│   ├── public/                # 静态资源
│   │   └── assets/            # 游戏图标和资源文件
│   ├── scripts/               # 开发和工具脚本
│   │   ├── convert_images.py       # 图片批量格式转换工具
│   │   ├── rename_images_by_mtime.py  # 图片按修改时间批量重命名工具
│   │   └── generate-icons/         # AI 图标生成工具集
│   ├── __tests__/             # 前端测试
│   └── package.json
├── docs-website/              # 文档网站（新增）
│   └── .vitepress/           # VitePress 配置

├── sql_init/                  # 数据库初始化脚本
├── scripts/                   # 部署和维护脚本
├── grafana/                   # Grafana 配置
└── docker-compose.yml         # Docker 配置
```

## 核心目录说明

### backend/
后端服务，使用 Node.js + Express 构建。

### frontend/
前端项目，使用 Vue 3 + Vite 构建。

### docs-website/
新增的 VitePress 文档网站，提供现代化的文档浏览体验。


