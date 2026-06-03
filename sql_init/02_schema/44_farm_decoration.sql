-- ============================================
-- 文件名: 44_farm_decoration.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.71.0
-- 功能描述: 农场装饰系统表组——装饰物配置、玩家拥有、放置记录、美观度
-- 执行顺序: 02-44
-- 依赖关系: 02-11_player_base.sql, 02-06_farm_land.sql, 02-09_item_config.sql
-- 更新记录:
--   2026-05-31 - v4.71.0 - 方案B：新增农场装饰系统3张表
-- ============================================

-- 装饰物拥有记录表
CREATE TABLE IF NOT EXISTS player_decoration_inventory (
    player_id VARCHAR(64) NOT NULL,
    decoration_id INT NOT NULL REFERENCES item_config(item_id),
    owned_count INT NOT NULL DEFAULT 0,
    placed_count INT NOT NULL DEFAULT 0,
    first_obtained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, decoration_id)
);

COMMENT ON TABLE player_decoration_inventory IS '开心农场-玩家装饰物拥有表';
COMMENT ON COLUMN player_decoration_inventory.decoration_id IS '关联item_config.item_id(装饰类道具ID 29-30)';
COMMENT ON COLUMN player_decoration_inventory.owned_count IS '拥有总数';
COMMENT ON COLUMN player_decoration_inventory.placed_count IS '已放置数量';

-- 装饰物放置记录表
CREATE TABLE IF NOT EXISTS farm_decoration_placement (
    placement_id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    decoration_id INT NOT NULL REFERENCES item_config(item_id),
    grid_x INT NOT NULL,
    grid_y INT NOT NULL,
    pixel_offset_x INT NOT NULL DEFAULT 0,
    pixel_offset_y INT NOT NULL DEFAULT 0,
    rotation INT NOT NULL DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
    layer_override INT DEFAULT NULL,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, grid_x, grid_y, decoration_id)
);

COMMENT ON TABLE farm_decoration_placement IS '开心农场-装饰物放置记录表';
COMMENT ON COLUMN farm_decoration_placement.grid_x IS '锚点X坐标(地块级)';
COMMENT ON COLUMN farm_decoration_placement.grid_y IS '锚点Y坐标(地块级)';
COMMENT ON COLUMN farm_decoration_placement.pixel_offset_x IS '像素级微调偏移X';
COMMENT ON COLUMN farm_decoration_placement.pixel_offset_y IS '像素级微调偏移Y';
COMMENT ON COLUMN farm_decoration_placement.rotation IS '旋转角度(0/90/180/270)';
COMMENT ON COLUMN farm_decoration_placement.layer_override IS '手动层级覆盖(NULL=自动排序)';

CREATE INDEX IF NOT EXISTS idx_placement_player
    ON farm_decoration_placement (player_id);
CREATE INDEX IF NOT EXISTS idx_placement_grid
    ON farm_decoration_placement (player_id, grid_x, grid_y);

DROP TRIGGER IF EXISTS update_farm_decoration_placement_updated_at ON farm_decoration_placement;
CREATE TRIGGER update_farm_decoration_placement_updated_at
    BEFORE UPDATE ON farm_decoration_placement
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 美观度记录表
CREATE TABLE IF NOT EXISTS farm_beauty_record (
    player_id VARCHAR(64) PRIMARY KEY,
    total_beauty_score INT NOT NULL DEFAULT 0,
    fence_count INT NOT NULL DEFAULT 0,
    decoration_count INT NOT NULL DEFAULT 0,
    enclosure_count INT NOT NULL DEFAULT 0,
    weekly_likes INT NOT NULL DEFAULT 0,
    best_weekly_rank INT NOT NULL DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE farm_beauty_record IS '开心农场-农场美观度记录表';
COMMENT ON COLUMN farm_beauty_record.total_beauty_score IS '总美观度评分';
COMMENT ON COLUMN farm_beauty_record.fence_count IS '围栏装饰物数量';
COMMENT ON COLUMN farm_beauty_record.decoration_count IS '其他装饰物总数';
COMMENT ON COLUMN farm_beauty_record.enclosure_count IS '围合区域数量';
COMMENT ON COLUMN farm_beauty_record.weekly_likes IS '本周获赞数';
COMMENT ON COLUMN farm_beauty_record.best_weekly_rank IS '历史最佳周排名';

DROP TRIGGER IF EXISTS update_farm_beauty_record_updated_at ON farm_beauty_record;
CREATE TRIGGER update_farm_beauty_record_updated_at
    BEFORE UPDATE ON farm_beauty_record
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '农场装饰系统表组创建成功！'