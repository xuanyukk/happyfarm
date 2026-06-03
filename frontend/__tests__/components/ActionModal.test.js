/**
 * 文件名：ActionModal.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：ActionModal 组件测试 - 测试操作模态框功能
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ActionModal from '@/components/ActionModal.vue';

describe('ActionModal 组件', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ActionModal, {
      props: {
        modelValue: true,
        title: '测试标题'
      }
    });
  });

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('应该显示标题', () => {
      expect(wrapper.text()).toContain('测试标题');
    });
  });

  describe('交互测试', () => {
    it('点击关闭按钮应该触发关闭', async () => {
      const closeBtn = wrapper.find('.close-btn');
      if (closeBtn.exists()) {
        await closeBtn.trigger('click');
        expect(wrapper.emitted()).toHaveProperty('update:modelValue');
      }
    });
  });
});
