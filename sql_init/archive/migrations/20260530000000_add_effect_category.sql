-- ============================================
-- 文件名: 20260530000000_add_effect_category.sql
-- 作者: SOLO
-- 日期: 2026-05-30
-- 版本: v1.0.0
-- 功能描述: 为已有数据库添加 effect_category 列并扩大 effect_value 精度
-- 注意: 新安装数据库已从 09_item_config.sql 和 07_item_config_data.sql 直接包含对应字段
--       本迁移仅用于升级已有数据库
-- ============================================

ALTER TABLE item_config 
  ADD COLUMN IF NOT EXISTS effect_category VARCHAR(20) NOT NULL DEFAULT 'yield_multiplier';

ALTER TABLE item_config 
  ALTER COLUMN effect_value TYPE DECIMAL(10,2);

UPDATE item_config SET effect_category = 'yield_multiplier' WHERE item_type IN (1, 2, 3, 7);
UPDATE item_config SET effect_category = 'speed_multiplier' WHERE item_type IN (4, 5, 6, 8);
UPDATE item_config SET effect_category = 'double_chance' WHERE item_type = 9;
UPDATE item_config SET effect_category = 'instant_mature' WHERE item_type = 10;
UPDATE item_config SET effect_category = 'global_yield_multiplier' WHERE item_type = 11;
UPDATE item_config SET effect_category = 'quality_boost' WHERE item_type = 12;
UPDATE item_config SET effect_category = 'exp_multiplier' WHERE item_type = 13;
UPDATE item_config SET effect_category = 'gold_range' WHERE item_type = 14;
UPDATE item_config SET effect_category = 'random_reward' WHERE item_type = 15;
UPDATE item_config SET effect_category = 'exp_amount' WHERE item_type IN (16, 17);
UPDATE item_config SET effect_category = 'restore_amount' WHERE item_type IN (18, 19);
UPDATE item_config SET effect_category = 'restore_amount_full' WHERE item_type = 20;

UPDATE item_config SET effect_value = 5000.00 WHERE item_type = 16;
UPDATE item_config SET effect_value = 2000.00 WHERE item_type = 17;
UPDATE item_config SET effect_value = 50.00 WHERE item_type = 18;
UPDATE item_config SET effect_value = 200.00 WHERE item_type = 19;
UPDATE item_config SET effect_value = 200.00 WHERE item_type = 20;
UPDATE item_config SET effect_value = 0.5 WHERE item_type = 9;

\echo '道具效果分类迁移完成！'