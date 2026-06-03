-- ============================================
-- 迁移名称: add_audit_logs_table
-- 版本: v2.0.0
-- 日期: 2026-03-19
-- 描述: 添加操作审计日志表
-- 影响范围: 新增 audit_logs 表及其索引
-- 回滚操作: DROP TABLE IF EXISTS audit_logs;
-- 依赖: sys_login.sql（用户表）
-- ============================================

-- 文件名：004_add_audit_logs_table.sql
-- 作者：开发者
-- 日期：2026-03-19
-- 版本：v1.1.0
-- 功能描述：添加操作审计日志表的迁移脚本

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);


