-- ============================================
-- 迁移名称: add_farm_world_exp_fields
-- 版本: v2.0.0
-- 日期: 2026-03-24
-- 描述: 在player_base表中添加农场经验和世界经验字段
-- 影响范围: player_base表新增farm_exp/world_exp字段
-- 回滚操作: ALTER TABLE player_base DROP COLUMN IF EXISTS farm_exp, DROP COLUMN IF EXISTS world_exp;
-- 依赖: 11_player_base.sql
-- ============================================

-- 添加农场经验字段
ALTER TABLE player_base ADD COLUMN IF NOT EXISTS farm_exp BIGINT DEFAULT 0;
COMMENT ON COLUMN player_base.farm_exp IS '农场经验值';

-- 添加世界经验字段
ALTER TABLE player_base ADD COLUMN IF NOT EXISTS world_exp BIGINT DEFAULT 0;
COMMENT ON COLUMN player_base.world_exp IS '世界经验值';

-- 更新现有玩家的经验值
UPDATE player_base SET farm_exp = 0 WHERE farm_exp IS NULL;
UPDATE player_base SET world_exp = 0 WHERE world_exp IS NULL;

