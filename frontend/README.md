/**
 * 文件名：README.md
 * 作者：TraeAI、xuanyukk
 * 日期：2026-06-01
 * 版本：v4.71.6
 * 功能描述：开心农场前端应用说明文档
 * 更新记录：
 *   2026-05-21 - v4.50.0 - 初始创建
 *   2026-06-01 - v4.71.6 - 同步最新版本，修正Vite版本号
 */

# 开心农场 - 前端

开心农场项目的前端应用，基于 Vue 3 + Vite 构建。

## 技术栈

- **框架**：Vue 3 (Composition API)
- **构建工具**：Vite 5.x
- **状态管理**：Pinia
- **路由**：Vue Router 4.x
- **HTTP客户端**：Axios
- **WebSocket**：Socket.io-client
- **测试框架**：Vitest
- **代码规范**：ESLint + Prettier
- **Git钩子**：Husky

## 快速开始

### 环境要求

- Node.js >= 18.x
- npm >= 9.x

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

### 运行测试

```bash
# 运行测试
npm run test

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 代码检查

```bash
# ESLint检查
npm run lint

# 自动修复
npm run lint:fix

# Prettier格式化
npm run format
```

### 性能优化

```bash
# 依赖优化
npm run optimize:deps

# 清理缓存
npm run clean

# 查看构建包大小
npm run size
```

## 项目结构

```
frontend/
├── src/
│   ├── components/        # 组件
│   │   ├── AchievementList.vue
│   │   ├── AchievementNotification.vue
│   │   ├── ActionModal.vue
│   │   ├── AdminLayout.vue
│   │   ├── CropInfoModal.vue
│   │   ├── ErrorBoundary.vue
│   │   ├── HarvestAnimation.vue
│   │   ├── HelloWorld.vue
│   │   ├── LandCell.vue
│   │   ├── LandGrid.vue
│   │   ├── LandGridOptimized.vue
│   │   ├── LazyImage.vue
│   │   ├── LoadingOverlay.vue
│   │   ├── PlantAnimation.vue
│   │   ├── SkeletonLoader.vue
│   │   ├── SoundSettings.vue
│   │   ├── ToastContainer.vue
│   │   ├── TutorialGuide.vue
│   │   ├── UnlockAnimation.vue
│   │   ├── UpgradeAnimation.vue
│   │   ├── VirtualLandGrid.vue
│   │   └── VirtualScroll.vue
│   ├── directives/        # 自定义指令
│   │   ├── gestures.js
│   │   └── lazyLoad.js
│   ├── pages/            # 页面组件
│   │   ├── admin/        # 管理员后台页面
│   │   │   ├── AlertsPage.vue
│   │   │   ├── AlertsPushPage.vue
│   │   │   ├── AnnouncementsPage.vue
│   │   │   ├── ApprovalsPage.vue
│   │   │   ├── AuditLogsPage.vue
│   │   │   ├── BackupPage.vue
│   │   │   ├── BatchOperationsPage.vue
│   │   │   ├── ConfigHotUpdatePage.vue
│   │   │   ├── ConfigsPage.vue
│   │   │   ├── CropsPage.vue
│   │   │   ├── CurrencyPage.vue
│   │   │   ├── DashboardPage.vue
│   │   │   ├── DatabasePage.vue
│   │   │   ├── DocsPage.vue
│   │   │   ├── FarmLevelPage.vue
│   │   │   ├── GameEventsPage.vue
│   │   │   ├── HealthCheckPage.vue
│   │   │   ├── ItemsPage.vue
│   │   │   ├── LogAnalysisPage.vue
│   │   │   ├── LogsPage.vue
│   │   │   ├── MonitoringPage.vue
│   │   │   ├── PerformancePage.vue
│   │   │   ├── PlayersPage.vue
│   │   │   ├── RolesPage.vue
│   │   │   ├── ShopPage.vue
│   │   │   ├── StatisticsPage.vue
│   │   │   ├── SystemStatePage.vue
│   │   │   └── AchievementPage.vue
│   │   ├── CurrencyLogPage.vue
│   │   ├── ForgotPasswordPage.vue
│   │   ├── Home.vue
│   │   ├── InventoryPage.vue
│   │   ├── LoginPage.vue
│   │   ├── QueueManager.vue
│   │   ├── RegisterPage.vue
│   │   ├── ResetPasswordPage.vue
│   │   └── ShopPage.vue
│   ├── services/         # API服务
│   │   ├── adminService.js
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── buffManager.js
│   │   ├── errorHandler.js
│   │   ├── farmViewManager.js
│   │   ├── gameService.js
│   │   ├── growthCalculator.js
│   │   ├── growthStageManager.js
│   │   ├── incrementalService.js
│   │   ├── logger.js
│   │   ├── metricsCollector.js
│   │   ├── networkMonitor.js
│   │   ├── offlineCache.js
│   │   ├── operationQueue.js
│   │   ├── refreshCoordinator.js
│   │   ├── requestBatcher.js
│   │   ├── soundManager.js
│   │   ├── stateSnapshot.js
│   │   ├── timeSync.js
│   │   ├── timerManager.js
│   │   └── websocketService.js
│   ├── stores/           # Pinia状态管理
│   │   ├── achievement.js
│   │   ├── admin.js
│   │   ├── alert.js
│   │   ├── announcement.js
│   │   ├── batch.js
│   │   ├── config.js
│   │   ├── farm.js
│   │   ├── gameEvent.js
│   │   ├── loading.js
│   │   ├── player.js
│   │   ├── queue.js
│   │   ├── rbac.js
│   │   └── shop.js
│   ├── types/            # TypeScript类型定义
│   │   └── index.d.ts
│   ├── utils/            # 工具函数
│   │   ├── constants.js
│   │   ├── imageUtils.js
│   │   ├── localStorage.js
│   │   ├── performanceMonitor.js
│   │   ├── preloadStrategy.js
│   │   ├── request.js
│   │   └── validation.js
│   ├── App.vue           # 根组件
│   ├── main.js           # 应用入口
│   ├── mobile.css        # 移动端样式
│   ├── router.js         # 路由配置
│   └── style.css         # 全局样式
├── public/               # 静态资源
│   ├── favicon.svg
│   └── icons.svg
├── scripts/              # 构建脚本
│   ├── build.bat
│   └── build.sh
├── .env.example          # 环境变量示例
├── Dockerfile            # Docker配置
├── Dockerfile.dev        # Docker开发配置
├── nginx.conf            # Nginx配置
├── vite.config.js        # Vite配置
├── vitest.config.js      # Vitest测试配置
├── package.json
└── README.md
```

## 主要功能

### 核心游戏功能

- **农场管理**：土地解锁、升级、种植、收获
- **作物系统**：24种作物，按等级解锁
- **商店系统**：种子和道具购买
- **背包系统**：物品管理和批量出售
- **成就系统**：成就进度展示和奖励
- **货币系统**：多种货币类型和流水记录

### 扩展功能

- **实时推送**：WebSocket实时更新
- **离线缓存**：LocalStorage状态持久化
- **性能优化**：虚拟滚动、懒加载、keep-alive缓存
- **响应式设计**：移动端适配
- **日志上报**：客户端日志收集和分析

### 管理员后台

- **用户管理**：用户信息、状态管理
- **数据统计**：实时数据看板
- **系统配置**：游戏参数热更新
- **公告管理**：公告发布和分类
- **日志审计**：操作日志查询
- **备份恢复**：数据库备份和恢复
- **性能监控**：系统性能指标
- **游戏活动**：活动创建和管理

## 环境变量

复制 `.env.example` 为 `.env` 并根据需要修改：

```env
# API地址
VITE_API_BASE_URL=http://localhost:3000

# WebSocket地址
VITE_WS_URL=ws://localhost:3000

# 是否启用日志上报
VITE_ENABLE_LOG_REPORT=true

# 日志上报地址
VITE_LOG_REPORT_ENDPOINT=/api/client-logs
VITE_LOG_BATCH_REPORT_ENDPOINT=/api/client-logs/batch

# 上报间隔（毫秒）
VITE_LOG_REPORT_INTERVAL=30000

# 是否启用控制台日志
VITE_ENABLE_LOG_CONSOLE=true
```

## 开发指南

### 添加新页面

1. 在 `src/pages/` 创建页面组件
2. 在 `src/router.js` 添加路由配置
3. 如需要，在 `src/stores/` 添加状态管理

### 添加新组件

1. 在 `src/components/` 创建组件
2. 在需要的页面中引入使用

### API调用

使用 `src/services/api.js` 中的封装函数：

```javascript
import { api } from '@/services/api'

// GET请求
const data = await api.get('/endpoint')

// POST请求
const result = await api.post('/endpoint', { data })
```

## 性能优化特性

- **路由懒加载**：页面组件按需加载
- **虚拟滚动**：长列表性能优化
- **图片懒加载**：延迟加载图片资源
- **keep-alive缓存**：高频页面状态保留
- **响应式优化**：shallowRef/shallowReactive使用
- **Tree Shaking**：Vite构建优化
- **代码分割**：按路由自动分割

## 部署

### Docker部署

```bash
cd frontend
docker build -t happy-farm-frontend .
docker run -p 80:80 happy-farm-frontend
```

### Nginx部署

项目包含 `nginx.conf` 配置文件，可直接用于生产环境部署。

## 相关文档

更多详细文档请参考项目根目录的 `docs-website/` 或访问文档网站。

## 版本

v4.50.0

## 许可证

MIT License
