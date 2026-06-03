-- ============================================
-- 迁移名称: add_game_event_medium_term
-- 版本: v2.0.0
-- 日期: 2026-05-22
-- 描述: 游戏活动系统中期优化 - 活动模板系统和定时任务
-- 影响范围: game_event_templates表增强，新增 game_event_template_versions/game_event_template_variables/game_event_scheduled_tasks/game_event_task_logs 表
-- 回滚操作: DROP TABLE IF EXISTS game_event_task_logs; DROP TABLE IF EXISTS game_event_scheduled_tasks; DROP TABLE IF EXISTS game_event_template_variables; DROP TABLE IF EXISTS game_event_template_versions;
-- 依赖: 33_game_event_system.sql
-- ============================================

-- ============================================
-- 文件名: 021_add_game_event_medium_term.sql
-- 作者: Trae AI
-- 日期: 2026-05-22
-- 版本: v1.0.0
-- 功能描述: 游戏活动系统中期优化 - 活动模板系统和定时任务
-- 执行顺序: archive/migrations/021
-- 依赖关系: 02-33_game_event_system.sql
-- ============================================

-- 活动模板表 (已存在基础结构，增强)
ALTER TABLE game_event_templates ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'custom';
ALTER TABLE game_event_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE game_event_templates ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES sys_user(id);

-- 模板版本历史表
CREATE TABLE IF NOT EXISTS game_event_template_versions (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES game_event_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    template_config JSONB NOT NULL,
    change_log TEXT,
    created_by INTEGER REFERENCES sys_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_template_versions IS '活动模板版本历史表';
COMMENT ON COLUMN game_event_template_versions.template_id IS '模板ID';
COMMENT ON COLUMN game_event_template_versions.version IS '版本号';
COMMENT ON COLUMN game_event_template_versions.template_config IS '模板配置JSON';
COMMENT ON COLUMN game_event_template_versions.change_log IS '变更记录';
COMMENT ON COLUMN game_event_template_versions.created_by IS '创建者ID';

-- 模板变量表
CREATE TABLE IF NOT EXISTS game_event_template_variables (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES game_event_templates(id) ON DELETE CASCADE,
    variable_name VARCHAR(100) NOT NULL,
    variable_type VARCHAR(50) NOT NULL, -- string, number, date, select
    default_value TEXT,
    is_required BOOLEAN DEFAULT TRUE,
    description TEXT,
    options JSONB, -- 下拉选项
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_template_variables IS '活动模板变量表';
COMMENT ON COLUMN game_event_template_variables.template_id IS '模板ID';
COMMENT ON COLUMN game_event_template_variables.variable_name IS '变量名';
COMMENT ON COLUMN game_event_template_variables.variable_type IS '变量类型';
COMMENT ON COLUMN game_event_template_variables.default_value IS '默认值';
COMMENT ON COLUMN game_event_template_variables.is_required IS '是否必填';
COMMENT ON COLUMN game_event_template_variables.description IS '描述';
COMMENT ON COLUMN game_event_template_variables.options IS '选项配置JSON';

-- 定时任务表
CREATE TABLE IF NOT EXISTS game_event_scheduled_tasks (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL, -- event_start, event_end, daily_reset, weekly_reset, stats_compute
    event_id INTEGER REFERENCES game_events(id),
    cron_expression VARCHAR(100),
    scheduled_time TIMESTAMP WITH TIME ZONE,
    task_config JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed, cancelled
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_scheduled_tasks IS '活动定时任务表';
COMMENT ON COLUMN game_event_scheduled_tasks.task_type IS '任务类型';
COMMENT ON COLUMN game_event_scheduled_tasks.event_id IS '活动ID';
COMMENT ON COLUMN game_event_scheduled_tasks.cron_expression IS 'Cron表达式';
COMMENT ON COLUMN game_event_scheduled_tasks.scheduled_time IS '预定执行时间';
COMMENT ON COLUMN game_event_scheduled_tasks.task_config IS '任务配置JSON';
COMMENT ON COLUMN game_event_scheduled_tasks.status IS '任务状态';
COMMENT ON COLUMN game_event_scheduled_tasks.retry_count IS '重试次数';
COMMENT ON COLUMN game_event_scheduled_tasks.max_retries IS '最大重试次数';
COMMENT ON COLUMN game_event_scheduled_tasks.last_error IS '最后错误信息';
COMMENT ON COLUMN game_event_scheduled_tasks.executed_at IS '执行时间';

-- 定时任务执行日志表
CREATE TABLE IF NOT EXISTS game_event_task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES game_event_scheduled_tasks(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- success, failed
    execution_result JSONB,
    error_message TEXT,
    execution_duration_ms INTEGER,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE game_event_task_logs IS '定时任务执行日志表';
COMMENT ON COLUMN game_event_task_logs.task_id IS '任务ID';
COMMENT ON COLUMN game_event_task_logs.status IS '执行状态';
COMMENT ON COLUMN game_event_task_logs.execution_result IS '执行结果JSON';
COMMENT ON COLUMN game_event_task_logs.error_message IS '错误信息';
COMMENT ON COLUMN game_event_task_logs.execution_duration_ms IS '执行耗时(毫秒)';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_game_event_template_versions_template_id ON game_event_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_game_event_template_variables_template_id ON game_event_template_variables(template_id);
CREATE INDEX IF NOT EXISTS idx_game_event_scheduled_tasks_status ON game_event_scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_game_event_scheduled_tasks_event_id ON game_event_scheduled_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_game_event_scheduled_tasks_scheduled_time ON game_event_scheduled_tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_game_event_task_logs_task_id ON game_event_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_game_event_task_logs_executed_at ON game_event_task_logs(executed_at);

-- 为表创建更新时间触发器
DROP TRIGGER IF EXISTS update_game_event_scheduled_tasks_updated_at ON game_event_scheduled_tasks;
CREATE TRIGGER update_game_event_scheduled_tasks_updated_at 
    BEFORE UPDATE ON game_event_scheduled_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

\echo '游戏活动系统中期优化表创建成功！'


