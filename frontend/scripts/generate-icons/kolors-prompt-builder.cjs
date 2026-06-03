/**
 * 文件名：kolors-prompt-builder.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.2.0
 * 功能描述：基础/经济作物图标Prompt构建器——针对Qwen/Qwen-Image模型优化，
 *           采用简洁自然语言描述生成基础/经济作物的生长阶段图和成品图标。
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v1.1.0 - 添加成品图标(product)的prompt构建
 *   2026-05-29 - v2.0.0 - 重构prompt模板，采用提示词.txt详细规范格式
 *   2026-05-29 - v2.1.0 - 模型从Kolors切换至Qwen/Qwen-Image(游戏图标专用)，
 *                         尺寸升级至256x256(Qwen最小要求)，新增双语负向提示词
 *   2026-05-29 - v2.2.0 - 提示词格式重大调整：去除精确坐标/CSS参数/rgba值等
 *                         技术参数，改为简洁自然语言视觉描述。实验验证Qwen模型
 *                         对复杂技术参数处理能力弱，简洁描述生成质量显著提升。
 *                         推理步数提升至40，引导系数提升至12。
 *
 * 设计原则：
 *   - Qwen/Qwen-Image 不擅长精确坐标/CSS参数，使用自然语言视觉描述
 *   - 中文为主，简洁明了，避免超过200字
 *   - 聚焦核心视觉元素：风格、描边、光源、土壤、阶段描述
 */

const NEGATIVE_PROMPT =
  "blurry, low quality, 3D, realistic, photo, photography, deformed, ugly, " +
  "extra limbs, watermark, text, logo, messy, chaotic, noise, grain, " +
  "low resolution, pixelated, distorted, bad anatomy, cartoon, anime, manga, " +
  "hand-drawn, sketch, abstract, complex background, extra elements";

const DEFAULT_PARAMS = {
  model: "Qwen/Qwen-Image",
  image_size: "256x256",
  num_inference_steps: 40,
  guidance_scale: 12,
  negative_prompt: NEGATIVE_PROMPT,
  transparent_background: true,
  response_format: "png"
};

const COMMON_STYLE =
  "游戏图标，2D矢量艺术风格，简约设计，深色轮廓描边，左上方光源，柔和阴影，透明背景";

function getDefaultParams(overrides = {}) {
  return { ...DEFAULT_PARAMS, ...overrides };
}

/**
 * 获取各阶段画面占比描述
 */
function getStageRatio(stageNum) {
  const ratios = {
    1: '画面占比10%-20%',
    2: '画面占比30%-50%',
    3: '画面占比50%-70%',
    4: '画面占比60%-80%',
    5: '画面占比80%-95%，金色光晕，右上角星标'
  };
  return ratios[stageNum] || '画面占比50%-70%';
}

/**
 * 构建各阶段通用框架描述
 */
function getStageFramework(stageNum, category) {
  const frameworks = {
    1: {
      default: '土壤中冒出2-3片浅绿色小嫩芽',
      root: '土壤中冒出2-3片浅绿色小嫩芽，根部开始在土中生长',
      vine: '土壤中冒出藤蔓幼苗，旁边有小支架支撑',
      tree: '土壤中冒出细长树苗，顶部2-3片嫩叶'
    },
    2: {
      default: '茎叶快速展开，植株长高',
      root: '茎叶快速展开，地上部分和地下根部同步发育',
      vine: '藤蔓开始沿支架攀爬，叶片展开',
      tree: '树干增粗，叶片增多形成小型树冠'
    },
    3: {
      default: '植株繁茂，花朵开放或叶丛茂盛',
      root: '地上茎叶繁茂开花，土壤横截面可见根部开始膨大',
      vine: '藤蔓布满支架中下部，花朵出现',
      tree: '树冠满花开放'
    },
    4: {
      default: '花朵谢落，幼果或可食用部分初现',
      root: '地上茎叶开始变黄，土壤横截面可见根部明显膨大，土壤表面微裂',
      vine: '藤蔓上悬挂的幼果变大',
      tree: '树冠中花落结果，小果实点缀枝头'
    },
    5: {
      default: '完全成熟，可采收，植株达到最大',
      root: '地上茎叶枯萎变黄，土壤横截面露出成熟的根部',
      vine: '藤蔓布满支架，果实完全成熟悬挂',
      tree: '树冠中硕果累累，果实成熟颜色鲜艳'
    }
  };

  const stageFramework = frameworks[stageNum];
  if (!stageFramework) return frameworks[1].default;
  return stageFramework[category] || stageFramework.default;
}

/**
 * 获取各阶段名称标签（中文）
 */
function getStageLabel(stageNum) {
  const labels = {
    1: '幼苗期(stage_1)',
    2: '生长期(stage_2)',
    3: '开花期(stage_3)',
    4: '结果期(stage_4)',
    5: '成熟期(stage_5)'
  };
  return labels[stageNum] || `阶段${stageNum}`;
}

/**
 * 确定底衬颜色
 */
function getBackingColor(id) {
  if (id >= 1 && id <= 15) {
    return '浅绿色(#E8F5E9)';
  }
  return '浅橙色(#FFF3E0)';
}

/**
 * 构建生长阶段prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildKolorsStagePrompt(taskData) {
  const { name, enName, stageVisual, stageNum, category, stageLabel } = taskData;
  const id = taskData.id;
  const categoryKey = taskData.category || 'default';

  const stageDesc = getStageFramework(stageNum, categoryKey);
  const ratio = getStageRatio(stageNum);
  const label = getStageLabel(stageNum);

  const prompt =
    `${name}(${enName})${label}图标，` +
    `俯视45度视角，根部在画面中下方棕色土壤横截面上，` +
    `${COMMON_STYLE}，` +
    `${stageDesc}，具体表现为${stageVisual}，` +
    `${ratio}，` +
    `底部有柔和椭圆形投影投射在土壤上，` +
    `单张游戏精灵图`;

  return prompt;
}

/**
 * 构建成品图标prompt（简洁自然语言格式）
 * v2.2.0: 去除精确坐标/CSS参数，改用自然语言视觉描述
 */
function buildKolorsProductPrompt(taskData) {
  const { name, enName, productVisual, category } = taskData;
  const id = taskData.id;
  const backingColor = getBackingColor(id);

  const prompt =
    `${name}(${enName})成品图标，` +
    `正面平视视角，` +
    `成熟${name}占据画面70%-80%，具体表现为${productVisual}，` +
    `左侧上方光源，底部有柔和投影，深色外轮廓描边，` +
    `透明背景加${backingColor}圆角矩形底衬，` +
    `单张游戏道具图标`;

  return prompt;
}

function buildKolorsPrompt(task) {
  if (task.type === 'growth_stage') {
    return buildKolorsStagePrompt(task.data);
  } else if (task.type === 'product') {
    return buildKolorsProductPrompt(task.data);
  }
  throw new Error(`未知的Kolors任务类型: ${task.type}`);
}

module.exports = {
  NEGATIVE_PROMPT,
  DEFAULT_PARAMS,
  getDefaultParams,
  buildKolorsPrompt,
  buildKolorsStagePrompt,
  buildKolorsProductPrompt
};