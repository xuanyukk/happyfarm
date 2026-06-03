-- ============================================
-- 文件名: 41_player_combo_tracker.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.71.0
-- 功能描述: 玩家连击追踪表——记录连续登录/任务/收获/种植连击数据
-- 执行顺序: 02-41
-- 依赖关系: 02-11_player_base.sql, 02-28_achievement_system.sql
-- 更新记录:
--   2026-05-31 - v4.71.0 - 方案B：新增连击追踪表
-- ============================================

CREATE TABLE IF NOT EXISTS player_combo_tracker (
    player_id VARCHAR(64) PRIMARY KEY,
    login_combo_days INT NOT NULL DEFAULT 0,
    task_combo_days INT NOT NULL DEFAULT 0,
    full_task_combo_days INT NOT NULL DEFAULT 0,
    last_login_date DATE,
    last_task_date DATE,
    last_full_task_date DATE,
    session_harvest_combo INT NOT NULL DEFAULT 0,
    session_plant_combo INT NOT NULL DEFAULT 0,
    last_harvest_time TIMESTAMP WITH TIME ZONE,
    last_plant_time TIMESTAMP WITH TIME ZONE,
    perfect_operation_combo INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE player_combo_tracker IS '开心农场-玩家连击追踪表';
COMMENT ON COLUMN player_combo_tracker.login_combo_days IS '连续登录天数';
COMMENT ON COLUMN player_combo_tracker.task_combo_days IS '连续完成≥3个每日任务天数';
COMMENT ON COLUMN player_combo_tracker.full_task_combo_days IS '连续完成全部每日任务天数';
COMMENT ON COLUMN player_combo_tracker.last_login_date IS '上次登录日期';
COMMENT ON COLUMN player_combo_tracker.last_task_date IS '上次完成任务日期';
COMMENT ON COLUMN player_combo_tracker.last_full_task_date IS '上次全部完成任务日期';
COMMENT ON COLUMN player_combo_tracker.session_harvest_combo IS '当前会话连续收获次数';
COMMENT ON COLUMN player_combo_tracker.session_plant_combo IS '当前会话连续种植次数';
COMMENT ON COLUMN player_combo_tracker.last_harvest_time IS '上次收获时间';
COMMENT ON COLUMN player_combo_tracker.last_plant_time IS '上次种植时间';
COMMENT ON COLUMN player_combo_tracker.perfect_operation_combo IS '连续完美操作次数（未枯死/未超时）';

DROP TRIGGER IF EXISTS update_player_combo_tracker_updated_at ON player_combo_tracker;
CREATE TRIGGER update_player_combo_tracker_updated_at
    BEFORE UPDATE ON player_combo_tracker
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '玩家连击追踪表创建成功！'