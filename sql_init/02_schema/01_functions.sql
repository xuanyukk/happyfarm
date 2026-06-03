-- ============================================
-- 文件名: 01_functions.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 数据库通用函数定义
-- 执行顺序: 02-01 (schema第一步)
-- 依赖关系: 01_database/01_create_database.sql
-- ============================================

-- 自动更新update_time字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 生成UUID的辅助函数
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS VARCHAR(36) AS $$
BEGIN
    RETURN uuid_generate_v4()::VARCHAR(36);
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 生成玩家ID的函数
CREATE OR REPLACE FUNCTION generate_player_id()
RETURNS VARCHAR(36) AS $$
BEGIN
    RETURN generate_uuid();
END;
$$ LANGUAGE plpgsql VOLATILE;

\echo '通用函数创建成功！'
