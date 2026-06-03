/**
 * 文件名：preloadStrategy.js
 * 作者：开发者
 * 日期：2026-05-12
 * 版本：v2.0.0
 * 功能描述：资源预加载策略 - 智能预加载关键资源提升用户体验
 * 更新记录：
 *   2026-05-12 - v1.0.0 - 初始创建，实现智能预加载功能
 *   2026-05-28 - v1.1.0 - 填充实际游戏资源路径、完善路由预加载逻辑
 *   2026-05-28 - v2.0.0 - 接入ASSET_PATHS常量、充实组件预加载逻辑、完善全部路由的预加载策略
 */

import { logger } from '../services/logger';
import { ASSET_PATHS } from './constants';

const {
  CROP_ICONS,
  SEED_ICONS,
  ITEM_ICONS,
  LAND_ICONS,
  UI_BUTTONS,
  UI_PANELS,
  UI_COMMON,
} = ASSET_PATHS;

class PreloadStrategy {
  constructor() {
    this.preloadedResources = new Set();
    this.pendingPreloads = new Map();
    this.isEnabled = true;
  }

  /**
   * 预加载关键资源（应用启动后延迟调用）
   */
  preloadCriticalResources() {
    if (!this.isEnabled) return;

    logger.info('开始预加载关键资源');

    this.preloadFarmImages();
    this.preloadCoreUI();
  }

  /**
   * 预加载农场核心图片——按钮、货币图标、土地品质、基础作物
   */
  preloadFarmImages() {
    const images = [
      `${UI_BUTTONS}ui_button_plant.png`,
      `${UI_BUTTONS}ui_button_harvest.png`,
      `${UI_BUTTONS}ui_button_water.png`,
      `${UI_BUTTONS}ui_button_fertilize.png`,
      `${UI_BUTTONS}ui_button_shop.png`,
      `${UI_BUTTONS}ui_button_bag.png`,
      `${UI_BUTTONS}ui_button_upgrade.png`,
      `${UI_COMMON}ui_icon_gold.png`,
      `${UI_COMMON}ui_icon_exp.png`,
      `${UI_COMMON}ui_icon_energy.png`,
      `${UI_COMMON}ui_icon_seed.png`,
      `${UI_COMMON}ui_frame_slot.png`,
      `${UI_COMMON}ui_frame_land_empty.png`,
      `${UI_COMMON}ui_overlay_locked.png`,
      `${UI_COMMON}ui_badge_quality.png`,
      `${LAND_ICONS}land_1.png`,
      `${LAND_ICONS}land_2.png`,
      `${LAND_ICONS}land_3.png`,
      `${LAND_ICONS}land_4.png`,
      `${UI_PANELS}ui_panel_main_bg.png`,
    ];

    images.forEach((url) => this.preloadImage(url));
  }

  /**
   * 预加载核心UI面板背景
   */
  preloadCoreUI() {
    const panels = [
      `${UI_PANELS}ui_panel_crop_detail.png`,
      `${UI_PANELS}ui_panel_item_detail.png`,
      `${UI_PANELS}ui_panel_shop_bg.png`,
      `${UI_COMMON}ui_bar_green.png`,
      `${UI_COMMON}ui_bar_yellow.png`,
      `${UI_COMMON}ui_particle_sparkle.png`,
      `${UI_COMMON}ui_particle_leaf.png`,
    ];

    panels.forEach((url) => this.preloadImage(url));
  }

  /**
   * 预加载单张图片
   * @param {string} url - 图片URL
   * @param {Function} onLoad - 加载成功回调
   * @param {Function} onError - 加载失败回调
   */
  preloadImage(url, onLoad, onError) {
    if (!this.isEnabled || this.preloadedResources.has(url)) {
      return;
    }

    if (this.pendingPreloads.has(url)) {
      return;
    }

    const img = new Image();
    this.pendingPreloads.set(url, img);

    img.onload = () => {
      this.preloadedResources.add(url);
      this.pendingPreloads.delete(url);
      logger.debug(`图片预加载成功: ${url}`);
      if (onLoad) onLoad();
    };

    img.onerror = (error) => {
      this.pendingPreloads.delete(url);
      logger.warn(`图片预加载失败: ${url}`, error);
      if (onError) onError(error);
    };

    img.src = url;
  }

  /**
   * 预加载 Vue 组件（路由懒加载预热）
   * @param {Array<() => Promise>} componentLoaders - 组件动态导入函数数组
   */
  preloadComponents(componentLoaders = []) {
    if (!this.isEnabled) return;

    componentLoaders.forEach((loader) => {
      try {
        loader()
          .then(() => {
            logger.debug('组件预加载成功');
          })
          .catch((err) => {
            logger.warn('组件预加载失败', err);
          });
      } catch (err) {
        logger.warn('组件预加载异常', err);
      }
    });
  }

  /**
   * 路由切换时预加载下一页资源
   * @param {string} routeName - 目标路由名称
   */
  preloadForRoute(routeName) {
    if (!this.isEnabled) return;

    logger.debug(`为路由预加载资源: ${routeName}`);

    const strategies = {
      shop: () => this.preloadShopResources(),
      inventory: () => this.preloadInventoryResources(),
      'currency-log': () => this.preloadCurrencyResources(),
      'queue-manager': () => this.preloadQueueResources(),
      'game-events': () => this.preloadEventResources(),
      admin: () => this.preloadAdminResources(),
    };

    const strategy = strategies[routeName];
    if (strategy) {
      strategy();
    }
  }

  /**
   * 预加载商店页面资源
   */
  preloadShopResources() {
    const images = [
      `${UI_PANELS}ui_panel_shop_bg.png`,
      `${UI_COMMON}ui_frame_slot_selected.png`,
      `${CROP_ICONS}crop_1.png`,
      `${CROP_ICONS}crop_12.png`,
      `${CROP_ICONS}crop_16.png`,
      `${CROP_ICONS}crop_19.png`,
      `${SEED_ICONS}seed_1.png`,
      `${SEED_ICONS}seed_12.png`,
      `${SEED_ICONS}seed_16.png`,
    ];
    images.forEach((url) => this.preloadImage(url));
  }

  /**
   * 预加载背包/库存页面资源
   */
  preloadInventoryResources() {
    const images = [
      `${UI_COMMON}ui_frame_slot.png`,
      `${UI_COMMON}ui_frame_slot_selected.png`,
      `${ITEM_ICONS}item_1.png`,
      `${ITEM_ICONS}item_4.png`,
      `${ITEM_ICONS}item_13.png`,
      `${ITEM_ICONS}item_14.png`,
      `${ITEM_ICONS}item_15.png`,
      `${ITEM_ICONS}item_18.png`,
    ];
    images.forEach((url) => this.preloadImage(url));
  }

  /**
   * 预加载货币日志页面资源
   */
  preloadCurrencyResources() {
    const images = [
      `${UI_COMMON}ui_icon_gold.png`,
      `${UI_COMMON}ui_icon_exp.png`,
      `${UI_PANELS}ui_panel_item_detail.png`,
    ];
    images.forEach((url) => this.preloadImage(url));
  }

  /**
   * 预加载队列管理页面资源
   */
  preloadQueueResources() {
    const images = [
      `${UI_COMMON}ui_bar_green.png`,
      `${UI_COMMON}ui_bar_yellow.png`,
      `${UI_COMMON}ui_frame_slot.png`,
    ];
    images.forEach((url) => this.preloadImage(url));
  }

  /**
   * 预加载游戏活动页面资源
   */
  preloadEventResources() {
    const images = [
      `${UI_PANELS}ui_panel_main_bg.png`,
      `${UI_COMMON}ui_icon_seed.png`,
      `${UI_COMMON}ui_icon_gold.png`,
    ];
    images.forEach((url) => this.preloadImage(url));
  }

  /**
   * 预加载后台管理页面资源
   */
  preloadAdminResources() {
    const images = [
      `${UI_PANELS}ui_panel_main_bg.png`,
      `${UI_COMMON}ui_frame_slot.png`,
      `${UI_COMMON}ui_frame_slot_selected.png`,
    ];
    images.forEach((url) => this.preloadImage(url));
  }

  /**
   * 智能预加载 - 根据用户行为预测
   * @param {string} userAction - 用户当前行为
   */
  smartPreload(userAction) {
    if (!this.isEnabled) return;

    switch (userAction) {
      case 'viewing_farm':
        this.preloadFarmImages();
        break;
      case 'viewing_shop':
        this.preloadShopResources();
        break;
    }
  }

  /**
   * 清除预加载缓存
   */
  clearPreloadCache() {
    this.preloadedResources.clear();
    this.pendingPreloads.clear();
    logger.info('预加载缓存已清除');
  }

  /**
   * 启用/禁用预加载
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    logger.info(`预加载策略已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 获取预加载状态
   * @returns {{enabled: boolean, preloadedCount: number, pendingCount: number}}
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      preloadedCount: this.preloadedResources.size,
      pendingCount: this.pendingPreloads.size,
    };
  }
}

const preloadStrategy = new PreloadStrategy();

export default preloadStrategy;
