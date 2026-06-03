-- farm_land.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.1
-- 功能: 公共地块配置表(固定50块)

-- 表结构
CREATE TABLE IF NOT EXISTS farm_land (
  land_id SERIAL PRIMARY KEY,
  land_num SMALLINT NOT NULL,
  default_quality SMALLINT NOT NULL DEFAULT 1,
  unlock_player_level SMALLINT NOT NULL,
  unlock_farm_level SMALLINT NOT NULL,
  unlock_world_level SMALLINT NOT NULL,
  unlock_cost BIGINT NOT NULL DEFAULT 0,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  description VARCHAR(200) NOT NULL,
  UNIQUE (land_num),
  CHECK (land_num >= 1 AND land_num <= 50),
  CONSTRAINT fk_land_quality FOREIGN KEY (default_quality) REFERENCES land_quality (quality_id)
);

-- 添加注释
COMMENT ON TABLE farm_land IS '开心农场-公共地块配置表(固定50块，农场币解锁)';
COMMENT ON COLUMN farm_land.land_id IS '地块唯一ID(1-50)';
COMMENT ON COLUMN farm_land.land_num IS '地块序号(1-50，固定不变)';
COMMENT ON COLUMN farm_land.default_quality IS '默认品质(1=普通)';
COMMENT ON COLUMN farm_land.unlock_player_level IS '解锁所需玩家等级';
COMMENT ON COLUMN farm_land.unlock_farm_level IS '解锁所需农场等级';
COMMENT ON COLUMN farm_land.unlock_world_level IS '解锁所需世界等级';
COMMENT ON COLUMN farm_land.unlock_cost IS '解锁该地块所需农场币';
COMMENT ON COLUMN farm_land.position_x IS '地块X坐标';
COMMENT ON COLUMN farm_land.position_y IS '地块Y坐标';
COMMENT ON COLUMN farm_land.is_default IS '是否新手默认解锁 0=否 1=是';
COMMENT ON COLUMN farm_land.description IS '地块描述';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_unlock_level ON farm_land (unlock_player_level, unlock_farm_level, unlock_world_level);
CREATE INDEX IF NOT EXISTS idx_position ON farm_land (position_x, position_y);