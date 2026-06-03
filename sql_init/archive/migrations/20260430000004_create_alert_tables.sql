-- ============================================
-- 迁移名称: create_alert_tables
-- 版本: v2.0.0
-- 日期: 2026-04-30
-- 描述: 创建实时预警推送系统表
-- 影响范围: 新增 alert_rule/alert_record/alert_push_log/ws_connection 表
-- 回滚操作: DROP TABLE IF EXISTS ws_connection; DROP TABLE IF EXISTS alert_push_log; DROP TABLE IF EXISTS alert_record; DROP TABLE IF EXISTS alert_rule;
-- 依赖: 29_admin_system.sql（管理员表）
-- ============================================

-- 预警规则表
CREATE TABLE IF NOT EXISTS alert_rule (
  id SERIAL PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL COMMENT '规则名称',
  metric VARCHAR(50) NOT NULL COMMENT '指标',
  threshold VARCHAR(100) NOT NULL COMMENT '阈值',
  operator VARCHAR(20) DEFAULT '>' CHECK (operator IN ('>', '<', '>=', '<=', '=', '!=')) COMMENT '操作符',
  duration VARCHAR(20) DEFAULT '1m' COMMENT '持续时间',
  level VARCHAR(20) DEFAULT 'INFO' CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')) COMMENT '级别',
  enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  channels JSONB COMMENT '通知渠道',
  recipients JSONB COMMENT '接收人',
  cooldown VARCHAR(20) DEFAULT '1h' COMMENT '冷却时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES admins(id),
  updated_by INTEGER REFERENCES admins(id)
);

-- 预警记录表
CREATE TABLE IF NOT EXISTS alert_record (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES alert_rule(id),
  metric VARCHAR(50) NOT NULL COMMENT '指标',
  value VARCHAR(100) COMMENT '当前值',
  threshold VARCHAR(100) COMMENT '阈值',
  level VARCHAR(20) NOT NULL CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')) COMMENT '级别',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT COMMENT '内容',
  data JSONB COMMENT '数据',
  status VARCHAR(20) DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'RESOLVED', 'IGNORED')) COMMENT '状态',
  read_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES admins(id),
  resolved_note TEXT COMMENT '处理备注',
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 预警推送日志表
CREATE TABLE IF NOT EXISTS alert_push_log (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER REFERENCES alert_record(id),
  channel VARCHAR(50) NOT NULL COMMENT '推送渠道',
  recipient VARCHAR(200) COMMENT '接收人',
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')) COMMENT '状态',
  error_message TEXT COMMENT '错误信息',
  pushed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WebSocket连接记录表
CREATE TABLE IF NOT EXISTS ws_connection (
  id SERIAL PRIMARY KEY,
  connection_id VARCHAR(100) NOT NULL UNIQUE COMMENT '连接ID',
  user_id INTEGER COMMENT '用户ID',
  user_type VARCHAR(20) COMMENT '用户类型',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  user_agent TEXT COMMENT 'User Agent',
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_alert_rule_enabled ON alert_rule(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_record_rule ON alert_record(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_record_status ON alert_record(status);
CREATE INDEX IF NOT EXISTS idx_alert_record_triggered ON alert_record(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_push_alert ON alert_push_log(alert_id);
CREATE INDEX IF NOT EXISTS idx_ws_connection_active ON ws_connection(is_active);
CREATE INDEX IF NOT EXISTS idx_ws_connection_user ON ws_connection(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_alert_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_alert_rule_updated_at ON alert_rule;
CREATE TRIGGER update_alert_rule_updated_at
  BEFORE UPDATE ON alert_rule
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rule_updated_at();

-- 插入初始预警规则
INSERT INTO alert_rule (rule_name, metric, threshold, operator, duration, level, enabled, channels) VALUES
('CPU使用率警告', 'CPU_USAGE', '80', '>', '5m', 'WARNING', TRUE, '["WEB", "EMAIL"]'),
('内存使用率警告', 'MEMORY_USAGE', '85', '>', '5m', 'WARNING', TRUE, '["WEB", "EMAIL"]'),
('磁盘使用率警告', 'DISK_USAGE', '90', '>', '1h', 'ERROR', TRUE, '["WEB", "EMAIL"]'),
('API响应时间警告', 'API_RESPONSE_TIME', '3000', '>', '5m', 'WARNING', TRUE, '["WEB"]'),
('API错误率警告', 'API_ERROR_RATE', '10', '>', '5m', 'ERROR', TRUE, '["WEB", "EMAIL"]')
ON CONFLICT DO NOTHING;

