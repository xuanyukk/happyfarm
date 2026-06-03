/** * 文件名：TutorialGuide.vue * 作者：开发者 * 日期：2026-03-29 * 版本：v1.0.0
* 功能描述：新手引导组件 - 提供完整的新手教程流程 * 更新记录： * 2026-03-29 -
v1.0.0 - 初始创建，新手引导功能 */

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showTutorial"
        class="tutorial-overlay"
        @click.self="skipTutorial"
      >
        <div class="tutorial-content">
          <div class="tutorial-header">
            <h2>🎉 欢迎来到开心农场！</h2>
            <div class="tutorial-progress">
              <div
                v-for="(step, index) in totalSteps"
                :key="index"
                class="progress-dot"
                :class="{
                  active: currentStep >= index,
                  completed: currentStep > index,
                }"
              ></div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-icon">{{ currentTutorialStep.icon }}</div>
            <h3 class="step-title">{{ currentTutorialStep.title }}</h3>
            <p class="step-description">
              {{ currentTutorialStep.description }}
            </p>

            <div v-if="currentTutorialStep.image" class="step-image">
              <img :src="currentTutorialStep.image" alt="教程图片" />
            </div>
          </div>

          <div class="tutorial-actions">
            <button
              v-if="currentStep > 0"
              class="btn btn-secondary"
              @click="prevStep"
            >
              上一步
            </button>
            <button class="btn btn-primary" @click="nextStep">
              {{ currentStep < totalSteps - 1 ? '下一步' : '开始游戏！' }}
            </button>
          </div>

          <button class="skip-btn" @click="skipTutorial">跳过教程</button>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showHighlight" class="highlight-overlay">
        <div class="highlight-box" :style="highlightStyle"></div>
        <div class="tooltip-box" :style="tooltipStyle">
          <div class="tooltip-arrow"></div>
          <div class="tooltip-content">
            <h4>{{ currentTooltip.title }}</h4>
            <p>{{ currentTooltip.description }}</p>
            <button class="btn btn-small btn-primary" @click="nextHighlight">
              {{
                currentHighlightIndex < highlightSteps.length - 1
                  ? '知道了'
                  : '完成！'
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const STORAGE_KEY = 'happyFarm_tutorialCompleted';

const showTutorial = ref(false);
const showHighlight = ref(false);
const currentStep = ref(0);
const currentHighlightIndex = ref(0);
const highlightElement = ref(null);

const tutorialSteps = [
  {
    icon: '👋',
    title: '欢迎来到开心农场！',
    description: '这是一个充满乐趣的农场模拟游戏。让我带你了解一下基本玩法吧！',
    image: null,
  },
  {
    icon: '🌱',
    title: '种植作物',
    description:
      '点击空地可以选择种子进行种植。不同的作物有不同的生长时间和收益哦！',
    image: null,
  },
  {
    icon: '🌾',
    title: '收获作物',
    description:
      '等待作物成熟后，点击成熟的地块就可以收获了！收获的作物可以出售获得农场币。',
    image: null,
  },
  {
    icon: '💰',
    title: '农场币',
    description:
      '农场币是游戏中的核心货币。你可以用它购买种子、解锁地块、提升品质！',
    image: null,
  },
  {
    icon: '🏠',
    title: '解锁地块',
    description: '随着等级提升，你可以解锁更多的地块来扩大你的农场规模！',
    image: null,
  },
  {
    icon: '✨',
    title: '提升品质',
    description: '地块品质越高，产量越高！点击地块品质标识可以查看和提升品质。',
    image: null,
  },
  {
    icon: '🛒',
    title: '商店与背包',
    description:
      '在商店购买种子和道具，在背包管理你的库存。道具可以帮助你更快成长！',
    image: null,
  },
  {
    icon: '🎮',
    title: '准备好了吗？',
    description:
      '太棒了！你已经了解了基本玩法。现在开始你的农场之旅吧！记得经常回来看看你的作物哦~',
    image: null,
  },
];

const highlightSteps = [
  {
    target: '.currency-display',
    title: '农场币',
    description: '这里显示你的农场币余额，用于购买种子和解锁地块！',
    position: 'bottom',
  },
  {
    target: '.land-grid',
    title: '农场地块',
    description: '这是你的农场！点击空地种植，点击成熟地块收获！',
    position: 'top',
  },
  {
    target: '.nav',
    title: '导航菜单',
    description: '这里可以访问商店、背包、货币流水等功能！',
    position: 'bottom',
  },
];

const totalSteps = computed(() => tutorialSteps.length);

const currentTutorialStep = computed(() => tutorialSteps[currentStep.value]);

const currentTooltip = computed(
  () => highlightSteps[currentHighlightIndex.value]
);

const highlightStyle = computed(() => {
  if (!highlightElement.value) return {};
  const rect = highlightElement.value.getBoundingClientRect();
  return {
    top: `${rect.top - 5}px`,
    left: `${rect.left - 5}px`,
    width: `${rect.width + 10}px`,
    height: `${rect.height + 10}px`,
  };
});

const tooltipStyle = computed(() => {
  if (!highlightElement.value) return {};
  const rect = highlightElement.value.getBoundingClientRect();
  const step = highlightSteps[currentHighlightIndex.value];

  let top, left;
  switch (step.position) {
    case 'top':
      top = rect.top - 120;
      left = rect.left + rect.width / 2 - 150;
      break;
    case 'bottom':
      top = rect.bottom + 20;
      left = rect.left + rect.width / 2 - 150;
      break;
    default:
      top = rect.top + rect.height / 2 - 60;
      left = rect.right + 20;
  }

  return {
    top: `${Math.max(10, top)}px`,
    left: `${Math.max(10, Math.min(left, window.innerWidth - 320))}px`,
  };
});

const checkTutorialStatus = () => {
  const completed = localStorage.getItem(STORAGE_KEY);
  if (!completed) {
    showTutorial.value = true;
  }
};

const completeTutorial = () => {
  localStorage.setItem(STORAGE_KEY, 'true');
  showTutorial.value = false;
  showHighlight.value = false;
};

const nextStep = () => {
  if (currentStep.value < totalSteps.value - 1) {
    currentStep.value++;
  } else {
    completeTutorial();
    startHighlightTutorial();
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const skipTutorial = () => {
  if (confirm('确定要跳过教程吗？你可以随时在设置中重新查看教程。')) {
    completeTutorial();
  }
};

const startHighlightTutorial = () => {
  currentHighlightIndex.value = 0;
  showHighlight.value = true;
  updateHighlight();
};

const updateHighlight = () => {
  const step = highlightSteps[currentHighlightIndex.value];
  const element = document.querySelector(step.target);
  if (element) {
    highlightElement.value = element;
  }
};

const nextHighlight = () => {
  if (currentHighlightIndex.value < highlightSteps.length - 1) {
    currentHighlightIndex.value++;
    updateHighlight();
  } else {
    showHighlight.value = false;
  }
};

const resetTutorial = () => {
  localStorage.removeItem(STORAGE_KEY);
  currentStep.value = 0;
  currentHighlightIndex.value = 0;
  showTutorial.value = true;
  showHighlight.value = false;
};

onMounted(() => {
  checkTutorialStatus();
});

defineExpose({
  resetTutorial,
});
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.tutorial-content {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95),
    rgba(255, 255, 255, 0.85)
  );
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.tutorial-header {
  text-align: center;
  margin-bottom: 30px;
}

.tutorial-header h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 24px;
}

.tutorial-progress {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: #4caf50;
}

.progress-dot.completed {
  background: #4caf50;
}

.tutorial-step {
  text-align: center;
  margin-bottom: 30px;
}

.step-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.step-title {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 20px;
}

.step-description {
  color: #555;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.step-image {
  margin-top: 20px;
}

.step-image img {
  max-width: 100%;
  border-radius: 12px;
}

.tutorial-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 15px;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-small {
  padding: 8px 20px;
  font-size: 14px;
}

.skip-btn {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  padding: 10px;
  transition: color 0.3s ease;
}

.skip-btn:hover {
  color: #555;
}

.highlight-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9998;
}

.highlight-box {
  position: absolute;
  border: 3px solid #4caf50;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 9999px rgba(0, 0, 0, 0.7),
      0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow:
      0 0 0 9999px rgba(0, 0, 0, 0.7),
      0 0 0 15px rgba(76, 175, 80, 0);
  }
}

.tooltip-box {
  position: absolute;
  background: white;
  border-radius: 16px;
  padding: 20px;
  width: 300px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 9999;
}

.tooltip-arrow {
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  transform: rotate(45deg);
  top: -8px;
  left: 50%;
  margin-left: -8px;
}

.tooltip-content h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 18px;
}

.tooltip-content p {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 14px;
  line-height: 1.5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .tutorial-content {
    padding: 25px;
    margin: 10px;
  }

  .tutorial-header h2 {
    font-size: 20px;
  }

  .step-icon {
    font-size: 48px;
  }

  .step-title {
    font-size: 18px;
  }

  .step-description {
    font-size: 14px;
  }

  .btn {
    padding: 10px 24px;
    font-size: 14px;
  }

  .tooltip-box {
    width: 280px;
    padding: 15px;
  }
}
</style>
