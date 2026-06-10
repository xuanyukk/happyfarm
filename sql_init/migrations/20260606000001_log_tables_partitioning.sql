-- ============================================
-- 文件名: 20260606000001_log_tables_partitioning.sql
-- 作者: 开发者
-- 日期: 2026-06-06
-- 版本: v1.0.0
-- 功能描述: 高频日志表按月分区迁移，将现有的 player_currency_log
--           和 game_activity_log 从普通表转换为按月分区表，
--           提升查询性能和管理效率
-- 依赖关系: 需先存在 13_player_currency_log 和 23_game_activity_log 表
-- 适用版本: PostgreSQL 12+
-- 注意: 此脚本为升级迁移脚本，仅用于已有数据库的升级
--       新安装数据库从 02_schema/ 直接创建分区表
--       需在业务低峰期执行，避免ALTER TABLE锁表影响
-- ============================================

BEGIN;

-- ============================================
-- 步骤1: player_currency_log 按月分区迁移
-- ============================================

-- 1.1 重命名原表为旧表
ALTER TABLE IF EXISTS player_currency_log RENAME TO player_currency_log_old;

-- 1.2 创建分区父表（与原表结构一致）
CREATE TABLE player_currency_log (
    id BIGSERIAL,
    player_id VARCHAR(64) NOT NULL,
    type SMALLINT NOT NULL,
    amount BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL,
    related_id BIGINT DEFAULT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_player FOREIGN KEY (player_id) REFERENCES player_base(player_id)
) PARTITION BY RANGE (create_time);

COMMENT ON TABLE player_currency_log IS '开心农场-玩家货币交易记录表（按月分区）';

-- 1.3 创建当前月份分区（2026年6月）
CREATE TABLE player_currency_log_2026_06 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- 1.4 创建后续月份分区（预创建未来3个月，避免写入失败）
CREATE TABLE player_currency_log_2026_07 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE player_currency_log_2026_08 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE player_currency_log_2026_09 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- 1.5 迁移旧数据到分区表（如果旧表有数据）
DO $$
DECLARE
    old_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO old_count FROM player_currency_log_old;
    IF old_count > 0 THEN
        INSERT INTO player_currency_log
        SELECT * FROM player_currency_log_old;
        RAISE NOTICE '已迁移 % 条 player_currency_log 记录到分区表', old_count;
    END IF;
END $$;

-- 1.6 重置序列（确保新ID不冲突）
SELECT setval('player_currency_log_id_seq',
    COALESCE((SELECT MAX(id) FROM player_currency_log), 1));

-- 1.7 删除旧表
DROP TABLE IF EXISTS player_currency_log_old;

-- 1.8 创建分区索引
CREATE INDEX IF NOT EXISTS idx_currency_log_player_id ON player_currency_log(player_id);
CREATE INDEX IF NOT EXISTS idx_currency_log_type ON player_currency_log(type);
CREATE INDEX IF NOT EXISTS idx_currency_log_source ON player_currency_log(source);
CREATE INDEX IF NOT EXISTS idx_currency_log_create_time ON player_currency_log(create_time DESC);


-- ============================================
-- 步骤2: game_activity_log 按月分区迁移
-- ============================================

-- 2.1 重命名原表为旧表
ALTER TABLE IF EXISTS game_activity_log RENAME TO game_activity_log_old;

-- 2.2 创建分区父表
CREATE TABLE game_activity_log (
    id BIGSERIAL,
    player_id VARCHAR(64) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_category VARCHAR(30) NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    metadata JSONB,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_player FOREIGN KEY (player_id)
        REFERENCES player_base(player_id) ON DELETE CASCADE
) PARTITION BY RANGE (create_time);

COMMENT ON TABLE game_activity_log IS '开心农场-游戏操作活动日志表（按月分区）';

-- 2.3 创建当前及未来分区
CREATE TABLE game_activity_log_2026_06 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE game_activity_log_2026_07 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE game_activity_log_2026_08 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE game_activity_log_2026_09 PARTITION OF game_activity_log
FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- 2.4 迁移旧数据
DO $$
DECLARE
    old_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO old_count FROM game_activity_log_old;
    IF old_count > 0 THEN
        INSERT INTO game_activity_log
        SELECT * FROM game_activity_log_old;
        RAISE NOTICE '已迁移 % 条 game_activity_log 记录到分区表', old_count;
    END IF;
END $$;

-- 2.5 重置序列
SELECT setval('game_activity_log_id_seq',
    COALESCE((SELECT MAX(id) FROM game_activity_log), 1));

-- 2.6 删除旧表
DROP TABLE IF EXISTS game_activity_log_old;

-- 2.7 创建分区索引
CREATE INDEX IF NOT EXISTS idx_game_activity_player_id ON game_activity_log(player_id);
CREATE INDEX IF NOT EXISTS idx_game_activity_type ON game_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_game_activity_category ON game_activity_log(activity_category);
CREATE INDEX IF NOT EXISTS idx_game_activity_create_time ON game_activity_log(create_time DESC);


-- ============================================
-- 步骤3: 创建自动创建未来分区的函数
-- ============================================

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

-- 创建未来N个月分区的便捷函数
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

-- 立即创建当前和未来3个月的分区
SELECT create_future_partitions('player_currency_log', 3);
SELECT create_future_partitions('game_activity_log', 3);

COMMIT;

\echo '日志表按月分区迁移成功！'
\echo '已创建 player_currency_log 和 game_activity_log 的分区表'
\echo '建议每月初执行: SELECT create_future_partitions(''player_currency_log'', 3);'