
-- 文件名：audit_logs.sql
-- 作者：开发者
-- 日期：2026-03-19
-- 版本：v1.0.0
-- 功能描述：操作审计日志表

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'success'
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

COMMENT ON TABLE audit_logs IS '操作审计日志表';
COMMENT ON COLUMN audit_logs.user_id IS '用户ID';
COMMENT ON COLUMN audit_logs.action IS '操作类型';
COMMENT ON COLUMN audit_logs.resource_type IS '资源类型';
COMMENT ON COLUMN audit_logs.resource_id IS '资源ID';
COMMENT ON COLUMN audit_logs.old_values IS '操作前值';
COMMENT ON COLUMN audit_logs.new_values IS '操作后值';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP地址';
COMMENT ON COLUMN audit_logs.user_agent IS '用户代理';
COMMENT ON COLUMN audit_logs.request_id IS '请求ID';
COMMENT ON COLUMN audit_logs.created_at IS '创建时间';
COMMENT ON COLUMN audit_logs.status IS '操作状态';

