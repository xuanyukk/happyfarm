import { defineConfig } from 'vitepress'

/**
 * 文件名：config.mjs
 * 作者：Trae AI
 * 日期：2026-06-06
 * 版本：v2.0.0
 * 功能描述：VitePress 配置文件，重组侧边栏为 general/player/dev 三区结构
 * 更新记录：
 *   2026-06-06 - v2.0.0 - 移除权限控制，文档重组为三区结构
 */

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
      { text: '快速开始', link: '/general/getting-started' },
      { text: '游戏指南', link: '/player/core-gameplay' },
      { text: '功能特性', link: '/player/overview' },
      {
        text: '更多',
        items: [
          { text: 'API 文档', link: '/dev/api-overview' },
          { text: '部署指南', link: '/dev/deployment/docker' },
          { text: '开发者指南', link: '/dev/dev-guide/environment-setup' },
          { text: '技术文档', link: '/dev/tech/rbac' },
          { text: '教程资源', link: '/general/tutorials/' },
        ]
      },
    ],

    sidebar: [
      // ========== 通用文档 ==========
      {
        text: '📖 入门指南',
        items: [
          { text: '介绍', link: '/general/introduction' },
          { text: '快速开始', link: '/general/getting-started' },
          { text: '项目结构', link: '/general/project-structure' },
        ]
      },
      {
        text: '❓ 常见问题',
        items: [
          { text: 'FAQ', link: '/general/faq' },
        ]
      },
      {
        text: '🎓 教程资源',
        items: [
          { text: '教程概览', link: '/general/tutorials/' },
          { text: '视频教程', link: '/general/tutorials/video-tutorials' },
          { text: '代码示例', link: '/general/tutorials/code-examples' },
        ]
      },

      // ========== 用户文档 ==========
      {
        text: '🎮 游戏指南',
        items: [
          { text: '核心玩法', link: '/player/core-gameplay' },
          { text: '游戏活动', link: '/player/game-events' },
          { text: '用户手册', link: '/player/user-manual' },
        ]
      },
      {
        text: '🎮 游戏功能',
        items: [
          { text: '功能概览', link: '/player/overview' },
          { text: '用户系统', link: '/player/user-system' },
          { text: '农场管理', link: '/player/farm-management' },
          { text: '作物系统', link: '/player/crop-system' },
          { text: '商店系统', link: '/player/shop-system' },
          { text: '成就系统', link: '/player/achievement-system' },
          { text: '多货币体系', link: '/player/multi-currency-system' },
          { text: '道具获取途径', link: '/player/item-acquisition' },
          { text: '农场装饰系统', link: '/player/decoration-system' },
          { text: '音效系统', link: '/player/sound-system' },
          { text: '数据仓库', link: '/player/data-warehouse' },
        ]
      },

      // ========== 开发管理员文档 ==========
      {
        text: '🛠️ 后台管理',
        items: [
          { text: '后台管理系统', link: '/dev/admin-system' },
        ]
      },
      {
        text: '🏗️ 架构设计',
        items: [
          { text: '系统架构', link: '/dev/architecture/system' },
          { text: '数据库设计', link: '/dev/architecture/database' },
          { text: 'DI 容器', link: '/dev/architecture/di-container' },
        ]
      },
      {
        text: '⚙️ 技术实施',
        items: [
          { text: 'RBAC 权限控制', link: '/dev/tech/rbac' },
          { text: 'WebSocket 优化', link: '/dev/tech/websocket' },
          { text: '缓存失效策略', link: '/dev/tech/cache-strategy' },
          { text: '日志分析平台', link: '/dev/tech/logging' },
          { text: '性能优化', link: '/dev/tech/performance' },
          { text: '前端渲染优化', link: '/dev/tech/frontend-rendering' },
          { text: '优化模块使用', link: '/dev/tech/optimization-module' },
          { text: '监控告警体系', link: '/dev/tech/monitoring' },
          { text: '业务指标监控', link: '/dev/tech/business-metrics' },
          { text: 'PM2 进程管理', link: '/dev/tech/pm2' },
          { text: 'TypeScript迁移指南', link: '/dev/tech/typescript-migration' },
          { text: '数据库迁移管理', link: '/dev/tech/database-migration' },
          { text: '性能基准测试', link: '/dev/tech/performance-benchmark' },
          { text: '每日任务系统', link: '/dev/tech/daily-tasks' },
          { text: '每日折扣系统', link: '/dev/tech/daily-discount' },
        ]
      },
      {
        text: '🚀 部署指南',
        items: [
          { text: 'Docker 部署（完整）', link: '/dev/deployment/docker-full' },
          { text: 'Docker 部署（快速）', link: '/dev/deployment/docker' },
          { text: '本地部署（完整）', link: '/dev/deployment/local-full' },
          { text: '本地部署（快速）', link: '/dev/deployment/local' },
          { text: '环境配置', link: '/dev/deployment/environment' },
          { text: '安全加固指南', link: '/dev/deployment/security-hardening' },
          { text: '灾难恢复和备份', link: '/dev/deployment/disaster-recovery' },
          { text: '密码和配置快速参考', link: '/dev/deployment/quick-reference' },
        ]
      },
      {
        text: '📚 API 参考',
        items: [
          { text: 'API 概览', link: '/dev/api-overview' },
          { text: '访问地址', link: '/player/access-addresses' },
          { text: '默认账户与访问地址', link: '/dev/api-default-accounts' },
        ]
      },
      {
        text: '👨‍💻 开发者指南',
        items: [
          { text: '开发环境配置', link: '/dev/dev-guide/environment-setup' },
          { text: '数据库开发工具', link: '/dev/dev-guide/database-tools' },
          { text: '图标工具链', link: '/dev/dev-guide/icon-tools' },
          { text: '开发规范', link: '/dev/dev-guide/code-standards' },
          { text: 'Git 工作流', link: '/dev/dev-guide/git-workflow' },
          { text: '代码审查检查清单', link: '/dev/dev-guide/code-review' },
          { text: '测试指南', link: '/dev/dev-guide/testing' },
          { text: '贡献指南', link: '/dev/dev-guide/contributing' },
        ]
      },
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