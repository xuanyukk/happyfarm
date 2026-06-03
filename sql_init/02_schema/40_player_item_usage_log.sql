-- ============================================
-- 文件名: 40_player_item_usage_log.sql
-- 作者: SOLO
-- 日期: 2026-05-31
-- 版本: v1.0.0
-- 功能描述: 玩家道具使用日志表 - 记录所有道具使用情况
-- 执行顺序: 02-40
-- 依赖关系: 02-11_player_base.sql, 02-09_item_config.sql
-- 用途: 数据分析和防作弊审查
-- ============================================

CREATE TABLE IF NOT EXISTS player_item_usage_log (
    id BIGSERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    item_id INTEGER NOT NULL,
    item_name VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    usage_scene VARCHAR(50) NOT NULL,
    land_num SMALLINT DEFAULT NULL,
    result VARCHAR(100) DEFAULT NULL,
    effect_detail JSONB DEFAULT NULL,
    inventory_before INTEGER DEFAULT NULL,
    inventory_after INTEGER DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_usage_log_player FOREIGN KEY (player_id) REFERENCES player_base (player_id),
    CONSTRAINT fk_item_usage_log_item FOREIGN KEY (item_id) REFERENCES item_config (item_id)
);

COMMENT ON TABLE player_item_usage_log IS '开心农场-玩家道具使用日志表';
COMMENT ON COLUMN player_item_usage_log.id IS '日志记录ID';
COMMENT ON COLUMN player_item_usage_log.player_id IS '玩家ID';
COMMENT ON COLUMN player_item_usage_log.item_id IS '道具ID（关联item_config）';
COMMENT ON COLUMN player_item_usage_log.item_name IS '道具名称（冗余存储，便于查询）';
COMMENT ON COLUMN player_item_usage_log.quantity IS '使用数量';
COMMENT ON COLUMN player_item_usage_log.usage_scene IS '使用场景：farm_land=地块使用, inventory=背包使用, quick_use=快捷使用, task_reward=任务奖励, achievement=成就奖励';
COMMENT ON COLUMN player_item_usage_log.land_num IS '目标地块编号（地块使用时）';
COMMENT ON COLUMN player_item_usage_log.result IS '使用结果：success=成功, failed=失败, expired=已过期, insufficient=数量不足';
COMMENT ON COLUMN player_item_usage_log.effect_detail IS '效果详情JSON：{boost_type, boost_value, end_time, land_count}';
COMMENT ON COLUMN player_item_usage_log.inventory_before IS '使用前背包数量';
COMMENT ON COLUMN player_item_usage_log.inventory_after IS '使用后背包数量';
COMMENT ON COLUMN player_item_usage_log.ip_address IS '客户端IP地址';
COMMENT ON COLUMN player_item_usage_log.user_agent IS '客户端User-Agent';
COMMENT ON COLUMN player_item_usage_log.create_time IS '使用时间';

CREATE INDEX IF NOT EXISTS idx_item_usage_log_player ON player_item_usage_log (player_id);
CREATE INDEX IF NOT EXISTS idx_item_usage_log_item ON player_item_usage_log (item_id);
CREATE INDEX IF NOT EXISTS idx_item_usage_log_scene ON player_item_usage_log (usage_scene);
CREATE INDEX IF NOT EXISTS idx_item_usage_log_result ON player_item_usage_log (result);
CREATE INDEX IF NOT EXISTS idx_item_usage_log_time ON player_item_usage_log (create_time);
CREATE INDEX IF NOT EXISTS idx_item_usage_log_player_item ON player_item_usage_log (player_id, item_id);
CREATE INDEX IF NOT EXISTS idx_item_usage_log_player_time ON player_item_usage_log (player_id, create_time DESC);

\echo '玩家道具使用日志表创建成功！'