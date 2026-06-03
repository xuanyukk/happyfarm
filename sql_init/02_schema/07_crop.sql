-- ============================================
-- 文件名: 07_crop.sql
-- 作者: Trae AI
-- 日期: 2026-05-13
-- 版本: v2.5.0
-- 功能描述: 作物公共配置表(分阶段解锁)
-- 执行顺序: 02-07
-- 依赖关系: 02-06_farm_land.sql
-- ============================================

CREATE TABLE IF NOT EXISTS crop (
    crop_id SERIAL PRIMARY KEY,
    crop_name VARCHAR(50) NOT NULL,
    world_id SMALLINT NOT NULL,
    unlock_player_level SMALLINT NOT NULL DEFAULT 1,
    unlock_farm_level SMALLINT NOT NULL DEFAULT 1,
    growth_cycle INTEGER NOT NULL,
    base_yield INTEGER NOT NULL,
    min_yield INTEGER NOT NULL DEFAULT 1,
    max_yield INTEGER NOT NULL DEFAULT 1,
    sell_price BIGINT NOT NULL,
    seed_cost BIGINT NOT NULL,
    gp_per_min DECIMAL(10,2) NOT NULL,
    crop_type VARCHAR(20) NOT NULL,
    unlock_desc VARCHAR(200) NOT NULL,
    player_exp_base INTEGER NOT NULL DEFAULT 1,
    farm_exp_base INTEGER NOT NULL DEFAULT 1,
    world_exp_base INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (growth_cycle >= 3),
    CHECK (gp_per_min <= 100),
    CHECK (min_yield > 0),
    CHECK (max_yield >= min_yield),
    CONSTRAINT fk_crop_world FOREIGN KEY (world_id) REFERENCES world_level (world_id)
);

COMMENT ON TABLE crop IS '开心农场-作物公共配置表';
COMMENT ON COLUMN crop.crop_id IS '作物ID';
COMMENT ON COLUMN crop.crop_name IS '作物名称';
COMMENT ON COLUMN crop.world_id IS '解锁世界等级';
COMMENT ON COLUMN crop.unlock_player_level IS '解锁所需玩家等级';
COMMENT ON COLUMN crop.unlock_farm_level IS '解锁所需农场等级';
COMMENT ON COLUMN crop.growth_cycle IS '生长周期(分钟)';
COMMENT ON COLUMN crop.base_yield IS '基础产量';
COMMENT ON COLUMN crop.min_yield IS '最小产量';
COMMENT ON COLUMN crop.max_yield IS '最大产量';
COMMENT ON COLUMN crop.sell_price IS '出售单价(农场币)';
COMMENT ON COLUMN crop.seed_cost IS '种子成本(农场币)';
COMMENT ON COLUMN crop.gp_per_min IS '单位时间收益(GP/min)';
COMMENT ON COLUMN crop.crop_type IS '作物类型：basic(基础), economic(经济), rare(稀有), top(顶级)';
COMMENT ON COLUMN crop.unlock_desc IS '解锁说明';
COMMENT ON COLUMN crop.player_exp_base IS '玩家等级基础经验值';
COMMENT ON COLUMN crop.farm_exp_base IS '农场等级基础经验值';
COMMENT ON COLUMN crop.world_exp_base IS '世界等级基础经验值';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_world_id ON crop (world_id);
CREATE INDEX IF NOT EXISTS idx_gp_per_min ON crop (gp_per_min);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_crop_updated_at ON crop;
CREATE TRIGGER update_crop_updated_at
    BEFORE UPDATE ON crop
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '作物公共配置表创建成功！'
