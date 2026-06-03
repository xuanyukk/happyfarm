-- ============================================
-- 文件名: 17_sys_login.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 登录系统表结构
-- 执行顺序: 02-17
-- 依赖关系: 02-16_player_crop_unlock.sql
-- ============================================

-- 用户表（sys_user）
CREATE TABLE IF NOT EXISTS sys_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sys_user IS '系统用户表';
COMMENT ON COLUMN sys_user.id IS '自增主键';
COMMENT ON COLUMN sys_user.username IS '登录用户名（唯一）';
COMMENT ON COLUMN sys_user.password_hash IS '密码哈希值（bcrypt）';
COMMENT ON COLUMN sys_user.email IS '邮箱（可选，用于找回密码）';
COMMENT ON COLUMN sys_user.phone IS '手机号（可选）';
COMMENT ON COLUMN sys_user.is_active IS '账号是否激活（禁用/启用）';
COMMENT ON COLUMN sys_user.is_admin IS '是否为管理员';
COMMENT ON COLUMN sys_user.last_login_at IS '最后登录时间';
COMMENT ON COLUMN sys_user.created_at IS '创建时间';
COMMENT ON COLUMN sys_user.updated_at IS '更新时间';

-- 索引：提升用户名登录查询效率
CREATE INDEX IF NOT EXISTS idx_sys_user_username ON sys_user(username);
CREATE INDEX IF NOT EXISTS idx_sys_user_email ON sys_user(email);
CREATE INDEX IF NOT EXISTS idx_sys_user_is_active ON sys_user(is_active);
COMMENT ON INDEX idx_sys_user_email IS '邮箱索引';
COMMENT ON INDEX idx_sys_user_is_active IS '账号激活状态索引';

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_desc VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sys_role IS '系统角色表';
COMMENT ON COLUMN sys_role.id IS '角色ID';
COMMENT ON COLUMN sys_role.role_name IS '角色名称';
COMMENT ON COLUMN sys_role.role_desc IS '角色描述';

-- 权限表
CREATE TABLE IF NOT EXISTS sys_permission (
    id SERIAL PRIMARY KEY,
    perm_code VARCHAR(50) NOT NULL UNIQUE,
    perm_name VARCHAR(50) NOT NULL,
    perm_desc VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sys_permission IS '系统权限表';
COMMENT ON COLUMN sys_permission.id IS '权限ID';
COMMENT ON COLUMN sys_permission.perm_code IS '权限编码';
COMMENT ON COLUMN sys_permission.perm_name IS '权限名称';
COMMENT ON COLUMN sys_permission.perm_desc IS '权限描述';

-- 角色-权限关联表（多对多）
CREATE TABLE IF NOT EXISTS sys_role_permission (
    role_id INT REFERENCES sys_role(id) ON DELETE CASCADE,
    perm_id INT REFERENCES sys_permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, perm_id)
);

COMMENT ON TABLE sys_role_permission IS '角色-权限关联表';

-- 用户-角色关联表（多对多）
CREATE TABLE IF NOT EXISTS sys_user_role (
    user_id INT REFERENCES sys_user(id) ON DELETE CASCADE,
    role_id INT REFERENCES sys_role(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE sys_user_role IS '用户-角色关联表';

-- 登录会话表
CREATE TABLE IF NOT EXISTS sys_login_session (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    client_ip VARCHAR(50),
    user_agent VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sys_login_session IS '登录会话表';
COMMENT ON COLUMN sys_login_session.session_id IS '会话ID';
COMMENT ON COLUMN sys_login_session.user_id IS '用户ID';
COMMENT ON COLUMN sys_login_session.client_ip IS '登录IP';
COMMENT ON COLUMN sys_login_session.user_agent IS '客户端UA';
COMMENT ON COLUMN sys_login_session.expires_at IS '会话过期时间';
COMMENT ON COLUMN sys_login_session.created_at IS '创建时间';
COMMENT ON COLUMN sys_login_session.updated_at IS '更新时间';

-- 索引：按用户ID查询会话、按过期时间清理过期会话
CREATE INDEX IF NOT EXISTS idx_sys_login_session_user_id ON sys_login_session(user_id);
CREATE INDEX IF NOT EXISTS idx_sys_login_session_expires_at ON sys_login_session(expires_at);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_sys_user_updated_at ON sys_user;
CREATE TRIGGER update_sys_user_updated_at
    BEFORE UPDATE ON sys_user
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sys_login_session_updated_at ON sys_login_session;
CREATE TRIGGER update_sys_login_session_updated_at
    BEFORE UPDATE ON sys_login_session
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '登录系统表创建成功！'
