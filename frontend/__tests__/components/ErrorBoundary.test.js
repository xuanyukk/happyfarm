/**
 * 文件名：ErrorBoundary.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：ErrorBoundary 组件测试 - 测试错误边界功能
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import ErrorBoundary from '@/components/ErrorBoundary.vue';

describe('ErrorBoundary 组件', () => {
  let wrapper;

  beforeEach(() => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }]
    });
    
    wrapper = mount(ErrorBoundary, {
      global: {
        plugins: [router]
      }
    });
  });

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true);
    });
  });
});
