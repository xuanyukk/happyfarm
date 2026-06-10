/**
 * 文件名：AchievementNotification.vue
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.0.0
 * 功能描述：成就通知组件 - 解锁成就时显示右上角通知
 * 更新记录：
 * 2026-03-28 - v1.0.0 - 初始创建，成就通知功能
 */

<template>
  <div v-if="visible" class="achievement-notification">
    <div class="notification-content">
      <div class="achievement-icon">{{ achievement?.icon }}</div>
      <div class="notification-text">
        <h4 class="achievement-name">{{ achievement?.achievement_name }}</h4>
        <p class="achievement-description">{{ achievement?.description }}</p>
        <div
          v-if="achievement?.reward_type !== 'none'"
          class="achievement-reward"
        >
          获得奖励: {{ getRewardText(achievement) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AchievementNotification',
  data() {
    return {
      visible: false,
      achievement: null,
      timeout: null,
    };
  },
  methods: {
    showNotification(achievement) {
      this.achievement = achievement;
      this.visible = true;

      // 播放成就解锁音效
      this.playUnlockSound();

      // 3秒后自动隐藏
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.visible = false;
      }, 3000);
    },
    getRewardText(achievement) {
      if (!achievement) return '';
      switch (achievement.reward_type) {
        case 'currency':
          return `${achievement.reward_amount} 农场币`;
        case 'item':
          return `物品 ID: ${achievement.reward_item_id}`;
        case 'title':
          return `称号: ${achievement.reward_title}`;
        default:
          return '无';
      }
    },
    playUnlockSound() {
      // 这里可以添加音效播放逻辑
      // 例如：const audio = new Audio('/sounds/achievement-unlock.mp3');
      // audio.play();
    },
  },
};
</script>

<style scoped>
.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.notification-content {
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  min-width: 300px;
  max-width: 400px;
}

.achievement-icon {
  font-size: 48px;
  margin-right: 16px;
  animation: bounce 0.5s ease-in-out;
}

.notification-text {
  flex: 1;
}

.achievement-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
  animation: fadeIn 0.3s ease-out;
}

.achievement-description {
  font-size: 14px;
  margin: 0 0 8px 0;
  opacity: 0.9;
  animation: fadeIn 0.5s ease-out;
}

.achievement-reward {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
  animation: fadeIn 0.7s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .achievement-notification {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .notification-content {
    min-width: auto;
    max-width: none;
  }
}
</style>
