-- ============================================
-- 文件名: 01_functions.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v4.72.0
-- 功能描述: 数据库通用函数定义（含分区管理辅助函数）
-- 执行顺序: 02-01 (schema第一步)
-- 依赖关系: 01_database/01_create_database.sql
-- 更新记录:
--   2026-06-06 - v4.72.0 - 新增分区管理辅助函数（create_monthly_partition, create_future_partitions）
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

-- ============================================
-- 分区管理辅助函数
-- ============================================

/**
 * 创建指定月份的分区
 * @param parent_table TEXT - 父表名（如 'player_currency_log'）
 * @param partition_date DATE - 目标月份（如 '2026-07-01'）
 * @returns VOID
 */
CREATE OR REPLACE FUNCTION create_monthly_partition(
    parent_table TEXT,
    partition_date DATE
) RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    -- 构造分区名：表名_YYYY_MM
    partition_name := parent_table || '_' || to_char(partition_date, 'YYYY_MM');
    start_date := to_char(partition_date, 'YYYY-MM-01');
    end_date := to_char(partition_date + INTERVAL '1 month', 'YYYY-MM-01');

    -- 检查分区是否已存在
    IF EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
    ) THEN
        RAISE NOTICE '分区 % 已存在，跳过创建', partition_name;
        RETURN;
    END IF;

    -- 动态创建分区
    EXECUTE format(
        'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        partition_name, parent_table, start_date, end_date
    );

    RAISE NOTICE '成功创建分区: % (%, %)', partition_name, start_date, end_date;
END;
$$ LANGUAGE plpgsql;

/**
 * 批量创建未来N个月的分区（包含当前月）
 * @param parent_table TEXT - 父表名
 * @param months_ahead INTEGER - 向前创建月数（默认3）
 * @returns VOID
 */
CREATE OR REPLACE FUNCTION create_future_partitions(
    parent_table TEXT,
    months_ahead INTEGER DEFAULT 3
) RETURNS VOID AS $$
DECLARE
    i INTEGER;
    target_date DATE;
BEGIN
    FOR i IN 0..months_ahead LOOP
        target_date := date_trunc('month', CURRENT_DATE)::DATE + (i * INTERVAL '1 month');
        PERFORM create_monthly_partition(parent_table, target_date);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

\echo '通用函数创建成功！'
