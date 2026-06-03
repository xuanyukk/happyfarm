-- ============================================
-- 迁移名称: add_indexes
-- 版本: v2.0.0
-- 日期: 2026-03-18
-- 描述: 数据库索引优化，为sys_user表添加索引
-- 影响范围: sys_user表新增3个索引（username/email/is_active）
-- 回滚操作: DROP INDEX IF EXISTS idx_sys_user_username; DROP INDEX IF EXISTS idx_sys_user_email; DROP INDEX IF EXISTS idx_sys_user_is_active;
-- 依赖: 17_sys_login.sql
-- ============================================

-- 为sys_user表添加索引
CREATE INDEX IF NOT EXISTS idx_sys_user_username ON sys_user(username);
CREATE INDEX IF NOT EXISTS idx_sys_user_email ON sys_user(email);
CREATE INDEX IF NOT EXISTS idx_sys_user_is_active ON sys_user(is_active);

-- 注释
COMMENT ON INDEX idx_sys_user_username IS '用户名索引';
COMMENT ON INDEX idx_sys_user_email IS '邮箱索引';
COMMENT ON INDEX idx_sys_user_is_active IS '账号激活状态索引';

