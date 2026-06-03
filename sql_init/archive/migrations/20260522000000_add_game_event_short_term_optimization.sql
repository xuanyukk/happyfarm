-- ============================================
-- 迁移名称: add_game_event_short_term_optimization
-- 版本: v2.0.0
-- 日期: 2026-05-22
-- 描述: 游戏活动系统短期优化 - 添加触发器和统计表
-- 影响范围: 新增 game_event_triggers/game_event_trigger_logs/game_event_stats/game_event_funnel 表
-- 回滚操作: DROP TABLE IF EXISTS game_event_funnel; DROP TABLE IF EXISTS game_event_stats; DROP TABLE IF EXISTS game_event_trigger_logs; DROP TABLE IF EXISTS game_event_triggers;
-- 依赖: 33_game_event_system.sql
-- ============================================

-- ============================================
-- 文件名: 020_add_game_event_short_term_optimization.sql
-- 作者: Trae AI
-- 日期: 2026-05-22
-- 版本: v1.0.0
-- 功能描述: 游戏活动系统短期优化 - 添加触发器和统计表
-- 执行顺序: archive/migrations/020
-- 依赖关系: 02-33_game_event_system.sql
-- 更新记录:
--   2026-05-22 - v1.0.0 - 初始创建
-- ============================================

-- 创建活动触发器表
CREATE TABLE IF NOT EXISTS game_event_triggers (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- time_based/behavior_based/threshold_based
    trigger_condition JSONB NOT NULL,
    trigger_action VARCHAR(100) NOT NULL,
    trigger_params JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_triggers IS '活动触发器表';
COMMENT ON COLUMN game_event_triggers.id IS '触发器ID';
COMMENT ON COLUMN game_event_triggers.event_id IS '活动ID';
COMMENT ON COLUMN game_event_triggers.trigger_type IS '触发器类型：time_based/behavior_based/threshold_based';
COMMENT ON COLUMN game_event_triggers.trigger_condition IS '触发条件JSON';
COMMENT ON COLUMN game_event_triggers.trigger_action IS '触发动作';
COMMENT ON COLUMN game_event_triggers.trigger_params IS '触发参数JSON';
COMMENT ON COLUMN game_event_triggers.is_active IS '是否启用';
COMMENT ON COLUMN game_event_triggers.created_at IS '创建时间';
COMMENT ON COLUMN game_event_triggers.updated_at IS '更新时间';

-- 创建触发器执行日志表
CREATE TABLE IF NOT EXISTS game_event_trigger_logs (
    id SERIAL PRIMARY KEY,
    trigger_id INTEGER REFERENCES game_event_triggers(id) ON DELETE CASCADE,
    event_id INTEGER,
    player_id VARCHAR(64),
    execution_status VARCHAR(20) NOT NULL, -- success/failed/retrying
    execution_result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_trigger_logs IS '触发器执行日志表';
COMMENT ON COLUMN game_event_trigger_logs.id IS '日志ID';
COMMENT ON COLUMN game_event_trigger_logs.trigger_id IS '触发器ID';
COMMENT ON COLUMN game_event_trigger_logs.event_id IS '活动ID';
COMMENT ON COLUMN game_event_trigger_logs.player_id IS '玩家ID';
COMMENT ON COLUMN game_event_trigger_logs.execution_status IS '执行状态：success/failed/retrying';
COMMENT ON COLUMN game_event_trigger_logs.execution_result IS '执行结果JSON';
COMMENT ON COLUMN game_event_trigger_logs.error_message IS '错误信息';
COMMENT ON COLUMN game_event_trigger_logs.retry_count IS '重试次数';
COMMENT ON COLUMN game_event_trigger_logs.created_at IS '创建时间';

-- 创建活动统计表
CREATE TABLE IF NOT EXISTS game_event_stats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    -- 参与指标
    unique_participants INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    new_participants INTEGER DEFAULT 0,
    -- 完成指标
    tasks_completed INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    -- 转化指标
    reward_claimed_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    -- 留存指标
    day1_retention DECIMAL(5,2) DEFAULT 0,
    day7_retention DECIMAL(5,2) DEFAULT 0,
    -- 创建时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, stat_date)
);

COMMENT ON TABLE game_event_stats IS '活动统计表';
COMMENT ON COLUMN game_event_stats.id IS '统计ID';
COMMENT ON COLUMN game_event_stats.event_id IS '活动ID';
COMMENT ON COLUMN game_event_stats.stat_date IS '统计日期';
COMMENT ON COLUMN game_event_stats.unique_participants IS '独立参与人数';
COMMENT ON COLUMN game_event_stats.total_participants IS '总参与人次';
COMMENT ON COLUMN game_event_stats.new_participants IS '新增参与人数';
COMMENT ON COLUMN game_event_stats.tasks_completed IS '完成任务数';
COMMENT ON COLUMN game_event_stats.completion_rate IS '完成率';
COMMENT ON COLUMN game_event_stats.reward_claimed_count IS '奖励领取数';
COMMENT ON COLUMN game_event_stats.conversion_rate IS '转化率';
COMMENT ON COLUMN game_event_stats.day1_retention IS '次日留存率';
COMMENT ON COLUMN game_event_stats.day7_retention IS '7日留存率';
COMMENT ON COLUMN game_event_stats.created_at IS '创建时间';
COMMENT ON COLUMN game_event_stats.updated_at IS '更新时间';

-- 创建活动漏斗表
CREATE TABLE IF NOT EXISTS game_event_funnel (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    funnel_step VARCHAR(50) NOT NULL,
    user_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    stat_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_funnel IS '活动漏斗表';
COMMENT ON COLUMN game_event_funnel.id IS '漏斗ID';
COMMENT ON COLUMN game_event_funnel.event_id IS '活动ID';
COMMENT ON COLUMN game_event_funnel.funnel_step IS '漏斗步骤：saw_event/clicked_event/joined_event/completed_task/claimed_reward';
COMMENT ON COLUMN game_event_funnel.user_count IS '用户数';
COMMENT ON COLUMN game_event_funnel.conversion_rate IS '转化率';
COMMENT ON COLUMN game_event_funnel.stat_date IS '统计日期';
COMMENT ON COLUMN game_event_funnel.created_at IS '创建时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_game_event_triggers_event ON game_event_triggers(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_triggers_active ON game_event_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_game_event_trigger_logs_trigger ON game_event_trigger_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_game_event_trigger_logs_created ON game_event_trigger_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_game_event_stats_event_date ON game_event_stats(event_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_game_event_funnel_event_date ON game_event_funnel(event_id, stat_date);

-- 为表创建更新时间触发器
DROP TRIGGER IF EXISTS update_game_event_triggers_updated_at ON game_event_triggers;
CREATE TRIGGER update_game_event_triggers_updated_at 
    BEFORE UPDATE ON game_event_triggers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_event_stats_updated_at ON game_event_stats;
CREATE TRIGGER update_game_event_stats_updated_at 
    BEFORE UPDATE ON game_event_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo '游戏活动系统短期优化表创建成功！'


