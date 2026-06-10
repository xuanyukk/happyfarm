-- ============================================
-- 文件名: 23_game_activity_log.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v4.72.0
-- 功能描述: 游戏操作活动日志表（按月分区），记录玩家在游戏中的关键操作
-- 执行顺序: 02-23
-- 依赖关系: 02-22_audit_logs.sql
-- 更新记录:
--   2026-06-06 - v4.72.0 - 从普通表改为按月分区表，预建当前+未来3个月分区
--   2026-06-09 - v4.72.1 - message字段添加DEFAULT ''（防御性设计，防止插入失败）
-- ============================================

CREATE TABLE IF NOT EXISTS game_activity_log (
    id BIGSERIAL,
    player_id VARCHAR(64) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_category VARCHAR(30) NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    metadata JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_player FOREIGN KEY (player_id) REFERENCES player_base(player_id) ON DELETE CASCADE,
    PRIMARY KEY (id, create_time)
) PARTITION BY RANGE (create_time);

COMMENT ON TABLE game_activity_log IS '开心农场-游戏操作活动日志表（按月分区）';
COMMENT ON COLUMN game_activity_log.id IS '日志ID';
COMMENT ON COLUMN game_activity_log.player_id IS '玩家ID';
COMMENT ON COLUMN game_activity_log.activity_type IS '操作类型：plant(种植), harvest(收获), buy(购买), unlock(解锁), upgrade(升级), use_item(使用道具)';
COMMENT ON COLUMN game_activity_log.activity_category IS '操作分类：crop(作物), shop(商店), land(土地), item(道具)';
COMMENT ON COLUMN game_activity_log.message IS '操作描述信息';
COMMENT ON COLUMN game_activity_log.metadata IS '扩展元数据JSON';
COMMENT ON COLUMN game_activity_log.create_time IS '创建时间';

-- ============================================
-- 预创建当前及未来3个月分区
-- ============================================

CREATE TABLE game_activity_log_2026_06 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE game_activity_log_2026_07 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE game_activity_log_2026_08 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE game_activity_log_2026_09 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- ============================================
-- 分区索引（在父表上创建，自动继承到所有分区）
-- ============================================

CREATE INDEX IF NOT EXISTS idx_game_activity_player_id ON game_activity_log(player_id);
CREATE INDEX IF NOT EXISTS idx_game_activity_type ON game_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_game_activity_category ON game_activity_log(activity_category);
CREATE INDEX IF NOT EXISTS idx_game_activity_create_time ON game_activity_log(create_time DESC);

\echo '游戏活动日志表（按月分区）创建成功！'