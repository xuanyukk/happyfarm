/**
 * 文件名：OfflineRewardsModal.vue
 * 作者：Trae AI
 * 日期：2026-06-09
 * 版本：v1.0.0
 * 功能描述：离线收益弹窗组件 — 展示离线时长、金币和经验奖励、计算详情
 * 更新记录：
 */

<script setup>
import { ref } from 'vue';
import ActionModal from './ActionModal.vue';

/**
 * 组件配置
 */
defineOptions({
  name: 'OfflineRewardsModal',
});

/**
 * Props 定义
 */
defineProps({
  /** v-model 绑定的显示状态 */
  modelValue: {
    type: Boolean,
    default: false,
  },
  /** 离线收益数据对象 */
  offlineRewardsData: {
    type: Object,
    default: null,
  },
});

/**
 * Emits 定义
 */
const emit = defineEmits(['update:modelValue']);

// ============================================================
// 本地状态
// ============================================================

/** 是否展开计算详情 */
const showDetails = ref(false);

// ============================================================
// 事件处理
// ============================================================

/** 关闭弹窗（领取奖励） */
const close = () => {
  emit('update:modelValue', false);
};

/** 切换详情展开/收起 */
const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};
</script>

<template>
  <ActionModal
    :model-value="modelValue"
    @update:model-value="close"
    title="离线收益"
  >
    <div v-if="offlineRewardsData" class="offline-rewards-content">
      <div class="offline-icon">💤</div>
      <p class="offline-duration">
        您离开了 {{ offlineRewardsData.displayText }}
      </p>
      <div class="offline-reward-items">
        <div class="offline-reward-item">
          <span class="reward-icon">💰</span>
          <span class="reward-label">获得金币</span>
          <span class="reward-value"
            >+{{ offlineRewardsData.goldEarned }}</span
          >
        </div>
        <div class="offline-reward-item">
          <span class="reward-icon">⭐</span>
          <span class="reward-label">获得经验</span>
          <span class="reward-value"
            >+{{ offlineRewardsData.expEarned }}</span
          >
        </div>
      </div>

      <!-- 计算详情（可展开） -->
      <div
        v-if="offlineRewardsData.details"
        class="offline-details-section"
      >
        <div class="details-toggle" @click="toggleDetails">
          <span class="toggle-text">
            {{ showDetails ? '收起详情' : '查看计算详情' }}
          </span>
          <span class="toggle-icon">{{ showDetails ? '▲' : '▼' }}</span>
        </div>

        <transition name="slide-down">
          <div v-if="showDetails" class="offline-details">
            <div class="detail-item">
              <span class="detail-label">玩家等级：</span>
              <span class="detail-value">{{
                offlineRewardsData.details.playerLevel
              }}</span>
            </div>

            <div class="detail-section">
              <h4>💰 金币收益计算</h4>
              <div class="detail-item">
                <span class="detail-label">基础收益：</span>
                <span class="detail-value"
                  >{{
                    offlineRewardsData.details.goldCalculation.baseRate
                  }}/分钟</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">等级加成：</span>
                <span class="detail-value"
                  >+{{
                    offlineRewardsData.details.goldCalculation.levelBonus
                  }}/分钟</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">总计速率：</span>
                <span class="detail-value"
                  >{{
                    offlineRewardsData.details.goldCalculation.totalRate
                  }}/分钟</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">计算公式：</span>
                <span class="detail-formula">{{
                  offlineRewardsData.details.goldCalculation.formula
                }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>⭐ 经验收益计算</h4>
              <div class="detail-item">
                <span class="detail-label">基础收益：</span>
                <span class="detail-value"
                  >{{
                    offlineRewardsData.details.expCalculation.baseRate
                  }}/分钟</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">等级加成：</span>
                <span class="detail-value"
                  >+{{
                    offlineRewardsData.details.expCalculation.levelBonus
                  }}/分钟</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">总计速率：</span>
                <span class="detail-value"
                  >{{
                    offlineRewardsData.details.expCalculation.totalRate
                  }}/分钟</span
                >
              </div>
              <div class="detail-item">
                <span class="detail-label">计算公式：</span>
                <span class="detail-formula">{{
                  offlineRewardsData.details.expCalculation.formula
                }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- 操作按钮 -->
      <div class="modal-actions">
        <button class="btn btn-primary" @click="close">领取奖励</button>
      </div>
    </div>
  </ActionModal>
</template>

<style scoped>
/* OfflineRewardsModal 样式沿用 Home.vue 中 offline-* 样式定义 */
/* 主样式在 Home.vue 的 <style scoped> 中统一定义 */
</style>