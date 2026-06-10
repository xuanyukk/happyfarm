/**
 * 文件名：UserInfo.vue
 * 作者：开发者
 * 日期：2026-05-22
 * 版本：v2.11.0
 * 功能描述：用户信息组件，显示用户头像、用户名、等级信息等
 * 更新记录：
 * 2026-05-22 - v2.11.0 - 从Home.vue中拆分出独立组件
 */

<template>
  <div class="user-info">
    <div class="avatar" @click="handleAvatarClick">
      <img
        class="avatar-icon-img"
        :src="avatarSrc"
        alt="头像"
        @error="onImgError"
      />
    </div>
    <div class="user-details">
      <span class="username">{{
        playerStore.playerData?.username ||
        playerStore.playerData?.player_id ||
        '玩家'
      }}</span>
      <div class="levels-vertical">
        <div class="level-row">
          <div class="level-info">
            <img class="level-icon-img" :src="iconSrcs.level" @error="onImgError" alt="等级" />
            <span class="level-label">玩家</span>
            <span class="level-value">{{
              playerStore.playerData?.player_level || 1
            }}</span>
          </div>
        </div>
        <div class="level-row">
          <div class="level-info">
            <img class="level-icon-img" :src="iconSrcs.farm" @error="onImgError" alt="农场" />
            <span class="level-label">农场</span>
            <span class="level-value">{{
              playerStore.playerData?.farm_level || 1
            }}</span>
          </div>
        </div>
        <div class="level-row">
          <div class="level-info">
            <img class="level-icon-img" :src="iconSrcs.globe" @error="onImgError" alt="世界" />
            <span class="level-label">世界</span>
            <span class="level-value">{{
              playerStore.playerData?.world_level || 1
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlayerStore } from '../stores/player';
import { getUICommonImage } from '../utils/imagePaths';

const props = defineProps({
  onClickAvatar: {
    type: Function,
    default: null,
  },
});

const playerStore = usePlayerStore();

/** 头像图片路径 */
const avatarSrc = computed(() => {
  return getUICommonImage('icon_avatar');
});

/** 等级图标路径集合 */
const iconSrcs = computed(() => ({
  level: getUICommonImage('icon_level'),
  farm: getUICommonImage('icon_farm'),
  globe: getUICommonImage('icon_globe'),
}));

/** 图片加载失败时隐藏图片 */
function onImgError(event) {
  event.target.style.display = 'none';
}

const handleAvatarClick = () => {
  if (props.onClickAvatar) {
    props.onClickAvatar();
  }
};
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-400), var(--purple-500));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  animation: float 3s ease-in-out infinite;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.avatar:hover {
  transform: scale(1.1);
}

.avatar-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.level-icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.username {
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.levels-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.level-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
}

.level-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 200px;
}

.level-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.level-value {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.exp-bar {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.exp-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.player-exp-fill {
  background: linear-gradient(90deg, var(--success-400), var(--success-500));
  box-shadow: 0 0 8px var(--success-400);
}

.farm-exp-fill {
  background: linear-gradient(90deg, var(--primary-400), var(--primary-500));
  box-shadow: 0 0 8px var(--primary-400);
}

.world-exp-fill {
  background: linear-gradient(90deg, var(--gold-400), var(--gold-500));
  box-shadow: 0 0 8px var(--gold-400);
}

.progress-info {
  display: flex;
  flex-direction: row;
  gap: 16px;
  margin-top: 8px;
  align-items: center;
}

.progress-info .progress-text {
  font-size: 12px;
  white-space: nowrap;
}

.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style>
