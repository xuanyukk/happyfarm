<script setup>
defineOptions({ name: 'App' });

import ErrorBoundary from './components/ErrorBoundary.vue';
import TutorialGuide from './components/TutorialGuide.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';
import ToastContainer from './components/ToastContainer.vue';
import errorHandler from './services/errorHandler';
import { onMounted, onUnmounted, onErrorCaptured } from 'vue';
import logger from './services/logger';

// 全局错误边界兜底：捕获 ErrorBoundary 组件自身可能遗漏的错误
onErrorCaptured((error, instance, info) => {
  logger.error('App.vue 全局错误捕获（兜底）', {
    error: error.message,
    stack: error.stack,
    info,
    componentName: instance?.$options?.name || instance?.type?.name || 'unknown',
    url: window.location.href,
  });
  // 返回 false 阻止错误继续向上传播
  return false;
});

onMounted(() => {
  errorHandler.initErrorHandler();
});

onUnmounted(() => {
  errorHandler.destroyErrorHandler();
});
</script>

<template>
  <ErrorBoundary>
    <!-- 对高频复用的路由页面使用 keep-alive 缓存 -->
    <router-view v-slot="{ Component, route }">
      <keep-alive :include="['Home', 'ShopPage', 'InventoryPage']" :max="3">
        <component :is="Component" :key="route.name" />
      </keep-alive>
    </router-view>
    <TutorialGuide />
    <LoadingOverlay />
    <ToastContainer />
  </ErrorBoundary>
</template>
