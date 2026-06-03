-- ============================================
-- 文件名: 38_item_drop_config.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.69.0
-- 功能描述: 道具掉落配置表
-- 执行顺序: 02-38
-- 依赖关系: 02-09_item_config.sql, 02-07_crop.sql
-- 更新记录:
--   2026-05-31 - v4.69.0 - 新增plant/event来源类型，扩展掉落场景覆盖
-- ============================================

CREATE TABLE IF NOT EXISTS item_drop_config (
    drop_id SERIAL PRIMARY KEY,
    source_type VARCHAR(20) NOT NULL,
    source_id INTEGER DEFAULT NULL,
    item_id INTEGER NOT NULL,
    drop_rate DECIMAL(5,4) NOT NULL DEFAULT 0.01,
    min_count INTEGER NOT NULL DEFAULT 1,
    max_count INTEGER NOT NULL DEFAULT 1,
    quality_min INTEGER NOT NULL DEFAULT 1,
    world_level_min INTEGER NOT NULL DEFAULT 1,
    player_level_min INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_item_drop_source_type CHECK (
        source_type IN ('harvest', 'plant', 'quest', 'event', 'achievement', 'daily_task')
    ),
    CONSTRAINT chk_item_drop_rate CHECK (
        drop_rate > 0 AND drop_rate <= 1.0
    ),
    CONSTRAINT chk_item_drop_count CHECK (
        min_count > 0 AND max_count >= min_count
    ),
    CONSTRAINT fk_item_drop_item
        FOREIGN KEY (item_id) REFERENCES item_config(item_id)
        ON DELETE CASCADE
);

COMMENT ON TABLE item_drop_config IS '开心农场-道具掉落配置表';
COMMENT ON COLUMN item_drop_config.source_type IS '掉落来源类型：harvest=收获 quest=任务 event=活动 achievement=成就 daily_task=每日任务';
COMMENT ON COLUMN item_drop_config.source_id IS '掉落来源ID（作物ID/任务ID/活动ID等）';
COMMENT ON COLUMN item_drop_config.item_id IS '掉落道具ID';
COMMENT ON COLUMN item_drop_config.drop_rate IS '掉落概率(0-1)';
COMMENT ON COLUMN item_drop_config.min_count IS '最少掉落数量';
COMMENT ON COLUMN item_drop_config.max_count IS '最多掉落数量';
COMMENT ON COLUMN item_drop_config.quality_min IS '最低地块品质要求(1=普通)';
COMMENT ON COLUMN item_drop_config.world_level_min IS '最低世界等级要求';
COMMENT ON COLUMN item_drop_config.player_level_min IS '最低玩家等级要求';

CREATE INDEX IF NOT EXISTS idx_item_drop_source
    ON item_drop_config (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_item_drop_item
    ON item_drop_config (item_id);

DROP TRIGGER IF EXISTS update_item_drop_config_updated_at ON item_drop_config;
CREATE TRIGGER update_item_drop_config_updated_at
    BEFORE UPDATE ON item_drop_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '道具掉落配置表创建成功！'