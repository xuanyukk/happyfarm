-- ============================================
-- 文件名: 15_player_land_status.sql
-- 作者: Trae AI
-- 日期: 2026-05-13
-- 版本: v2.8.0
-- 功能描述: 玩家私有地块状态表(核心)，含产量加速结束时间字段
-- 执行顺序: 02-15
-- 依赖关系: 02-14_player_inventory.sql
-- 更新记录:
--   2026-06-09 - v2.7.0 - 时间字段命名统一：update_time→updated_at
--   2026-06-11 - v2.8.0 - D4修复：添加fertilizer_multiplier和last_fertilized_at字段（超级肥料包功能）
-- ============================================

CREATE TABLE IF NOT EXISTS player_land_status (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    land_num SMALLINT NOT NULL,
    is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    current_quality SMALLINT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'idle',
    crop_id SMALLINT DEFAULT NULL,
    planted_time TIMESTAMP DEFAULT NULL,
    harvest_time TIMESTAMP DEFAULT NULL,
    last_harvest_time TIMESTAMP DEFAULT NULL,
    unlock_time TIMESTAMP DEFAULT NULL,
    cover_time TIMESTAMP DEFAULT NULL,
    notified_mature BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    yield_boost DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    speed_boost DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    speed_boost_end_time TIMESTAMP DEFAULT NULL,
    yield_boost_end_time TIMESTAMP DEFAULT NULL,
    star_level SMALLINT NOT NULL DEFAULT 1,
    lucky_seed_active BOOLEAN NOT NULL DEFAULT FALSE,
    exp_potion_active BOOLEAN NOT NULL DEFAULT FALSE,
    -- D4修复：超级肥料包功能字段
    fertilizer_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    last_fertilized_at TIMESTAMP DEFAULT NULL,
    UNIQUE (player_id, land_num),
    CONSTRAINT chk_yield_boost_range CHECK (yield_boost >= 1.0 AND yield_boost <= 10.0),
    CONSTRAINT chk_speed_boost_range CHECK (speed_boost >= 1.0 AND speed_boost <= 10.0),
    CONSTRAINT chk_star_level CHECK (star_level >= 1 AND star_level <= 5),
    CONSTRAINT fk_land_num FOREIGN KEY (land_num) REFERENCES farm_land (land_num),
    CONSTRAINT fk_crop_id FOREIGN KEY (crop_id) REFERENCES crop (crop_id),
    CONSTRAINT fk_quality_id FOREIGN KEY (current_quality) REFERENCES land_quality (quality_id),
    -- D22修复：添加player_id外键约束
    CONSTRAINT fk_land_player FOREIGN KEY (player_id) REFERENCES player_base(player_id) ON DELETE CASCADE
);

COMMENT ON TABLE player_land_status IS '开心农场-玩家私有地块状态表(核心)';
COMMENT ON COLUMN player_land_status.id IS '主键ID';
COMMENT ON COLUMN player_land_status.player_id IS '玩家ID';
COMMENT ON COLUMN player_land_status.land_num IS '地块序号1-50';
COMMENT ON COLUMN player_land_status.is_unlocked IS '是否已解锁 0=未解锁 1=已解锁';
COMMENT ON COLUMN player_land_status.current_quality IS '当前地块品质';
COMMENT ON COLUMN player_land_status.status IS '地块状态：idle(空闲), planting(种植中), harvestable(可收获)';
COMMENT ON COLUMN player_land_status.crop_id IS '当前种植的作物ID';
COMMENT ON COLUMN player_land_status.planted_time IS '种植时间';
COMMENT ON COLUMN player_land_status.harvest_time IS '预计收获时间';
COMMENT ON COLUMN player_land_status.last_harvest_time IS '上次收获时间';
COMMENT ON COLUMN player_land_status.unlock_time IS '解锁时间';
COMMENT ON COLUMN player_land_status.cover_time IS '品质覆盖时间';
COMMENT ON COLUMN player_land_status.notified_mature IS '是否已发送成熟通知，默认为FALSE';
COMMENT ON COLUMN player_land_status.updated_at IS '更新时间';
COMMENT ON COLUMN player_land_status.yield_boost IS '产量倍率(1.0-10.0)，默认1.0，使用增产剂时调整';
COMMENT ON COLUMN player_land_status.speed_boost IS '生长速度倍率(1.0-10.0)，默认1.0，使用加速剂时调整';
COMMENT ON COLUMN player_land_status.speed_boost_end_time IS '加速效果结束时间';
COMMENT ON COLUMN player_land_status.yield_boost_end_time IS '产量加速效果结束时间';
COMMENT ON COLUMN player_land_status.star_level IS '地块当前星级(1-5)，每品质独立';
COMMENT ON COLUMN player_land_status.lucky_seed_active IS '幸运种子是否激活，使用后有50%双倍收益';
COMMENT ON COLUMN player_land_status.exp_potion_active IS '经验药水是否激活，收获时获得双倍经验';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_player_id ON player_land_status (player_id);
CREATE INDEX IF NOT EXISTS idx_land_num ON player_land_status (land_num);
CREATE INDEX IF NOT EXISTS idx_status ON player_land_status (status);
-- 复合索引：查询玩家的成熟地块（用于检查收获）
CREATE INDEX IF NOT EXISTS idx_player_status ON player_land_status (player_id, status);
-- 复合索引：查询特定玩家的特定状态和作物
CREATE INDEX IF NOT EXISTS idx_player_crop ON player_land_status (player_id, crop_id, status);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_player_land_status_updated_at ON player_land_status;
CREATE TRIGGER update_player_land_status_updated_at
    BEFORE UPDATE ON player_land_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '玩家地块状态表创建成功！'
