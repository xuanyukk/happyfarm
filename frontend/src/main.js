/**
 * 文件名：main.js
 * 作者：开发者
 * 日期：2026-03-19
 * 版本：v1.7.1
 * 功能描述：Vue应用入口，注册路由和自定义指令，支持Pinia状态持久化和性能优化
 * 更新记录：
 *   2026-05-07 - v1.5.0 - 添加手势指令支持
 *   2026-05-12 - v1.6.0 - 添加预加载策略集成
 *   2026-06-11 - v1.7.0 - C8修复：添加Vue全局错误处理器（app.config.errorHandler）
 *   2026-06-11 - v1.7.1 - C19修复：预加载setTimeout存储到window.__preloadTimer，支持外部取消
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import './mobile.css';
import App from './App.vue';
import router from './router';
import logger from './services/logger';
import lazyLoad from './directives/lazyLoad';
import { vTouch, vLongpress, vPullrefresh } from './directives/gestures';
import wsService from './services/websocketService';
import { createPersistedState } from './utils/localStorage';
import errorHandler from './services/errorHandler';
import preloadStrategy from './utils/preloadStrategy';

logger.info('前端应用启动');

// 初始化错误处理
errorHandler.initErrorHandler();

const app = createApp(App);
const pinia = createPinia();

// C8修复：添加Vue全局错误处理器，捕获组件渲染/生命周期钩子错误
app.config.errorHandler = (err, vm, info) => {
  logger.error('Vue全局错误', {
    error: err.message,
    stack: err.stack,
    component: vm?.$options?.name || '匿名组件',
    info,
  });
  errorHandler.handleError(err, { source: 'vue', info });
  // 不阻止默认行为，让ErrorBoundary组件接管UI展示
};

pinia.use(
  createPersistedState({
    key: 'happyfarm_pinia_state',
    paths: ['player', 'farm', 'shop'],
  })
);

app.use(router);
app.use(pinia);
app.directive('lazy', lazyLoad);
app.directive('touch', vTouch);
app.directive('longpress', vLongpress);
app.directive('pullrefresh', vPullrefresh);

// 全局注入WebSocket服务
app.config.globalProperties.$ws = wsService;
// 全局注入错误处理
app.config.globalProperties.$errorHandler = errorHandler;
// 全局注入预加载策略
app.config.globalProperties.$preload = preloadStrategy;

// 应用挂载后预加载关键资源
app.mount('#app');

// 延迟预加载，避免阻塞首屏渲染
// C19修复：将预加载定时器ID存储到window对象，使其他模块可以取消
// 使用场景：用户快速切换页面、应用异常退出等需要中断预加载时
// 其他模块可通过 clearTimeout(window.__preloadTimer) 取消此预加载
window.__preloadTimer = setTimeout(() => {
  preloadStrategy.preloadCriticalResources();
  logger.info('关键资源预加载已启动');
}, 1000);

// 路由守卫 - 预加载下一页资源
router.beforeEach((to, from, next) => {
  // 预加载目标路由相关资源
  preloadStrategy.preloadForRoute(to.name || to.path);
  next();
});
