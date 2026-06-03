/**
 * 文件名：backend/src/utils/constants.js
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：后端常量定义
 * 更新记录：
 *   2026-04-30 - v1.0.0 - 初始创建，提供后端常量定义
 */

/**
 * HTTP状态码
 */
const HTTP_STATUS = {
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

// JWT 配置（实际生效值以 config/index.js 为准）
const JWT = {
  ACCESS_TOKEN_EXPIRE: '1h',
  REFRESH_TOKEN_EXPIRE: '7d',
};

/**
 * 速率限制常量
 */
const RATE_LIMIT = {
  DEFAULT_WINDOW: 15 * 60 * 1000,
  DEFAULT_MAX: 10,
  LOGIN_MAX: 5,
  LOGIN_WINDOW: 60 * 60 * 1000,
};

/**
 * 数据库配置常量
 */
const DATABASE = {
  DEFAULT_HOST: 'localhost',
  DEFAULT_PORT: 5432,
  DEFAULT_USER: 'postgres',
  CONNECTION_TIMEOUT: 5000,
  MAX_POOL_SIZE: 25,
  MIN_POOL_SIZE: 5,
  IDLE_TIMEOUT: 60000,
  STATEMENT_TIMEOUT: 60000,
};

/**
 * 分页常量
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MIN_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
};

/**
 * 验证常量
 */
const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  DISPLAY_NAME_MAX_LENGTH: 100,
};

/**
 * Redis配置常量
 */
const REDIS = {
  DEFAULT_HOST: 'localhost',
  DEFAULT_PORT: 6379,
  DEFAULT_DB: 0,
  CACHE_TTL_SHORT: 60,
  CACHE_TTL_NORMAL: 300,
  CACHE_TTL_LONG: 3600,
};

/**
 * 队列优先级
 */
const QUEUE_PRIORITY = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * 作物品质常量
 */
const LAND_QUALITY = {
  NORMAL: 1,
  COPPER: 2,
  IRON: 3,
  GOLD: 4,
  JADE: 5,
  DIAMOND: 6,
  HELL: 7,
  ENDLESS: 8,
};

/**
 * 作物生长阶段（5阶段系统，与前端一致）
 * 阶段1=幼苗期(0-20%)、阶段2=生长期(20-40%)、阶段3=开花期(40-60%)
 * 阶段4=结果期(60-80%)、阶段5=成熟期(80-100%)
 */
const GROWTH_STAGE = {
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
 * 货币系统常量
 */
const CURRENCY = {
  DEFAULT_MAX_HOLD: 99999999999,       // 999亿
  FARM_COIN_ID: 1,
  FARM_COIN_SYMBOL: '₣',
  FORMAT_WAN_THRESHOLD: 10000,
  FORMAT_YI_THRESHOLD: 100000000,
  FORMAT_DECIMALS: 1,
};

module.exports = {
  HTTP_STATUS,
  JWT,
  RATE_LIMIT,
  DATABASE,
  PAGINATION,
  VALIDATION,
  REDIS,
  QUEUE_PRIORITY,
  LAND_QUALITY,
  GROWTH_STAGE,
  CURRENCY,
};
