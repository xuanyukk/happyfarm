import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '开心农场',
  description: '开心农场 - 完整的农场模拟游戏项目文档',
  
  // 禁用死链接检查：避免 localhost 等本地链接和外部链接在构建时的检查失败
  ignoreDeadLinks: true,

  // 服务器配置：使用5174端口避免与前端开发服务器(5173)冲突
  server: {
    port: 5174,
    host: 'localhost'
  },

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '功能特性', link: '/features/overview' },
      { text: 'API 文档', link: '/api/overview' },
      { text: '部署指南', link: '/deployment/docker' },
      { text: '教程资源', link: '/tutorials/' },
    ],

    sidebar: [
      {
        text: '指南',
        items: [
          { text: '介绍', link: '/guide/introduction' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '项目结构', link: '/guide/project-structure' },
          { text: '核心玩法', link: '/guide/core-gameplay' },
          { text: '游戏活动', link: '/guide/game-events' },
          { text: '用户手册', link: '/guide/user-manual' },
        ]
      },
      {
        text: '功能特性',
        items: [
          { text: '功能概览', link: '/features/overview' },
          { text: '用户系统', link: '/features/user-system' },
          { text: '农场管理', link: '/features/farm-management' },
          { text: '作物系统', link: '/features/crop-system' },
          { text: '商店系统', link: '/features/shop-system' },
          { text: '成就系统', link: '/features/achievement-system' },
          { text: '多货币体系', link: '/features/multi-currency-system' },
          { text: '数据仓库', link: '/features/data-warehouse' },
        ]
      },
      {
        text: '部署指南',
        items: [
          { text: 'Docker 部署（完整）', link: '/deployment/docker-full' },
          { text: 'Docker 部署（快速）', link: '/deployment/docker' },
          { text: '本地部署（完整）', link: '/deployment/local-full' },
          { text: '本地部署（快速）', link: '/deployment/local' },
          { text: '环境配置', link: '/deployment/environment' },
          { text: '安全加固指南', link: '/deployment/security-hardening' },
          { text: '灾难恢复和备份', link: '/deployment/disaster-recovery' },
        ]
      },
      {
        text: '架构设计',
        items: [
          { text: '系统架构', link: '/architecture/system' },
          { text: '数据库设计', link: '/architecture/database' },
          { text: 'DI 容器', link: '/architecture/di-container' },
        ]
      },
      {
        text: '技术实施',
        items: [
          { text: 'RBAC 权限控制', link: '/tech/rbac' },
          { text: 'WebSocket 优化', link: '/tech/websocket' },
          { text: '日志分析平台', link: '/tech/logging' },
          { text: '性能优化', link: '/tech/performance' },
          { text: '前端渲染优化', link: '/tech/frontend-rendering' },
          { text: '优化模块使用', link: '/tech/optimization-module' },
          { text: '监控告警体系', link: '/tech/monitoring' },
          { text: '业务指标监控', link: '/tech/business-metrics' },
          { text: 'PM2 进程管理', link: '/tech/pm2' },
          { text: 'TypeScript迁移指南', link: '/tech/typescript-migration' },
          { text: '数据库迁移管理', link: '/tech/database-migration' },
          { text: '性能基准测试', link: '/tech/performance-benchmark' },
        ]
      },
      {
        text: 'API 参考',
        items: [
          { text: 'API 概览', link: '/api/overview' },
          { text: '访问地址', link: '/api/access-addresses' },
          { text: '默认账户与访问地址', link: '/api/default-accounts' },
        ]
      },
      {
        text: '开发者指南',
        items: [
          { text: '开发环境配置', link: '/dev-guide/environment-setup' },
          { text: '数据库开发工具', link: '/dev-guide/database-tools' },
          { text: '图标工具链', link: '/dev-guide/icon-tools' },
          { text: '开发规范', link: '/dev-guide/code-standards' },
          { text: 'Git 工作流', link: '/dev-guide/git-workflow' },
          { text: '代码审查检查清单', link: '/dev-guide/code-review' },
          { text: '测试指南', link: '/dev-guide/testing' },
          { text: '贡献指南', link: '/dev-guide/contributing' },
        ]
      },
      {
        text: '常见问题',
        items: [
          { text: 'FAQ', link: '/faq/index' },
        ]
      },
      {
        text: '教程资源',
        items: [
          { text: '教程概览', link: '/tutorials/' },
          { text: '视频教程', link: '/tutorials/video-tutorials' },
          { text: '代码示例', link: '/tutorials/code-examples' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo/happy-farm' }
    ],

    footer: {
      message: '基于 MIT 许可证发布',
      copyright: 'Copyright © 2026 Happy Farm Team'
    },

    search: {
      provider: 'local'
    }
  },

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ]
})
