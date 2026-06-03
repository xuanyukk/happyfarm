/**
 * 文件名：frontend/src/types/index.d.ts
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：前端TypeScript类型定义
 */

/**
 * 作物类型
 */
declare type CropType = 'basic' | 'economic' | 'rare' | 'top';

/**
 * 地块品质
 */
declare type LandQuality = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * 品质名称
 */
declare type QualityName = 
  | '普通'
  | '铜'
  | '铁'
  | '金'
  | '翡翠'
  | '钻石'
  | '狱'
  | '无尽';

/**
 * 作物生长阶段（5阶段系统）
 */
declare type GrowthStage = 1 | 2 | 3 | 4 | 5;

/**
 * 玩家信息（与实际API返回字段一致，snake_case）
 */
declare interface Player {
  player_id: string;
  username: string;
  player_level: number;
  farm_level: number;
  world_level: number;
  player_exp: number;
  farm_exp: number;
  world_exp: number;
  currency_num: number;
  gem_num: number;
  current_stamina: number;
  max_stamina: number;
  avatar: string;
  create_time: string;
  update_time: string;
}

/**
 * 地块信息
 */
declare interface LandCell {
  land_num: number;
  land_quality: LandQuality;
  crop_id: number | null;
  crop_name: string | null;
  planted_time: string | null;
  harvest_time: string | null;
  growth_progress: number;
  is_matured: boolean;
  stage: GrowthStage;
}

/**
 * 作物信息（与实际API返回字段一致，snake_case）
 */
declare interface Crop {
  crop_id: number;
  crop_name: string;
  crop_type: CropType;
  world_id: number;
  unlock_player_level: number;
  unlock_farm_level: number;
  growth_cycle: number;
  sell_price: number;
  seed_cost: number;
  min_yield: number;
  max_yield: number;
  base_yield: number;
  gp_per_min: number;
}

/**
 * 商店物品
 */
declare interface ShopItem {
  id: number;
  name: string;
  type: 'seed' | 'item' | 'resource';
  price: number;
  available: boolean;
  description?: string;
}

/**
 * 背包物品
 */
declare interface InventoryItem {
  id: number;
  itemId: number;
  quantity: number;
  itemType: 'seed' | 'crop' | 'item';
}

/**
 * API响应
 */
declare interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * 分页响应
 */
declare interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 用户认证相关
 */
declare interface AuthState {
  isAuthenticated: boolean;
  user?: Player;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * 表单验证错误
 */
declare interface ValidationErrors {
  [key: string]: string | string[];
}

/**
 * 分页查询参数
 */
declare interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 排序查询参数
 */
declare interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * 游戏状态
 */
declare interface GameState {
  player: Player | null;
  lands: LandCell[];
  crops: Crop[];
  items: any[];
  inventory: InventoryItem[];
  loading: boolean;
}

/**
 * 通知信息
 */
declare interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}
