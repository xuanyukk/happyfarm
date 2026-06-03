
-- 文件名：two_factor_auth.sql
-- 作者：开发者
-- 日期：2026-03-19
-- 版本：v1.0.0
-- 功能描述：双因素认证表

CREATE TABLE IF NOT EXISTS two_factor_auth (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    secret VARCHAR(255),
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS two_factor_verification_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON two_factor_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_code ON two_factor_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires ON two_factor_verification_codes(expires_at);

