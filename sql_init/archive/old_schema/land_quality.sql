-- land_quality.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.1
-- 功能: 地块品质公共配置表(8档)

-- 表结构
CREATE TABLE IF NOT EXISTS land_quality (
  quality_id SERIAL PRIMARY KEY,
  quality_name VARCHAR(20) NOT NULL,
  yield_rate DECIMAL(3,2) NOT NULL,
  grow_speed DECIMAL(3,2) NOT NULL,
  unlock_player_level SMALLINT NOT NULL,
  unlock_farm_level SMALLINT NOT NULL,
  unlock_world_level SMALLINT NOT NULL,
  cover_cost_type SMALLINT NOT NULL DEFAULT 2,
  cover_cost_id INTEGER DEFAULT NULL,
  cover_cost_num BIGINT NOT NULL,
  total_cover_cost BIGINT NOT NULL,
  description VARCHAR(200) NOT NULL,
  CHECK (yield_rate >= 1.0 AND yield_rate <= 10.0),
  CHECK (grow_speed >= 0.1 AND grow_speed <= 1.0)
);

-- 添加注释
COMMENT ON TABLE land_quality IS '开心农场-地块品质公共配置表';
COMMENT ON COLUMN land_quality.quality_id IS '品质ID(1-8)';
COMMENT ON COLUMN land_quality.quality_name IS '品质名称';
COMMENT ON COLUMN land_quality.yield_rate IS '产量加成倍率';
COMMENT ON COLUMN land_quality.grow_speed IS '生长加速倍率';
COMMENT ON COLUMN land_quality.unlock_player_level IS '解锁品质所需玩家等级';
COMMENT ON COLUMN land_quality.unlock_farm_level IS '解锁品质所需农场等级';
COMMENT ON COLUMN land_quality.unlock_world_level IS '解锁品质所需世界等级';
COMMENT ON COLUMN land_quality.cover_cost_type IS '覆盖成本类型 1=作物 2=农场币';
COMMENT ON COLUMN land_quality.cover_cost_id IS '覆盖成本作物ID(成本类型为1时必填)';
COMMENT ON COLUMN land_quality.cover_cost_num IS '覆盖成本数量';
COMMENT ON COLUMN land_quality.total_cover_cost IS '50块地块全覆盖成本';
COMMENT ON COLUMN land_quality.description IS '品质描述';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_unlock_level ON land_quality (unlock_player_level, unlock_farm_level, unlock_world_level);