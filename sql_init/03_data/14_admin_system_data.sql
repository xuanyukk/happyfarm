-- ============================================
-- 文件名: 14_admin_system_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-22
-- 版本: v4.50.0
-- 功能描述: 管理员系统初始数据
-- 执行顺序: 03-14
-- 依赖关系: 02-29_admin_system.sql, 03-09_sys_login_data.sql
-- 更新记录:
--   2026-05-19 - v2.5.1 - 修复数据权限枚举值，从 player_basic 改为 OWN
--   2026-05-22 - v4.50.0 - 版本同步更新
-- ============================================

-- 插入管理员角色
INSERT INTO admin_role (name, description, is_system, parent_id, is_active, created_by) VALUES
('超级管理员', '系统最高权限管理员，拥有所有权限', true, NULL, true, (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1)),
('系统管理员', '系统级管理员，管理系统配置', true, 1, true, (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1)),
('运营管理员', '负责游戏运营相关操作', true, 1, true, (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1)),
('客服管理员', '负责处理玩家问题和反馈', true, 1, true, (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1)),
('数据分析师', '负责查看和分析游戏数据', true, 1, true, (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- 为测试用户分配角色（为test_user分配客服管理员角色）
INSERT INTO user_role (user_id, role_id, is_active) VALUES
((SELECT id FROM sys_user WHERE username = 'test_user' LIMIT 1), 
 (SELECT id FROM admin_role WHERE name = '客服管理员' LIMIT 1), 
 true)
ON CONFLICT DO NOTHING;

-- 为测试用户添加数据权限
INSERT INTO data_permission (user_id, role_id, data_scope) SELECT 
  (SELECT id FROM sys_user WHERE username = 'test_user' LIMIT 1),
  (SELECT id FROM admin_role WHERE name = '客服管理员' LIMIT 1),
  'OWN'
WHERE EXISTS (
  SELECT 1 FROM sys_user WHERE username = 'test_user'
) ON CONFLICT DO NOTHING;

-- 插入管理员权限（按模块组织）
-- 用户管理模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('user:manage', '用户管理', '用户管理模块权限', 'user', 'function', true, NULL, 1, true),
('user:view', '查看用户', '查看用户列表和详情', 'user', 'operation', true, 1, 1, true),
('user:create', '创建用户', '创建新用户', 'user', 'operation', true, 1, 2, true),
('user:edit', '编辑用户', '编辑用户信息', 'user', 'operation', true, 1, 3, true),
('user:delete', '删除用户', '删除用户', 'user', 'operation', true, 1, 4, true),
('user:ban', '封禁用户', '封禁/解封用户', 'user', 'operation', true, 1, 5, true),
('user:reset_password', '重置密码', '重置用户密码', 'user', 'operation', true, 1, 6, true)
ON CONFLICT (code) DO NOTHING;

-- 玩家管理模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('player:manage', '玩家管理', '玩家管理模块权限', 'player', 'function', true, NULL, 2, true),
('player:view', '查看玩家', '查看玩家信息', 'player', 'operation', true, 8, 1, true),
('player:edit', '编辑玩家', '编辑玩家数据', 'player', 'operation', true, 8, 2, true),
('player:give_item', '发放道具', '给玩家发放道具', 'player', 'operation', true, 8, 3, true),
('player:give_gold', '发放金币', '给玩家发放金币', 'player', 'operation', true, 8, 4, true),
('player:adjust_exp', '调整经验', '调整玩家经验值', 'player', 'operation', true, 8, 5, true),
('player:kickout', '踢出玩家', '踢出在线玩家', 'player', 'operation', true, 8, 6, true)
ON CONFLICT (code) DO NOTHING;

-- 角色权限管理模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('role:manage', '角色管理', '角色权限管理模块', 'role', 'function', true, NULL, 3, true),
('role:view', '查看角色', '查看角色列表', 'role', 'operation', true, 15, 1, true),
('role:create', '创建角色', '创建新角色', 'role', 'operation', true, 15, 2, true),
('role:edit', '编辑角色', '编辑角色信息', 'role', 'operation', true, 15, 3, true),
('role:delete', '删除角色', '删除角色', 'role', 'operation', true, 15, 4, true),
('role:assign_perm', '分配权限', '为角色分配权限', 'role', 'operation', true, 15, 5, true),
('role:assign_user', '分配用户', '为用户分配角色', 'role', 'operation', true, 15, 6, true)
ON CONFLICT (code) DO NOTHING;

-- 系统配置模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('config:manage', '系统配置', '系统配置管理模块', 'config', 'function', true, NULL, 4, true),
('config:view', '查看配置', '查看系统配置', 'config', 'operation', true, 22, 1, true),
('config:edit', '编辑配置', '编辑系统配置', 'config', 'operation', true, 22, 2, true),
('config:backup', '备份配置', '备份系统配置', 'config', 'operation', true, 22, 3, true),
('config:restore', '恢复配置', '恢复系统配置', 'config', 'operation', true, 22, 4, true)
ON CONFLICT (code) DO NOTHING;

-- 游戏内容管理模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('game:manage', '游戏内容', '游戏内容管理模块', 'game', 'function', true, NULL, 5, true),
('game:crop', '作物管理', '管理作物配置', 'game', 'operation', true, 27, 1, true),
('game:item', '道具管理', '管理道具配置', 'game', 'operation', true, 27, 2, true),
('game:shop', '商店管理', '管理商店商品', 'game', 'operation', true, 27, 3, true),
('game:land', '地块管理', '管理地块配置', 'game', 'operation', true, 27, 4, true),
('game:achievement', '成就管理', '管理成就配置', 'game', 'operation', true, 27, 5, true)
ON CONFLICT (code) DO NOTHING;

-- 活动管理模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('event:manage', '活动管理', '活动管理模块', 'event', 'function', true, NULL, 6, true),
('event:view', '查看活动', '查看活动列表', 'event', 'operation', true, 33, 1, true),
('event:create', '创建活动', '创建新活动', 'event', 'operation', true, 33, 2, true),
('event:edit', '编辑活动', '编辑活动信息', 'event', 'operation', true, 33, 3, true),
('event:publish', '发布活动', '发布/下线活动', 'event', 'operation', true, 33, 4, true),
('event:reward', '活动奖励', '发放活动奖励', 'event', 'operation', true, 33, 5, true)
ON CONFLICT (code) DO NOTHING;

-- 公告管理模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('announcement:manage', '公告管理', '公告管理模块', 'announcement', 'function', true, NULL, 7, true),
('announcement:view', '查看公告', '查看公告列表', 'announcement', 'operation', true, 39, 1, true),
('announcement:create', '创建公告', '创建新公告', 'announcement', 'operation', true, 39, 2, true),
('announcement:edit', '编辑公告', '编辑公告内容', 'announcement', 'operation', true, 39, 3, true),
('announcement:publish', '发布公告', '发布/下线公告', 'announcement', 'operation', true, 39, 4, true),
('announcement:top', '置顶公告', '置顶/取消置顶', 'announcement', 'operation', true, 39, 5, true)
ON CONFLICT (code) DO NOTHING;

-- 数据统计模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('stats:manage', '数据统计', '数据统计模块', 'stats', 'function', true, NULL, 8, true),
('stats:view', '查看统计', '查看统计数据', 'stats', 'operation', true, 45, 1, true),
('stats:export', '导出数据', '导出统计数据', 'stats', 'operation', true, 45, 2, true),
('stats:dashboard', '数据看板', '查看数据看板', 'stats', 'operation', true, 45, 3, true)
ON CONFLICT (code) DO NOTHING;

-- 日志查看模块
INSERT INTO admin_permission (code, name, description, module, level, is_system, parent_id, sort_order, is_active) VALUES
('log:manage', '日志管理', '日志管理模块', 'log', 'function', true, NULL, 9, true),
('log:view', '查看日志', '查看系统日志', 'log', 'operation', true, 49, 1, true),
('log:audit', '审计日志', '查看审计日志', 'log', 'operation', true, 49, 2, true),
('log:operation', '操作日志', '查看操作日志', 'log', 'operation', true, 49, 3, true),
('log:download', '下载日志', '下载日志文件', 'log', 'operation', true, 49, 4, true)
ON CONFLICT (code) DO NOTHING;

-- 为超级管理员角色分配所有权限
INSERT INTO role_permission (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_role WHERE name = '超级管理员' LIMIT 1),
    id
FROM admin_permission
ON CONFLICT DO NOTHING;

-- 为系统管理员角色分配权限
INSERT INTO role_permission (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_role WHERE name = '系统管理员' LIMIT 1),
    id
FROM admin_permission
WHERE module IN ('config', 'log', 'stats')
OR code IN ('user:view', 'player:view', 'role:view')
ON CONFLICT DO NOTHING;

-- 为运营管理员角色分配权限
INSERT INTO role_permission (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_role WHERE name = '运营管理员' LIMIT 1),
    id
FROM admin_permission
WHERE module IN ('game', 'event', 'announcement', 'stats')
OR code IN ('player:view', 'player:give_item', 'player:give_gold')
ON CONFLICT DO NOTHING;

-- 为客服管理员角色分配权限
INSERT INTO role_permission (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_role WHERE name = '客服管理员' LIMIT 1),
    id
FROM admin_permission
WHERE code IN ('player:view', 'player:give_item', 'user:view', 'user:reset_password')
ON CONFLICT DO NOTHING;

-- 为数据分析师角色分配权限
INSERT INTO role_permission (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_role WHERE name = '数据分析师' LIMIT 1),
    id
FROM admin_permission
WHERE module IN ('stats', 'log')
ON CONFLICT DO NOTHING;

-- 为admin用户分配超级管理员角色
INSERT INTO user_role (user_id, role_id, is_active)
VALUES (
    (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1),
    (SELECT id FROM admin_role WHERE name = '超级管理员' LIMIT 1),
    true
)
ON CONFLICT DO NOTHING;

-- 为数据权限表设置默认权限
INSERT INTO data_permission (user_id, role_id, data_scope)
SELECT 
    (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1),
    (SELECT id FROM admin_role WHERE name = '超级管理员' LIMIT 1),
    'ALL'
ON CONFLICT DO NOTHING;

\echo '管理员系统初始数据插入成功！'
