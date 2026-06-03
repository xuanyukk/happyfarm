/**
 * 文件名：LandCell.test.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：LandCell 组件测试 - 测试土地格子组件功能
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始版本创建
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LandCell from '@/components/LandCell.vue';

describe('LandCell 组件', () => {
  let wrapper;
  const mockLandData = {
    id: 1,
    is_unlocked: true,
    crop_id: null,
    current_quality: 1,
    quality_name: '普通',
    unlock_cost: 100,
    yield_boost: 1.0,
    speed_boost: 1.0
  };

  beforeEach(() => {
    wrapper = mount(LandCell, {
      props: {
        land: mockLandData
      }
    });
  });

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('应该接收并显示land属性', () => {
      expect(wrapper.props('land')).toEqual(mockLandData);
    });
  });

  describe('交互测试', () => {
    it('应该在点击时触发click事件', async () => {
      await wrapper.trigger('click');
      expect(wrapper.emitted()).toHaveProperty('click');
    });
  });
});
