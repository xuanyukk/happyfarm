-- ============================================
-- 迁移名称: add_item_effect_fields
-- 版本: v2.0.0
-- 日期: 2026-03-21
-- 描述: 为player_land_status表添加道具效果字段
-- 影响范围: player_land_status表新增yield_boost/speed_boost/speed_boost_end_time字段
-- 回滚操作: ALTER TABLE player_land_status DROP COLUMN IF EXISTS yield_boost, DROP COLUMN IF EXISTS speed_boost, DROP COLUMN IF EXISTS speed_boost_end_time;
-- 依赖: 15_player_land_status.sql
-- ============================================

-- 文件名：006_add_item_effect_fields.sql
-- 作者：开发者
-- 日期：2026-03-21
-- 版本：v1.0.0
-- 功能描述：添加道具效果相关字段到player_land_status表

-- 为player_land_status表添加道具效果字段
ALTER TABLE player_land_status
ADD COLUMN IF NOT EXISTS yield_boost DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS speed_boost DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS speed_boost_end_time TIMESTAMP DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN player_land_status.yield_boost IS '产量加成倍率(增产道具效果)';
COMMENT ON COLUMN player_land_status.speed_boost IS '速度加成倍率(加速道具效果)';
COMMENT ON COLUMN player_land_status.speed_boost_end_time IS '加速效果结束时间';


