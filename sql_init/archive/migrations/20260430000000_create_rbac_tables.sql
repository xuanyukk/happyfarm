-- ============================================
-- 迁移名称: create_rbac_tables
-- 版本: v2.0.0
-- 日期: 2026-04-30
-- 描述: 创建RBAC权限管理系统表
-- 影响范围: 新增 admin_role/admin_permission/role_permission/user_role/data_permission/permission_audit_log 表
-- 回滚操作: DROP TABLE IF EXISTS permission_audit_log; DROP TABLE IF EXISTS data_permission; DROP TABLE IF EXISTS user_role; DROP TABLE IF EXISTS role_permission; DROP TABLE IF EXISTS admin_permission; DROP TABLE IF EXISTS admin_role;
-- 依赖: 17_sys_login.sql（系统用户表）
-- ============================================

-- ============================================
-- 1. 角色表（admin_role）
-- ============================================
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

CREATE INDEX idx_admin_role_parent_id ON admin_role(parent_id);
CREATE INDEX idx_admin_role_is_active ON admin_role(is_active);
CREATE INDEX idx_admin_role_is_system ON admin_role(is_system);

COMMENT ON TABLE admin_role IS '角色表';
COMMENT ON COLUMN admin_role.name IS '角色名称';
COMMENT ON COLUMN admin_role.description IS '角色描述';
COMMENT ON COLUMN admin_role.is_system IS '是否系统内置角色';
COMMENT ON COLUMN admin_role.parent_id IS '父角色ID（用于权限继承）';
COMMENT ON COLUMN admin_role.is_active IS '是否启用';
COMMENT ON COLUMN admin_role.created_by IS '创建人ID';

-- ============================================
-- 2. 权限表（admin_permission）
-- ============================================
CREATE TABLE IF NOT EXISTS admin_permission (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'function' CHECK (level IN ('function', 'operation', 'data')),
    is_system BOOLEAN DEFAULT FALSE,
    parent_id INTEGER REFERENCES admin_permission(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_permission_module ON admin_permission(module);
CREATE INDEX idx_admin_permission_parent_id ON admin_permission(parent_id);
CREATE INDEX idx_admin_permission_level ON admin_permission(level);
CREATE INDEX idx_admin_permission_is_active ON admin_permission(is_active);

COMMENT ON TABLE admin_permission IS '权限表';
COMMENT ON COLUMN admin_permission.code IS '权限代码（如：sys:user:view）';
COMMENT ON COLUMN admin_permission.name IS '权限名称';
COMMENT ON COLUMN admin_permission.description IS '权限描述';
COMMENT ON COLUMN admin_permission.module IS '所属模块';
COMMENT ON COLUMN admin_permission.level IS '权限级别（function/operation/data）';
COMMENT ON COLUMN admin_permission.is_system IS '是否系统内置权限';
COMMENT ON COLUMN admin_permission.parent_id IS '父权限ID';
COMMENT ON COLUMN admin_permission.sort_order IS '排序顺序';

-- ============================================
-- 3. 角色-权限关联表（role_permission）
-- ============================================
CREATE TABLE IF NOT EXISTS role_permission (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES admin_role(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES admin_permission(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permission_role_id ON role_permission(role_id);
CREATE INDEX idx_role_permission_permission_id ON role_permission(permission_id);

COMMENT ON TABLE role_permission IS '角色-权限关联表';

-- ============================================
-- 4. 用户-角色关联表（user_role）
-- ============================================
CREATE TABLE IF NOT EXISTS user_role (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sys_user(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES admin_role(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_role_user_id ON user_role(user_id);
CREATE INDEX idx_user_role_role_id ON user_role(role_id);
CREATE INDEX idx_user_role_is_active ON user_role(is_active);

COMMENT ON TABLE user_role IS '用户-角色关联表';

-- ============================================
-- 5. 数据权限表（data_permission）
-- ============================================
CREATE TABLE IF NOT EXISTS data_permission (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES sys_user(id),
    role_id INTEGER REFERENCES admin_role(id),
    data_scope VARCHAR(20) NOT NULL DEFAULT 'OWN' CHECK (data_scope IN ('ALL', 'DEPARTMENT', 'OWN', 'CUSTOM')),
    custom_rule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_permission_user_id ON data_permission(user_id);
CREATE INDEX idx_data_permission_role_id ON data_permission(role_id);

COMMENT ON TABLE data_permission IS '数据权限表';
COMMENT ON COLUMN data_permission.data_scope IS '数据范围（ALL/DEPARTMENT/OWN/CUSTOM）';
COMMENT ON COLUMN data_permission.custom_rule IS '自定义数据规则';

-- ============================================
-- 6. 权限变更审计表（permission_audit_log）
-- ============================================
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES sys_user(id),
    operator_username VARCHAR(50),
    operation_type VARCHAR(30) NOT NULL CHECK (operation_type IN ('ASSIGN', 'REVOKE', 'CREATE', 'DELETE', 'UPDATE')),
    target_type VARCHAR(30) NOT NULL,
    target_id INTEGER NOT NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permission_audit_operator ON permission_audit_log(operator_id);
CREATE INDEX idx_permission_audit_operation_type ON permission_audit_log(operation_type);
CREATE INDEX idx_permission_audit_target ON permission_audit_log(target_type, target_id);
CREATE INDEX idx_permission_audit_created_at ON permission_audit_log(created_at);

COMMENT ON TABLE permission_audit_log IS '权限变更审计表';
COMMENT ON COLUMN permission_audit_log.operation_type IS '操作类型（ASSIGN/REVOKE/CREATE/DELETE/UPDATE）';
COMMENT ON COLUMN permission_audit_log.target_type IS '操作目标类型';
COMMENT ON COLUMN permission_audit_log.target_id IS '操作目标ID';
COMMENT ON COLUMN permission_audit_log.old_value IS '变更前值';
COMMENT ON COLUMN permission_audit_log.new_value IS '变更后值';
COMMENT ON COLUMN permission_audit_log.reason IS '变更原因';

-- ============================================
-- 初始化数据
-- ============================================

-- 初始化系统内置角色
INSERT INTO admin_role (name, description, is_system, is_active, created_by) VALUES 
('超级管理员', '拥有系统所有权限的超级管理员', TRUE, TRUE, 1),
('运营管理员', '负责游戏运营管理的管理员', TRUE, TRUE, 1),
('客服专员', '处理玩家咨询和投诉的客服人员', TRUE, TRUE, 1),
('数据分析师', '查看和分析游戏数据的分析师', TRUE, TRUE, 1)
ON CONFLICT DO NOTHING;

-- 初始化系统权限
INSERT INTO admin_permission (code, name, description, module, level, is_system, sort_order) VALUES 
('sys:user:view', '用户查看', '查看用户列表和详情', '系统管理', 'function', TRUE, 1),
('sys:user:create', '用户创建', '创建新用户', '系统管理', 'operation', TRUE, 2),
('sys:user:update', '用户编辑', '编辑用户信息', '系统管理', 'operation', TRUE, 3),
('sys:user:delete', '用户删除', '删除用户', '系统管理', 'operation', TRUE, 4),
('sys:role:view', '角色查看', '查看角色列表', '系统管理', 'function', TRUE, 5),
('sys:role:create', '角色创建', '创建新角色', '系统管理', 'operation', TRUE, 6),
('sys:role:update', '角色编辑', '编辑角色信息', '系统管理', 'operation', TRUE, 7),
('sys:role:delete', '角色删除', '删除角色', '系统管理', 'operation', TRUE, 8),
('sys:role:config', '角色配置', '配置角色权限', '系统管理', 'operation', TRUE, 9),
('sys:permission:view', '权限查看', '查看权限列表', '系统管理', 'function', TRUE, 10),
('sys:permission:create', '权限创建', '创建新权限', '系统管理', 'operation', TRUE, 11),
('sys:permission:update', '权限编辑', '编辑权限信息', '系统管理', 'operation', TRUE, 12),
('sys:audit:view', '审计日志', '查看权限审计日志', '系统管理', 'function', TRUE, 13),
('player:view', '玩家查看', '查看玩家信息', '玩家管理', 'function', TRUE, 101),
('player:disable', '玩家禁用', '禁用玩家账号', '玩家管理', 'operation', TRUE, 102),
('player:modify', '玩家修改', '修改玩家信息', '玩家管理', 'operation', TRUE, 103),
('game:announcement', '公告管理', '管理游戏公告', '游戏运营', 'function', TRUE, 201),
('game:activity', '活动配置', '配置游戏活动', '游戏运营', 'function', TRUE, 202),
('game:config', '参数配置', '配置游戏参数', '游戏运营', 'function', TRUE, 203)
ON CONFLICT DO NOTHING;

-- 为超级管理员分配所有权限
WITH admin_role AS (
    SELECT id FROM admin_role WHERE name = '超级管理员' LIMIT 1
),
all_permissions AS (
    SELECT id FROM admin_permission
)
INSERT INTO role_permission (role_id, permission_id)
SELECT ar.id, ap.id FROM admin_role ar CROSS JOIN all_permissions ap
ON CONFLICT DO NOTHING;

-- 为admin用户分配超级管理员角色
WITH admin_user AS (
    SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1
),
admin_role AS (
    SELECT id FROM admin_role WHERE name = '超级管理员' LIMIT 1
)
INSERT INTO user_role (user_id, role_id)
SELECT au.id, ar.id FROM admin_user au CROSS JOIN admin_role ar
ON CONFLICT DO NOTHING;

-- 为超级管理员配置全部数据权限
WITH admin_role AS (
    SELECT id FROM admin_role WHERE name = '超级管理员' LIMIT 1
)
INSERT INTO data_permission (role_id, data_scope)
SELECT ar.id, 'ALL' FROM admin_role ar
ON CONFLICT DO NOTHING;

