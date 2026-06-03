/**
 * 文件名：soundManager.js
 * 作者：开发者
 * 日期：2026-03-28
 * 版本：v1.1.0
 * 功能描述：音效管理模块 - 负责游戏音效的加载、播放、音量控制等功能
 * 更新记录：
 *   2026-03-28 - v1.0.0 - 初始创建，实现基础音效管理功能
 *   2026-03-29 - v1.1.0 - 添加音效持久化、背景音乐、更多音效类型
 */

class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.masterVolume = 0.7;
    this.soundVolume = 0.7;
    this.musicVolume = 0.5;
    this.isMuted = false;
    this.initialized = false;
    this.backgroundMusic = null;
    this.bgMusicPlaying = false;
    this.storageKey = 'happyFarm_soundSettings';

    this._loadSettings();
  }

  /**
   * 初始化音效管理器
   */
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      this.initialized = true;
      this._createDefaultSounds();
    } catch (error) {
      console.warn('音效系统初始化失败:', error);
    }
  }

  /**
   * 从localStorage加载音效设置
   */
  _loadSettings() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const settings = JSON.parse(saved);
        this.masterVolume = settings.masterVolume ?? 0.7;
        this.soundVolume = settings.soundVolume ?? 0.7;
        this.musicVolume = settings.musicVolume ?? 0.5;
        this.isMuted = settings.isMuted ?? false;
      }
    } catch (error) {
      console.warn('加载音效设置失败:', error);
    }
  }

  /**
   * 保存音效设置到localStorage
   */
  _saveSettings() {
    try {
      const settings = {
        masterVolume: this.masterVolume,
        soundVolume: this.soundVolume,
        musicVolume: this.musicVolume,
        isMuted: this.isMuted,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch (error) {
      console.warn('保存音效设置失败:', error);
    }
  }

  /**
   * 创建默认音效（使用Web Audio API生成，无需外部文件）
   */
  _createDefaultSounds() {
    this.sounds.set('plant', this._createPlantSound());
    this.sounds.set('harvest', this._createHarvestSound());
    this.sounds.set('unlock', this._createUnlockSound());
    this.sounds.set('upgrade', this._createUpgradeSound());
    this.sounds.set('click', this._createClickSound());
    this.sounds.set('success', this._createSuccessSound());
    this.sounds.set('error', this._createErrorSound());
    this.sounds.set('coin', this._createCoinSound());
    this.sounds.set('levelup', this._createLevelUpSound());
    this.sounds.set('water', this._createWaterSound());
    this.sounds.set('sell', this._createSellSound());
    this.sounds.set('buy', this._createBuySound());
    this.sounds.set('notification', this._createNotificationSound());
    this.sounds.set('wind', this._createWindSound());
  }

  /**
   * 创建种植音效
   */
  _createPlantSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(
        0.3 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    };
  }

  /**
   * 创建收获音效
   */
  _createHarvestSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523, ctx.currentTime);
      gain1.gain.setValueAtTime(
        0.4 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      gain2.gain.setValueAtTime(
        0.4 * this.soundVolume * this.masterVolume,
        ctx.currentTime + 0.1
      );
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.25);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain3.gain.setValueAtTime(
        0.4 * this.soundVolume * this.masterVolume,
        ctx.currentTime + 0.2
      );
      gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc3.start(ctx.currentTime + 0.2);
      osc3.stop(ctx.currentTime + 0.35);
    };
  }

  /**
   * 创建解锁音效
   */
  _createUnlockSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(
        0.5 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    };
  }

  /**
   * 创建升级音效
   */
  _createUpgradeSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;

      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(
          0.35 * this.soundVolume * this.masterVolume,
          ctx.currentTime + index * 0.1
        );
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + index * 0.1 + 0.2
        );
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.2);
      });
    };
  }

  /**
   * 创建点击音效
   */
  _createClickSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(
        0.15 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    };
  }

  /**
   * 创建成功音效
   */
  _createSuccessSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(
        0.4 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    };
  }

  /**
   * 创建错误音效
   */
  _createErrorSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(
        0.3 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    };
  }

  /**
   * 创建金币音效
   */
  _createCoinSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.setValueAtTime(1500, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(
        0.25 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    };
  }

  /**
   * 创建升级音效
   */
  _createLevelUpSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const notes = [262, 330, 392, 523, 659, 784];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(
          0.3 * this.soundVolume * this.masterVolume,
          ctx.currentTime + index * 0.1
        );
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + index * 0.1 + 0.3
        );
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.3);
      });
    };
  }

  /**
   * 播放音效
   * @param {string} soundName - 音效名称
   */
  play(soundName) {
    if (!this.initialized) {
      this.init();
    }

    const sound = this.sounds.get(soundName);
    if (sound) {
      sound();
    }
  }

  /**
   * 创建浇水音效
   */
  _createWaterSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
        data[i] *= Math.pow(1 - i / buffer.length, 2);
      }

      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(
        0.2 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.3);
    };
  }

  /**
   * 创建出售音效
   */
  _createSellSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;

      const notes = [784, 659, 523];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);
        gain.gain.setValueAtTime(
          0.25 * this.soundVolume * this.masterVolume,
          ctx.currentTime + index * 0.08
        );
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + index * 0.08 + 0.2
        );
        osc.start(ctx.currentTime + index * 0.08);
        osc.stop(ctx.currentTime + index * 0.08 + 0.2);
      });
    };
  }

  /**
   * 创建购买音效
   */
  _createBuySound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(
        0.3 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    };
  }

  /**
   * 创建通知音效
   */
  _createNotificationSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const notes = [880, 660, 880, 1100];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
        gain.gain.setValueAtTime(
          0.2 * this.soundVolume * this.masterVolume,
          ctx.currentTime + index * 0.1
        );
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          ctx.currentTime + index * 0.1 + 0.15
        );
        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.15);
      });
    };
  }

  /**
   * 创建风声（环境音效）
   */
  _createWindSound() {
    return () => {
      if (!this.audioContext || this.isMuted) return;

      const ctx = this.audioContext;
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(
        0.1 * this.soundVolume * this.masterVolume,
        ctx.currentTime
      );

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 1);
    };
  }

  /**
   * 设置主音量
   * @param {number} volume - 音量值（0-1）
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this._saveSettings();
    this._updateBackgroundMusicVolume();
  }

  /**
   * 设置音效音量
   * @param {number} volume - 音量值（0-1）
   */
  setSoundVolume(volume) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    this._saveSettings();
  }

  /**
   * 设置音乐音量
   * @param {number} volume - 音量值（0-1）
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this._saveSettings();
    this._updateBackgroundMusicVolume();
  }

  /**
   * 静音/取消静音
   * @param {boolean} muted - 是否静音
   */
  setMuted(muted) {
    this.isMuted = muted;
    this._saveSettings();
    if (this.bgMusicPlaying) {
      if (muted) {
        this.stopBackgroundMusic();
      } else {
        this.playBackgroundMusic();
      }
    }
  }

  /**
   * 切换静音状态
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this._saveSettings();
    if (this.bgMusicPlaying) {
      if (this.isMuted) {
        this.stopBackgroundMusic();
      } else {
        this.playBackgroundMusic();
      }
    }
    return this.isMuted;
  }

  /**
   * 播放背景音乐（循环播放）
   */
  playBackgroundMusic() {
    if (!this.initialized) {
      this.init();
    }

    if (this.isMuted || this.bgMusicPlaying) return;

    this.bgMusicPlaying = true;
    this._createBackgroundMusic();
  }

  /**
   * 停止背景音乐
   */
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
      this.backgroundMusic = null;
    }
    this.bgMusicPlaying = false;
  }

  /**
   * 创建并循环播放背景音乐
   */
  _createBackgroundMusic() {
    if (!this.audioContext || this.isMuted) return;

    const ctx = this.audioContext;
    const melodyNotes = [262, 294, 330, 349, 392, 440, 494, 523];
    let noteIndex = 0;
    let intervalId = null;

    const playNote = () => {
      if (!this.bgMusicPlaying || this.isMuted) {
        clearInterval(intervalId);
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(melodyNotes[noteIndex], ctx.currentTime);

      const volume = 0.08 * this.musicVolume * this.masterVolume;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);

      noteIndex = (noteIndex + 1) % melodyNotes.length;
    };

    playNote();
    intervalId = setInterval(playNote, 600);
    this.backgroundMusic = { stop: () => clearInterval(intervalId) };
  }

  /**
   * 更新背景音乐音量
   */
  _updateBackgroundMusicVolume() {
    // 背景音乐音量在下次播放时更新
  }

  /**
   * 获取音效资源清单
   */
  getSoundList() {
    return {
      count: this.sounds.size,
      names: Array.from(this.sounds.keys()),
      hasBackgroundMusic: true,
    };
  }
}

const soundManager = new SoundManager();

export default soundManager;
