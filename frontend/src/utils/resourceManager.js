/**
 * 文件名：resourceManager.js
 * 作者：开发者
 * 日期：2026-05-28
 * 版本：v2.0.0
 * 功能描述：游戏资源管理工具——作物阶段/emoji映射、占位图生成
 * 更新记录：
 *   2026-05-28 - v1.0.0 - 初始创建
 *   2026-05-28 - v2.0.0 - 修复HTML实体编码、扩展CROP_EMOJIS到84种作物、完善段阶映射
 */

const CROP_STAGES = {
  1: '幼苗期',
  2: '生长期',
  3: '开花期',
  4: '结果期',
  5: '成熟期',
};

const STAGE_COLORS = {
  1: '#90EE90',
  2: '#32CD32',
  3: '#FFB6C1',
  4: '#FFA500',
  5: '#FFD700',
};

const CROP_EMOJIS = {
  1: '🌾',
  2: '🌽',
  3: '🥬',
  4: '🥬',
  5: '🥔',
  6: '🥗',
  7: '🥕',
  8: '🥬',
  9: '🥬',
  10: '🌿',
  11: '🫘',
  12: '🍅',
  13: '🥒',
  14: '🌶️',
  15: '🍆',
  16: '🍓',
  17: '🫐',
  18: '🍒',
  19: '🍉',
  20: '🍍',
  21: '🍊',
  22: '🍋',
  23: '🍇',
  24: '🍑',
  25: '🍑',
  26: '🍑',
  27: '🍑',
  28: '🍑',
  29: '🍑',
  30: '🍊',
  31: '🍎',
  32: '🥥',
  33: '🥭',
  34: '🫒',
  35: '🍒',
  36: '🍑',
  37: '👑',
  38: '✨',
  39: '🍈',
  40: '🫐',
  41: '🍒',
  42: '🫐',
  43: '🫐',
  44: '🍒',
  45: '🍒',
  46: '🫐',
  47: '🍓',
  48: '🍇',
  49: '🫐',
  50: '🌵',
  51: '🌵',
  52: '🐉',
  53: '🐉',
  54: '🪺',
  55: '😇',
  56: '🧚',
  57: '✨',
  58: '👼',
  59: '✝️',
  60: '🐲',
  61: '🐦',
  62: '🦄',
  63: '🔥',
  64: '🔥',
  65: '🔥',
  66: '🌑',
  67: '🕳️',
  68: '🌪️',
  69: '🕳️',
  70: '☄️',
  71: '⭐',
  72: '🌌',
  73: '🚀',
  74: '🌌',
  75: '🌅',
  76: '🌄',
  77: '🔮',
  78: '☯️',
  79: '💫',
  80: '♾️',
  81: '🌋',
  82: '💥',
  83: '🐦‍🔥',
  84: '👑',
};

const ITEM_EMOJIS = {
  1: '💧',
  2: '💦',
  3: '🌊',
  4: '⚡',
  5: '🚀',
  6: '✨',
  7: '🔥',
  8: '💫',
  9: '🍀',
  10: '⏰',
  11: '🙏',
  12: '🌟',
  13: '🧪',
  14: '💰',
  15: '📦',
  16: '📖',
  17: '🌍',
  18: '💚',
  19: '💙',
  20: '❤️',
  21: '🥉',
  22: '🥈',
  23: '🥇',
  24: '🌱',
  25: '🌾',
  26: '🌸',
  27: '🏖️',
  28: '🍂',
  29: '🪵',
  30: '🧑‍🌾',
};

const LAND_QUALITY_EMOJIS = {
  1: '🟫',
  2: '🟤',
  3: '⬜',
  4: '🟡',
  5: '🟢',
  6: '💎',
  7: '🔥',
  8: '🌌',
};

export const getCropStageDisplay = (cropId, progress) => {
  const stageNum = Math.min(5, Math.max(1, Math.ceil(progress / 20)));
  return {
    name: CROP_STAGES[stageNum],
    color: STAGE_COLORS[stageNum],
    stage: stageNum,
    emoji: CROP_EMOJIS[cropId] || '🌱',
  };
};

export const getCropEmoji = (cropId) => {
  return CROP_EMOJIS[cropId] || '🌱';
};

export const getItemEmoji = (itemId) => {
  return ITEM_EMOJIS[itemId] || '🎁';
};

export const getLandQualityEmoji = (qualityId) => {
  return LAND_QUALITY_EMOJIS[qualityId] || '🟫';
};

export const getGrowthStageEmoji = (progress) => {
  if (progress < 20) return '🌱';
  if (progress < 40) return '🌿';
  if (progress < 60) return '🌳';
  if (progress < 80) return '🌺';
  if (progress < 100) return '🍃';
  return '✨';
};

export const getStageName = (stage) => {
  return CROP_STAGES[stage] || '未知';
};

export const getStageColor = (stage) => {
  return STAGE_COLORS[stage] || '#90EE90';
};

export const generateCropPlaceholder = (cropId, stage, size = 128) => {
  const stageData = getCropStageDisplay(cropId, stage);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  bgGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
  bgGrad.addColorStop(1, stageData.color + '40');

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stageData.emoji, size / 2, size / 2);

  return canvas.toDataURL();
};

export const generateIconPlaceholder = (type, id, size = 64) => {
  const emoji =
    type === 'item'
      ? getItemEmoji(id)
      : type === 'seed'
        ? getCropEmoji(id)
        : getCropEmoji(id);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  bgGrad.addColorStop(0, '#f0f0f0');
  bgGrad.addColorStop(1, '#e0e0e0');

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2);

  return canvas.toDataURL();
};

export default {
  getCropStageDisplay,
  getCropEmoji,
  getItemEmoji,
  getLandQualityEmoji,
  getGrowthStageEmoji,
  getStageName,
  getStageColor,
  generateCropPlaceholder,
  generateIconPlaceholder,
};
