-- ============================================
-- 迁移名称: add_crop_yield_range_and_exp_fields
-- 版本: v2.0.0
-- 日期: 2026-03-25
-- 描述: 为作物表添加产量范围和三种等级经验值字段
-- 影响范围: crop表新增min_yield/max_yield/player_exp_base/farm_exp_base/world_exp_base字段
-- 回滚操作: ALTER TABLE crop DROP COLUMN IF EXISTS min_yield, DROP COLUMN IF EXISTS max_yield, DROP COLUMN IF EXISTS player_exp_base, DROP COLUMN IF EXISTS farm_exp_base, DROP COLUMN IF EXISTS world_exp_base;
-- 依赖: 07_crop.sql
-- ============================================

-- 添加产量范围字段
ALTER TABLE crop 
ADD COLUMN IF NOT EXISTS min_yield INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_yield INTEGER NOT NULL DEFAULT 1;

-- 添加三种等级经验值字段
ALTER TABLE crop 
ADD COLUMN IF NOT EXISTS player_exp_base INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS farm_exp_base INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS world_exp_base INTEGER NOT NULL DEFAULT 1;

-- 添加注释
COMMENT ON COLUMN crop.min_yield IS '最小产量';
COMMENT ON COLUMN crop.max_yield IS '最大产量';
COMMENT ON COLUMN crop.player_exp_base IS '玩家等级基础经验值';
COMMENT ON COLUMN crop.farm_exp_base IS '农场等级基础经验值';
COMMENT ON COLUMN crop.world_exp_base IS '世界等级基础经验值';

-- 验证字段添加成功
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'crop' 
  AND column_name IN ('min_yield', 'max_yield', 'player_exp_base', 'farm_exp_base', 'world_exp_base')
ORDER BY ordinal_position;

