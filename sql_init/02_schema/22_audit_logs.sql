-- ============================================
-- 文件名: 22_audit_logs.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 操作审计日志表
-- 执行顺序: 02-22
-- 依赖关系: 02-21_two_factor_auth.sql
-- ============================================

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

COMMENT ON TABLE audit_logs IS '操作审计日志表';
COMMENT ON COLUMN audit_logs.id IS '日志ID';
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

-- 创建索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

\echo '操作审计日志表创建成功！'
