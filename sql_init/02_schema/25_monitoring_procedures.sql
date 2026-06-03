-- ============================================
-- 文件名: 25_monitoring_procedures.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 监控和对账存储过程
-- 执行顺序: 02-25
-- 依赖关系: 02-24_monitoring_tables.sql
-- ============================================

-- 存储过程：每日货币对账
CREATE OR REPLACE FUNCTION sp_daily_currency_reconciliation()
RETURNS VOID AS $$
DECLARE
    total_earn BIGINT;
    total_spend BIGINT;
    total_balance BIGINT;
    log_earn BIGINT;
    log_spend BIGINT;
    balance_diff BIGINT;
BEGIN
    -- 计算玩家账户总余额
    SELECT COALESCE(SUM(currency_num), 0) INTO total_balance FROM player_currency;
    
    -- 计算玩家账户累计收支
    SELECT COALESCE(SUM(total_earn), 0), COALESCE(SUM(total_spend), 0) INTO total_earn, total_spend FROM player_currency;
    
    -- 计算交易日志累计收支
    SELECT COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN type = 2 THEN amount ELSE 0 END), 0)
    INTO log_earn, log_spend
    FROM player_currency_log;
    
    -- 计算差异
    balance_diff := ABS((total_earn - total_spend) - total_balance);
    
    -- 插入对账记录
    INSERT INTO system_monitoring_log (monitor_type, monitor_data, status, create_time)
    VALUES ('currency_reconciliation',
            CONCAT('总余额:', total_balance, ', 累计收入:', total_earn, ', 累计支出:', total_spend,
                   ', 日志收入:', log_earn, ', 日志支出:', log_spend, ', 差异:', balance_diff),
            CASE WHEN balance_diff = 0 THEN 'normal' ELSE 'abnormal' END,
            NOW());
    
    -- 如果差异大于0，触发预警
    IF balance_diff > 0 THEN
        INSERT INTO system_alert (alert_type, alert_message, severity, status, create_time)
        VALUES ('currency_discrepancy',
                CONCAT('货币对账发现差异: ', balance_diff, ' 农场币'),
                'high',
                'pending',
                NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 存储过程：检查产出/消耗比
CREATE OR REPLACE FUNCTION sp_check_production_consumption_ratio()
RETURNS VOID AS $$
DECLARE
    total_production BIGINT;
    total_consumption BIGINT;
    ratio DECIMAL(10,2);
    threshold DECIMAL(10,2);
BEGIN
    -- 获取监控阈值（默认1.5）
    threshold := 1.5;

    -- 计算今日总产出
    SELECT COALESCE(SUM(daily_earn), 0) INTO total_production FROM player_currency;

    -- 计算今日总消耗
    SELECT COALESCE(SUM(daily_spend), 0) INTO total_consumption FROM player_currency;

    -- 计算产出/消耗比
    IF total_consumption > 0 THEN
        ratio := total_production / total_consumption;
    ELSE
        ratio := 0;
    END IF;

    -- 插入监控记录
    INSERT INTO system_monitoring_log (monitor_type, monitor_data, status, create_time)
    VALUES ('production_consumption_ratio',
            CONCAT('总产出:', total_production, ', 总消耗:', total_consumption, ', 比率:', ratio),
            CASE WHEN ratio BETWEEN 0.7 AND 1.5 THEN 'normal' ELSE 'abnormal' END,
            NOW());

    -- 如果比率异常，触发预警
    IF ratio > threshold OR ratio < 0.7 THEN
        INSERT INTO system_alert (alert_type, alert_message, severity, status, create_time)
        VALUES ('production_consumption_ratio',
                CONCAT('产出/消耗比异常: ', ratio, ', 阈值: 0.7-', threshold),
                CASE WHEN ratio > threshold THEN 'high' ELSE 'medium' END,
                'pending',
                NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 存储过程：检查单个玩家异常行为
CREATE OR REPLACE FUNCTION sp_check_player_abnormal_behavior()
RETURNS VOID AS $$
DECLARE
    max_daily_earn BIGINT;
BEGIN
    -- 获取每日最大获得限制（默认1000000）
    max_daily_earn := 1000000;

    -- 检查超过每日获得限制的玩家
    INSERT INTO system_alert (alert_type, alert_message, severity, status, create_time)
    SELECT 'abnormal_earning',
           CONCAT('玩家 ', player_id, ' 今日获得农场币 ', daily_earn, ' 超过限制 ', max_daily_earn),
           'high',
           'pending',
           NOW()
    FROM player_currency
    WHERE daily_earn > max_daily_earn;

    -- 检查地块解锁与等级不匹配的玩家
    INSERT INTO system_alert (alert_type, alert_message, severity, status, create_time)
    SELECT 'unlock_mismatch',
           CONCAT('玩家 ', p.player_id, ' 等级 ', p.player_level, ' 已解锁 ', p.unlocked_land_num, ' 块地块，可能存在异常'),
           'medium',
           'pending',
           NOW()
    FROM player_base p
    WHERE p.unlocked_land_num > (p.player_level / 40) + 3;
END;
$$ LANGUAGE plpgsql;

-- 存储过程：重置每日统计数据
CREATE OR REPLACE FUNCTION sp_reset_daily_stats()
RETURNS VOID AS $$
BEGIN
    -- 重置玩家每日收支
    UPDATE player_currency
    SET daily_earn = 0,
        daily_spend = 0;

    -- 记录重置操作
    INSERT INTO system_monitoring_log (monitor_type, monitor_data, status, create_time)
    VALUES ('daily_reset', '已重置玩家每日统计数据', 'normal', NOW());
END;
$$ LANGUAGE plpgsql;

\echo '监控存储过程创建成功！'
