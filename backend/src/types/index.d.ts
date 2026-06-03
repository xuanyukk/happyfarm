/**
 * 文件名：backend/src/types/index.d.ts
 * 作者：AI助手
 * 日期：2026-04-30
 * 版本：v1.0.0
 * 功能描述：后端TypeScript类型定义
 */

/**
 * 玩家类型
 */
declare interface Player {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  passwordHash: string;
  passwordSalt: string;
  level: number;
  experience: number;
  farmLevel: number;
  worldLevel: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 用户类型（公开信息）
 */
declare interface PublicPlayer {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  level: number;
  experience: number;
  farmLevel: number;
  worldLevel: number;
  createdAt: string;
}

/**
 * 地块类型
 */
declare interface Land {
  id: number;
  userId: number;
  landNum: number;
  quality: number;
  unlocked: boolean;
  unlockedAt?: string;
  plantedAt?: string;
  cropId?: number;
}

/**
 * 作物类型
 */
declare interface Crop {
  id: number;
  name: string;
  type: 'basic' | 'economic' | 'rare' | 'top';
  growTime: number;
  basePrice: number;
  minYield: number;
  maxYield: number;
  requiredLevel: number;
}

/**
 * 商店物品类型
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
 * 库存物品类型
 */
declare interface InventoryItem {
  id: number;
  userId: number;
  itemId: number;
  quantity: number;
  itemType: 'seed' | 'crop' | 'item';
}

/**
 * API响应类型
 */
declare interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * 分页响应类型
 */
declare interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * JWT payload
 */
declare interface JwtPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

/**
 * 请求上下文
 */
declare interface RequestContext {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * Express请求扩展
 */
declare namespace Express {
  interface Request {
    user?: {
      id: number;
      username: string;
      email: string;
    };
    apiVersion?: string;
  }
}

/**
 * 验证错误
 */
declare interface ValidationError {
  field: string;
  message: string;
}

/**
 * 分页查询
 */
declare interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 排序查询
 */
declare interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * 队列任务数据
 */
declare interface QueueTaskData {
  [key: string]: any;
}

/**
 * 邮件任务数据
 */
declare interface EmailTaskData {
  to: string;
  subject: string;
  html?: string;
  template?: string;
  templateData?: {
    [key: string]: any;
  };
}

/**
 * 通知任务数据
 */
declare interface NotificationTaskData {
  userId: number;
  type: string;
  message: string;
  data?: {
    [key: string]: any;
  };
}

/**
 * 缓存失效任务数据
 */
declare interface CacheInvalidationData {
  pattern?: string;
  keys?: string[];
}
