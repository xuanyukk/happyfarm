/**
 * 文件名：PWA实施指南.md
 * 作者：开发团队
 * 日期：2026-03-19
 * 版本：v4.50.0
 * 功能描述：PWA缓存策略实施指南
 * 更新记录：
 *   2026-03-19 - v1.0.0 - 初始创建
 *   2026-05-21 - v4.50.0 - 更新项目版本，统一文档标准
 */

# PWA缓存策略实施指南

## 📅 文档信息
- 日期：2026-05-21
- 版本：v4.50.0
- 状态：待Vite 8.0兼容插件更新

## 🚫 当前兼容性问题

### 问题描述
当前项目使用 **Vite 8.0.0**，而主流的PWA插件 `vite-plugin-pwa` 目前不支持 Vite 8.0。

### 插件状态
- `vite-plugin-pwa` 最新版本：v0.20.x
- 支持的Vite版本：Vite 5.x - Vite 7.x
- Vite 8.0支持：正在开发中

## 💡 解决方案

### 方案一：等待插件更新（推荐）⭐
等待 `vite-plugin-pwa` 官方发布支持 Vite 8.0 的版本。

**优点：**
- 官方支持，稳定性最好
- 无需额外配置
- 持续更新维护

**监控方式：**
- GitHub仓库：https://github.com/vite-pwa/vite-plugin-pwa
- npm页面：https://www.npmjs.com/package/vite-plugin-pwa

---

### 方案二：降级Vite版本
将Vite降级到7.x版本以使用 `vite-plugin-pwa`。

**实施步骤：**
```bash
# 1. 修改 frontend/package.json
# 将 "vite": "^8.0.0" 改为 "vite": "^7.0.0"

# 2. 重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install

# 3. 安装vite-plugin-pwa
npm install -D vite-plugin-pwa
```

**优点：**
- 可以立即实施PWA
- 成熟稳定的方案

**缺点：**
- 失去Vite 8.0的新特性
- 可能需要调整其他依赖

---

### 方案三：手动实现Service Worker
不依赖插件，手动编写Service Worker。

**实施步骤：**

1. 创建 `frontend/public/sw.js`：
```javascript
const CACHE_NAME = 'happy-farm-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
```

2. 在 `frontend/src/main.js` 中注册：
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker 注册成功:', registration);
    })
    .catch((error) => {
      console.log('Service Worker 注册失败:', error);
    });
}
```

3. 创建 `frontend/public/manifest.json`：
```json
{
  "name": "开心农场",
  "short_name": "开心农场",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4CAF50",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

4. 在 `frontend/index.html` 中添加：
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#4CAF50">
```

**优点：**
- 完全控制
- 不依赖第三方插件
- 学习成本低

**缺点：**
- 需要手动维护
- 功能相对简单

---

## 📋 未来实施计划（使用vite-plugin-pwa）

当插件支持Vite 8.0后，按以下步骤实施：

### 1. 安装依赖
```bash
cd frontend
npm install -D vite-plugin-pwa
```

### 2. 配置 vite.config.js
```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: '开心农场',
        short_name: '开心农场',
        description: '快乐种植，收获幸福',
        theme_color: '#4CAF50',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ]
})
```

### 3. 缓存策略说明

#### Stale-While-Revalidate（优先使用缓存，同时后台更新）
适用于：静态资源、CSS、JS、图片
```javascript
handler: 'StaleWhileRevalidate'
```

#### Network-First（优先网络，失败时使用缓存）
适用于：API请求、动态内容
```javascript
handler: 'NetworkFirst'
```

#### Cache-First（优先缓存，无缓存时网络）
适用于：不常变化的资源
```javascript
handler: 'CacheFirst'
```

#### Network-Only（仅网络）
适用于：实时数据、敏感信息
```javascript
handler: 'NetworkOnly'
```

## 🎯 PWA特性清单

- [ ] 离线访问
- [ ] 添加到主屏幕
- [ ] 全屏体验
- [ ] 推送通知
- [ ] 后台同步
- [ ] 缓存策略
- [ ] Manifest配置

## 📚 参考资料

- [Vite PWA官方文档](https://vite-pwa-org.netlify.app/)
- [Service Worker API](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/zh-CN/docs/Web/Manifest)
- [Workbox文档](https://developer.chrome.com/docs/workbox/)
