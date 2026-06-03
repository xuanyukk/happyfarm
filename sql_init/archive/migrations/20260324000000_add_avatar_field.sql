-- ============================================
-- 迁移名称: add_avatar_field
-- 版本: v2.0.0
-- 日期: 2026-03-24
-- 描述: 在player_base表中添加头像字段
-- 影响范围: player_base表新增avatar字段
-- 回滚操作: ALTER TABLE player_base DROP COLUMN IF EXISTS avatar;
-- 依赖: 11_player_base.sql
-- ============================================

-- 添加头像字段
ALTER TABLE player_base ADD COLUMN IF NOT EXISTS avatar VARCHAR(50) DEFAULT '👤';

-- 添加注释
COMMENT ON COLUMN player_base.avatar IS '玩家头像(emoji表情)';

-- 更新现有玩家的头像
UPDATE player_base SET avatar = '👤' WHERE avatar IS NULL;

