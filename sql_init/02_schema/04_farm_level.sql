-- ============================================
-- 文件名: 04_farm_level.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 农场等级公共配置表(1-500级)
-- 执行顺序: 02-04
-- 依赖关系: 02-03_world_level.sql
-- ============================================

CREATE TABLE IF NOT EXISTS farm_level (
    farm_id SERIAL PRIMARY KEY,
    unlock_player_level SMALLINT NOT NULL,
    unlock_world_level SMALLINT NOT NULL,
    land_unlock_num SMALLINT NOT NULL DEFAULT 0,
    reward_type SMALLINT NOT NULL DEFAULT 1,
    reward_id INTEGER DEFAULT NULL,
    reward_num BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE farm_level IS '开心农场-农场等级公共配置表';
COMMENT ON COLUMN farm_level.farm_id IS '农场等级(1-500)';
COMMENT ON COLUMN farm_level.unlock_player_level IS '解锁所需玩家等级';
COMMENT ON COLUMN farm_level.unlock_world_level IS '解锁所需世界等级';
COMMENT ON COLUMN farm_level.land_unlock_num IS '本次升级解锁普通地块数';
COMMENT ON COLUMN farm_level.reward_type IS '奖励类型 1=农场币 2=道具';
COMMENT ON COLUMN farm_level.reward_id IS '奖励道具ID(奖励类型为2时必填)';
COMMENT ON COLUMN farm_level.reward_num IS '奖励数量';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_farm_level_updated_at ON farm_level;
CREATE TRIGGER update_farm_level_updated_at
    BEFORE UPDATE ON farm_level
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '农场等级表创建成功！'
