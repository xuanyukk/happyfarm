-- ============================================
-- 迁移名称: performance_optimization_indexes
-- 版本: v2.0.0
-- 日期: 2026-05-12
-- 描述: 性能优化 - 添加额外索引提升查询性能
-- 影响范围: 多个表新增优化索引（玩家作物、活动日志、公告、审计日志、玩家基础、游戏事件等）
-- 回滚操作: 多个 DROP INDEX 操作（需根据实际创建的索引逐条回滚）
-- 依赖: 所有已创建的业务表
-- ============================================

-- 为农场核心业务表添加优化索引

-- 1. 玩家作物表优化索引
-- 优化按玩家查询作物的性能
CREATE INDEX IF NOT EXISTS idx_player_crop_unlock_player ON player_crop_unlock (player_id, crop_id);

-- 2. 游戏活动表优化索引
CREATE INDEX IF NOT EXISTS idx_game_activity_log_type_time ON game_activity_log (activity_type, create_time);
CREATE INDEX IF NOT EXISTS idx_game_activity_log_player_time ON game_activity_log (player_id, create_time DESC);

-- 3. 公告系统优化索引
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements (is_published DESC, publish_time DESC);

-- 4. 审计日志优化索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at DESC);

-- 5. 玩家基础表优化索引
CREATE INDEX IF NOT EXISTS idx_player_level ON player_base (level DESC, experience DESC);
CREATE INDEX IF NOT EXISTS idx_player_last_login ON player_base (last_login_time DESC);

-- 6. 作物表优化索引（如果存在作物种植记录表）
-- 优化作物收获查询
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'player_crop_status') THEN
        CREATE INDEX IF NOT EXISTS idx_crop_status_player_land ON player_crop_status (player_id, land_num);
        CREATE INDEX IF NOT EXISTS idx_crop_status_harvest_time ON player_crop_status (harvest_time ASC);
    END IF;
END $$;

-- 7. 游戏事件系统优化索引
CREATE INDEX IF NOT EXISTS idx_game_events_active ON game_events (is_active DESC, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_game_event_participants ON game_event_participants (event_id, player_id);

-- 8. 备份记录表优化索引
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_records') THEN
        CREATE INDEX IF NOT EXISTS idx_backup_created ON backup_records (created_at DESC);
    END IF;
END $$;

-- 9. 刷新令牌表优化索引
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens (expires_at ASC);

-- 10. 双因素认证表优化索引
CREATE INDEX IF NOT EXISTS idx_two_factor_user ON two_factor_auth (user_id, is_enabled DESC);

-- 创建一个查询来检查索引使用情况（用于性能监控）
COMMENT ON INDEX idx_player_land_status IS '优化玩家地块状态查询';
COMMENT ON INDEX idx_player_item IS '优化玩家库存查询';
COMMENT ON INDEX idx_player_currency_log IS '优化玩家货币日志查询';
COMMENT ON INDEX idx_player_behavior IS '优化玩家行为日志查询';
COMMENT ON INDEX idx_alert_status IS '优化系统预警查询';

\echo '性能优化索引添加成功！'

