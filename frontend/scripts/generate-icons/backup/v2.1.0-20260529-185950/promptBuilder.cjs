/**
 * 文件名：promptBuilder.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.1.0
 * 功能描述：UI图标Prompt构建器——针对Qwen/Qwen-Image模型优化，
 *           严格按照开心农场设计规范生成种子/道具/土地/UI元素图标
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v2.0.0 - 重构prompt模板，采用提示词.txt详细规范格式，
 *                         逐项列出画布/视角/描边/光源/投影等完整设计约束，
 *                         每种图标类型使用独立的详细模板
 *   2026-05-29 - v2.1.0 - 模型名从Qwen-Image-2512更新至Qwen/Qwen-Image
 */

const {
  ICON_SIZE,
  COMMON_STYLE,
  CROP_QUALITY,
  SEED_BAG,
  getCropQuality,
  items,
  lands,
  uiButtons,
  uiPanels,
  uiCommon
} = require("./iconData.cjs");

const NEGATIVE_PROMPT =
  "low resolution, blurry, deformed, ugly, extra elements, watermark, text error, photorealism, 3D render, hand-drawn, messy background, heavy shadow, missing outline, complex background, realistic photo";

const DEFAULT_PARAMS = {
  model: "Qwen/Qwen-Image",
  image_size: "128x128",
  num_inference_steps: 30,
  guidance_scale: 7.5,
  negative_prompt: NEGATIVE_PROMPT,
  transparent_background: true,
  response_format: "png"
};

function getDefaultParams(overrides = {}) {
  return { ...DEFAULT_PARAMS, ...overrides };
}

/**
 * 构建作物成品图标prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— 基础/经济作物成品图标通用模板
 * 注意：不推荐使用本函数生成作物成品，建议用Kolors(1-34)和FLUX(35-84)
 */
function buildCropPrompt(crop) {
  const quality = getCropQuality(crop.id);
  const qual = CROP_QUALITY[quality];

  let qualityEffect = '';
  if (quality === 'rare') {
    qualityEffect = 'purple gradient glow border, floating purple star particles';
  } else if (quality === 'top') {
    qualityEffect = 'rainbow gradient glow border, rotating holographic ring, holographic particles';
  }

  let prompt =
    `Generate a Happy Farm game ${crop.name} finished crop icon. ` +
    `Canvas: 128x128px with 112x112px content area centered, 8px safe margin. ` +
    `Perspective: front-facing flat view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px dark outline stroke. ` +
    `Lighting: top-left light source. ` +
    `Soft drop shadow below subject (offset 0,4,8, rgba(0,0,0,0.15)). ` +
    `Background: transparent with ${qual.bg} ${qual.bg_shape} backing. ` +
    `Subject: mature ${crop.name}, occupying 70%-80% of frame, showing ${crop.visual} in ${crop.color} colors.`;

  if (qualityEffect) {
    prompt += ` Special effects: ${qualityEffect}.`;
  }

  prompt += ` Single 128x128 game inventory icon with transparent background.`;

  return prompt;
}

/**
 * 构建种子图标prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— 种子图标通用模板
 */
function buildSeedPrompt(crop) {
  const quality = getCropQuality(crop.id);
  const bag = SEED_BAG[quality];

  const prompt =
    `Generate a Happy Farm game ${crop.name} seed pouch icon. ` +
    `Canvas: 128x128px with 112x112px content area centered, 8px safe margin. ` +
    `Perspective: front-facing flat view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px dark outline stroke. ` +
    `Lighting: top-left light source. ` +
    `Soft drop shadow below subject (offset 0,4,8, rgba(0,0,0,0.15)). ` +
    `Background: transparent with light green (#F1F8E9) rounded rectangle backing. ` +
    `Subject: small cloth pouch in ${bag.bag_color} color, tied with ${bag.rope} at top with a bow, occupying 70% of the frame. ` +
    `A simplified ${bag.silhouette} silhouette of ${crop.name} is printed on the front of the pouch. ` +
    `Single 128x128 game seed icon with transparent background.`;

  return prompt;
}

/**
 * 构建道具图标prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— 道具图标通用模板
 */
function buildItemPrompt(item) {
  const prompt =
    `Generate a Happy Farm game ${item.name} item icon. ` +
    `Canvas: 128x128px with 112x112px content area centered, 8px safe margin. ` +
    `Perspective: front-facing flat view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px dark outline stroke. ` +
    `Lighting: top-left light source. ` +
    `Soft drop shadow below subject (offset 0,4,8, rgba(0,0,0,0.15)). ` +
    `Background: transparent with light gray (#EEEEEE) circular backing. ` +
    `Subject: ${item.form}, colored ${item.color}, occupying 70%-80% of the frame. ` +
    `Core elements: ${item.visual}. ` +
    `Single 128x128 game item inventory icon with transparent background.`;

  return prompt;
}

/**
 * 构建土地图标prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— 土地图标通用模板
 */
function buildLandPrompt(land) {
  const prompt =
    `Generate a Happy Farm game ${land.name} land plot icon. ` +
    `Canvas: 128x128px with 112x112px content area centered, 8px safe margin. ` +
    `Perspective: top-down view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px ${land.border} outer outline stroke. ` +
    `Lighting: top-left light source. ` +
    `Soft drop shadow below subject (offset 0,4,8, rgba(0,0,0,0.15)). ` +
    `Background: transparent with light brown (#EFEBE9) rounded rectangle backing. ` +
    `Subject: ${land.visual}, main color ${land.color}. ` +
    `Core elements: ${land.visual}. ` +
    `Texture: ${land.texture} texture. ` +
    `Single 128x128 game land quality icon with transparent background.`;

  return prompt;
}

/**
 * 构建UI按钮图标prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— UI元素通用模板
 */
function buildUIButtonPrompt(btn) {
  const prompt =
    `Generate a Happy Farm game ${btn.name} button icon. ` +
    `Canvas: ${btn.size}px. ` +
    `Perspective: front-facing flat view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px dark outline stroke. ` +
    `Lighting: top-left light source. ` +
    `Soft drop shadow below subject (offset 0,4,8, rgba(0,0,0,0.15)). ` +
    `Background: transparent. ` +
    `Core elements: ${btn.visual}, warm brown circular backing. ` +
    `Single game UI button icon with transparent background.`;

  return prompt;
}

/**
 * 构建UI面板背景prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— UI面板背景规范
 */
function buildUIPanelPrompt(panel) {
  const prompt =
    `Generate a Happy Farm game ${panel.name} panel background. ` +
    `Canvas: ${panel.size}px. ` +
    `Perspective: front-facing flat view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px border stroke. ` +
    `Lighting: top-left light source. ` +
    `Rounded corners: 16px radius. ` +
    `Features: subtle gradient background with light texture, 9-slice scalable. ` +
    `Core elements: ${panel.visual}. ` +
    `Single game UI panel background with transparent background.`;

  return prompt;
}

/**
 * 构建UI通用元素prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— UI元素通用模板
 */
function buildUICommonPrompt(el) {
  const prompt =
    `Generate a Happy Farm game ${el.name} UI element icon. ` +
    `Canvas: ${el.size}px. ` +
    `Perspective: front-facing flat view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px dark outline stroke. ` +
    `Lighting: top-left light source. ` +
    `Soft drop shadow below subject (offset 0,4,8, rgba(0,0,0,0.15)). ` +
    `Background: transparent. ` +
    `Core elements: ${el.visual}. ` +
    `Single game UI element with transparent background.`;

  return prompt;
}

/**
 * 根据任务类型构建prompt
 */
function buildPrompt(task) {
  switch (task.type) {
    case "crop":
      return buildCropPrompt(task.data);
    case "seed":
      return buildSeedPrompt(task.data);
    case "item":
      return buildItemPrompt(task.data);
    case "land":
      return buildLandPrompt(task.data);
    case "ui_button":
      return buildUIButtonPrompt(task.data);
    case "ui_panel":
      return buildUIPanelPrompt(task.data);
    case "ui_common":
      return buildUICommonPrompt(task.data);
    default:
      throw new Error(`未知的图标类型: ${task.type}`);
  }
}

module.exports = {
  NEGATIVE_PROMPT,
  DEFAULT_PARAMS,
  getDefaultParams,
  buildPrompt,
  buildCropPrompt,
  buildSeedPrompt,
  buildItemPrompt,
  buildLandPrompt,
  buildUIButtonPrompt,
  buildUIPanelPrompt,
  buildUICommonPrompt
};