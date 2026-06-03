-- ============================================
-- 文件名: 29_admin_system.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 后台管理系统表结构
-- 执行顺序: 02-29
-- 依赖关系: 02-28_achievement_system.sql
-- ============================================

-- 角色表
CREATE TABLE IF NOT EXISTS admin_role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    parent_id INTEGER REFERENCES admin_role(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES sys_user(id)
);

COMMENT ON TABLE admin_role IS '角色表';
COMMENT ON COLUMN admin_role.name IS '角色名称';
COMMENT ON COLUMN admin_role.description IS '角色描述';
COMMENT ON COLUMN admin_role.is_system IS '是否系统内置角色';
COMMENT ON COLUMN admin_role.parent_id IS '父角色ID（用于权限继承）';
COMMENT ON COLUMN admin_role.created_by IS '创建人ID';

CREATE INDEX idx_admin_role_parent_id ON admin_role(parent_id);
CREATE INDEX idx_admin_role_is_active ON admin_role(is_active);
CREATE INDEX idx_admin_role_is_system ON admin_role(is_system);

-- 权限表
CREATE TABLE IF NOT EXISTS admin_permission (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'function',
    is_system BOOLEAN DEFAULT FALSE,
    parent_id INTEGER REFERENCES admin_permission(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (level IN ('function', 'operation', 'data'))
);

COMMENT ON TABLE admin_permission IS '权限表';
COMMENT ON COLUMN admin_permission.code IS '权限代码';
COMMENT ON COLUMN admin_permission.name IS '权限名称';
COMMENT ON COLUMN admin_permission.module IS '所属模块';
COMMENT ON COLUMN admin_permission.level IS '权限级别';
COMMENT ON COLUMN admin_permission.is_system IS '是否系统内置权限';
COMMENT ON COLUMN admin_permission.parent_id IS '父权限ID';
COMMENT ON COLUMN admin_permission.sort_order IS '排序顺序';

CREATE INDEX idx_admin_permission_module ON admin_permission(module);
CREATE INDEX idx_admin_permission_parent_id ON admin_permission(parent_id);
CREATE INDEX idx_admin_permission_level ON admin_permission(level);
CREATE INDEX idx_admin_permission_is_active ON admin_permission(is_active);

-- 角色-权限关联表
CREATE TABLE IF NOT EXISTS role_permission (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES admin_role(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES admin_permission(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE role_permission IS '角色-权限关联表';

CREATE INDEX idx_role_permission_role_id ON role_permission(role_id);
CREATE INDEX idx_role_permission_permission_id ON role_permission(permission_id);

-- 用户-角色关联表
CREATE TABLE IF NOT EXISTS user_role (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sys_user(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES admin_role(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

COMMENT ON TABLE user_role IS '用户-角色关联表';

CREATE INDEX idx_user_role_user_id ON user_role(user_id);
CREATE INDEX idx_user_role_role_id ON user_role(role_id);
CREATE INDEX idx_user_role_is_active ON user_role(is_active);

-- 数据权限表
CREATE TABLE IF NOT EXISTS data_permission (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sys_user(id),
    role_id INTEGER REFERENCES admin_role(id),
    data_scope VARCHAR(20) NOT NULL DEFAULT 'OWN',
    custom_rule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (data_scope IN ('ALL', 'DEPARTMENT', 'OWN', 'CUSTOM'))
);

COMMENT ON TABLE data_permission IS '数据权限表';
COMMENT ON COLUMN data_permission.data_scope IS '数据范围';
COMMENT ON COLUMN data_permission.custom_rule IS '自定义数据规则';

CREATE INDEX idx_data_permission_user_id ON data_permission(user_id);
CREATE INDEX idx_data_permission_role_id ON data_permission(role_id);

-- 权限变更审计表
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES sys_user(id),
    operator_name VARCHAR(50),
    operation_type VARCHAR(30) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id INTEGER NOT NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (operation_type IN ('ASSIGN', 'REVOKE', 'CREATE', 'DELETE', 'UPDATE'))
);

COMMENT ON TABLE permission_audit_log IS '权限变更审计表';

CREATE INDEX idx_permission_audit_operator ON permission_audit_log(operator_id);
CREATE INDEX idx_permission_audit_operation_type ON permission_audit_log(operation_type);
CREATE INDEX idx_permission_audit_target ON permission_audit_log(target_type, target_id);
CREATE INDEX idx_permission_audit_created_at ON permission_audit_log(created_at);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES sys_user(id) ON DELETE SET NULL,
    admin_name VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    operation_module VARCHAR(50) NOT NULL,
    operation_desc TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    request_params JSONB,
    response_result JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    execution_time INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_operation_log_admin_id ON admin_operation_log(admin_id);
CREATE INDEX idx_admin_operation_log_operation_type ON admin_operation_log(operation_type);
CREATE INDEX idx_admin_operation_log_created_at ON admin_operation_log(created_at);
CREATE INDEX idx_admin_operation_log_status ON admin_operation_log(status);

COMMENT ON TABLE admin_operation_log IS '管理员操作日志表';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_admin_role_updated_at ON admin_role;
CREATE TRIGGER update_admin_role_updated_at
BEFORE UPDATE ON admin_role
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_permission_updated_at ON admin_permission;
CREATE TRIGGER update_admin_permission_updated_at
BEFORE UPDATE ON admin_permission
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_permission_updated_at ON data_permission;
CREATE TRIGGER update_data_permission_updated_at
BEFORE UPDATE ON data_permission
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

\echo '管理后台系统表创建成功！'
