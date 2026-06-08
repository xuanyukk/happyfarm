-- ============================================
-- 文件名: 0001_baseline.sql
-- 作者: 开发者
-- 日期: 2026-06-07
-- 版本: v1.0.0
-- 功能描述: 数据库基线迁移，记录当前数据库结构的完整状态
--           作为后续增量迁移的起点
-- 执行方式: 手动执行（仅用于全新环境初始化参考）
-- 注意: 此文件为文档性质，实际初始化请使用 sql_init/ 下的脚本
-- ============================================

-- 当前数据库版本：v4.72.1
-- 表数量：84 张
-- 本文件记录迁移工具所需的基线版本号，后续增量迁移从 0002 开始

-- 插入基线迁移记录
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('0001', 'Baseline - v4.72.1 initial schema', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;