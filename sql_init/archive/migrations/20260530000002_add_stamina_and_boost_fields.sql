-- ============================================
-- 文件名: 20260530000002_add_stamina_and_boost_fields.sql
-- 作者: SOLO
-- 日期: 2026-05-30
-- 版本: v1.0.0
-- 功能描述: 为 player_base 添加体力相关字段，为 player_land_status 添加产量加速结束时间字段
-- 影响范围: player_base 表新增 current_stamina/max_stamina/last_stamina_recover_time 列
--           player_land_status 表新增 yield_boost_end_time 列
-- ============================================

BEGIN;

-- ============ player_base 表：添加体力字段 ============
ALTER TABLE player_base
ADD COLUMN IF NOT EXISTS current_stamina INTEGER NOT NULL DEFAULT 100;

ALTER TABLE player_base
ADD COLUMN IF NOT EXISTS max_stamina INTEGER NOT NULL DEFAULT 200;

ALTER TABLE player_base
ADD COLUMN IF NOT EXISTS last_stamina_recover_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN player_base.current_stamina IS '当前体力值';
COMMENT ON COLUMN player_base.max_stamina IS '最大体力值';
COMMENT ON COLUMN player_base.last_stamina_recover_time IS '上次体力恢复时间';

-- ============ player_land_status 表：添加产量加速结束时间 ============
ALTER TABLE player_land_status
ADD COLUMN IF NOT EXISTS yield_boost_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN player_land_status.yield_boost_end_time IS '产量加速效果结束时间';

COMMIT;

\echo '体力字段和产量加速结束时间字段添加成功！'