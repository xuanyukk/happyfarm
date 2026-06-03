/**
 * 文件名：imagePaths.js
 * 作者：开发者
 * 日期：2026-05-30
 * 版本：v1.0.0
 * 功能描述：图片路径工具——从游戏数据ID映射到 public/assets/ 下的实际PNG路径
 *          替代 emoji 占位符，使用真实PNG-24图片
 * 更新记录：
 *   2026-05-30 - v1.0.0 - 初始创建
 */

import { ASSET_PATHS } from './constants';

const FALLBACK_CROP = '/assets/crops/stages/1_stage_1.png';
const FALLBACK_CROP_ICON = '/assets/icons/crops/crop_1.png';
const FALLBACK_SEED = '/assets/icons/seeds/seed_1.png';
const FALLBACK_ITEM = '/assets/icons/items/item_1.png';
const FALLBACK_LAND = '/assets/icons/land/land_1.png';

export const getCropStageImage = function (cropId, stage, fallback = true) {
  const id = parseInt(cropId) || 1;
  const s = parseInt(stage) || 1;
  const path = `${ASSET_PATHS.CROP_STAGES}${id}_stage_${s}.png`;
  return path;
};

export const getCropIconImage = function (cropId) {
  const id = parseInt(cropId) || 1;
  return `${ASSET_PATHS.CROP_ICONS}crop_${id}.png`;
};

export const getSeedIconImage = function (seedId) {
  const id = parseInt(seedId) || 1;
  return `${ASSET_PATHS.SEED_ICONS}seed_${id}.png`;
};

export const getItemIconImage = function (itemId) {
  const id = parseInt(itemId) || 1;
  return `${ASSET_PATHS.ITEM_ICONS}item_${id}.png`;
};

export const getLandIconImage = function (qualityId) {
  const id = parseInt(qualityId) || 1;
  return `${ASSET_PATHS.LAND_ICONS}land_${id}.png`;
};

export const getUIButtonImage = function (buttonName) {
  return `${ASSET_PATHS.UI_BUTTONS}ui_button_${buttonName}.png`;
};

export const getUIPanelImage = function (panelName) {
  return `${ASSET_PATHS.UI_PANELS}ui_panel_${panelName}.png`;
};

export const getUICommonImage = function (commonName) {
  return `${ASSET_PATHS.UI_COMMON}ui_${commonName}.png`;
};

export const getEmptyStateImage = function (type) {
  const mapping = {
    seeds: `${ASSET_PATHS.UI_COMMON}ui_empty_seeds.png`,
    crops: `${ASSET_PATHS.UI_COMMON}ui_empty_crops.png`,
    items: `${ASSET_PATHS.UI_COMMON}ui_empty_items.png`,
    events: `${ASSET_PATHS.UI_COMMON}ui_empty_events.png`,
    logs: `${ASSET_PATHS.UI_COMMON}ui_empty_logs.png`,
    default: `${ASSET_PATHS.UI_COMMON}ui_empty_default.png`,
  };
  return mapping[type] || mapping.default;
};

export const getFallbackImage = function (type) {
  const fallbacks = {
    crop: FALLBACK_CROP,
    crop_icon: FALLBACK_CROP_ICON,
    seed: FALLBACK_SEED,
    item: FALLBACK_ITEM,
    land: FALLBACK_LAND,
  };
  return fallbacks[type] || FALLBACK_CROP;
};

export default {
  getCropStageImage,
  getCropIconImage,
  getSeedIconImage,
  getItemIconImage,
  getLandIconImage,
  getUIButtonImage,
  getUIPanelImage,
  getUICommonImage,
  getEmptyStateImage,
  getFallbackImage,
};
