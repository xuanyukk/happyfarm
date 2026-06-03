/**
 * 文件名：flux-prompt-builder.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.0.0
 * 功能描述：FLUX特效作物Prompt构建器——针对FLUX.1-Kontext-dev模型优化的英文绘图提示词，
 *           严格按照开心农场设计规范生成稀有/顶级作物的生长阶段图和特效成品图标
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v2.0.0 - 重构prompt模板，采用提示词.txt详细规范格式，
 *                         逐项列出画布/视角/描边/光源/投影等完整设计约束，
 *                         精确还原发光、光晕、粒子、旋转光环等高级特效，
 *                         提升生成图片的规范一致性和视觉品质
 *
 * 设计原则：
 *   - FLUX模型擅长理解详细的自然语言描述
 *   - 特效描述需精确量化（颜色、强度、范围）
 *   - 使用英文prompt获得最佳生成质量
 *   - 负向prompt使用中英双语双重约束
 */

const NEGATIVE_PROMPT =
  "low quality, blurry, deformed, extra limbs, bad hands, bad face, watermark, text, photo, realistic photo, " +
  "cluttered, overexposed, underexposed, non-game art style, overly flat, no outline, " +
  "低质量,模糊,变形,多余肢体,坏手,坏脸,水印,文字,照片,真人,杂乱,过曝,欠曝,非游戏美术风格,扁平化过度,无描边";

const DEFAULT_PARAMS = {
  model: "black-forest-labs/FLUX.1-Kontext-dev",
  image_size: "128x128",
  num_inference_steps: 35,
  guidance_scale: 8.0,
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
 * 与提示词.txt稀有/顶级作物五阶段描述保持一致
 */
function getStageRatio(stageNum) {
  const ratios = {
    1: 'subject occupies 10%-20% of the frame',
    2: 'subject occupies 30%-50% of the frame',
    3: 'subject occupies 50%-70% of the frame',
    4: 'subject occupies 60%-80% of the frame',
    5: 'subject occupies 80%-95% of the frame, golden star mark at top right corner'
  };
  return ratios[stageNum] || 'subject occupies 50%-70% of the frame';
}

/**
 * 获取稀有作物各阶段通用框架描述（英文）
 * 与提示词.txt稀有作物五阶段通用描述保持一致
 */
function getRareStageFramework(stageNum, glowColor) {
  const frameworks = {
    1: `${glowColor} glowing light particles emerging from the dark soil, floating upwards gently`,
    2: `${glowColor} glow aura expanding around the area, young crop form beginning to materialize within the light`,
    3: `${glowColor} luminous pillar of light shooting upward from the soil, crop form becoming clearer and more defined`,
    4: `the ${glowColor} light pillar condensing into the core crop form, energy concentrating at the center`,
    5: `radiant ${glowColor} light bursting outward, the fully mature crop suspended within a glowing halo ring`
  };
  return frameworks[stageNum] || frameworks[1];
}

/**
 * 获取顶级作物各阶段通用框架描述（英文）
 * 与提示词.txt顶级作物五阶段通用描述保持一致
 */
function getTopStageFramework(stageNum) {
  const frameworks = {
    1: 'rainbow-colored light particles emerging from the dark soil, floating upwards with holographic shimmer',
    2: 'rainbow glow aura expanding around the area, young crop form beginning to materialize within the multicolored light',
    3: 'rainbow luminous pillar of light shooting skyward from the soil, crop form becoming clearer within the prismatic energy',
    4: 'the rainbow light pillar condensing into the core crop form, energy concentrating with rotating holographic ring forming',
    5: 'radiant rainbow light bursting outward, the fully mature crop suspended within a rotating holographic ring of pure energy'
  };
  return frameworks[stageNum] || frameworks[1];
}

/**
 * 确定底衬颜色与特效描述
 * 与提示词.txt品质对应规则保持一致
 */
function getQualityBackingAndEffect(quality, cropVisual) {
  const mappings = {
    '稀有': {
      backing: 'light purple (#F3E5F5) rounded rectangle backing',
      effect: 'purple gradient glow border (#9400D3), floating purple star particles, purple light beam effect'
    },
    '稀有+': {
      backing: 'light purple (#F3E5F5) rounded rectangle backing',
      effect: 'blue gradient glow border (#4169E1), floating blue light dot particles, blue light beam effect'
    },
    '极稀有': {
      backing: 'light gold (#FFFDE7) rounded rectangle backing with dark ornate pattern',
      effect: 'golden gradient glow border (#FFD700), floating golden stream particles, golden light beam effect'
    },
    '顶级': {
      backing: 'light gold (#FFFDE7) rounded rectangle backing with dark ornate pattern',
      effect: 'rainbow gradient glow border, rotating holographic ring surrounding the subject, holographic particles shimmering outward'
    }
  };
  return mappings[quality] || mappings['稀有'];
}

/**
 * 构建生长阶段prompt（逐项列出设计规范 + 特效描述）
 * 模板来源于提示词.txt —— 稀有/顶级作物生长阶段通用模板
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
    effectDesc = 'rainbow gradient glow aura, rotating holographic ring, holographic particle effects';
  }

  const prompt =
    `A 128x128 pixel game sprite for Happy Farm mobile game, generating ${name}(${enName}) growth stage icon. ` +
    `Canvas: 128x128px with 96x96px content area centered, 16px safe margin on all sides. ` +
    `Perspective: isometric 45-degree top-down view, plant root positioned at canvas coordinate (64,80). ` +
    `Bottom 20px area shows dark brown soil cross-section. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 1.5px dark outline stroke (40% darker than fill color). ` +
    `Lighting: top-left directional lighting, highlights on upper-left, shadows on bottom-right. ` +
    `Bottom has a semi-transparent elliptical drop shadow (rgba(0,0,0,0.2), 8px blur). ` +
    `Stage description: ${stageFramework}, specifically showing ${stageVisual}. ` +
    `${ratio}. ` +
    `Special effects: ${effectDesc}. ` +
    `Crop ID ${id}: ${name}(${enName}), ${quality} quality tier, stage ${stageNum}. ` +
    `Single 128x128 game sprite on transparent background.`;

  return prompt;
}

/**
 * 构建成品图标prompt（逐项列出设计规范 + 特效描述）
 * 模板来源于提示词.txt —— 稀有/顶级作物成品图标通用模板
 */
function buildProductIconPrompt(taskData) {
  const { name, enName, productVisual, quality } = taskData;
  const id = taskData.id;

  const { backing, effect } = getQualityBackingAndEffect(quality, productVisual);

  const prompt =
    `A 128x128 pixel game item icon for Happy Farm mobile game, generating ${name}(${enName}) finished product icon. ` +
    `Canvas: 128x128px with 112x112px content area centered, 8px safe margin on all sides. ` +
    `Perspective: front-facing flat view. ` +
    `Style: ${COMMON_STYLE}. ` +
    `Outline: 2px dark outline stroke. ` +
    `Lighting: top-left directional light source. ` +
    `Soft drop shadow below the subject (offset 0,4,8, rgba(0,0,0,0.15)). ` +
    `Background: transparent background with ${backing} behind the subject. ` +
    `Subject: mature ${name}(${enName}), occupying 70%-80% of the frame, specifically showing ${productVisual}. ` +
    `Special effects: ${effect}. ` +
    `Crop ID ${id}: ${name}(${enName}), ${quality} quality tier finished product icon. ` +
    `Single 128x128 game inventory icon on transparent background.`;

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