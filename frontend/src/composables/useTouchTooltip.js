/**
 * 文件名：useTouchTooltip.js
 * 作者：开发者
 * 日期：2026-06-06
 * 版本：v1.0.0
 * 功能描述：移动端触摸友好的 Tooltip 组合式函数
 *          替代 HTML title 属性，支持点击/触摸显示
 * 更新记录：
 *   2026-06-06 - v1.0.0 - 初始版本
 */

import { ref, onUnmounted } from 'vue';

/**
 * 移动端触摸友好 Tooltip 组合式函数
 * @returns {{ showTooltip: Ref<boolean>, tooltipText: Ref<string>, toggleTooltip: Function, hideTooltip: Function }}
 */
export function useTouchTooltip() {
  const showTooltip = ref(false);
  const tooltipText = ref('');
  let hideTimer = null;

  /**
   * 显示 Tooltip
   * @param {Event} event - 点击/触摸事件
   * @param {string} text - Tooltip 文本
   */
  const showTooltipFn = (event, text) => {
    event.stopPropagation();
    tooltipText.value = text;
    showTooltip.value = true;

    // 清除之前的定时器
    if (hideTimer) clearTimeout(hideTimer);
    // 3秒后自动隐藏
    hideTimer = setTimeout(() => {
      showTooltip.value = false;
    }, 3000);
  };

  /**
   * 切换 Tooltip 显示/隐藏
   * @param {Event} event - 点击/触摸事件
   * @param {string} text - Tooltip 文本
   */
  const toggleTooltip = (event, text) => {
    if (showTooltip.value) {
      showTooltip.value = false;
    } else {
      showTooltipFn(event, text);
    }
  };

  /**
   * 隐藏 Tooltip
   */
  const hideTooltip = () => {
    showTooltip.value = false;
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (hideTimer) clearTimeout(hideTimer);
  });

  return {
    showTooltip,
    tooltipText,
    showTooltipFn,
    toggleTooltip,
    hideTooltip,
  };
}