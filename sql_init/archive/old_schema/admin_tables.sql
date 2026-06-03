-- admin_tables.sql
-- 作者: Trae AI
-- 日期: 2026-03-28
-- 版本: v1.0.0
-- 功能: 后台管理系统表结构

-- ============================================
-- 1. 管理员操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS admin_operation_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    admin_username VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    operation_module VARCHAR(50) NOT NULL,
    operation_desc TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    request_params JSONB,
    response_result JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    execution_time INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_operation_log_admin_id ON admin_operation_log(admin_id);
CREATE INDEX idx_admin_operation_log_operation_type ON admin_operation_log(operation_type);
CREATE INDEX idx_admin_operation_log_created_at ON admin_operation_log(created_at);
CREATE INDEX idx_admin_operation_log_status ON admin_operation_log(status);

COMMENT ON TABLE admin_operation_log IS '管理员操作日志表';
COMMENT ON COLUMN admin_operation_log.admin_id IS '管理员ID';
COMMENT ON COLUMN admin_operation_log.admin_username IS '管理员用户名';
COMMENT ON COLUMN admin_operation_log.operation_type IS '操作类型';
COMMENT ON COLUMN admin_operation_log.operation_module IS '操作模块';
COMMENT ON COLUMN admin_operation_log.operation_desc IS '操作描述';
COMMENT ON COLUMN admin_operation_log.request_method IS '请求方法';
COMMENT ON COLUMN admin_operation_log.request_url IS '请求URL';
COMMENT ON COLUMN admin_operation_log.request_params IS '请求参数';
COMMENT ON COLUMN admin_operation_log.response_result IS '响应结果';
COMMENT ON COLUMN admin_operation_log.ip_address IS 'IP地址';
COMMENT ON COLUMN admin_operation_log.user_agent IS '用户代理';
COMMENT ON COLUMN admin_operation_log.execution_time IS '执行时间(毫秒)';
COMMENT ON COLUMN admin_operation_log.status IS '状态: success/failed';
COMMENT ON COLUMN admin_operation_log.created_at IS '创建时间';

-- ============================================
-- 2. 系统监控数据表
-- ============================================
CREATE TABLE IF NOT EXISTS system_monitoring (
    id SERIAL PRIMARY KEY,
    monitor_type VARCHAR(50) NOT NULL,
    monitor_key VARCHAR(100) NOT NULL,
    monitor_value NUMERIC,
    monitor_unit VARCHAR(20),
    monitor_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_monitoring_type ON system_monitoring(monitor_type);
CREATE INDEX idx_system_monitoring_key ON system_monitoring(monitor_key);
CREATE INDEX idx_system_monitoring_created_at ON system_monitoring(created_at);

COMMENT ON TABLE system_monitoring IS '系统监控数据表';
COMMENT ON COLUMN system_monitoring.monitor_type IS '监控类型: cpu/memory/disk/network/requests';
COMMENT ON COLUMN system_monitoring.monitor_key IS '监控指标键';
COMMENT ON COLUMN system_monitoring.monitor_value IS '监控数值';
COMMENT ON COLUMN system_monitoring.monitor_unit IS '单位: %/MB/KB/ms等';
COMMENT ON COLUMN system_monitoring.monitor_data IS '扩展数据(JSON)';
COMMENT ON COLUMN system_monitoring.created_at IS '创建时间';

-- ============================================
-- 3. 预警配置表
-- ============================================
CREATE TABLE IF NOT EXISTS alert_config (
    id SERIAL PRIMARY KEY,
    alert_name VARCHAR(100) NOT NULL,
    alert_code VARCHAR(50) NOT NULL UNIQUE,
    alert_type VARCHAR(50) NOT NULL,
    alert_level VARCHAR(20) NOT NULL DEFAULT 'warning',
    monitor_key VARCHAR(100) NOT NULL,
    threshold_operator VARCHAR(10) NOT NULL DEFAULT '>',
    threshold_value NUMERIC NOT NULL,
    duration_seconds INTEGER DEFAULT 60,
    is_enabled BOOLEAN DEFAULT TRUE,
    notification_methods VARCHAR(100)[] DEFAULT '{email,system}',
    notification_recipients TEXT[],
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_config_type ON alert_config(alert_type);
CREATE INDEX idx_alert_config_level ON alert_config(alert_level);
CREATE INDEX idx_alert_config_enabled ON alert_config(is_enabled);

COMMENT ON TABLE alert_config IS '预警配置表';
COMMENT ON COLUMN alert_config.alert_name IS '预警名称';
COMMENT ON COLUMN alert_config.alert_code IS '预警编码';
COMMENT ON COLUMN alert_config.alert_type IS '预警类型: system/economy/player';
COMMENT ON COLUMN alert_config.alert_level IS '预警级别: info/warning/error/critical';
COMMENT ON COLUMN alert_config.monitor_key IS '监控指标';
COMMENT ON COLUMN alert_config.threshold_operator IS '阈值运算符: >/</>=/<=/==/!=';
COMMENT ON COLUMN alert_config.threshold_value IS '阈值';
COMMENT ON COLUMN alert_config.duration_seconds IS '持续时间(秒)';
COMMENT ON COLUMN alert_config.is_enabled IS '是否启用';
COMMENT ON COLUMN alert_config.notification_methods IS '通知方式: email/sms/system';
COMMENT ON COLUMN alert_config.notification_recipients IS '通知接收人';
COMMENT ON COLUMN alert_config.description IS '描述';

-- ============================================
-- 4. 预警记录表
-- ============================================
CREATE TABLE IF NOT EXISTS alert_record (
    id SERIAL PRIMARY KEY,
    alert_config_id INTEGER REFERENCES alert_config(id) ON DELETE SET NULL,
    alert_code VARCHAR(50) NOT NULL,
    alert_name VARCHAR(100),
    alert_level VARCHAR(20),
    alert_type VARCHAR(50),
    monitor_key VARCHAR(100),
    actual_value NUMERIC,
    threshold_value NUMERIC,
    threshold_operator VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending',
    handled_by INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    handled_at TIMESTAMP WITH TIME ZONE,
    handle_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_record_config_id ON alert_record(alert_config_id);
CREATE INDEX idx_alert_record_code ON alert_record(alert_code);
CREATE INDEX idx_alert_record_level ON alert_record(alert_level);
CREATE INDEX idx_alert_record_status ON alert_record(status);
CREATE INDEX idx_alert_record_created_at ON alert_record(created_at);

COMMENT ON TABLE alert_record IS '预警记录表';
COMMENT ON COLUMN alert_record.alert_config_id IS '预警配置ID';
COMMENT ON COLUMN alert_record.alert_code IS '预警编码';
COMMENT ON COLUMN alert_record.alert_name IS '预警名称';
COMMENT ON COLUMN alert_record.alert_level IS '预警级别';
COMMENT ON COLUMN alert_record.alert_type IS '预警类型';
COMMENT ON COLUMN alert_record.monitor_key IS '监控指标';
COMMENT ON COLUMN alert_record.actual_value IS '实际值';
COMMENT ON COLUMN alert_record.threshold_value IS '阈值';
COMMENT ON COLUMN alert_record.threshold_operator IS '阈值运算符';
COMMENT ON COLUMN alert_record.status IS '状态: pending/processing/resolved/ignored';
COMMENT ON COLUMN alert_record.handled_by IS '处理人ID';
COMMENT ON COLUMN alert_record.handled_at IS '处理时间';
COMMENT ON COLUMN alert_record.handle_note IS '处理备注';

-- ============================================
-- 5. 操作审批流程表
-- ============================================
CREATE TABLE IF NOT EXISTS operation_approval (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(64) UNIQUE NOT NULL,
    requester_id INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    requester_username VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    operation_module VARCHAR(50) NOT NULL,
    operation_desc TEXT,
    target_player_id VARCHAR(64),
    target_data JSONB,
    approval_status VARCHAR(20) DEFAULT 'pending',
    approver_id INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    approver_username VARCHAR(50),
    approval_note TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operation_approval_request_id ON operation_approval(request_id);
CREATE INDEX idx_operation_approval_requester_id ON operation_approval(requester_id);
CREATE INDEX idx_operation_approval_status ON operation_approval(approval_status);
CREATE INDEX idx_operation_approval_created_at ON operation_approval(created_at);

COMMENT ON TABLE operation_approval IS '操作审批流程表';
COMMENT ON COLUMN operation_approval.request_id IS '请求ID';
COMMENT ON COLUMN operation_approval.requester_id IS '申请人ID';
COMMENT ON COLUMN operation_approval.requester_username IS '申请人用户名';
COMMENT ON COLUMN operation_approval.operation_type IS '操作类型';
COMMENT ON COLUMN operation_approval.operation_module IS '操作模块';
COMMENT ON COLUMN operation_approval.operation_desc IS '操作描述';
COMMENT ON COLUMN operation_approval.target_player_id IS '目标玩家ID';
COMMENT ON COLUMN operation_approval.target_data IS '目标数据(JSON)';
COMMENT ON COLUMN operation_approval.approval_status IS '审批状态: pending/approved/rejected/executed';
COMMENT ON COLUMN operation_approval.approver_id IS '审批人ID';
COMMENT ON COLUMN operation_approval.approver_username IS '审批人用户名';
COMMENT ON COLUMN operation_approval.approval_note IS '审批备注';
COMMENT ON COLUMN operation_approval.approved_at IS '审批时间';
COMMENT ON COLUMN operation_approval.executed_at IS '执行时间';

-- ============================================
-- 6. 货币调控记录表
-- ============================================
CREATE TABLE IF NOT EXISTS currency_control_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    admin_username VARCHAR(50),
    control_type VARCHAR(50) NOT NULL,
    currency_type VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL,
    target_player_id VARCHAR(64),
    reason TEXT,
    approval_id INTEGER REFERENCES operation_approval(id) ON DELETE SET NULL,
    before_balance BIGINT,
    after_balance BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_currency_control_admin_id ON currency_control_log(admin_id);
CREATE INDEX idx_currency_control_type ON currency_control_log(control_type);
CREATE INDEX idx_currency_control_currency ON currency_control_log(currency_type);
CREATE INDEX idx_currency_control_player_id ON currency_control_log(target_player_id);
CREATE INDEX idx_currency_control_created_at ON currency_control_log(created_at);

COMMENT ON TABLE currency_control_log IS '货币调控记录表';
COMMENT ON COLUMN currency_control_log.admin_id IS '管理员ID';
COMMENT ON COLUMN currency_control_log.admin_username IS '管理员用户名';
COMMENT ON COLUMN currency_control_log.control_type IS '调控类型: issue/recover/adjust';
COMMENT ON COLUMN currency_control_log.currency_type IS '货币类型: coin/gem/special';
COMMENT ON COLUMN currency_control_log.amount IS '金额(正数=发行,负数=回收)';
COMMENT ON COLUMN currency_control_log.target_player_id IS '目标玩家ID(为空表示全局)';
COMMENT ON COLUMN currency_control_log.reason IS '原因';
COMMENT ON COLUMN currency_control_log.approval_id IS '审批ID';
COMMENT ON COLUMN currency_control_log.before_balance IS '调控前余额';
COMMENT ON COLUMN currency_control_log.after_balance IS '调控后余额';

-- ============================================
-- 7. 货币投放策略配置表
-- ============================================
CREATE TABLE IF NOT EXISTS currency_release_strategy (
    id SERIAL PRIMARY KEY,
    strategy_name VARCHAR(100) NOT NULL,
    strategy_code VARCHAR(50) NOT NULL UNIQUE,
    currency_type VARCHAR(50) NOT NULL,
    release_type VARCHAR(50) NOT NULL,
    release_amount BIGINT,
    release_rate NUMERIC,
    target_players VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_by INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_currency_release_strategy_code ON currency_release_strategy(strategy_code);
CREATE INDEX idx_currency_release_currency ON currency_release_strategy(currency_type);
CREATE INDEX idx_currency_release_active ON currency_release_strategy(is_active);

COMMENT ON TABLE currency_release_strategy IS '货币投放策略配置表';
COMMENT ON COLUMN currency_release_strategy.strategy_name IS '策略名称';
COMMENT ON COLUMN currency_release_strategy.strategy_code IS '策略编码';
COMMENT ON COLUMN currency_release_strategy.currency_type IS '货币类型';
COMMENT ON COLUMN currency_release_strategy.release_type IS '投放类型: fixed/percentage/event';
COMMENT ON COLUMN currency_release_strategy.release_amount IS '投放金额';
COMMENT ON COLUMN currency_release_strategy.release_rate IS '投放比例';
COMMENT ON COLUMN currency_release_strategy.target_players IS '目标玩家: all/new/active/vip';
COMMENT ON COLUMN currency_release_strategy.start_time IS '开始时间';
COMMENT ON COLUMN currency_release_strategy.end_time IS '结束时间';
COMMENT ON COLUMN currency_release_strategy.is_active IS '是否激活';
COMMENT ON COLUMN currency_release_strategy.description IS '描述';

-- ============================================
-- 8. 数据统计报表表
-- ============================================
CREATE TABLE IF NOT EXISTS data_statistics (
    id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    stat_period VARCHAR(20) NOT NULL,
    stat_type VARCHAR(50) NOT NULL,
    stat_key VARCHAR(100) NOT NULL,
    stat_value NUMERIC NOT NULL,
    stat_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_date, stat_period, stat_type, stat_key)
);

CREATE INDEX idx_data_statistics_date ON data_statistics(stat_date);
CREATE INDEX idx_data_statistics_period ON data_statistics(stat_period);
CREATE INDEX idx_data_statistics_type ON data_statistics(stat_type);
CREATE INDEX idx_data_statistics_key ON data_statistics(stat_key);

COMMENT ON TABLE data_statistics IS '数据统计报表表';
COMMENT ON COLUMN data_statistics.stat_date IS '统计日期';
COMMENT ON COLUMN data_statistics.stat_period IS '统计周期: daily/weekly/monthly/quarterly';
COMMENT ON COLUMN data_statistics.stat_type IS '统计类型: player/economy/activity/retention';
COMMENT ON COLUMN data_statistics.stat_key IS '统计指标';
COMMENT ON COLUMN data_statistics.stat_value IS '统计值';
COMMENT ON COLUMN data_statistics.stat_data IS '扩展数据';

-- ============================================
-- 9. 货币平衡监测表
-- ============================================
CREATE TABLE IF NOT EXISTS currency_balance_monitor (
    id SERIAL PRIMARY KEY,
    monitor_date DATE NOT NULL,
    currency_type VARCHAR(50) NOT NULL,
    total_supply BIGINT NOT NULL,
    total_circulation BIGINT NOT NULL,
    total_production BIGINT NOT NULL,
    total_consumption BIGINT NOT NULL,
    production_rate NUMERIC,
    consumption_rate NUMERIC,
    balance_index NUMERIC,
    health_score INTEGER,
    inflation_rate NUMERIC,
    monitor_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(monitor_date, currency_type)
);

CREATE INDEX idx_currency_balance_date ON currency_balance_monitor(monitor_date);
CREATE INDEX idx_currency_balance_currency ON currency_balance_monitor(currency_type);

COMMENT ON TABLE currency_balance_monitor IS '货币平衡监测表';
COMMENT ON COLUMN currency_balance_monitor.monitor_date IS '监测日期';
COMMENT ON COLUMN currency_balance_monitor.currency_type IS '货币类型';
COMMENT ON COLUMN currency_balance_monitor.total_supply IS '总供应量';
COMMENT ON COLUMN currency_balance_monitor.total_circulation IS '流通量';
COMMENT ON COLUMN currency_balance_monitor.total_production IS '当日产出';
COMMENT ON COLUMN currency_balance_monitor.total_consumption IS '当日消耗';
COMMENT ON COLUMN currency_balance_monitor.production_rate IS '产出率';
COMMENT ON COLUMN currency_balance_monitor.consumption_rate IS '消耗率';
COMMENT ON COLUMN currency_balance_monitor.balance_index IS '平衡指数';
COMMENT ON COLUMN currency_balance_monitor.health_score IS '健康评分(0-100)';
COMMENT ON COLUMN currency_balance_monitor.inflation_rate IS '通胀率';
COMMENT ON COLUMN currency_balance_monitor.monitor_data IS '扩展数据';

-- ============================================
-- 10. 系统通知表
-- ============================================
CREATE TABLE IF NOT EXISTS system_notification (
    id SERIAL PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL,
    notification_level VARCHAR(20) NOT NULL DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    content TEXT,
    target_users INTEGER[],
    is_read BOOLEAN DEFAULT FALSE,
    read_by INTEGER[],
    created_by INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_system_notification_type ON system_notification(notification_type);
CREATE INDEX idx_system_notification_level ON system_notification(notification_level);
CREATE INDEX idx_system_notification_created_at ON system_notification(created_at);

COMMENT ON TABLE system_notification IS '系统通知表';
COMMENT ON COLUMN system_notification.notification_type IS '通知类型: alert/announcement/task';
COMMENT ON COLUMN system_notification.notification_level IS '通知级别: info/warning/error/critical';
COMMENT ON COLUMN system_notification.title IS '标题';
COMMENT ON COLUMN system_notification.content IS '内容';
COMMENT ON COLUMN system_notification.target_users IS '目标用户ID列表';
COMMENT ON COLUMN system_notification.is_read IS '是否已读';
COMMENT ON COLUMN system_notification.read_by IS '已读用户ID列表';
COMMENT ON COLUMN system_notification.created_by IS '创建人ID';
COMMENT ON COLUMN system_notification.expires_at IS '过期时间';
