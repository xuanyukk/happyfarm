-- ============================================
-- 文件名: 33_game_event_system.sql
-- 作者: Trae AI
-- 日期: 2026-05-22
-- 版本: v3.0.0
-- 功能描述: 游戏活动管理系统数据表（含短中期优化）
-- 执行顺序: 02-33
-- 依赖关系: 02-29_admin_system.sql
-- 更新记录:
--   2026-05-19 - v2.7.1 - 修复外键引用错误，从 admins 表改为 sys_user 表
--   2026-05-22 - v3.0.0 - 添加活动触发器、统计、模板系统、定时任务等短中期优化
-- ============================================

-- 创建活动模板表
CREATE TABLE IF NOT EXISTS game_event_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL, -- 活动类型：daily/weekly/holiday/seasonal/special
    description TEXT,
    template_config JSONB NOT NULL, -- 活动模板配置
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_templates IS '游戏活动模板表';
COMMENT ON COLUMN game_event_templates.id IS '模板ID';
COMMENT ON COLUMN game_event_templates.template_name IS '模板名称';
COMMENT ON COLUMN game_event_templates.template_type IS '模板类型：daily/weekly/holiday/seasonal/special';
COMMENT ON COLUMN game_event_templates.description IS '模板描述';
COMMENT ON COLUMN game_event_templates.template_config IS '模板配置JSON';
COMMENT ON COLUMN game_event_templates.is_active IS '是否启用';
COMMENT ON COLUMN game_event_templates.created_by IS '创建者ID';
COMMENT ON COLUMN game_event_templates.created_at IS '创建时间';
COMMENT ON COLUMN game_event_templates.updated_at IS '更新时间';

-- 创建活动表
CREATE TABLE IF NOT EXISTS game_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    event_banner VARCHAR(500), -- 活动横幅图片
    template_id INTEGER REFERENCES game_event_templates(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    event_config JSONB NOT NULL, -- 活动配置
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_events IS '游戏活动表';
COMMENT ON COLUMN game_events.id IS '活动ID';
COMMENT ON COLUMN game_events.event_name IS '活动名称';
COMMENT ON COLUMN game_events.event_type IS '活动类型';
COMMENT ON COLUMN game_events.event_description IS '活动描述';
COMMENT ON COLUMN game_events.event_banner IS '活动横幅图片URL';
COMMENT ON COLUMN game_events.template_id IS '关联模板ID';
COMMENT ON COLUMN game_events.start_time IS '开始时间';
COMMENT ON COLUMN game_events.end_time IS '结束时间';
COMMENT ON COLUMN game_events.event_config IS '活动配置JSON';
COMMENT ON COLUMN game_events.is_active IS '是否启用';
COMMENT ON COLUMN game_events.created_by IS '创建者ID（管理员）';
COMMENT ON COLUMN game_events.created_at IS '创建时间';
COMMENT ON COLUMN game_events.updated_at IS '更新时间';

-- 创建活动任务表
CREATE TABLE IF NOT EXISTS game_event_tasks (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 任务类型：harvest/plant/sell/buy/use_item/unlock/upgrade
    task_description TEXT,
    task_target INTEGER NOT NULL, -- 任务目标值
    task_rewards JSONB NOT NULL, -- 任务奖励
    task_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_tasks IS '游戏活动任务表';
COMMENT ON COLUMN game_event_tasks.id IS '任务ID';
COMMENT ON COLUMN game_event_tasks.event_id IS '活动ID';
COMMENT ON COLUMN game_event_tasks.task_name IS '任务名称';
COMMENT ON COLUMN game_event_tasks.task_type IS '任务类型：harvest/plant/sell/buy/use_item/unlock/upgrade';
COMMENT ON COLUMN game_event_tasks.task_description IS '任务描述';
COMMENT ON COLUMN game_event_tasks.task_target IS '任务目标值';
COMMENT ON COLUMN game_event_tasks.task_rewards IS '任务奖励JSON';
COMMENT ON COLUMN game_event_tasks.task_order IS '任务排序';
COMMENT ON COLUMN game_event_tasks.is_active IS '是否启用';
COMMENT ON COLUMN game_event_tasks.created_at IS '创建时间';
COMMENT ON COLUMN game_event_tasks.updated_at IS '更新时间';

-- 创建玩家活动进度表
CREATE TABLE IF NOT EXISTS player_event_progress (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) REFERENCES player_base(player_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES game_event_tasks(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    is_rewarded BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, event_id, task_id)
);

COMMENT ON TABLE player_event_progress IS '玩家活动进度表';
COMMENT ON COLUMN player_event_progress.id IS '进度ID';
COMMENT ON COLUMN player_event_progress.player_id IS '玩家ID';
COMMENT ON COLUMN player_event_progress.event_id IS '活动ID';
COMMENT ON COLUMN player_event_progress.task_id IS '任务ID';
COMMENT ON COLUMN player_event_progress.progress IS '当前进度';
COMMENT ON COLUMN player_event_progress.is_completed IS '是否完成';
COMMENT ON COLUMN player_event_progress.is_rewarded IS '是否已领取奖励';
COMMENT ON COLUMN player_event_progress.completed_at IS '完成时间';
COMMENT ON COLUMN player_event_progress.created_at IS '创建时间';
COMMENT ON COLUMN player_event_progress.updated_at IS '更新时间';

-- 创建活动奖励记录表
CREATE TABLE IF NOT EXISTS game_event_rewards (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) REFERENCES player_base(player_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES game_event_tasks(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL, -- 奖励类型：currency/item/exp
    reward_data JSONB NOT NULL, -- 奖励数据
    distributed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_rewards IS '游戏活动奖励记录表';
COMMENT ON COLUMN game_event_rewards.id IS '记录ID';
COMMENT ON COLUMN game_event_rewards.player_id IS '玩家ID';
COMMENT ON COLUMN game_event_rewards.event_id IS '活动ID';
COMMENT ON COLUMN game_event_rewards.task_id IS '任务ID';
COMMENT ON COLUMN game_event_rewards.reward_type IS '奖励类型：currency/item/exp';
COMMENT ON COLUMN game_event_rewards.reward_data IS '奖励数据JSON';
COMMENT ON COLUMN game_event_rewards.distributed_at IS '发放时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_game_events_start_end ON game_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_game_events_active ON game_events(is_active);
CREATE INDEX IF NOT EXISTS idx_game_event_tasks_event ON game_event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_player_event_progress_player ON player_event_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_player_event_progress_event ON player_event_progress(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_rewards_player ON game_event_rewards(player_id);

-- 为表创建更新时间触发器
DROP TRIGGER IF EXISTS update_game_event_templates_updated_at ON game_event_templates;
CREATE TRIGGER update_game_event_templates_updated_at 
    BEFORE UPDATE ON game_event_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_events_updated_at ON game_events;
CREATE TRIGGER update_game_events_updated_at 
    BEFORE UPDATE ON game_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_event_tasks_updated_at ON game_event_tasks;
CREATE TRIGGER update_game_event_tasks_updated_at 
    BEFORE UPDATE ON game_event_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_event_progress_updated_at ON player_event_progress;
CREATE TRIGGER update_player_event_progress_updated_at 
    BEFORE UPDATE ON player_event_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 短期优化：活动触发器和统计系统
-- ============================================

-- 活动触发器表
CREATE TABLE IF NOT EXISTS game_event_triggers (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- 类型：time/behavior/stat_threshold
    trigger_name VARCHAR(255) NOT NULL,
    trigger_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_triggers IS '活动触发器表';
COMMENT ON COLUMN game_event_triggers.id IS '触发器ID';
COMMENT ON COLUMN game_event_triggers.event_id IS '活动ID';
COMMENT ON COLUMN game_event_triggers.trigger_type IS '触发器类型';
COMMENT ON COLUMN game_event_triggers.trigger_name IS '触发器名称';
COMMENT ON COLUMN game_event_triggers.trigger_config IS '触发器配置';
COMMENT ON COLUMN game_event_triggers.is_active IS '是否启用';

-- 触发器执行日志表
CREATE TABLE IF NOT EXISTS game_event_trigger_logs (
    id SERIAL PRIMARY KEY,
    trigger_id INTEGER REFERENCES game_event_triggers(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    trigger_result JSONB,
    status VARCHAR(20) NOT NULL, -- success/failed/skipped
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_trigger_logs IS '触发器执行日志表';
COMMENT ON COLUMN game_event_trigger_logs.id IS '日志ID';
COMMENT ON COLUMN game_event_trigger_logs.trigger_id IS '触发器ID';
COMMENT ON COLUMN game_event_trigger_logs.event_id IS '活动ID';
COMMENT ON COLUMN game_event_trigger_logs.trigger_result IS '触发结果';
COMMENT ON COLUMN game_event_trigger_logs.status IS '执行状态';
COMMENT ON COLUMN game_event_trigger_logs.error_message IS '错误信息';

-- 活动统计表
CREATE TABLE IF NOT EXISTS game_event_stats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    participation_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    avg_progress DECIMAL(10,2) DEFAULT 0,
    total_rewards_distributed JSONB,
    conversion_rate DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, stat_date)
);

COMMENT ON TABLE game_event_stats IS '活动统计表';
COMMENT ON COLUMN game_event_stats.id IS '统计ID';
COMMENT ON COLUMN game_event_stats.event_id IS '活动ID';
COMMENT ON COLUMN game_event_stats.stat_date IS '统计日期';
COMMENT ON COLUMN game_event_stats.participation_count IS '参与人数';
COMMENT ON COLUMN game_event_stats.completion_count IS '完成人数';
COMMENT ON COLUMN game_event_stats.avg_progress IS '平均进度';
COMMENT ON COLUMN game_event_stats.total_rewards_distributed IS '总奖励发放';
COMMENT ON COLUMN game_event_stats.conversion_rate IS '转化率';

-- 活动漏斗分析表
CREATE TABLE IF NOT EXISTS game_event_funnel (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_order INTEGER NOT NULL,
    user_count INTEGER DEFAULT 0,
    dropoff_rate DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, stat_date, step_order)
);

COMMENT ON TABLE game_event_funnel IS '活动漏斗分析表';
COMMENT ON COLUMN game_event_funnel.id IS '漏斗ID';
COMMENT ON COLUMN game_event_funnel.event_id IS '活动ID';
COMMENT ON COLUMN game_event_funnel.stat_date IS '统计日期';
COMMENT ON COLUMN game_event_funnel.step_name IS '步骤名称';
COMMENT ON COLUMN game_event_funnel.step_order IS '步骤顺序';
COMMENT ON COLUMN game_event_funnel.user_count IS '用户数';
COMMENT ON COLUMN game_event_funnel.dropoff_rate IS '流失率';

-- ============================================
-- 中期规划：活动模板系统和定时任务
-- ============================================

-- 模板版本历史表
CREATE TABLE IF NOT EXISTS game_event_template_versions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES game_event_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    template_config JSONB NOT NULL,
    change_log TEXT,
    created_by INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_template_versions IS '活动模板版本历史表';
COMMENT ON COLUMN game_event_template_versions.id IS '版本ID';
COMMENT ON COLUMN game_event_template_versions.template_id IS '模板ID';
COMMENT ON COLUMN game_event_template_versions.version IS '版本号';
COMMENT ON COLUMN game_event_template_versions.template_config IS '模板配置';
COMMENT ON COLUMN game_event_template_versions.change_log IS '变更记录';
COMMENT ON COLUMN game_event_template_versions.created_by IS '创建者ID';

-- 模板变量表
CREATE TABLE IF NOT EXISTS game_event_template_variables (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES game_event_templates(id) ON DELETE CASCADE,
    variable_name VARCHAR(100) NOT NULL,
    variable_type VARCHAR(50) NOT NULL, -- string/number/date/select
    default_value TEXT,
    is_required BOOLEAN DEFAULT true,
    description TEXT,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_template_variables IS '活动模板变量表';
COMMENT ON COLUMN game_event_template_variables.id IS '变量ID';
COMMENT ON COLUMN game_event_template_variables.template_id IS '模板ID';
COMMENT ON COLUMN game_event_template_variables.variable_name IS '变量名';
COMMENT ON COLUMN game_event_template_variables.variable_type IS '变量类型';
COMMENT ON COLUMN game_event_template_variables.default_value IS '默认值';
COMMENT ON COLUMN game_event_template_variables.is_required IS '是否必填';
COMMENT ON COLUMN game_event_template_variables.description IS '描述';
COMMENT ON COLUMN game_event_template_variables.options IS '选项配置';

-- 定时任务表
CREATE TABLE IF NOT EXISTS game_event_scheduled_tasks (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL, -- event_start/event_end/daily_reset/weekly_reset/stats_compute
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    cron_expression VARCHAR(100),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    task_config JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending/running/completed/failed/cancelled
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_scheduled_tasks IS '定时任务表';
COMMENT ON COLUMN game_event_scheduled_tasks.id IS '任务ID';
COMMENT ON COLUMN game_event_scheduled_tasks.task_type IS '任务类型';
COMMENT ON COLUMN game_event_scheduled_tasks.event_id IS '活动ID';
COMMENT ON COLUMN game_event_scheduled_tasks.cron_expression IS 'Cron表达式';
COMMENT ON COLUMN game_event_scheduled_tasks.scheduled_time IS '预定执行时间';
COMMENT ON COLUMN game_event_scheduled_tasks.task_config IS '任务配置';
COMMENT ON COLUMN game_event_scheduled_tasks.status IS '任务状态';
COMMENT ON COLUMN game_event_scheduled_tasks.retry_count IS '重试次数';
COMMENT ON COLUMN game_event_scheduled_tasks.max_retries IS '最大重试次数';
COMMENT ON COLUMN game_event_scheduled_tasks.last_error IS '最后错误';

-- 定时任务执行日志表
CREATE TABLE IF NOT EXISTS game_event_task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES game_event_scheduled_tasks(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- success/failed
    execution_result JSONB,
    error_message TEXT,
    execution_duration_ms INTEGER,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_task_logs IS '任务执行日志表';
COMMENT ON COLUMN game_event_task_logs.id IS '日志ID';
COMMENT ON COLUMN game_event_task_logs.task_id IS '任务ID';
COMMENT ON COLUMN game_event_task_logs.status IS '执行状态';
COMMENT ON COLUMN game_event_task_logs.execution_result IS '执行结果';
COMMENT ON COLUMN game_event_task_logs.error_message IS '错误信息';
COMMENT ON COLUMN game_event_task_logs.execution_duration_ms IS '执行耗时(ms)';

-- 创建新的索引
CREATE INDEX IF NOT EXISTS idx_game_event_triggers_event ON game_event_triggers(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_trigger_logs_trigger ON game_event_trigger_logs(trigger_id);
CREATE INDEX IF NOT EXISTS idx_game_event_trigger_logs_event ON game_event_trigger_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_stats_event ON game_event_stats(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_funnel_event ON game_event_funnel(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_template_versions_template ON game_event_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_game_event_template_variables_template ON game_event_template_variables(template_id);
CREATE INDEX IF NOT EXISTS idx_game_event_scheduled_tasks_status ON game_event_scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_game_event_scheduled_tasks_event ON game_event_scheduled_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_scheduled_tasks_time ON game_event_scheduled_tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_game_event_task_logs_task ON game_event_task_logs(task_id);

-- 为新表创建更新时间触发器
DROP TRIGGER IF EXISTS update_game_event_triggers_updated_at ON game_event_triggers;
CREATE TRIGGER update_game_event_triggers_updated_at 
    BEFORE UPDATE ON game_event_triggers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_event_stats_updated_at ON game_event_stats;
CREATE TRIGGER update_game_event_stats_updated_at 
    BEFORE UPDATE ON game_event_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_event_scheduled_tasks_updated_at ON game_event_scheduled_tasks;
CREATE TRIGGER update_game_event_scheduled_tasks_updated_at 
    BEFORE UPDATE ON game_event_scheduled_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo '游戏活动管理系统表创建成功！'
\echo '  - 含活动触发器、统计系统（短期优化）'
\echo '  - 含模板系统、定时任务（中期规划）'
