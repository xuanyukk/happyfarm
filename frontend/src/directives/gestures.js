/**
 * 文件名：gestures.js
 * 作者：开发者
 * 日期：2026-05-07
 * 版本：v1.0.0
 * 功能描述：手势指令 - 提供移动端手势支持
 * 更新记录：
 *   2026-05-07 - v1.0.0 - 初始创建，提供常用手势支持
 */

import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 触摸手势指令 v-touch
 * 支持：tap, longpress, swipe, pinch
 */
export const vTouch = {
  mounted(el, binding) {
    const { value } = binding;

    if (!value || typeof value !== 'object') {
      console.warn('v-touch expects an object with handlers');
      return;
    }

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let longPressTimer = null;
    let isLongPressTriggered = false;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isLongPressTriggered = false;

      if (value.longpress) {
        longPressTimer = setTimeout(() => {
          isLongPressTriggered = true;
          value.longpress(e);
        }, 500);
      }
    };

    const handleTouchMove = (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    const handleTouchEnd = (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (isLongPressTriggered) {
        return;
      }

      touchEndX = e.changedTouches[0].clientX;
      touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Tap手势
      if (touchDuration < 300 && distance < 10) {
        if (value.tap) {
          value.tap(e);
        }
        return;
      }

      // Swipe手势
      if (distance > 50 && touchDuration < 500) {
        const direction =
          Math.abs(deltaX) > Math.abs(deltaY)
            ? deltaX > 0
              ? 'right'
              : 'left'
            : deltaY > 0
              ? 'down'
              : 'up';

        if (value.swipe) {
          value.swipe(e, { direction, deltaX, deltaY, distance });
        }

        if (value[`swipe${direction}`]) {
          value[`swipe${direction}`](e);
        }
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    el._touchHandlers = {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    };
  },

  unmounted(el) {
    if (el._touchHandlers) {
      const { handleTouchStart, handleTouchMove, handleTouchEnd } =
        el._touchHandlers;
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    }
  },
};

/**
 * 长按指令 v-longpress
 */
export const vLongpress = {
  mounted(el, binding) {
    const { value: handler } = binding;
    if (typeof handler !== 'function') return;

    let timer = null;

    const handleStart = () => {
      timer = setTimeout(() => {
        handler();
      }, 500);
    };

    const handleEnd = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    el.addEventListener('touchstart', handleStart, { passive: true });
    el.addEventListener('touchend', handleEnd, { passive: true });
    el.addEventListener('touchcancel', handleEnd, { passive: true });
    el.addEventListener('touchmove', handleEnd, { passive: true });

    el._longpressHandlers = { handleStart, handleEnd };
  },

  unmounted(el) {
    if (el._longpressHandlers) {
      const { handleStart, handleEnd } = el._longpressHandlers;
      el.removeEventListener('touchstart', handleStart);
      el.removeEventListener('touchend', handleEnd);
      el.removeEventListener('touchcancel', handleEnd);
      el.removeEventListener('touchmove', handleEnd);
    }
  },
};

/**
 * 下拉刷新指令 v-pullrefresh
 */
export const vPullrefresh = {
  mounted(el, binding) {
    const { value: handler } = binding;
    if (typeof handler !== 'function') return;

    let startY = 0;
    let isPulling = false;
    let refreshIndicator = null;

    const createIndicator = () => {
      if (refreshIndicator) return;

      refreshIndicator = document.createElement('div');
      refreshIndicator.className = 'pull-refresh-indicator';
      refreshIndicator.innerHTML = `
        <div class="pull-refresh-icon">
          <span class="pull-refresh-arrow">↓</span>
        </div>
        <div class="pull-refresh-text">下拉刷新</div>
      `;

      el.insertBefore(refreshIndicator, el.firstChild);
    };

    const updateIndicator = (distance) => {
      if (!refreshIndicator) return;

      const normalizedDistance = Math.min(distance / 100, 1);
      refreshIndicator.style.transform = `translateY(${Math.min(distance, 100)}px)`;

      const text = refreshIndicator.querySelector('.pull-refresh-text');
      const arrow = refreshIndicator.querySelector('.pull-refresh-arrow');

      if (distance >= 80) {
        text.textContent = '释放刷新';
        arrow.style.transform = 'rotate(180deg)';
      } else {
        text.textContent = '下拉刷新';
        arrow.style.transform = 'rotate(0deg)';
      }
    };

    const showLoading = () => {
      if (!refreshIndicator) return;

      const text = refreshIndicator.querySelector('.pull-refresh-text');
      const icon = refreshIndicator.querySelector('.pull-refresh-icon');

      text.textContent = '刷新中...';
      icon.innerHTML = `<span class="pull-refresh-spinner"></span>`;
    };

    const hideIndicator = () => {
      if (!refreshIndicator) return;

      refreshIndicator.style.transition = 'transform 0.3s ease';
      refreshIndicator.style.transform = 'translateY(-100%)';

      setTimeout(() => {
        if (refreshIndicator && refreshIndicator.parentNode) {
          refreshIndicator.parentNode.removeChild(refreshIndicator);
          refreshIndicator = null;
        }
      }, 300);
    };

    const handleTouchStart = (e) => {
      if (el.scrollTop > 0) return;

      isPulling = true;
      startY = e.touches[0].clientY;
      createIndicator();
    };

    const handleTouchMove = (e) => {
      if (!isPulling || el.scrollTop > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0) {
        e.preventDefault();
        updateIndicator(distance);
      }
    };

    const handleTouchEnd = async (e) => {
      if (!isPulling) return;

      isPulling = false;

      const currentY = e.changedTouches[0].clientY;
      const distance = currentY - startY;

      if (distance >= 80) {
        showLoading();
        await handler();
        hideIndicator();
      } else {
        hideIndicator();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    el._pullrefreshHandlers = {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    };
  },

  unmounted(el) {
    if (el._pullrefreshHandlers) {
      const { handleTouchStart, handleTouchMove, handleTouchEnd } =
        el._pullrefreshHandlers;
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    }
  },
};

export default {
  vTouch,
  vLongpress,
  vPullrefresh,
};
