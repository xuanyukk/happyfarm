-- 文件名: 27_optimization.sql
-- 作者: Trae AI
-- 日期: 2026-05-12
-- 版本: v2.8.0
-- 功能描述: 性能优化和约束增强（包含新增的性能优化索引）
-- 执行顺序: 02-27
-- 依赖关系: 02-26_emergency_procedures.sql
-- 更新记录:
--   2026-05-12 - v2.7.0 - 新增 10+ 性能优化索引，覆盖所有核心查询场景
--   2026-05-24 - v2.8.0 - 新增3个复合索引：idx_crop_unlock、idx_shop_goods_unlock、idx_currency_log_player_type_time

-- 1. 索引优化

-- 为player_land_status表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_player_land_status ON player_land_status (player_id, land_num, status);

-- 为player_inventory表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_player_item ON player_inventory (player_id, item_type, item_obj_id);

-- 为player_currency_log表添加复合索引，提高查询性能
CREATE INDEX IF NOT EXISTS idx_player_currency_log ON player_currency_log (player_id, type, create_time);

-- player_behavior_log 和 system_alert 表暂时不存在，跳过索引创建

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

-- 3. 存储过程优化

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
    pending_alert_count := 0;  -- system_alert 表暂时不存在

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. 触发器优化

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
        EXECUTE FUNCTION trg_before_currency_update();
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
        EXECUTE FUNCTION trg_before_inventory_update();
    END IF;
END $$;

-- 触发器：记录玩家行为（player_behavior_log 表暂时不存在）
-- 暂时注释掉相关功能，待表创建后再启用
-- CREATE OR REPLACE FUNCTION trg_after_land_unlock()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- 2. 新增性能优化索引（v2.7.0 新增）

-- 2.1 玩家作物解锁表优化索引
CREATE INDEX IF NOT EXISTS idx_player_crop_unlock_player ON player_crop_unlock (player_id, crop_id);
COMMENT ON INDEX idx_player_crop_unlock_player IS '优化玩家作物解锁查询';

-- 2.2 游戏活动日志表优化索引
CREATE INDEX IF NOT EXISTS idx_game_activity_log_type_time ON game_activity_log (activity_type, create_time);
CREATE INDEX IF NOT EXISTS idx_game_activity_log_player_time ON game_activity_log (player_id, create_time DESC);
COMMENT ON INDEX idx_game_activity_log_type_time IS '优化按活动类型和时间查询';
COMMENT ON INDEX idx_game_activity_log_player_time IS '优化玩家活动日志查询';

-- 2.3 公告系统优化索引（表在 30_announcement_system.sql 中创建）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcement') THEN
        CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcement (is_published DESC, publish_time DESC);
    END IF;
END $$;

-- 2.4 审计日志优化索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at DESC);
COMMENT ON INDEX idx_audit_logs_action_time IS '优化审计日志按操作查询';
COMMENT ON INDEX idx_audit_logs_user IS '优化审计日志按用户查询';

-- 2.5 玩家基础表优化索引
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'player_base' AND column_name = 'player_level') THEN
        CREATE INDEX IF NOT EXISTS idx_player_level_exp ON player_base (player_level DESC, player_exp DESC);
    END IF;
END $$;
-- idx_player_last_login: last_login_time 列在 player_base 中不存在，跳过
COMMENT ON INDEX idx_player_level IS '优化玩家等级排行查询';

-- 2.6 游戏事件系统优化索引（如果表存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_events') THEN
        CREATE INDEX IF NOT EXISTS idx_game_events_active ON game_events (is_active DESC, start_time DESC);
        COMMENT ON INDEX idx_game_events_active IS '优化游戏活动查询';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_event_participants') THEN
        CREATE INDEX IF NOT EXISTS idx_game_event_participants ON game_event_participants (event_id, player_id);
        COMMENT ON INDEX idx_game_event_participants IS '优化游戏活动参与者查询';
    END IF;
END $$;

-- 2.7 刷新令牌表优化索引
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens (expires_at ASC);
COMMENT ON INDEX idx_refresh_tokens_expiry IS '优化刷新令牌过期清理查询';

-- 2.8 双因素认证表优化索引
CREATE INDEX IF NOT EXISTS idx_two_factor_user ON two_factor_auth (user_id, is_enabled DESC);
COMMENT ON INDEX idx_two_factor_user IS '优化双因素认证查询';

-- 2.9 作物解锁条件查询优化索引
CREATE INDEX IF NOT EXISTS idx_crop_unlock 
  ON crop (world_id, unlock_player_level, unlock_farm_level);
COMMENT ON INDEX idx_crop_unlock IS '优化作物解锁条件查询';

-- 2.10 商店商品解锁查询优化索引
CREATE INDEX IF NOT EXISTS idx_shop_goods_unlock 
  ON shop_goods (is_on_sale, unlock_player_level, unlock_world_level);
COMMENT ON INDEX idx_shop_goods_unlock IS '优化商店商品解锁查询';

-- 2.11 货币流水复合查询优化索引
CREATE INDEX IF NOT EXISTS idx_currency_log_player_type_time 
  ON player_currency_log (player_id, type, create_time DESC);
COMMENT ON INDEX idx_currency_log_player_type_time 
  IS '优化货币流水分页查询';

\echo '优化相关SQL执行成功！包含新增的性能优化索引（v2.7.0）'
