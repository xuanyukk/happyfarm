/**
 * 文件名：promptBuilder.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.2.0
 * 功能描述：UI图标Prompt构建器——针对Qwen/Qwen-Image模型优化，
 *           采用简洁自然语言描述生成种子/道具/土地/UI元素图标
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v2.0.0 - 重构prompt模板，采用提示词.txt详细规范格式
 *   2026-05-29 - v2.1.0 - 模型名从Qwen-Image-2512更新至Qwen/Qwen-Image
 *   2026-05-29 - v2.2.0 - 提示词格式重大调整：去除精确坐标/CSS参数/rgba值等
 *                         技术参数，改为简洁自然语言视觉描述。实验验证Qwen模型
 *                         对复杂技术参数处理能力弱，简洁描述生成质量显著提升。
 *                         推理步数提升至40，引导系数提升至12。
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
  "blurry, low quality, 3D, realistic, photo, photography, deformed, ugly, " +
  "extra limbs, watermark, text, logo, messy, chaotic, noise, grain, " +
  "low resolution, pixelated, distorted, bad anatomy, cartoon, anime, manga, " +
  "hand-drawn, sketch, abstract, complex background, extra elements";

const DEFAULT_PARAMS = {
  model: "Qwen/Qwen-Image",
  image_size: "128x128",
  num_inference_steps: 40,
  guidance_scale: 12,
  negative_prompt: NEGATIVE_PROMPT,
  transparent_background: true,
  response_format: "png"
};

function getDefaultParams(overrides = {}) {
  return { ...DEFAULT_PARAMS, ...overrides };
}

/**
 * 构建作物成品图标prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildCropPrompt(crop) {
  const quality = getCropQuality(crop.id);
  const qual = CROP_QUALITY[quality];

  let qualityEffect = '';
  if (quality === 'rare') {
    qualityEffect = '紫色渐变发光边框，漂浮紫色星粒';
  } else if (quality === 'top') {
    qualityEffect = '彩虹渐变发光边框，全息旋转光环，全息粒子效果';
  }

  let prompt =
    `开心农场${crop.name}成品图标，正面平视视角，` +
    `${COMMON_STYLE}，` +
    `深色外轮廓描边，左侧上方光源，` +
    `底部柔和投影，` +
    `成熟${crop.name}占画面70%-80%，${crop.color}色调，` +
    `表现为${crop.visual}，` +
    `透明背景加${qual.bg}${qual.bg_shape}底衬`;

  if (qualityEffect) {
    prompt += `，特效：${qualityEffect}`;
  }

  prompt += `，单张128x128游戏道具图标`;

  return prompt;
}

/**
 * 构建种子图标prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildSeedPrompt(crop) {
  const quality = getCropQuality(crop.id);
  const bag = SEED_BAG[quality];

  const prompt =
    `开心农场${crop.name}种子袋图标，正面平视视角，` +
    `${COMMON_STYLE}，` +
    `深色外轮廓描边，左侧上方光源，` +
    `底部柔和投影，` +
    `透明背景加浅绿色(#F1F8E9)圆角矩形底衬，` +
    `${bag.bag_color}色小布袋，${bag.rope}绳扎口带蝴蝶结，占据画面70%，` +
    `袋子正面印有${bag.silhouette}轮廓的${crop.name}剪影，` +
    `单张128x128游戏种子图标`;

  return prompt;
}

/**
 * 构建道具图标prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildItemPrompt(item) {
  const prompt =
    `开心农场${item.name}道具图标，正面平视视角，` +
    `${COMMON_STYLE}，` +
    `深色外轮廓描边，左侧上方光源，` +
    `底部柔和投影，` +
    `透明背景加浅灰色(#EEEEEE)圆形底衬，` +
    `${item.form}形态，${item.color}色调，占据画面70%-80%，` +
    `核心元素为${item.visual}，` +
    `单张128x128游戏道具图标`;

  return prompt;
}

/**
 * 构建土地图标prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildLandPrompt(land) {
  const prompt =
    `开心农场${land.name}土地图标，俯视视角，` +
    `${COMMON_STYLE}，` +
    `${land.border}色外轮廓描边，左侧上方光源，` +
    `底部柔和投影，` +
    `透明背景加浅棕色(#EFEBE9)圆角矩形底衬，` +
    `${land.color}色调，${land.texture}纹理，` +
    `表现为${land.visual}，` +
    `单张128x128游戏土地品质图标`;

  return prompt;
}

/**
 * 构建UI按钮图标prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildUIButtonPrompt(btn) {
  const prompt =
    `开心农场${btn.name}按钮图标，正面平视视角，` +
    `${COMMON_STYLE}，` +
    `深色外轮廓描边，左侧上方光源，` +
    `底部柔和投影，` +
    `核心元素为${btn.visual}，暖棕色圆形底衬，` +
    `透明背景`;

  return prompt;
}

/**
 * 构建UI面板背景prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildUIPanelPrompt(panel) {
  const prompt =
    `开心农场${panel.name}面板背景，正面平视视角，` +
    `${COMMON_STYLE}，` +
    `边框描边，` +
    `16px圆角，` +
    `细腻渐变背景带浅纹理，九宫格可拉伸，` +
    `表现为${panel.visual}，` +
    `透明背景`;

  return prompt;
}

/**
 * 构建UI通用元素prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildUICommonPrompt(el) {
  const prompt =
    `开心农场${el.name}UI元素图标，正面平视视角，` +
    `${COMMON_STYLE}，` +
    `深色外轮廓描边，左侧上方光源，` +
    `底部柔和投影，` +
    `核心元素为${el.visual}，` +
    `透明背景`;

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