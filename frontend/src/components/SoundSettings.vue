/**
 * 文件名：SoundSettings.vue
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.0.0
 * 功能描述：音效设置组件 - 提供音量控制、音效开关等功能
 * 更新记录：
 * 2026-03-29 - v1.0.0 - 初始创建，实现音效设置功能
 */

<template>
  <div class="sound-settings">
    <div class="sound-toggle" @click="toggleSettings">
      <span class="toggle-icon">{{ isMuted ? '🔇' : '🔊' }}</span>
    </div>

    <Transition name="slide-down">
      <div v-if="showSettings" class="sound-panel glass">
        <div class="panel-header">
          <h3>🔊 音效设置</h3>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="setting-icon">🔊</span>
            <span>主音量</span>
          </div>
          <div class="setting-control">
            <input
              v-model.number="masterVolume"
              type="range"
              :min="0"
              :max="1"
              :step="0.01"
              class="volume-slider"
              @input="updateMasterVolume"
            />
            <span class="volume-value"
              >{{ Math.round(masterVolume * 100) }}%</span
            >
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="setting-icon">🔉</span>
            <span>音效音量</span>
          </div>
          <div class="setting-control">
            <input
              v-model.number="soundVolume"
              type="range"
              :min="0"
              :max="1"
              :step="0.01"
              class="volume-slider"
              @input="updateSoundVolume"
            />
            <span class="volume-value"
              >{{ Math.round(soundVolume * 100) }}%</span
            >
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="setting-icon">🎵</span>
            <span>音乐音量</span>
          </div>
          <div class="setting-control">
            <input
              v-model.number="musicVolume"
              type="range"
              :min="0"
              :max="1"
              :step="0.01"
              class="volume-slider"
              @input="updateMusicVolume"
            />
            <span class="volume-value"
              >{{ Math.round(musicVolume * 100) }}%</span
            >
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="setting-icon">🎶</span>
            <span>背景音乐</span>
          </div>
          <div class="setting-control">
            <button
              class="toggle-btn"
              :class="{ active: bgMusicPlaying }"
              @click="toggleBackgroundMusic"
            >
              {{ bgMusicPlaying ? '已开启' : '已关闭' }}
            </button>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span class="setting-icon">{{ isMuted ? '🔇' : '🔈' }}</span>
            <span>全部静音</span>
          </div>
          <div class="setting-control">
            <button
              class="toggle-btn"
              :class="{ active: isMuted }"
              @click="toggleMute"
            >
              {{ isMuted ? '已静音' : '未静音' }}
            </button>
          </div>
        </div>

        <div class="presets">
          <div class="preset-label">预设音量：</div>
          <div class="preset-buttons">
            <button class="preset-btn" @click="applyPreset('full')">
              全开
            </button>
            <button class="preset-btn" @click="applyPreset('half')">
              半开
            </button>
            <button class="preset-btn" @click="applyPreset('off')">关闭</button>
          </div>
        </div>

        <div class="test-buttons">
          <button class="test-btn" @click="testSound('click')">测试点击</button>
          <button class="test-btn" @click="testSound('success')">
            测试成功
          </button>
          <button class="test-btn" @click="testSound('coin')">测试金币</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import soundManager from '../services/soundManager';

const showSettings = ref(false);
const masterVolume = ref(0.7);
const soundVolume = ref(0.7);
const musicVolume = ref(0.5);
const isMuted = ref(false);
const bgMusicPlaying = ref(false);

onMounted(() => {
  masterVolume.value = soundManager.masterVolume;
  soundVolume.value = soundManager.soundVolume;
  musicVolume.value = soundManager.musicVolume;
  isMuted.value = soundManager.isMuted;
});

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

const updateMasterVolume = () => {
  soundManager.setMasterVolume(masterVolume.value);
};

const updateSoundVolume = () => {
  soundManager.setSoundVolume(soundVolume.value);
};

const updateMusicVolume = () => {
  soundManager.setMusicVolume(musicVolume.value);
};

const toggleMute = () => {
  isMuted.value = soundManager.toggleMute();
  if (isMuted.value) {
    bgMusicPlaying.value = false;
  }
};

const toggleBackgroundMusic = () => {
  if (bgMusicPlaying.value) {
    soundManager.stopBackgroundMusic();
    bgMusicPlaying.value = false;
  } else {
    soundManager.playBackgroundMusic();
    bgMusicPlaying.value = true;
  }
};

const applyPreset = (preset) => {
  switch (preset) {
    case 'full':
      masterVolume.value = 1;
      soundVolume.value = 1;
      musicVolume.value = 0.8;
      isMuted.value = false;
      break;
    case 'half':
      masterVolume.value = 0.5;
      soundVolume.value = 0.5;
      musicVolume.value = 0.3;
      isMuted.value = false;
      break;
    case 'off':
      masterVolume.value = 0;
      soundVolume.value = 0;
      musicVolume.value = 0;
      isMuted.value = true;
      break;
  }
  soundManager.setMasterVolume(masterVolume.value);
  soundManager.setSoundVolume(soundVolume.value);
  soundManager.setMusicVolume(musicVolume.value);
  soundManager.setMuted(isMuted.value);
  if (isMuted.value) {
    bgMusicPlaying.value = false;
    soundManager.stopBackgroundMusic();
  }
};

const testSound = (soundName) => {
  soundManager.play(soundName);
};
</script>

<style scoped>
.sound-settings {
  position: relative;
}

.sound-toggle {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.toggle-icon {
  font-size: 20px;
}

.sound-panel {
  position: absolute;
  top: 50px;
  right: 0;
  width: 300px;
  padding: 20px;
  border-radius: 16px;
  z-index: 1000;
}

.panel-header h3 {
  margin: 0 0 20px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.setting-icon {
  font-size: 16px;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-slider {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.volume-value {
  min-width: 45px;
  text-align: right;
  color: var(--text-secondary);
  font-size: 14px;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toggle-btn.active {
  background: var(--primary-color);
  color: white;
}

.presets {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.preset-label {
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 14px;
}

.preset-buttons {
  display: flex;
  gap: 10px;
}

.preset-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.test-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.test-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
}

.test-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
