<script setup>
import ErrorBoundary from './components/ErrorBoundary.vue';
import TutorialGuide from './components/TutorialGuide.vue';
import LoadingOverlay from './components/LoadingOverlay.vue';
import ToastContainer from './components/ToastContainer.vue';
import errorHandler from './services/errorHandler';
import { onMounted, onUnmounted } from 'vue';

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
        <component :is="Component" :key="route.path" />
      </keep-alive>
    </router-view>
    <TutorialGuide />
    <LoadingOverlay />
    <ToastContainer />
  </ErrorBoundary>
</template>
