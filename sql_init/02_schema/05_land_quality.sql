-- ============================================
-- 文件名: 05_land_quality.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.5.0
-- 功能描述: 地块品质公共配置表(8档) + 地块品质星级配置表(5星×8品质)
-- 执行顺序: 02-05
-- 依赖关系: 02-04_farm_level.sql
-- ============================================

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (yield_rate >= 1.0 AND yield_rate <= 10.0),
    CHECK (grow_speed >= 0.1 AND grow_speed <= 1.0)
);

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

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_land_quality_updated_at ON land_quality;
CREATE TRIGGER update_land_quality_updated_at
    BEFORE UPDATE ON land_quality
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '地块品质表创建成功！'

-- ============================================================
-- 地块品质星级配置表（每种品质各有5个星级）
-- ============================================================

CREATE TABLE IF NOT EXISTS land_quality_star (
    id SERIAL PRIMARY KEY,
    quality_id SMALLINT NOT NULL,
    star_level SMALLINT NOT NULL,
    star_name VARCHAR(30) NOT NULL,
    yield_bonus DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    speed_bonus DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    upgrade_cost BIGINT NOT NULL DEFAULT 0,
    unlock_player_level SMALLINT NOT NULL DEFAULT 1,
    description VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (quality_id, star_level),
    CONSTRAINT fk_star_quality FOREIGN KEY (quality_id)
      REFERENCES land_quality (quality_id),
    CONSTRAINT chk_star_yield_bonus CHECK (yield_bonus >= 0.0 AND yield_bonus <= 10.0),
    CONSTRAINT chk_star_speed_bonus CHECK (speed_bonus >= 0.0 AND speed_bonus <= 10.0),
    CONSTRAINT chk_star_level_range CHECK (star_level >= 1 AND star_level <= 5)
);

COMMENT ON TABLE land_quality_star IS '地块品质星级配置表——每种品质各有5个星级';
COMMENT ON COLUMN land_quality_star.quality_id IS '所属品质ID(1-8)';
COMMENT ON COLUMN land_quality_star.star_level IS '星级等级(1-5)';
COMMENT ON COLUMN land_quality_star.star_name IS '星级名称（如"★☆☆☆☆"）';
COMMENT ON COLUMN land_quality_star.yield_bonus IS '该星级产量额外加成（叠加品质基础倍率）';
COMMENT ON COLUMN land_quality_star.speed_bonus IS '该星级速度额外加成（叠加品质基础倍率）';
COMMENT ON COLUMN land_quality_star.upgrade_cost IS '升级到该星级所需农场币';
COMMENT ON COLUMN land_quality_star.unlock_player_level IS '升级到该星级所需玩家等级';
COMMENT ON COLUMN land_quality_star.description IS '星级描述';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_land_quality_star_updated_at ON land_quality_star;
CREATE TRIGGER update_land_quality_star_updated_at
    BEFORE UPDATE ON land_quality_star
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '地块品质星级配置表创建成功！'
