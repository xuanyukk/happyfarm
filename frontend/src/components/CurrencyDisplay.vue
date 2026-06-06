/** * 文件名：CurrencyDisplay.vue * 作者：开发者 * 日期：2026-05-22 *
版本：v2.14.0 * 功能描述：多货币显示组件，支持农场币和农场宝石币（万/亿格式化）
* 更新记录： * 2026-05-22 - v2.11.0 - 从Home.vue中拆分出独立组件 * 2026-05-25 -
v2.12.0 - 集成货币格式化（万/亿），增加tooltip显示完整数值 * 2026-05-25 -
v2.13.0 - 新增农场宝石币显示支持（type='gem'） * 2026-06-06 -
v2.14.0 - 修复tooltip移动端无法触发，改用点击/触摸显示 */

<template>
  <div class="currency-display" :class="'currency-type-' + currencyType">
    <span class="currency-icon">{{ icon }}</span>
    <span
      class="currency-amount"
      @click.stop="toggleTooltip"
      @touchstart.stop="toggleTooltip"
    >
      {{ formattedAmount }}
      <span v-if="showTooltip" class="currency-tooltip">
        完整数值：{{ rawAmount.toLocaleString('zh-CN') }}
      </span>
    </span>
    <span class="currency-label">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatCurrency } from '../utils/currencyFormatter';

const props = defineProps({
  amount: {
    type: [Number, String],
    default: 0,
  },
  /** 货币类型：'coin'=农场币（默认），'gem'=农场宝石币 */
  type: {
    type: String,
    default: 'coin',
  },
});

// 移动端tooltip状态
const showTooltip = ref(false);
let tooltipTimer = null;

const toggleTooltip = () => {
  showTooltip.value = !showTooltip.value;
  if (showTooltip.value) {
    // 3秒后自动隐藏
    if (tooltipTimer) clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => {
      showTooltip.value = false;
    }, 3000);
  }
};

const rawAmount = computed(() => {
  return parseInt(props.amount) || 0;
});

const formattedAmount = computed(() => {
  return formatCurrency(rawAmount.value);
});

const currencyType = computed(() => props.type || 'coin');

const icon = computed(() => {
  return currencyType.value === 'gem' ? '💎' : '💰';
});

const label = computed(() => {
  return currencyType.value === 'gem' ? '农场宝石币' : '农场币';
});
</script>

<style scoped>
.currency-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: var(--border-radius-lg);
  border: 1px solid;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: pulse-glow 2s ease-in-out infinite;
}

/* 农场币主题 */
.currency-type-coin {
  background: linear-gradient(
    135deg,
    rgba(251, 191, 36, 0.3),
    rgba(245, 158, 11, 0.3)
  );
  border-color: rgba(251, 191, 36, 0.4);
}

.currency-type-coin .currency-icon {
  animation: bounce 2s ease-in-out infinite;
}

/* 农场宝石币主题 */
.currency-type-gem {
  background: linear-gradient(
    135deg,
    rgba(147, 51, 234, 0.3),
    rgba(192, 38, 211, 0.3)
  );
  border-color: rgba(147, 51, 234, 0.4);
}

.currency-type-gem .currency-icon {
  animation: sparkle 1.5s ease-in-out infinite;
}

.currency-icon {
  font-size: 28px;
}

.currency-amount {
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  cursor: pointer;
}

.currency-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  font-size: 14px;
  font-weight: 400;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
}

.currency-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.85);
}

.currency-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes sparkle {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.85;
  }
}
</style>
