/** * 文件名：AchievementList.vue * 作者：开发者 * 日期：2026-03-28 *
版本：v2.0.0 * 功能描述：成就列表组件 - 展示所有成就，支持分类筛选和进度查看 *
更新记录： * 2026-04-30 - v2.0.0 - 重构组件，使用统一的 Pinia Store 和
gameService */

<template>
  <div class="achievement-container">
    <h2 class="achievement-title">🏆 成就系统</h2>

    <!-- 成就分类筛选 -->
    <div class="achievement-filters">
      <button
        v-for="category in achievementStore.categories"
        :key="category.value"
        :class="[
          'filter-btn',
          { active: achievementStore.selectedCategory === category.value },
        ]"
        @click="achievementStore.setCategory(category.value)"
      >
        {{ category.label }}
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="achievementStore.loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">加载成就中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="achievementStore.error" class="error-container">
      <span class="error-icon">⚠️</span>
      <p class="error-text">{{ achievementStore.error }}</p>
      <button
        class="btn btn-primary"
        @click="achievementStore.fetchAchievements(true)"
      >
        重试
      </button>
    </div>

    <!-- 成就列表 -->
    <div v-else class="achievement-list">
      <div
        v-for="achievement in achievementStore.filteredAchievements"
        :key="achievement.achievement_id"
        :class="['achievement-card', { completed: achievement.is_completed }]"
      >
        <div class="achievement-icon">{{ achievement.icon || '🎖️' }}</div>
        <div class="achievement-info">
          <h3 class="achievement-name">{{ achievement.achievement_name }}</h3>
          <p class="achievement-description">{{ achievement.description }}</p>
          <div class="achievement-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: `${Math.min((achievement.current_count / achievement.required_count) * 100, 100)}%`,
                }"
              ></div>
            </div>
            <span class="progress-text">
              {{ achievement.current_count }} / {{ achievement.required_count }}
            </span>
          </div>
          <div
            v-if="achievement.reward_type !== 'none'"
            class="achievement-reward"
          >
            🎁 奖励: {{ getRewardText(achievement) }}
          </div>
          <div v-if="achievement.is_completed" class="achievement-status">
            ✅ 已解锁于 {{ formatDate(achievement.completed_at) }}
          </div>
        </div>
        <div class="achievement-rarity" :class="achievement.rarity">
          {{ getRarityText(achievement.rarity) }}
        </div>
      </div>
    </div>

    <!-- 成就统计 -->
    <div class="achievement-stats">
      <div class="stat-item">
        <span class="stat-value">{{ achievementStore.completedCount }}</span>
        <span class="stat-label">已解锁</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ achievementStore.totalCount }}</span>
        <span class="stat-label">总成就</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ achievementStore.completionRate }}%</span>
        <span class="stat-label">完成率</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAchievementStore } from '../stores/achievement';

const achievementStore = useAchievementStore();

const getRewardText = (achievement) => {
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
};

const getRarityText = (rarity) => {
  const rarityMap = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  };
  return rarityMap[rarity] || rarity;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  achievementStore.fetchAchievements();
});
</script>

<style scoped>
.achievement-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.achievement-title {
  font-size: 28px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 24px;
  text-align: center;
}

.achievement-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  justify-content: center;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid rgba(100, 116, 139, 0.3);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.filter-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateY(-2px);
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.error-text {
  font-size: 16px;
  color: #4a5568;
}

.error-icon {
  font-size: 48px;
}

.achievement-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.achievement-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #cbd5e0;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.achievement-card.completed {
  border-left-color: #48bb78;
  background: linear-gradient(
    135deg,
    rgba(72, 187, 120, 0.1) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
}

.achievement-icon {
  font-size: 40px;
  text-align: center;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 18px;
  font-weight: bold;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.achievement-description {
  font-size: 14px;
  color: #718096;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.achievement-progress {
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: #e2e8f0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 12px;
  color: #718096;
  text-align: right;
  display: block;
}

.achievement-reward {
  font-size: 14px;
  color: #ed8936;
  margin-bottom: 8px;
  font-weight: 500;
}

.achievement-status {
  font-size: 12px;
  color: #48bb78;
  font-style: italic;
}

.achievement-rarity {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-top: 8px;
}

.achievement-rarity.common {
  background: #e2e8f0;
  color: #4a5568;
}

.achievement-rarity.rare {
  background: #bee3f8;
  color: #2b6cb0;
}

.achievement-rarity.epic {
  background: #e9d8fd;
  color: #6b46c1;
}

.achievement-rarity.legendary {
  background: #feebc8;
  color: #c05621;
}

.achievement-stats {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-top: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .achievement-list {
    grid-template-columns: 1fr;
  }

  .achievement-filters {
    flex-direction: column;
    align-items: center;
  }

  .filter-btn {
    width: 100%;
    max-width: 240px;
  }

  .achievement-stats {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
