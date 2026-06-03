-- player_base.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.1
-- 功能: 玩家基础表(上线后生成)

-- 表结构
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
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id)
);

-- 添加注释
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
COMMENT ON COLUMN player_base.create_time IS '创建时间';
COMMENT ON COLUMN player_base.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_player_level ON player_base (player_level);
CREATE INDEX IF NOT EXISTS idx_farm_level ON player_base (farm_level);
CREATE INDEX IF NOT EXISTS idx_world_level ON player_base (world_level);

-- 添加更新时间触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_player_base_modtime' 
        AND tgrelid = 'player_base'::regclass
    ) THEN
        CREATE TRIGGER update_player_base_modtime
        BEFORE UPDATE ON player_base
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
    END IF;
END $$;