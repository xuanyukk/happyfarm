/**
 * 文件名：soundManager.test.js
 * 作者：开发者
 * 日期：2026-03-29
 * 版本：v1.2.0
 * 功能描述：音效管理器测试
 * 更新记录：
 *   2026-03-29 - v1.0.0 - 初始创建，测试音效管理器功能
 *   2026-03-29 - v1.1.0 - 修复语法错误，更新为ES Modules
 *   2026-03-29 - v1.2.0 - 简化测试，避免语法问题
 */

import { describe, it, expect, vi } from 'vitest';
import soundManager from '@/services/soundManager';

describe('音效管理器测试', () => {
  describe('初始化', () => {
    it('应该能够初始化音效管理器', () => {
      expect(soundManager).toBeDefined();
    });
  });

  describe('音量控制', () => {
    it('应该能够设置主音量', () => {
      soundManager.setMasterVolume(0.5);
      expect(soundManager.masterVolume).toBe(0.5);
    });

    it('应该能够设置音效音量', () => {
      soundManager.setSoundVolume(0.3);
      expect(soundManager.soundVolume).toBe(0.3);
    });

    it('应该能够设置音乐音量', () => {
      soundManager.setMusicVolume(0.8);
      expect(soundManager.musicVolume).toBe(0.8);
    });

    it('音量应该限制在0-1范围内', () => {
      soundManager.setMasterVolume(-0.5);
      expect(soundManager.masterVolume).toBe(0);

      soundManager.setMasterVolume(1.5);
      expect(soundManager.masterVolume).toBe(1);
    });
  });

  describe('静音控制', () => {
    it('应该能够设置静音', () => {
      soundManager.setMuted(true);
      expect(soundManager.isMuted).toBe(true);
    });

    it('应该能够切换静音状态', () => {
      const initialState = soundManager.isMuted;
      const newState = soundManager.toggleMute();
      expect(newState).toBe(!initialState);
      expect(soundManager.isMuted).toBe(!initialState);
    });
  });
});
