-- ============================================
-- 文件名: 20_user_devices.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 用户设备管理表
-- 执行顺序: 02-20
-- 依赖关系: 02-19_password_reset_tokens.sql
-- ============================================

CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address VARCHAR(45),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE user_devices IS '用户设备管理表';
COMMENT ON COLUMN user_devices.id IS '设备ID';
COMMENT ON COLUMN user_devices.user_id IS '用户ID';
COMMENT ON COLUMN user_devices.device_id IS '设备唯一标识';
COMMENT ON COLUMN user_devices.device_name IS '设备名称';
COMMENT ON COLUMN user_devices.device_type IS '设备类型（desktop/mobile/tablet）';
COMMENT ON COLUMN user_devices.browser IS '浏览器信息';
COMMENT ON COLUMN user_devices.os IS '操作系统信息';
COMMENT ON COLUMN user_devices.ip_address IS 'IP地址';
COMMENT ON COLUMN user_devices.last_active_at IS '最后活跃时间';
COMMENT ON COLUMN user_devices.created_at IS '创建时间';
COMMENT ON COLUMN user_devices.is_revoked IS '是否已撤销';
COMMENT ON COLUMN user_devices.revoked_at IS '撤销时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active ON user_devices(last_active_at);

\echo '用户设备管理表创建成功！'
