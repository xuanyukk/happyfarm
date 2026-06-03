-- 文件名：refresh_tokens.sql
-- 作者：开发者
-- 日期：2026-03-18
-- 版本：v1.0.0
-- 功能描述：JWT刷新令牌表，用于存储用户的刷新令牌

-- 创建刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 注释
COMMENT ON TABLE refresh_tokens IS 'JWT刷新令牌表';
COMMENT ON COLUMN refresh_tokens.id IS '主键ID';
COMMENT ON COLUMN refresh_tokens.user_id IS '用户ID，关联sys_user表';
COMMENT ON COLUMN refresh_tokens.token IS '刷新令牌';
COMMENT ON COLUMN refresh_tokens.expires_at IS '过期时间';
COMMENT ON COLUMN refresh_tokens.created_at IS '创建时间';
COMMENT ON COLUMN refresh_tokens.revoked_at IS '撤销时间';
COMMENT ON COLUMN refresh_tokens.ip_address IS '客户端IP地址';
COMMENT ON COLUMN refresh_tokens.user_agent IS '客户端User-Agent';
