/**
 * 文件名：flux-prompt-builder.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.1.0
 * 功能描述：FLUX特效作物Prompt构建器——针对FLUX.1-Kontext-dev模型优化，
 *           采用简洁英文绘图提示词生成稀有/顶级作物的生长阶段图和特效成品图标
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v2.0.0 - 重构prompt模板，采用提示词.txt详细规范格式
 *   2026-05-29 - v2.1.0 - 简化过度的技术参数（坐标/CSS值），保留核心特效描述，
 *                         FLUX模型对清晰视觉描述理解良好，无需精确像素级约束。
 *                         推理步数提升至40，引导系数提升至10。
 *
 * 设计原则：
 *   - FLUX擅长高质量游戏美术和特效还原
 *   - 使用英文简洁描述获得最佳生成质量
 *   - 特效描述需精确量化（颜色、强度、范围）
 */

const NEGATIVE_PROMPT =
  "low quality, blurry, deformed, extra limbs, bad hands, bad face, watermark, " +
  "text, photo, realistic photo, cluttered, overexposed, underexposed, " +
  "non-game art style, no outline, messy background";

const DEFAULT_PARAMS = {
  model: "black-forest-labs/FLUX.1-Kontext-dev",
  image_size: "128x128",
  num_inference_steps: 40,
  guidance_scale: 10,
  negative_prompt: NEGATIVE_PROMPT
};

const COMMON_STYLE =
  "2D vector game art, flat design with soft gradient shading, " +
  "clean 2px dark outline stroke, top-left lighting, soft drop shadow";

function getDefaultParams(overrides = {}) {
  return { ...DEFAULT_PARAMS, ...overrides };
}

/**
 * 获取各阶段画面占比描述
 */
function getStageRatio(stageNum) {
  const ratios = {
    1: 'subject occupies 10%-20% of frame',
    2: 'subject occupies 30%-50% of frame',
    3: 'subject occupies 50%-70% of frame',
    4: 'subject occupies 60%-80% of frame',
    5: 'subject occupies 80%-95% of frame, golden star mark at top right'
  };
  return ratios[stageNum] || 'subject occupies 50%-70% of frame';
}

/**
 * 稀有作物各阶段通用框架（英文）
 */
function getRareStageFramework(stageNum, glowColor) {
  const frameworks = {
    1: `${glowColor} glowing light particles emerging from dark soil`,
    2: `${glowColor} glow aura expanding, young crop form materializing within light`,
    3: `${glowColor} luminous pillar shooting upward from soil, crop form becoming defined`,
    4: `${glowColor} light pillar condensing into core crop form, energy concentrating`,
    5: `radiant ${glowColor} light bursting outward, mature crop within glowing halo ring`
  };
  return frameworks[stageNum] || frameworks[1];
}

/**
 * 顶级作物各阶段通用框架（英文）
 */
function getTopStageFramework(stageNum) {
  const frameworks = {
    1: 'rainbow-colored light particles emerging from dark soil, holographic shimmer',
    2: 'rainbow glow aura expanding, young crop form materializing within multicolored light',
    3: 'rainbow luminous pillar shooting skyward, crop form becoming clearer within prismatic energy',
    4: 'rainbow light pillar condensing into core form, rotating holographic ring forming',
    5: 'radiant rainbow light bursting, mature crop within rotating holographic ring'
  };
  return frameworks[stageNum] || frameworks[1];
}

/**
 * 确定底衬颜色与特效描述
 */
function getQualityBackingAndEffect(quality, cropVisual) {
  const mappings = {
    '稀有': {
      backing: 'light purple rounded rectangle backing',
      effect: 'purple gradient glow border, floating purple star particles, purple light beam'
    },
    '稀有+': {
      backing: 'light purple rounded rectangle backing',
      effect: 'blue gradient glow border, floating blue light dot particles, blue light beam'
    },
    '极稀有': {
      backing: 'light gold rounded rectangle backing with ornate pattern',
      effect: 'golden gradient glow border, floating golden particles, golden light beam'
    },
    '顶级': {
      backing: 'light gold rounded rectangle backing with ornate pattern',
      effect: 'rainbow gradient glow border, rotating holographic ring, holographic particles'
    }
  };
  return mappings[quality] || mappings['稀有'];
}

/**
 * 构建生长阶段prompt（简洁格式 + 特效描述）
 * v2.1.0: 简化过度的像素级约束，保留核心视觉描述
 */
function buildGrowthStagePrompt(taskData) {
  const { name, enName, stageVisual, stageNum, effects, quality } = taskData;
  const id = taskData.id;
  const isTopTier = quality === '顶级';

  let stageFramework;
  if (isTopTier) {
    stageFramework = getTopStageFramework(stageNum);
  } else {
    stageFramework = getRareStageFramework(stageNum, effects.glowColor || 'mystical');
  }

  const ratio = getStageRatio(stageNum);
  let effectDesc = effects.fullEffect || effects.glow;

  if (stageNum >= 5 && effects.ring) {
    effectDesc += `, ${effects.ring}`;
  }
  if (isTopTier) {
    effectDesc = 'rainbow gradient glow aura, rotating holographic ring, holographic particles';
  }

  const prompt =
    `${name}(${enName}) growth stage icon, ` +
    `isometric 45-degree top-down view over dark brown soil cross-section, ` +
    `${COMMON_STYLE}, ` +
    `semi-transparent elliptical shadow on soil below plant, ` +
    `${stageFramework}, showing ${stageVisual}, ` +
    `${ratio}, ` +
    `special effects: ${effectDesc}, ` +
    `${quality} quality crop, stage ${stageNum} game sprite on transparent background`;

  return prompt;
}

/**
 * 构建成品图标prompt（简洁格式 + 特效描述）
 * v2.1.0: 简化过度的像素级约束，保留核心视觉描述
 */
function buildProductIconPrompt(taskData) {
  const { name, enName, productVisual, quality } = taskData;
  const id = taskData.id;

  const { backing, effect } = getQualityBackingAndEffect(quality, productVisual);

  const prompt =
    `${name}(${enName}) finished product icon, ` +
    `front-facing flat view, ` +
    `${COMMON_STYLE}, ` +
    `soft drop shadow below subject, ` +
    `transparent background with ${backing}, ` +
    `mature ${name} occupying 70%-80% of frame, showing ${productVisual}, ` +
    `special effects: ${effect}, ` +
    `${quality} quality, game inventory icon on transparent background`;

  return prompt;
}

/**
 * 根据任务类型构建FLUX prompt
 */
function buildFluxPrompt(task) {
  switch (task.type) {
    case 'growth_stage':
      return buildGrowthStagePrompt(task.data);
    case 'product_icon':
      return buildProductIconPrompt(task.data);
    default:
      throw new Error(`未知的FLUX任务类型: ${task.type}`);
  }
}

module.exports = {
  NEGATIVE_PROMPT,
  DEFAULT_PARAMS,
  getDefaultParams,
  buildFluxPrompt,
  buildGrowthStagePrompt,
  buildProductIconPrompt
};