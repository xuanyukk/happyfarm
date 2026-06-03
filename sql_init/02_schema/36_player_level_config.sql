-- ============================================
-- 文件名: 36_player_level_config.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.68.0
-- 功能描述: 玩家等级经验配置表(1-1000级)
-- 执行顺序: 02-36
-- 依赖关系: 02-11_player_base.sql
-- ============================================

CREATE TABLE IF NOT EXISTS player_level_config (
    level_id SERIAL PRIMARY KEY,
    player_level SMALLINT NOT NULL UNIQUE,
    exp_required BIGINT NOT NULL,
    exp_to_next BIGINT NOT NULL,
    reward_gold BIGINT NOT NULL DEFAULT 0,
    reward_gems INTEGER NOT NULL DEFAULT 0,
    reward_items JSONB DEFAULT NULL,
    stamina_increase INTEGER NOT NULL DEFAULT 0,
    max_stamina INTEGER NOT NULL DEFAULT 200,
    is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE player_level_config IS '开心农场-玩家等级经验配置表';
COMMENT ON COLUMN player_level_config.player_level IS '玩家等级(1-1000)';
COMMENT ON COLUMN player_level_config.exp_required IS '到达该等级所需累计经验值';
COMMENT ON COLUMN player_level_config.exp_to_next IS '从上一级到本级所需经验值';
COMMENT ON COLUMN player_level_config.reward_gold IS '升级奖励农场币';
COMMENT ON COLUMN player_level_config.reward_gems IS '升级奖励宝石币';
COMMENT ON COLUMN player_level_config.reward_items IS '升级奖励道具(JSON格式：[{item_id, count}])';
COMMENT ON COLUMN player_level_config.stamina_increase IS '体力上限增加量';
COMMENT ON COLUMN player_level_config.max_stamina IS '该等级体力上限';
COMMENT ON COLUMN player_level_config.is_milestone IS '是否为里程碑等级';

CREATE INDEX IF NOT EXISTS idx_player_level_config_level
    ON player_level_config (player_level);

DROP TRIGGER IF EXISTS update_player_level_config_updated_at ON player_level_config;
CREATE TRIGGER update_player_level_config_updated_at
    BEFORE UPDATE ON player_level_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '玩家等级经验配置表创建成功！'