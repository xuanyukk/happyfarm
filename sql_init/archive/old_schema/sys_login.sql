-- sys_login.sql
-- 作者: Trae AI
-- 日期: 2026-03-17
-- 版本: 1.0
-- 功能: 登录系统表结构

-- 启用pgcrypto扩展（需超级用户权限）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 用户表（sys_user）
CREATE TABLE IF NOT EXISTS sys_user (
    id SERIAL PRIMARY KEY,                      -- 自增主键
    username VARCHAR(50) NOT NULL UNIQUE,       -- 登录用户名（唯一）
    password_hash VARCHAR(255) NOT NULL,        -- 密码哈希值（bcrypt）
    email VARCHAR(100) UNIQUE,                  -- 邮箱（可选，用于找回密码）
    phone VARCHAR(20) UNIQUE,                   -- 手机号（可选）
    is_active BOOLEAN DEFAULT TRUE,             -- 账号是否激活（禁用/启用）
    is_admin BOOLEAN DEFAULT FALSE,             -- 是否为管理员
    last_login_at TIMESTAMP WITH TIME ZONE,     -- 最后登录时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引：提升用户名登录查询效率
CREATE INDEX IF NOT EXISTS idx_sys_user_username ON sys_user(username);

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,      -- 角色名称（如admin、user、guest）
    role_desc VARCHAR(200),                     -- 角色描述
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE IF NOT EXISTS sys_permission (
    id SERIAL PRIMARY KEY,
    perm_code VARCHAR(50) NOT NULL UNIQUE,      -- 权限编码（如user:add、user:delete）
    perm_name VARCHAR(50) NOT NULL,             -- 权限名称
    perm_desc VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 角色-权限关联表（多对多）
CREATE TABLE IF NOT EXISTS sys_role_permission (
    role_id INT REFERENCES sys_role(id) ON DELETE CASCADE,
    perm_id INT REFERENCES sys_permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, perm_id)
);

-- 用户-角色关联表（多对多）
CREATE TABLE IF NOT EXISTS sys_user_role (
    user_id INT REFERENCES sys_user(id) ON DELETE CASCADE,
    role_id INT REFERENCES sys_role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 登录会话表
CREATE TABLE IF NOT EXISTS sys_login_session (
    session_id VARCHAR(64) PRIMARY KEY,         -- 会话ID（UUID/随机字符串）
    user_id INT NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    client_ip VARCHAR(50),                      -- 登录IP
    user_agent VARCHAR(255),                    -- 客户端UA
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,-- 会话过期时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引：按用户ID查询会话、按过期时间清理过期会话
CREATE INDEX IF NOT EXISTS idx_sys_login_session_user_id ON sys_login_session(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_login_session_expires_at ON sys_login_session(expires_at);