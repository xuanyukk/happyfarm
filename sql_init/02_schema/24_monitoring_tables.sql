-- ============================================
-- 文件名: 24_monitoring_tables.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 监控和预警相关表
-- 执行顺序: 02-24
-- 依赖关系: 02-23_game_activity_log.sql
-- ============================================

-- 系统监控日志表
CREATE TABLE IF NOT EXISTS system_monitoring_log (
    log_id BIGSERIAL PRIMARY KEY,
    monitor_type VARCHAR(50) NOT NULL,
    monitor_data TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_monitoring_log IS '开心农场-系统监控日志表';
COMMENT ON COLUMN system_monitoring_log.log_id IS '日志ID';
COMMENT ON COLUMN system_monitoring_log.monitor_type IS '监控类型';
COMMENT ON COLUMN system_monitoring_log.monitor_data IS '监控数据';
COMMENT ON COLUMN system_monitoring_log.status IS '状态：normal(正常), abnormal(异常)';
COMMENT ON COLUMN system_monitoring_log.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_monitor_type ON system_monitoring_log (monitor_type);
CREATE INDEX IF NOT EXISTS idx_status ON system_monitoring_log (status);
CREATE INDEX IF NOT EXISTS idx_create_time ON system_monitoring_log (create_time);

-- 系统预警表
CREATE TABLE IF NOT EXISTS system_alert (
    alert_id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    alert_message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    processed_by VARCHAR(50) DEFAULT NULL,
    processed_time TIMESTAMP DEFAULT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_alert IS '开心农场-系统预警表';
COMMENT ON COLUMN system_alert.alert_id IS '预警ID';
COMMENT ON COLUMN system_alert.alert_type IS '预警类型';
COMMENT ON COLUMN system_alert.alert_message IS '预警消息';
COMMENT ON COLUMN system_alert.severity IS '严重程度：low(低), medium(中), high(高)';
COMMENT ON COLUMN system_alert.status IS '状态：pending(待处理), processed(已处理), ignored(已忽略)';
COMMENT ON COLUMN system_alert.processed_by IS '处理人';
COMMENT ON COLUMN system_alert.processed_time IS '处理时间';
COMMENT ON COLUMN system_alert.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_alert_type ON system_alert (alert_type);
CREATE INDEX IF NOT EXISTS idx_severity ON system_alert (severity);
CREATE INDEX IF NOT EXISTS idx_status ON system_alert (status);
CREATE INDEX IF NOT EXISTS idx_create_time ON system_alert (create_time);

-- 玩家行为日志表
CREATE TABLE IF NOT EXISTS player_behavior_log (
    log_id BIGSERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL REFERENCES player_base(player_id) ON DELETE CASCADE,
    behavior_type VARCHAR(50) NOT NULL,
    behavior_data TEXT NOT NULL,
    ip_address VARCHAR(50) DEFAULT NULL,
    device_id VARCHAR(100) DEFAULT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE player_behavior_log IS '开心农场-玩家行为日志表';
COMMENT ON COLUMN player_behavior_log.log_id IS '日志ID';
COMMENT ON COLUMN player_behavior_log.player_id IS '玩家ID';
COMMENT ON COLUMN player_behavior_log.behavior_type IS '行为类型：login(登录), plant(种植), harvest(收获), sell(出售), unlock(解锁), cover(覆盖), buy(购买)';
COMMENT ON COLUMN player_behavior_log.behavior_data IS '行为数据';
COMMENT ON COLUMN player_behavior_log.ip_address IS 'IP地址';
COMMENT ON COLUMN player_behavior_log.device_id IS '设备ID';
COMMENT ON COLUMN player_behavior_log.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_player_behavior_log_player_id ON player_behavior_log (player_id);
CREATE INDEX IF NOT EXISTS idx_behavior_type ON player_behavior_log (behavior_type);
CREATE INDEX IF NOT EXISTS idx_behavior_create_time ON player_behavior_log (create_time);

-- 系统操作日志表
CREATE TABLE IF NOT EXISTS system_operation_log (
    log_id BIGSERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    operation_data TEXT NOT NULL,
    operator VARCHAR(50) NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_operation_log IS '开心农场-系统操作日志表';
COMMENT ON COLUMN system_operation_log.log_id IS '日志ID';
COMMENT ON COLUMN system_operation_log.operation_type IS '操作类型：config_update(配置更新), emergency_control(紧急控制), data_fix(数据修复)';
COMMENT ON COLUMN system_operation_log.operation_data IS '操作数据';
COMMENT ON COLUMN system_operation_log.operator IS '操作人';
COMMENT ON COLUMN system_operation_log.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_operation_type ON system_operation_log (operation_type);
CREATE INDEX IF NOT EXISTS idx_operator ON system_operation_log (operator);
CREATE INDEX IF NOT EXISTS idx_operation_create_time ON system_operation_log (create_time);

\echo '监控相关表创建成功！'
