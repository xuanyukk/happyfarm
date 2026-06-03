/**
 * 文件名：LoadingOverlay.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：LoadingOverlay 组件测试 - 测试加载遮罩功能
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import { useLoadingStore } from '@/stores/loading';

describe('LoadingOverlay 组件', () => {
  let wrapper;

  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    
    wrapper = mount(LoadingOverlay, {
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
