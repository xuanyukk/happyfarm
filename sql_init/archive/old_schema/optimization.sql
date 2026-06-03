-- optimization.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 性能优化和约束增强

-- 1. 索引优化

-- 为player_land_status表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_player_land_status ON player_land_status (player_id, land_num, status);

-- 为player_inventory表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_player_item ON player_inventory (player_id, item_type, item_obj_id);

-- 为player_currency_log表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_player_currency_log ON player_currency_log (player_id, type, create_time);

-- 为player_behavior_log表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_player_behavior ON player_behavior_log (player_id, behavior_type, create_time);

-- 为system_alert表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_alert_status ON system_alert (status, severity, create_time);

-- 2. 数据约束增强

-- 为crop表添加更多CHECK约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_seed_cost' 
        AND conrelid = 'crop'::regclass
    ) THEN
        ALTER TABLE crop ADD CONSTRAINT chk_seed_cost CHECK (seed_cost >= 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_sell_price' 
        AND conrelid = 'crop'::regclass
    ) THEN
        ALTER TABLE crop ADD CONSTRAINT chk_sell_price CHECK (sell_price >= 0);
    END IF;
END $$;

-- 为player_currency表添加CHECK约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_currency_num' 
        AND conrelid = 'player_currency'::regclass
    ) THEN
        ALTER TABLE player_currency ADD CONSTRAINT chk_currency_num CHECK (currency_num >= 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_daily_earn' 
        AND conrelid = 'player_currency'::regclass
    ) THEN
        ALTER TABLE player_currency ADD CONSTRAINT chk_daily_earn CHECK (daily_earn >= 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_daily_spend' 
        AND conrelid = 'player_currency'::regclass
    ) THEN
        ALTER TABLE player_currency ADD CONSTRAINT chk_daily_spend CHECK (daily_spend >= 0);
    END IF;
END $$;

-- 为shop_goods表添加CHECK约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_price_num' 
        AND conrelid = 'shop_goods'::regclass
    ) THEN
        ALTER TABLE shop_goods ADD CONSTRAINT chk_price_num CHECK (price_num >= 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_stock_limit' 
        AND conrelid = 'shop_goods'::regclass
    ) THEN
        ALTER TABLE shop_goods ADD CONSTRAINT chk_stock_limit CHECK (stock_limit >= 0);
    END IF;
END $$;

-- 为farm_land表添加CHECK约束
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chk_unlock_cost' 
        AND conrelid = 'farm_land'::regclass
    ) THEN
        ALTER TABLE farm_land ADD CONSTRAINT chk_unlock_cost CHECK (unlock_cost >= 0);
    END IF;
END $$;

-- 3. 分区表优化

-- 为player_currency_log表添加分区
-- 注意：PostgreSQL分区表语法
-- CREATE TABLE player_currency_log (
--   id BIGSERIAL PRIMARY KEY,
--   player_id VARCHAR(64) NOT NULL,
--   type SMALLINT NOT NULL,
--   amount BIGINT NOT NULL,
--   source VARCHAR(50) NOT NULL,
--   related_id BIGINT DEFAULT NULL,
--   balance_before BIGINT NOT NULL,
--   balance_after BIGINT NOT NULL,
--   create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- ) PARTITION BY RANGE (create_time);

-- CREATE TABLE player_currency_log_p202603 PARTITION OF player_currency_log
--   FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- 为player_behavior_log表添加分区
-- CREATE TABLE player_behavior_log (
--   log_id BIGSERIAL PRIMARY KEY,
--   player_id VARCHAR(64) NOT NULL,
--   behavior_type VARCHAR(50) NOT NULL,
--   behavior_data TEXT NOT NULL,
--   ip_address VARCHAR(50) DEFAULT NULL,
--   device_id VARCHAR(100) DEFAULT NULL,
--   create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- ) PARTITION BY RANGE (create_time);

-- 4. 存储过程优化

-- 存储过程：优化玩家数据查询
CREATE OR REPLACE FUNCTION sp_get_player_summary(p_player_id VARCHAR(64))
RETURNS SETOF player_base AS $$
BEGIN
    -- 玩家基础信息
    RETURN QUERY SELECT * FROM player_base WHERE player_id = p_player_id;
    
    -- 玩家货币信息
    RETURN QUERY SELECT * FROM player_currency WHERE player_id = p_player_id;
    
    -- 玩家已解锁地块数量
    RETURN QUERY SELECT COUNT(*) as unlocked_land_count 
    FROM player_land_status 
    WHERE player_id = p_player_id AND is_unlocked = true;
    
    -- 玩家高品质地块数量
    RETURN QUERY SELECT COUNT(*) as high_quality_land_count 
    FROM player_land_status 
    WHERE player_id = p_player_id AND current_quality > 1;
    
    -- 玩家库存概览
    RETURN QUERY SELECT item_type, COUNT(*) as item_count, SUM(item_num) as total_quantity
    FROM player_inventory 
    WHERE player_id = p_player_id 
    GROUP BY item_type;
END;
$$ LANGUAGE plpgsql;

-- 存储过程：优化系统监控数据查询
CREATE OR REPLACE FUNCTION sp_get_system_summary()
RETURNS TABLE (
    player_count BIGINT,
    total_currency BIGINT,
    total_daily_earn BIGINT,
    total_daily_spend BIGINT,
    total_unlocked_land BIGINT,
    total_high_quality_land BIGINT,
    pending_alert_count BIGINT
) AS $$
BEGIN
    -- 玩家总数
    player_count := (SELECT COUNT(*) FROM player_base);
    
    -- 总农场币流通量
    total_currency := (SELECT COALESCE(SUM(currency_num), 0) FROM player_currency);
    
    -- 今日总产出和消耗
    SELECT COALESCE(SUM(daily_earn), 0), COALESCE(SUM(daily_spend), 0) 
    INTO total_daily_earn, total_daily_spend 
    FROM player_currency;
    
    -- 地块解锁情况
    total_unlocked_land := (SELECT COUNT(*) FROM player_land_status WHERE is_unlocked = true);
    
    -- 高品质地块覆盖情况
    total_high_quality_land := (SELECT COUNT(*) FROM player_land_status WHERE current_quality > 1);
    
    -- 待处理预警数量
    pending_alert_count := (SELECT COUNT(*) FROM system_alert WHERE status = 'pending');
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 5. 触发器优化

-- 触发器：确保玩家货币余额不为负
CREATE OR REPLACE FUNCTION trg_before_currency_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.currency_num < 0 THEN
        NEW.currency_num := 0;
    END IF;
    
    IF NEW.daily_earn < 0 THEN
        NEW.daily_earn := 0;
    END IF;
    
    IF NEW.daily_spend < 0 THEN
        NEW.daily_spend := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：确保玩家货币余额不为负
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_before_currency_update' 
        AND tgrelid = 'player_currency'::regclass
    ) THEN
        CREATE TRIGGER trg_before_currency_update
        BEFORE UPDATE ON player_currency
        FOR EACH ROW
        EXECUTE PROCEDURE trg_before_currency_update();
    END IF;
END $$;

-- 触发器：确保玩家库存数量不为负
CREATE OR REPLACE FUNCTION trg_before_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.item_num < 0 THEN
        NEW.item_num := 0;
    END IF;
    
    IF NEW.lock_num < 0 THEN
        NEW.lock_num := 0;
    END IF;
    
    IF NEW.lock_num > NEW.item_num THEN
        NEW.lock_num := NEW.item_num;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：确保玩家库存数量不为负
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_before_inventory_update' 
        AND tgrelid = 'player_inventory'::regclass
    ) THEN
        CREATE TRIGGER trg_before_inventory_update
        BEFORE UPDATE ON player_inventory
        FOR EACH ROW
        EXECUTE PROCEDURE trg_before_inventory_update();
    END IF;
END $$;

-- 触发器：记录玩家行为
CREATE OR REPLACE FUNCTION trg_after_land_unlock()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_unlocked = false AND NEW.is_unlocked = true THEN
        INSERT INTO player_behavior_log (player_id, behavior_type, behavior_data, create_time)
        VALUES (NEW.player_id, 'unlock', 
                CONCAT('解锁地块 ', NEW.land_num),
                NOW());
    END IF;
    
    IF OLD.current_quality < NEW.current_quality THEN
        INSERT INTO player_behavior_log (player_id, behavior_type, behavior_data, create_time)
        VALUES (NEW.player_id, 'cover', 
                CONCAT('地块 ', NEW.land_num, ' 品质提升至 ', NEW.current_quality),
                NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：记录玩家行为
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_after_land_unlock' 
        AND tgrelid = 'player_land_status'::regclass
    ) THEN
        CREATE TRIGGER trg_after_land_unlock
        AFTER UPDATE ON player_land_status
        FOR EACH ROW
        EXECUTE PROCEDURE trg_after_land_unlock();
    END IF;
END $$;