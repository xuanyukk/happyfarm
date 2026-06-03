/**
 * 文件名：ToastContainer.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：ToastContainer 组件测试 - 测试通知容器和交互功能
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ToastContainer from '@/components/ToastContainer.vue';
import { useToastStore } from '@/stores/toast';

describe('ToastContainer 组件', () => {
  let wrapper;
  let toastStore;

  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    toastStore = useToastStore();
    toastStore.clearToasts();
    
    wrapper = mount(ToastContainer, {
      global: {
        plugins: [pinia]
      }
    });
  });

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true);
    });
  });
});
