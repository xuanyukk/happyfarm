/**
 * 文件名：frontend/src/utils/constants.js
 * 作者：AI助手
 * 日期：2026-04-26
 * 版本：v2.3.0
 * 功能描述：常量定义——作物类型、土地品质、HTTP状态码等全局常量
 * 更新记录：
 *   2026-04-26 - v2.0.0 - 初始创建，提供基础常量
 *   2026-04-30 - v2.1.0 - 新增HTTP状态码、时间间隔、UI尺寸等常量
 *   2026-05-28 - v2.2.0 - 修正GROWTH_STAGE为5阶段系统、补充作物分类/道具类型/土地产量加成常量
 *   2026-05-31 - v2.3.0 - 修正speed_multiplier显示公式，适配新加速剂数值(>1)
 *   2026-05-31 - v2.4.0 - 方案B：新增watering_boost/fertilize_boost/harvest_boost/skin/decoration 5种effect_category及前端格式化
 */

export const CROP_TYPES = {
  BASIC: 'basic',
  ECONOMIC: 'economic',
  RARE: 'rare',
  TOP: 'top',
};

export const CROP_TYPE_NAMES = {
  basic: '基础作物',
  economic: '经济作物',
  rare: '稀有作物',
  top: '顶级作物',
};

export const CROP_TYPE_COLORS = {
  basic: '#E8F5E9',
  economic: '#FFF3E0',
  rare: '#F3E5F5',
  top: '#FFFDE7',
};

export const LAND_QUALITY = {
  NORMAL: 1,
  COPPER: 2,
  IRON: 3,
  GOLD: 4,
  JADE: 5,
  DIAMOND: 6,
  HELL: 7,
  ENDLESS: 8,
};

export const QUALITY_NAMES = {
  1: '普通',
  2: '铜',
  3: '铁',
  4: '金',
  5: '翡翠',
  6: '钻石',
  7: '狱',
  8: '无尽',
};

export const QUALITY_YIELD_BONUS = {
  1: 1.0,
  2: 1.2,
  3: 1.5,
  4: 2.0,
  5: 2.5,
  6: 3.0,
  7: 4.0,
  8: 5.0,
};

export const QUALITY_SPEED_BONUS = {
  1: 1.0,
  2: 0.9,
  3: 0.8,
  4: 0.7,
  5: 0.6,
  6: 0.5,
  7: 0.3,
  8: 0.1,
};

export const ITEM_TYPES = {
  YIELD_BOOST: 'yield_boost',
  SPEED_BOOST: 'speed_boost',
  LUCKY: 'lucky',
  INSTANT: 'instant',
  EXPERIENCE: 'experience',
  ENERGY: 'energy',
  PERMANENT: 'permanent',
  WATERING: 'watering',
  FERTILIZE: 'fertilize',
  HARVEST: 'harvest',
  SKIN: 'skin',
  DECORATION: 'decoration',
};

export const EFFECT_CATEGORY_NAMES = {
  yield_multiplier: '增产倍率',
  speed_multiplier: '加速倍率',
  global_yield_multiplier: '全局增产',
  double_chance: '双倍概率',
  instant_mature: '立即成熟',
  quality_boost: '品质提升',
  exp_multiplier: '经验倍率',
  exp_amount: '经验获得',
  gold_range: '金币范围',
  random_reward: '随机奖励',
  restore_amount: '体力恢复',
  restore_amount_full: '体力全满',
  watering_boost: '浇水效率',
  fertilize_boost: '施肥效果',
  harvest_boost: '收获产量',
  skin: '限时皮肤',
  decoration: '装饰物品',
};

export const formatEffectValue = function (effectValue, effectCategory) {
  if (!effectCategory) return String(effectValue);
  switch (effectCategory) {
    case 'yield_multiplier':
    case 'global_yield_multiplier':
      return `+${Math.round((effectValue - 1) * 100)}%`;
    case 'speed_multiplier':
      return `+${Math.round((effectValue - 1) * 100)}%`;
    case 'double_chance':
      return `${Math.round(effectValue * 100)}%`;
    case 'exp_multiplier':
      return `${effectValue}x`;
    case 'exp_amount':
      return `${effectValue}点`;
    case 'restore_amount':
      return `${effectValue}点`;
    case 'restore_amount_full':
      return '完全恢复';
    case 'instant_mature':
      return '立即';
    case 'quality_boost':
      return `+${effectValue}级`;
    case 'gold_range':
      return '随机';
    case 'random_reward':
      return '随机';
    case 'watering_boost':
      return `耗时-${Math.round((1 - effectValue) * 100)}%`;
    case 'fertilize_boost':
      return `效果+${Math.round((effectValue - 1) * 100)}%`;
    case 'harvest_boost':
      return `产量+${Math.round((effectValue - 1) * 100)}%`;
    case 'skin':
      return `${effectValue}天`;
    case 'decoration':
      return '可放置';
    default:
      return String(effectValue);
  }
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  PLAYER_DATA: 'playerData',
  FARM_STATE: 'farmState',
  THEME: 'theme',
  SETTINGS: 'settings',
};

/**
 * HTTP状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

/**
 * 时间间隔常量（毫秒）
 */
export const TIME_INTERVAL = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  QUICK_POLL: 1000,
  NORMAL_POLL: 5000,
  SLOW_POLL: 10000,
};

/**
 * UI尺寸常量
 */
export const UI_SIZES = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  BUTTON_MIN_WIDTH: 80,
  MODAL_MIN_WIDTH: 400,
  CARD_PADDING: 16,
};

/**
 * 分页常量
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MIN_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
};

/**
 * 验证常量
 */
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  DISPLAY_NAME_MAX_LENGTH: 100,
};

/**
 * 作物生长阶段常量（5阶段系统）
 * 阶段1=幼苗期(0-20%)、阶段2=生长期(20-40%)、阶段3=开花期(40-60%)
 * 阶段4=结果期(60-80%)、阶段5=成熟期(80-100%)
 */
export const GROWTH_STAGE = {
  SPROUT: 1,
  GROWING: 2,
  FLOWERING: 3,
  FRUITING: 4,
  MATURE: 5,
  MAX_STAGE: 5,
  TOTAL_STAGES: 5,
  PROGRESS_PER_STAGE: 20,
};

/**
 * 作物分类ID范围
 */
export const CROP_ID_RANGES = {
  BASIC_MIN: 1,
  BASIC_MAX: 15,
  ECONOMIC_MIN: 16,
  ECONOMIC_MAX: 34,
  RARE_MIN: 35,
  RARE_MAX: 74,
  TOP_MIN: 75,
  TOP_MAX: 84,
  TOTAL: 84,
};

export const CURRENCY = {
  FARM_COIN_ID: 1,
  FARM_COIN_SYMBOL: '₣',
  GEM_ID: 2,
  GEM_SYMBOL: '💎',
  DEFAULT_MAX_HOLD: 99999999999,
};

/**
 * 任务优先级常量
 */
export const TASK_PRIORITY = {
  LOW: 3,
  MEDIUM: 2,
  HIGH: 1,
  URGENT: 0,
};

/**
 * 动画时长（毫秒）
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SLOWER: 1000,
};

/**
 * 缓存超时（秒）
 */
export const CACHE_TTL = {
  SHORT: 60,
  NORMAL: 300,
  LONG: 3600,
  DAY: 86400,
};

/**
 * 游戏资源路径常量
 */
export const ASSET_PATHS = {
  CROP_STAGES: '/assets/crops/stages/',
  CROP_ICONS: '/assets/icons/crops/',
  SEED_ICONS: '/assets/icons/seeds/',
  ITEM_ICONS: '/assets/icons/items/',
  LAND_ICONS: '/assets/icons/land/',
  UI_BUTTONS: '/assets/ui/buttons/',
  UI_PANELS: '/assets/ui/panels/',
  UI_COMMON: '/assets/ui/common/',
};
