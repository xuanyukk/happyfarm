-- ============================================
-- 迁移名称: add_user_devices_table
-- 版本: v2.0.0
-- 日期: 2026-03-19
-- 描述: 添加用户设备管理表
-- 影响范围: 新增 user_devices 表及其索引
-- 回滚操作: DROP TABLE IF EXISTS user_devices;
-- 依赖: sys_login.sql（用户表）
-- ============================================

-- 文件名：005_add_user_devices_table.sql
-- 作者：开发者
-- 日期：2026-03-19
-- 版本：v1.0.0
-- 功能描述：添加用户设备管理表的迁移脚本

CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active ON user_devices(last_active_at);


