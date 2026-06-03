-- ============================================
-- 文件名: 03_world_level.sql
-- 作者: Trae AI
-- 日期: 2026-05-23
-- 版本: v4.53.0
-- 功能描述: 世界等级公共配置表(1-100级)
-- 执行顺序: 02-02
-- 依赖关系: 无
-- 更新记录:
--   2026-05-23 - v4.53.0 - 移除对旧版system_config的依赖
-- ============================================

CREATE TABLE IF NOT EXISTS world_level (
    world_id SERIAL PRIMARY KEY,
    world_name VARCHAR(50) NOT NULL,
    unlock_player_level SMALLINT NOT NULL,
    unlock_farm_level SMALLINT NOT NULL,
    unlock_cost BIGINT NOT NULL DEFAULT 0,
    soil_rate DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    stage_desc VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE world_level IS '开心农场-世界等级公共配置表';
COMMENT ON COLUMN world_level.world_id IS '世界等级(1-100)';
COMMENT ON COLUMN world_level.world_name IS '世界阶段名称';
COMMENT ON COLUMN world_level.unlock_player_level IS '解锁所需玩家等级';
COMMENT ON COLUMN world_level.unlock_farm_level IS '解锁所需农场等级';
COMMENT ON COLUMN world_level.unlock_cost IS '解锁该世界等级所需农场币';
COMMENT ON COLUMN world_level.soil_rate IS '土壤产量倍率';
COMMENT ON COLUMN world_level.stage_desc IS '阶段描述';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_world_level_updated_at ON world_level;
CREATE TRIGGER update_world_level_updated_at
    BEFORE UPDATE ON world_level
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '世界等级表创建成功！'
