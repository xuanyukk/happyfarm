-- ============================================
-- 文件名: 20260530000001_add_player_shop_daily_limit.sql
-- 作者: SOLO
-- 日期: 2026-05-30
-- 版本: v1.0.0
-- 功能描述: 为已有数据库添加玩家商店每日限购记录表
-- 注意: 新安装数据库已从 02_schema/35_player_shop_daily_limit.sql 直接创建此表
--       本迁移仅用于升级已有数据库
-- ============================================

CREATE TABLE IF NOT EXISTS player_shop_daily_limit (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    goods_id INTEGER NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity_purchased INTEGER NOT NULL DEFAULT 0,
    last_purchase_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id, goods_id, purchase_date),
    CONSTRAINT fk_daily_limit_player FOREIGN KEY (player_id) REFERENCES player_base (player_id),
    CONSTRAINT fk_daily_limit_goods FOREIGN KEY (goods_id) REFERENCES shop_goods (goods_id)
);

COMMENT ON TABLE player_shop_daily_limit IS '开心农场-玩家商店每日限购记录表';
COMMENT ON COLUMN player_shop_daily_limit.player_id IS '玩家ID';
COMMENT ON COLUMN player_shop_daily_limit.goods_id IS '商品ID';
COMMENT ON COLUMN player_shop_daily_limit.purchase_date IS '购买日期';
COMMENT ON COLUMN player_shop_daily_limit.quantity_purchased IS '当日已购数量';
COMMENT ON COLUMN player_shop_daily_limit.last_purchase_time IS '最后购买时间';

CREATE INDEX IF NOT EXISTS idx_daily_limit_player_date ON player_shop_daily_limit (player_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_daily_limit_goods ON player_shop_daily_limit (goods_id);

\echo '玩家商店每日限购记录表迁移完成！'