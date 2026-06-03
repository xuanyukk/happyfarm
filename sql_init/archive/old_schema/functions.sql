-- functions.sql
-- 作者: Trae AI
-- 日期: 2026-03-17
-- 版本: 1.0
-- 功能: 通用函数定义

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;