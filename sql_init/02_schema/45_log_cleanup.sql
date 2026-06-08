-- ============================================
-- 文件名: 45_log_cleanup.sql
-- 作者: Trae AI
-- 日期: 2026-06-07
-- 版本: v4.72.0
-- 功能描述: 日志表归档清理机制，包含归档表、归档函数、清理函数
--           和一键月度维护函数
-- 执行顺序: 02-45
-- 依赖关系: 02-13_player_currency_log.sql（分区表）
--           02-23_game_activity_log.sql（分区表）
--           02-01_functions.sql（create_future_partitions函数）
-- 注意: 建议通过 pg_cron 或操作系统 cron 定时执行
--       每月1日凌晨3点执行归档，3个月前的数据归档，6个月前的空分区删除
-- ============================================

-- ============================================
-- 步骤1: 创建日志归档表
-- ============================================

-- 货币日志归档表（结构同 player_currency_log 分区表）
CREATE TABLE IF NOT EXISTS player_currency_log_archive (
    LIKE player_currency_log INCLUDING ALL
) PARTITION BY RANGE (create_time);

COMMENT ON TABLE player_currency_log_archive IS '玩家货币日志归档表';

-- 预建当前及未来3个月归档分区
CREATE TABLE IF NOT EXISTS player_currency_log_archive_2026_06
    PARTITION OF player_currency_log_archive
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS player_currency_log_archive_2026_07
    PARTITION OF player_currency_log_archive
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS player_currency_log_archive_2026_08
    PARTITION OF player_currency_log_archive
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS player_currency_log_archive_2026_09
    PARTITION OF player_currency_log_archive
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- 活动日志归档表（结构同 game_activity_log 分区表）
CREATE TABLE IF NOT EXISTS game_activity_log_archive (
    LIKE game_activity_log INCLUDING ALL
) PARTITION BY RANGE (create_time);

COMMENT ON TABLE game_activity_log_archive IS '游戏活动日志归档表';

-- 预建当前及未来3个月归档分区
CREATE TABLE IF NOT EXISTS game_activity_log_archive_2026_06
    PARTITION OF game_activity_log_archive
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS game_activity_log_archive_2026_07
    PARTITION OF game_activity_log_archive
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS game_activity_log_archive_2026_08
    PARTITION OF game_activity_log_archive
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS game_activity_log_archive_2026_09
    PARTITION OF game_activity_log_archive
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');


-- ============================================
-- 步骤2: 创建归档函数
-- ============================================

/**
 * 归档指定月份之前的日志数据到归档表
 * @param source_table TEXT - 源表名
 * @param archive_table TEXT - 归档表名
 * @param retention_months INTEGER - 保留月数（默认3个月）
 * @returns INTEGER - 归档的记录数
 */
CREATE OR REPLACE FUNCTION archive_old_logs(
    source_table TEXT,
    archive_table TEXT,
    retention_months INTEGER DEFAULT 3
) RETURNS INTEGER AS $$
DECLARE
    cutoff_date TIMESTAMP;
    partition_name TEXT;
    partition_start TEXT;
    partition_end TEXT;
    moved_count INTEGER;
    total_count INTEGER := 0;
    partition_record RECORD;
BEGIN
    cutoff_date := date_trunc('month', CURRENT_DATE)
        - (retention_months * INTERVAL '1 month');

    -- 遍历需要归档的旧分区
    FOR partition_record IN
        SELECT
            c.relname AS partition_name,
            pg_get_expr(c.relpartbound, c.oid) AS partition_bound
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON i.inhparent = p.oid
        WHERE p.relname = source_table
          AND c.relkind = 'r'
    LOOP
        BEGIN
            EXECUTE format(
                'SELECT COUNT(*) FROM %I WHERE create_time < %L',
                partition_record.partition_name, cutoff_date
            ) INTO moved_count;

            IF moved_count > 0 THEN
                -- 从分区名提取日期信息
                partition_start := regexp_replace(
                    partition_record.partition_name,
                    '^.*_(\d{4}_\d{2})$', '\1'
                );
                partition_start := replace(partition_start, '_', '-') || '-01';
                partition_end := to_char(
                    (partition_start::DATE + INTERVAL '1 month')::DATE,
                    'YYYY-MM-DD'
                );

                partition_name := archive_table || '_' ||
                    replace(left(partition_start, 7), '-', '_');

                -- 如果归档分区不存在则创建
                IF NOT EXISTS (
                    SELECT 1 FROM pg_class WHERE relname = partition_name
                ) THEN
                    EXECUTE format(
                        'CREATE TABLE %I PARTITION OF %I '
                        || 'FOR VALUES FROM (%L) TO (%L)',
                        partition_name, archive_table,
                        partition_start, partition_end
                    );
                END IF;

                -- 移动数据到归档表
                EXECUTE format(
                    'INSERT INTO %I SELECT * FROM %I '
                    || 'WHERE create_time < %L',
                    partition_name, partition_record.partition_name,
                    cutoff_date
                );

                GET DIAGNOSTICS moved_count = ROW_COUNT;
                total_count := total_count + moved_count;

                -- 删除源表中已归档的旧数据
                EXECUTE format(
                    'DELETE FROM %I WHERE create_time < %L',
                    partition_record.partition_name, cutoff_date
                );

                RAISE NOTICE '已归档 % 条记录: % -> %',
                    moved_count, partition_record.partition_name, partition_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '归档分区 % 失败: %',
                partition_record.partition_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '归档完成，共归档 % 条记录', total_count;
    RETURN total_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 步骤3: 创建定期清理函数（删除超过保留期的空分区）
-- ============================================

/**
 * 删除超过保留期的空分区以释放磁盘空间
 * @param parent_table TEXT - 父表名
 * @param retention_months INTEGER - 保留月数（默认6个月）
 * @returns INTEGER - 删除的分区数
 */
CREATE OR REPLACE FUNCTION cleanup_empty_partitions(
    parent_table TEXT,
    retention_months INTEGER DEFAULT 6
) RETURNS INTEGER AS $$
DECLARE
    cutoff_date DATE;
    partition_record RECORD;
    deleted_count INTEGER := 0;
    row_count BIGINT;
BEGIN
    cutoff_date := date_trunc('month', CURRENT_DATE)
        - (retention_months * INTERVAL '1 month');

    FOR partition_record IN
        SELECT
            c.relname AS partition_name
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON i.inhparent = p.oid
        WHERE p.relname = parent_table
          AND c.relkind = 'r'
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I',
                partition_record.partition_name)
            INTO row_count;

            IF row_count = 0 THEN
                EXECUTE format('DROP TABLE IF EXISTS %I',
                    partition_record.partition_name);
                deleted_count := deleted_count + 1;
                RAISE NOTICE '已删除空分区: %',
                    partition_record.partition_name;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '清理分区 % 失败: %',
                partition_record.partition_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '清理完成，共删除 % 个空分区', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 步骤4: 创建一站式维护函数
-- ============================================

/**
 * 日志表月度维护：归档旧数据 + 删除空分区 + 创建未来分区
 * 建议每月1日凌晨通过 cron 执行
 * 使用方式: SELECT monthly_log_maintenance();
 */
CREATE OR REPLACE FUNCTION monthly_log_maintenance() RETURNS VOID AS $$
DECLARE
    archived_count INTEGER;
    cleaned_count INTEGER;
BEGIN
    RAISE NOTICE '======== 开始月度日志维护 ========';

    -- 1. 归档3个月前的日志
    RAISE NOTICE '-- 归档 player_currency_log --';
    archived_count := archive_old_logs(
        'player_currency_log', 'player_currency_log_archive', 3
    );
    RAISE NOTICE '-- 归档 game_activity_log --';
    archived_count := archived_count + archive_old_logs(
        'game_activity_log', 'game_activity_log_archive', 3
    );

    -- 2. 清理超过6个月的空分区
    RAISE NOTICE '-- 清理空分区 --';
    cleaned_count := cleanup_empty_partitions('player_currency_log', 6);
    cleaned_count := cleaned_count
        + cleanup_empty_partitions('game_activity_log', 6);

    -- 3. 创建未来3个月的分区
    RAISE NOTICE '-- 创建未来分区 --';
    PERFORM create_future_partitions('player_currency_log', 3);
    PERFORM create_future_partitions('game_activity_log', 3);
    PERFORM create_future_partitions('player_currency_log_archive', 3);
    PERFORM create_future_partitions('game_activity_log_archive', 3);

    RAISE NOTICE '======== 月度日志维护完成 ========';
    RAISE NOTICE '归档: % 条, 清理: % 个分区',
        archived_count, cleaned_count;
END;
$$ LANGUAGE plpgsql;

\echo '日志归档清理机制创建成功！'
\echo '使用方式:'
\echo '  手动执行: SELECT monthly_log_maintenance();'
\echo '  cron 定时: 0 3 1 * * psql -c "SELECT monthly_log_maintenance();"'