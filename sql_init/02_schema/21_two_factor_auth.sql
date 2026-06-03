-- ============================================
-- 文件名: 21_two_factor_auth.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 双因素认证表
-- 执行顺序: 02-21
-- 依赖关系: 02-20_user_devices.sql
-- ============================================

CREATE TABLE IF NOT EXISTS two_factor_auth (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    secret VARCHAR(255),
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

COMMENT ON TABLE two_factor_auth IS '双因素认证表';
COMMENT ON COLUMN two_factor_auth.id IS '认证ID';
COMMENT ON COLUMN two_factor_auth.user_id IS '用户ID';
COMMENT ON COLUMN two_factor_auth.secret IS '密钥';
COMMENT ON COLUMN two_factor_auth.is_enabled IS '是否启用';
COMMENT ON COLUMN two_factor_auth.backup_codes IS '备用码';
COMMENT ON COLUMN two_factor_auth.created_at IS '创建时间';
COMMENT ON COLUMN two_factor_auth.updated_at IS '更新时间';

CREATE TABLE IF NOT EXISTS two_factor_verification_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE two_factor_verification_codes IS '双因素验证码表';
COMMENT ON COLUMN two_factor_verification_codes.id IS '验证码ID';
COMMENT ON COLUMN two_factor_verification_codes.user_id IS '用户ID';
COMMENT ON COLUMN two_factor_verification_codes.code IS '验证码';
COMMENT ON COLUMN two_factor_verification_codes.type IS '类型';
COMMENT ON COLUMN two_factor_verification_codes.expires_at IS '过期时间';
COMMENT ON COLUMN two_factor_verification_codes.is_used IS '是否已使用';
COMMENT ON COLUMN two_factor_verification_codes.created_at IS '创建时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON two_factor_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_code ON two_factor_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires ON two_factor_verification_codes(expires_at);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_two_factor_auth_updated_at ON two_factor_auth;
CREATE TRIGGER update_two_factor_auth_updated_at
    BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '双因素认证表创建成功！'
