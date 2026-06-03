-- emergency_procedures.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 紧急调控存储过程

-- 存储过程：通胀紧急调控
CREATE OR REPLACE FUNCTION sp_emergency_inflation_control(p_control_level VARCHAR(20))
RETURNS VOID AS $$
DECLARE
    v_affected_count INT;
BEGIN
    -- 记录操作
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('emergency_control', 
            CONCAT('启动通胀紧急调控，等级: ', p_control_level),
            'system',
            NOW());
    
    -- 根据调控等级执行不同的措施
    CASE p_control_level
        WHEN 'mild' THEN
            -- 轻度调控：增加高品质地块覆盖成本
            UPDATE land_quality 
            SET cover_cost_num = cover_cost_num * 1.1,
                total_cover_cost = total_cover_cost * 1.1
            WHERE quality_id > 4;
            GET DIAGNOSTICS v_affected_count = ROW_COUNT;
        
        WHEN 'moderate' THEN
            -- 中度调控：增加高品质地块覆盖成本和顶级作物种子成本
            UPDATE land_quality 
            SET cover_cost_num = cover_cost_num * 1.2,
                total_cover_cost = total_cover_cost * 1.2
            WHERE quality_id > 3;
            
            UPDATE crop 
            SET seed_cost = seed_cost * 1.15
            WHERE crop_type = 'top' OR crop_type = 'rare';
            GET DIAGNOSTICS v_affected_count = ROW_COUNT;
        
        WHEN 'severe' THEN
            -- 重度调控：增加所有高品质成本，降低顶级作物售价
            UPDATE land_quality 
            SET cover_cost_num = cover_cost_num * 1.3,
                total_cover_cost = total_cover_cost * 1.3
            WHERE quality_id > 2;
            
            UPDATE crop 
            SET seed_cost = seed_cost * 1.2,
                sell_price = sell_price * 0.9
            WHERE crop_type = 'top' OR crop_type = 'rare';
            
            UPDATE shop_goods 
            SET price_num = price_num * 1.1
            WHERE goods_type = 2; -- 道具
            GET DIAGNOSTICS v_affected_count = ROW_COUNT;
    END CASE;
    
    -- 更新系统配置
    UPDATE system_config 
    SET config_value = '1',
        update_time = NOW()
    WHERE config_key = 'inflation_control_enabled';
    
    -- 记录调控结果
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('emergency_control', 
            CONCAT('通胀紧急调控完成，影响记录数: ', v_affected_count),
            'system',
            NOW());
END;
$$ LANGUAGE plpgsql;

-- 存储过程：通缩紧急调控
CREATE OR REPLACE FUNCTION sp_emergency_deflation_control(p_control_level VARCHAR(20))
RETURNS VOID AS $$
DECLARE
    v_affected_count INT;
    v_emergency_fund BIGINT;
BEGIN
    -- 记录操作
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('emergency_control', 
            CONCAT('启动通缩紧急调控，等级: ', p_control_level),
            'system',
            NOW());
    
    -- 获取紧急补偿金额
    SELECT CAST(config_value AS BIGINT) INTO v_emergency_fund FROM system_config WHERE config_key = 'emergency_fund_amount';
    
    -- 根据调控等级执行不同的措施
    CASE p_control_level
        WHEN 'mild' THEN
            -- 轻度调控：降低新手地块解锁成本
            UPDATE farm_land 
            SET unlock_cost = unlock_cost * 0.8
            WHERE land_num <= 10;
            GET DIAGNOSTICS v_affected_count = ROW_COUNT;
        
        WHEN 'moderate' THEN
            -- 中度调控：降低地块解锁成本，提高作物售价
            UPDATE farm_land 
            SET unlock_cost = unlock_cost * 0.7
            WHERE land_num <= 20;
            
            UPDATE crop 
            SET sell_price = sell_price * 1.1
            WHERE crop_type = 'basic' OR crop_type = 'economic';
            GET DIAGNOSTICS v_affected_count = ROW_COUNT;
        
        WHEN 'severe' THEN
            -- 重度调控：降低地块解锁成本，提高作物售价，给所有玩家发放补偿
            UPDATE farm_land 
            SET unlock_cost = unlock_cost * 0.6;
            
            UPDATE crop 
            SET sell_price = sell_price * 1.15;
            
            -- 给所有玩家发放补偿
            IF v_emergency_fund > 0 THEN
                UPDATE player_currency 
                SET currency_num = currency_num + v_emergency_fund,
                    total_earn = total_earn + v_emergency_fund,
                    daily_earn = daily_earn + v_emergency_fund;
                GET DIAGNOSTICS v_affected_count = ROW_COUNT;
            END IF;
    END CASE;
    
    -- 更新系统配置
    UPDATE system_config 
    SET config_value = '1',
        update_time = NOW()
    WHERE config_key = 'deflation_control_enabled';
    
    -- 记录调控结果
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('emergency_control', 
            CONCAT('通缩紧急调控完成，影响记录数: ', v_affected_count),
            'system',
            NOW());
END;
$$ LANGUAGE plpgsql;

-- 存储过程：启用熔断机制
CREATE OR REPLACE FUNCTION sp_enable_circuit_breaker(p_reason VARCHAR(200))
RETURNS VOID AS $$
BEGIN
    -- 记录操作
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('emergency_control', 
            CONCAT('启用熔断机制，原因: ', p_reason),
            'system',
            NOW());
    
    -- 更新系统配置
    UPDATE system_config 
    SET config_value = '1',
        update_time = NOW()
    WHERE config_key = 'enable_circuit_breaker';
    
    -- 记录熔断事件
    INSERT INTO system_alert (alert_type, alert_message, severity, status, create_time)
    VALUES ('circuit_breaker', 
            CONCAT('系统启用熔断机制，原因: ', p_reason),
            'critical',
            'processed',
            NOW());
END;
$$ LANGUAGE plpgsql;

-- 存储过程：禁用熔断机制
CREATE OR REPLACE FUNCTION sp_disable_circuit_breaker(p_reason VARCHAR(200))
RETURNS VOID AS $$
BEGIN
    -- 记录操作
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('emergency_control', 
            CONCAT('禁用熔断机制，原因: ', p_reason),
            'system',
            NOW());
    
    -- 更新系统配置
    UPDATE system_config 
    SET config_value = '0',
        update_time = NOW()
    WHERE config_key = 'enable_circuit_breaker';
    
    -- 记录熔断事件
    INSERT INTO system_alert (alert_type, alert_message, severity, status, create_time)
    VALUES ('circuit_breaker', 
            CONCAT('系统禁用熔断机制，原因: ', p_reason),
            'medium',
            'processed',
            NOW());
END;
$$ LANGUAGE plpgsql;

-- 存储过程：批量修复玩家数据
CREATE OR REPLACE FUNCTION sp_fix_player_data()
RETURNS VOID AS $$
DECLARE
    v_fixed_count INT DEFAULT 0;
    v_row_count INT;
BEGIN
    -- 记录操作
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('data_fix', '开始批量修复玩家数据', 'system', NOW());
    
    -- 修复玩家货币余额为负的情况
    UPDATE player_currency 
    SET currency_num = 0
    WHERE currency_num < 0;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_fixed_count := v_fixed_count + v_row_count;
    
    -- 修复玩家库存数量为负的情况
    UPDATE player_inventory 
    SET item_num = 0
    WHERE item_num < 0;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_fixed_count := v_fixed_count + v_row_count;
    
    -- 修复锁定数量大于物品数量的情况
    UPDATE player_inventory 
    SET lock_num = item_num
    WHERE lock_num > item_num;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_fixed_count := v_fixed_count + v_row_count;
    
    -- 修复地块解锁数量超过50的情况
    UPDATE player_base 
    SET unlocked_land_num = 50
    WHERE unlocked_land_num > 50;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_fixed_count := v_fixed_count + v_row_count;
    
    -- 记录修复结果
    INSERT INTO system_operation_log (operation_type, operation_data, operator, create_time)
    VALUES ('data_fix', 
            CONCAT('批量修复玩家数据完成，修复记录数: ', v_fixed_count),
            'system',
            NOW());
END;
$$ LANGUAGE plpgsql;