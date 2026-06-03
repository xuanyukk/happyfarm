/**
 * 文件名：kolors-prompt-builder.cjs
 * 作者：开发者
 * 日期：2026-05-29
 * 版本：v2.1.0
 * 功能描述：基础/经济作物图标Prompt构建器——针对Qwen/Qwen-Image模型优化，
 *           严格按照开心农场设计规范生成基础/经济作物的生长阶段图和成品图标。
 *           因Kwai-Kolors/Kolors模型不支持游戏美术风格，v2.1起切换至Qwen。
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-29 - v1.1.0 - 添加成品图标(product)的prompt构建
 *   2026-05-29 - v2.0.0 - 重构prompt模板，采用提示词.txt详细规范格式
 *   2026-05-29 - v2.1.0 - 模型从Kolors切换至Qwen/Qwen-Image(游戏图标专用)，
 *                         尺寸升级至256x256(Qwen最小要求)，新增双语负向提示词，
 *                         新增transparent_background和response_format参数，
 *                         guidance_scale提升至10，prompt坐标值同步翻倍
 *
 * 设计原则：
 *   - 使用Qwen/Qwen-Image模型，原生支持游戏像素图标生成
 *   - 使用中文为主要描述语言，英文为辅助技术术语
 *   - 逐项列出画布尺寸、视角、土壤横截面、风格、描边、光源、投影等约束
 *   - 负向prompt聚焦排除非游戏风格和写实照片风格
 */

const NEGATIVE_PROMPT =
  "low resolution, blurry, deformed, ugly, extra elements, watermark, " +
  "text error, photorealism, 3D render, hand-drawn, messy background, " +
  "realistic photo, photography, complex background, " +
  "低质量,模糊,变形,坏手,坏脸,水印,文字,照片写实,3D渲染,杂乱背景";

const DEFAULT_PARAMS = {
  model: "Qwen/Qwen-Image",
  image_size: "256x256",
  num_inference_steps: 30,
  guidance_scale: 10,
  negative_prompt: NEGATIVE_PROMPT,
  transparent_background: true,
  response_format: "png"
};

const COMMON_STYLE =
  "2D vector game art, flat design with soft gradient, clean 1.5px dark outline stroke, " +
  "top-left lighting, soft drop shadow";

function getDefaultParams(overrides = {}) {
  return { ...DEFAULT_PARAMS, ...overrides };
}

/**
 * 获取各阶段画面占比描述
 * 与提示词.txt五阶段通用描述保持一致
 */
function getStageRatio(stageNum) {
  const ratios = {
    1: '画面占比10%-20%',
    2: '画面占比30%-50%',
    3: '画面占比50%-70%',
    4: '画面占比60%-80%',
    5: '画面占比80%-95%，添加金色光晕，右上角加星标'
  };
  return ratios[stageNum] || '画面占比50%-70%';
}

/**
 * 构建各阶段通用框架描述
 * 与提示词.txt中五阶段通用描述保持一致
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
 * 基础作物(ID1-ID15)：浅绿#E8F5E9，经济作物(ID16-ID34)：浅橙#FFF3E0
 */
function getBackingColor(id) {
  if (id >= 1 && id <= 15) {
    return '浅绿色(#E8F5E9)';
  }
  return '浅橙色(#FFF3E0)';
}

/**
 * 构建生长阶段prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— 基础/经济作物生长阶段通用模板
 */
function buildKolorsStagePrompt(taskData) {
  const { name, enName, stageVisual, stageNum, category, stageLabel } = taskData;
  const id = taskData.id;
  const categoryKey = taskData.category || 'default';

  const stageDesc = getStageFramework(stageNum, categoryKey);
  const ratio = getStageRatio(stageNum);
  const label = getStageLabel(stageNum);

  const prompt =
    `生成开心农场${name}(${enName})的${label}图标。` +
    `画布尺寸：256x256px，内容区域192x192px居中，四周32px安全边距。` +
    `视角：俯视45度角，植株根部位于画布坐标(128,160)位置。` +
    `底部40px显示棕色土壤横截面。` +
    `风格：${COMMON_STYLE}。` +
    `描边：1.5px深色外轮廓描边（比填充色深40%）。` +
    `光源：左上方打光，高光在左上角，阴影在右下角。` +
    `底部添加半透明椭圆形投影(rgba(0,0,0,0.2)，8px模糊)。` +
    `阶段描述：${stageDesc}，具体画面呈现为${stageVisual}。` +
    `${ratio}。` +
    `作物编号ID ${id}，分类${category}，${stageLabel}。` +
    `单张256x256像素游戏精灵图，透明背景。`;

  return prompt;
}

/**
 * 构建成品图标prompt（逐项列出设计规范）
 * 模板来源于提示词.txt —— 基础/经济作物成品图标通用模板
 */
function buildKolorsProductPrompt(taskData) {
  const { name, enName, productVisual, category } = taskData;
  const id = taskData.id;

  const backingColor = getBackingColor(id);

  const prompt =
    `生成开心农场${name}(${enName})的成品图标。` +
    `画布尺寸：256x256px，内容区域224x224px居中，16px安全边距。` +
    `视角：正面平视。` +
    `风格：${COMMON_STYLE}。` +
    `描边：2px深色外轮廓描边。` +
    `光源：顶部偏左光源。` +
    `下方添加柔和投影(0,4,8,rgba(0,0,0,0.15))。` +
    `背景：透明背景+${backingColor}圆角矩形底衬。` +
    `主体：${name}成熟形态，占画面70%-80%，具体表现为${productVisual}。` +
    `作物编号ID ${id}，分类${category}，成品图标。` +
    `单张256x256像素游戏道具图标，透明背景。`;

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