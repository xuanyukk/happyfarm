/**
 * 文件名：ProfileModal.vue
 * 作者：Trae AI
 * 日期：2026-06-09
 * 版本：v1.0.0
 * 功能描述：个人中心弹窗组件 — 展示玩家等级、资产、进度和账户信息
 * 更新记录：
 */

<script setup>
import { computed } from 'vue';
import { usePlayerStore } from '../stores/player';
import ActionModal from './ActionModal.vue';

/**
 * 组件配置
 */
defineOptions({
  name: 'ProfileModal',
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
});

/**
 * Emits 定义
 */
const emit = defineEmits([
  'update:modelValue',
  'openAvatarSelector',
]);

const playerStore = usePlayerStore();

// ============================================================
// 计算属性
// ============================================================

/** 当前玩家头像 emoji */
const playerAvatar = computed(() => {
  return playerStore.currentAvatar || '👤';
});

// ============================================================
// 工具函数
// ============================================================

/**
 * 格式化日期字符串为 YYYY-MM-DD HH:mm
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// ============================================================
// 事件处理
// ============================================================

/** 关闭弹窗 */
const close = () => {
  emit('update:modelValue', false);
};

/** 打开头像选择器 */
const openAvatarSelector = () => {
  emit('openAvatarSelector');
};
</script>

<template>
  <ActionModal :model-value="modelValue" @update:model-value="close" title="个人中心">
    <div class="profile-content">
      <!-- 头像和基本信息 -->
      <div class="profile-header">
        <div class="profile-avatar" @click="openAvatarSelector">
          <span class="avatar-icon-large">{{ playerAvatar }}</span>
          <span class="avatar-edit-hint">点击更换</span>
        </div>
        <div class="profile-name-info">
          <h2 class="profile-username">
            {{ playerStore.playerData?.username || '玩家' }}
          </h2>
          <p class="profile-player-id">
            ID: {{ playerStore.playerData?.player_id || '-' }}
          </p>
          <p class="profile-join-date">
            加入时间：{{ formatDate(playerStore.playerData?.created_at) }}
          </p>
        </div>
      </div>

      <!-- 等级信息 -->
      <div class="profile-section">
        <h3 class="section-title">📊 等级信息</h3>
        <div class="level-cards">
          <div class="level-card player-level-card">
            <div class="card-icon">⭐</div>
            <div class="card-info">
              <span class="card-label">玩家等级</span>
              <span class="card-value">{{
                playerStore.playerData?.player_level || 1
              }}</span>
            </div>
          </div>
          <div class="level-card farm-level-card">
            <div class="card-icon">🏠</div>
            <div class="card-info">
              <span class="card-label">农场等级</span>
              <span class="card-value">{{
                playerStore.playerData?.farm_level || 1
              }}</span>
            </div>
          </div>
          <div class="level-card world-level-card">
            <div class="card-icon">🌍</div>
            <div class="card-info">
              <span class="card-label">世界等级</span>
              <span class="card-value">{{
                playerStore.playerData?.world_level || 1
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 资产信息 -->
      <div class="profile-section">
        <h3 class="section-title">💰 资产信息</h3>
        <div class="currency-card">
          <div class="currency-icon-large">💰</div>
          <div class="currency-info">
            <span class="currency-label">农场币</span>
            <span class="currency-value-large">{{
              playerStore.playerData?.currency_num || 0
            }}</span>
          </div>
        </div>
      </div>

      <!-- 进度信息 -->
      <div v-if="playerStore.levelProgress" class="profile-section">
        <h3 class="section-title">📈 进度信息</h3>
        <div class="progress-cards">
          <div class="progress-card">
            <div class="progress-header">
              <span
                >⭐ Lv.{{ playerStore.levelProgress.playerLevel }}
                {{ playerStore.levelProgress.playerExpProgress }} /
                {{ playerStore.levelProgress.playerExpNeeded }} EXP</span
              >
            </div>
            <div class="progress-bar-small">
              <div
                class="progress-fill-small player-progress"
                :style="{
                  width:
                    playerStore.levelProgress.playerProgressPercent + '%',
                }"
              ></div>
            </div>
          </div>
          <div class="progress-card">
            <div class="progress-header">
              <span
                >🏠 Lv.{{ playerStore.levelProgress.farmLevel }} 农场经验
                {{ playerStore.levelProgress.farmExpProgress }} /
                {{ playerStore.levelProgress.farmExpNeeded }} EXP</span
              >
            </div>
            <div class="progress-bar-small">
              <div
                class="progress-fill-small farm-progress"
                :style="{
                  width: playerStore.levelProgress.farmProgressPercent + '%',
                }"
              ></div>
            </div>
          </div>
          <div class="progress-card">
            <div class="progress-header">
              <span
                >🌍 Lv.{{ playerStore.levelProgress.worldLevel }} 世界经验
                {{ playerStore.levelProgress.worldExpProgress }} /
                {{ playerStore.levelProgress.worldExpNeeded }} EXP</span
              >
            </div>
            <div class="progress-bar-small">
              <div
                class="progress-fill-small world-progress"
                :style="{
                  width: playerStore.levelProgress.worldProgressPercent + '%',
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 账户信息 -->
      <div class="profile-section">
        <h3 class="section-title">📋 账户信息</h3>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">玩家ID</span>
            <span class="info-value">{{
              playerStore.playerData?.player_id || '-'
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后更新</span>
            <span class="info-value">{{
              formatDate(playerStore.playerData?.updated_at)
            }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="modal-actions">
        <button class="btn btn-primary" @click="close">关闭</button>
      </div>
    </div>
  </ActionModal>
</template>

<style scoped>
/* ProfileModal 样式沿用 Home.vue 中 profile-* 样式定义 */
/* 主样式在 Home.vue 的 <style scoped> 中统一定义 */
</style>