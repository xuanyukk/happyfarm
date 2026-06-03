-- ============================================
-- 文件名: 23_game_activity_log.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 游戏操作活动日志表 - 记录玩家在游戏中的关键操作
-- 执行顺序: 02-23
-- 依赖关系: 02-22_audit_logs.sql
-- ============================================

CREATE TABLE IF NOT EXISTS game_activity_log (
    id BIGSERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_category VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_player FOREIGN KEY (player_id) REFERENCES player_base(player_id) ON DELETE CASCADE
);

COMMENT ON TABLE game_activity_log IS '开心农场-游戏操作活动日志表';
COMMENT ON COLUMN game_activity_log.id IS '日志ID';
COMMENT ON COLUMN game_activity_log.player_id IS '玩家ID';
COMMENT ON COLUMN game_activity_log.activity_type IS '操作类型：plant(种植), harvest(收获), buy(购买), unlock(解锁), upgrade(升级), use_item(使用道具)';
COMMENT ON COLUMN game_activity_log.activity_category IS '操作分类：crop(作物), shop(商店), land(土地), item(道具)';
COMMENT ON COLUMN game_activity_log.message IS '操作描述信息';
COMMENT ON COLUMN game_activity_log.metadata IS '扩展元数据JSON';
COMMENT ON COLUMN game_activity_log.create_time IS '创建时间';

-- 创建索引
CREATE INDEX idx_game_activity_player_id ON game_activity_log(player_id);
CREATE INDEX idx_game_activity_type ON game_activity_log(activity_type);
CREATE INDEX idx_game_activity_category ON game_activity_log(activity_category);
CREATE INDEX idx_game_activity_create_time ON game_activity_log(create_time DESC);

\echo '游戏活动日志表创建成功！'
