-- ============================================
-- 迁移名称: add_password_reset_tokens_table
-- 版本: v2.0.0
-- 日期: 2026-03-18
-- 描述: 添加密码重置令牌表
-- 影响范围: 新增 password_reset_tokens 表
-- 回滚操作: DROP TABLE IF EXISTS password_reset_tokens;
-- 依赖: sys_login.sql（用户表）
-- ============================================

-- 创建密码重置令牌表
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    ip_address VARCHAR(45)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- 注释
COMMENT ON TABLE password_reset_tokens IS '密码重置令牌表';
COMMENT ON COLUMN password_reset_tokens.id IS '主键ID';
COMMENT ON COLUMN password_reset_tokens.user_id IS '用户ID，关联sys_user表';
COMMENT ON COLUMN password_reset_tokens.token IS '重置令牌';
COMMENT ON COLUMN password_reset_tokens.expires_at IS '过期时间';
COMMENT ON COLUMN password_reset_tokens.created_at IS '创建时间';
COMMENT ON COLUMN password_reset_tokens.used_at IS '使用时间';
COMMENT ON COLUMN password_reset_tokens.ip_address IS '客户端IP地址';

