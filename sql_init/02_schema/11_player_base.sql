-- ============================================
-- 文件名: 11_player_base.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.5.0
-- 功能描述: 玩家基础表(上线后生成)，含体力值字段
-- 执行顺序: 02-11
-- 依赖关系: 02-10_shop_goods.sql
-- ============================================

CREATE TABLE IF NOT EXISTS player_base (
    player_id VARCHAR(64) NOT NULL,
    player_level SMALLINT NOT NULL DEFAULT 1,
    player_exp BIGINT NOT NULL DEFAULT 0,
    farm_level SMALLINT NOT NULL DEFAULT 1,
    farm_exp BIGINT NOT NULL DEFAULT 0,
    world_level SMALLINT NOT NULL DEFAULT 1,
    world_exp BIGINT NOT NULL DEFAULT 0,
    current_land_quality SMALLINT NOT NULL DEFAULT 1,
    covered_land_num SMALLINT NOT NULL DEFAULT 0,
    unlocked_land_num SMALLINT NOT NULL DEFAULT 3,
    total_earn BIGINT NOT NULL DEFAULT 0,
    total_spend BIGINT NOT NULL DEFAULT 0,
    avatar VARCHAR(100) DEFAULT NULL,
    current_stamina INTEGER NOT NULL DEFAULT 100,
    max_stamina INTEGER NOT NULL DEFAULT 200,
    last_stamina_recover_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id)
);

COMMENT ON TABLE player_base IS '开心农场-玩家基础表(上线后生成数据)';
COMMENT ON COLUMN player_base.player_id IS '玩家唯一ID';
COMMENT ON COLUMN player_base.player_level IS '玩家等级(1-1000)';
COMMENT ON COLUMN player_base.player_exp IS '玩家经验值';
COMMENT ON COLUMN player_base.farm_level IS '农场等级(1-500)';
COMMENT ON COLUMN player_base.farm_exp IS '农场经验值';
COMMENT ON COLUMN player_base.world_level IS '世界等级(1-100)';
COMMENT ON COLUMN player_base.world_exp IS '世界经验值';
COMMENT ON COLUMN player_base.current_land_quality IS '当前最高地块品质';
COMMENT ON COLUMN player_base.covered_land_num IS '已覆盖高品质地块数量';
COMMENT ON COLUMN player_base.unlocked_land_num IS '已解锁地块数量';
COMMENT ON COLUMN player_base.total_earn IS '累计获得农场币';
COMMENT ON COLUMN player_base.total_spend IS '累计消耗农场币';
COMMENT ON COLUMN player_base.avatar IS '玩家头像';
COMMENT ON COLUMN player_base.current_stamina IS '当前体力值(每分钟恢复1点)';
COMMENT ON COLUMN player_base.max_stamina IS '最大体力值';
COMMENT ON COLUMN player_base.last_stamina_recover_time IS '上次体力恢复时间';
COMMENT ON COLUMN player_base.create_time IS '创建时间';
COMMENT ON COLUMN player_base.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_player_level ON player_base (player_level);
CREATE INDEX IF NOT EXISTS idx_farm_level ON player_base (farm_level);
CREATE INDEX IF NOT EXISTS idx_world_level ON player_base (world_level);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_player_base_updated_at ON player_base;
CREATE TRIGGER update_player_base_updated_at
    BEFORE UPDATE ON player_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '玩家基础表创建成功！'
