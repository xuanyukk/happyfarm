-- sys_login_data.sql
-- 作者: Trae AI
-- 日期: 2026-03-17
-- 版本: 1.0
-- 功能: 登录系统初始数据

-- 插入管理员用户（用户名：admin，密码：123456）
INSERT INTO sys_user (username, password_hash, email, is_admin) 
VALUES (
    'admin',
    crypt('123456', gen_salt('bf', 10)),  -- bcrypt哈希（10轮复杂度）
    'admin@example.com',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- 插入普通用户（用户名：test_user，密码：123456）
INSERT INTO sys_user (username, password_hash, email) 
VALUES (
    'test_user',
    crypt('123456', gen_salt('bf', 10)),
    'test@example.com'
) ON CONFLICT (username) DO NOTHING;

-- 插入角色
INSERT INTO sys_role (role_name, role_desc) VALUES
('admin', '系统管理员，拥有全部权限'),
('user', '普通用户，拥有基础操作权限')
ON CONFLICT (role_name) DO NOTHING;

-- 插入权限
INSERT INTO sys_permission (perm_code, perm_name, perm_desc) VALUES
('user:query', '查询用户', '查询系统用户信息'),
('user:edit', '编辑用户', '编辑系统用户信息'),
('user:add', '添加用户', '添加新系统用户'),
('user:delete', '删除用户', '删除系统用户'),
('role:query', '查询角色', '查询系统角色信息'),
('role:edit', '编辑角色', '编辑系统角色信息'),
('role:add', '添加角色', '添加新系统角色'),
('role:delete', '删除角色', '删除系统角色'),
('permission:query', '查询权限', '查询系统权限信息'),
('permission:edit', '编辑权限', '编辑系统权限信息'),
('player:query', '查询玩家', '查询游戏玩家信息'),
('player:edit', '编辑玩家', '编辑游戏玩家信息'),
('player:add', '添加玩家', '添加新游戏玩家'),
('player:delete', '删除玩家', '删除游戏玩家'),
('system:config', '系统配置', '修改系统配置信息')
ON CONFLICT (perm_code) DO NOTHING;

-- 给admin角色分配所有权限
INSERT INTO sys_role_permission (role_id, perm_id)
SELECT  
    (SELECT id FROM sys_role WHERE role_name = 'admin'),
    id 
FROM  sys_permission
ON CONFLICT DO NOTHING;

-- 给user角色分配基础权限
INSERT INTO sys_role_permission (role_id, perm_id)
SELECT  
    (SELECT id FROM sys_role WHERE role_name = 'user'),
    id 
FROM  sys_permission
WHERE perm_code IN ('user:query', 'player:query')
ON CONFLICT DO NOTHING;

-- 给admin用户绑定admin角色
INSERT INTO sys_user_role (user_id, role_id)
VALUES (
    (SELECT id FROM sys_user WHERE username = 'admin'),
    (SELECT id FROM sys_role WHERE role_name = 'admin')
) ON CONFLICT DO NOTHING;

-- 给test_user用户绑定user角色
INSERT INTO sys_user_role (user_id, role_id)
VALUES (
    (SELECT id FROM sys_user WHERE username = 'test_user'),
    (SELECT id FROM sys_role WHERE role_name = 'user')
) ON CONFLICT DO NOTHING;