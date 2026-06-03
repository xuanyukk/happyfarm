-- ============================================
-- 迁移名称: add_item_system_configs
-- 版本: v2.0.0
-- 日期: 2026-05-24
-- 描述: 添加道具系统相关配置项到game_config表
-- 影响范围: game_config表新增道具系统相关配置项（金币袋、农场手册、世界之书、体力药水等）
-- 回滚操作: DELETE FROM game_config WHERE key IN (道具相关keys); DELETE FROM config_version WHERE config_id IN (SELECT id FROM game_config WHERE key IN (道具相关keys));
-- 依赖: 31_game_config_system.sql
-- ============================================

-- 道具系统配置项
INSERT INTO game_config (key, name, description, category, data_type, value, default_value, is_readonly, is_required_approval, sort_order, is_active) VALUES
-- 金币袋配置
('GOLD_BAG_MIN_GOLD', '金币袋最小金币', '使用金币袋获得的最小金币数', 'ITEM', 'INTEGER', '1000', '1000', FALSE, FALSE, 10, true),
('GOLD_BAG_MAX_GOLD', '金币袋最大金币', '使用金币袋获得的最大金币数', 'ITEM', 'INTEGER', '10000', '10000', FALSE, FALSE, 11, true),

-- 农场手册配置
('FARM_BOOK_EXP', '农场手册经验', '使用农场手册获得的农场经验值', 'ITEM', 'INTEGER', '5000', '5000', FALSE, FALSE, 12, true),

-- 世界之书配置
('WORLD_BOOK_EXP', '世界之书经验', '使用世界之书获得的世界经验值', 'ITEM', 'INTEGER', '2000', '2000', FALSE, FALSE, 13, true),

-- 体力药水配置
('STAMINA_POTION_1_RESTORE', '初级体力药水恢复', '初级体力药水恢复的体力值', 'ITEM', 'INTEGER', '50', '50', FALSE, FALSE, 14, true),
('STAMINA_POTION_2_RESTORE', '高级体力药水恢复', '高级体力药水恢复的体力值', 'ITEM', 'INTEGER', '200', '200', FALSE, FALSE, 15, true),

-- 丰收之神配置
('HARVEST_GOD_DURATION', '丰收之神持续时间', '丰收之神效果持续时间（小时）', 'ITEM', 'INTEGER', '24', '24', FALSE, FALSE, 16, true),
('HARVEST_GOD_YIELD_BOOST', '丰收之神产量加成', '丰收之神提供的产量加成倍数', 'ITEM', 'FLOAT', '1.5', '1.5', FALSE, FALSE, 17, true),

-- 幸运种子配置
('LUCKY_SEED_DOUBLE_CHANCE', '幸运种子双倍概率', '幸运种子触发双倍收益的概率(0-1)', 'ITEM', 'FLOAT', '0.5', '0.5', FALSE, FALSE, 18, true),

-- 神秘宝箱奖励配置 (JSON格式)
('MYSTERY_BOX_REWARDS', '神秘宝箱奖励', '神秘宝箱可能掉落的道具配置(JSON数组)', 'ITEM', 'JSON', '[{"itemId":1,"min":1,"max":5},{"itemId":4,"min":1,"max":5},{"itemId":18,"min":1,"max":3},{"itemId":2,"min":0,"max":2},{"itemId":5,"min":0,"max":2}]', '[{"itemId":1,"min":1,"max":5},{"itemId":4,"min":1,"max":5},{"itemId":18,"min":1,"max":3},{"itemId":2,"min":0,"max":2},{"itemId":5,"min":0,"max":2}]', FALSE, FALSE, 19, true),
('MYSTERY_BOX_MIN_REWARDS', '神秘宝箱最小奖励数', '神秘宝箱每次最少掉落的道具种类数', 'ITEM', 'INTEGER', '1', '1', FALSE, FALSE, 20, true),
('MYSTERY_BOX_MAX_REWARDS', '神秘宝箱最大奖励数', '神秘宝箱每次最多掉落的道具种类数', 'ITEM', 'INTEGER', '3', '3', FALSE, FALSE, 21, true)
ON CONFLICT (key) DO NOTHING;

-- 记录版本变更
INSERT INTO config_version (config_id, version, old_value, new_value, change_type, changed_by, change_reason)
SELECT id, 1, NULL, value, 'CREATE', 1, '添加道具系统配置项'
FROM game_config
WHERE key IN (
    'GOLD_BAG_MIN_GOLD', 'GOLD_BAG_MAX_GOLD',
    'FARM_BOOK_EXP', 'WORLD_BOOK_EXP',
    'STAMINA_POTION_1_RESTORE', 'STAMINA_POTION_2_RESTORE',
    'HARVEST_GOD_DURATION', 'HARVEST_GOD_YIELD_BOOST',
    'LUCKY_SEED_DOUBLE_CHANCE',
    'MYSTERY_BOX_REWARDS', 'MYSTERY_BOX_MIN_REWARDS', 'MYSTERY_BOX_MAX_REWARDS'
)
ON CONFLICT DO NOTHING;

-- 更新游戏版本配置
UPDATE game_config 
SET value = 'v4.54.0', default_value = 'v4.54.0', updated_at = CURRENT_TIMESTAMP
WHERE key = 'GAME_VERSION';


