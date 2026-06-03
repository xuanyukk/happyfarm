-- ============================================
-- 文件名: 10_shop_goods.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 商店公共配置表(种子/道具，支持农场币)
-- 执行顺序: 02-10
-- 依赖关系: 02-09_item_config.sql
-- ============================================

CREATE TABLE IF NOT EXISTS shop_goods (
    goods_id SERIAL PRIMARY KEY,
    goods_type SMALLINT NOT NULL,
    goods_obj_id INTEGER NOT NULL,
    goods_name VARCHAR(50) NOT NULL,
    price_type SMALLINT NOT NULL DEFAULT 1,
    price_num BIGINT NOT NULL,
    unlock_world_level SMALLINT NOT NULL DEFAULT 1,
    unlock_player_level SMALLINT NOT NULL DEFAULT 1,
    stock_limit INTEGER NOT NULL DEFAULT 9999,
    sales_volume INTEGER NOT NULL DEFAULT 0,
    is_on_sale BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE shop_goods IS '开心农场-商店商品公共配置表';
COMMENT ON COLUMN shop_goods.goods_id IS '商品ID';
COMMENT ON COLUMN shop_goods.goods_type IS '商品类型 1=种子 2=道具';
COMMENT ON COLUMN shop_goods.goods_obj_id IS '商品对象ID(种子对应crop_id，道具对应item_id)';
COMMENT ON COLUMN shop_goods.goods_name IS '商品名称';
COMMENT ON COLUMN shop_goods.price_type IS '价格类型 1=农场币';
COMMENT ON COLUMN shop_goods.price_num IS '价格数量';
COMMENT ON COLUMN shop_goods.unlock_world_level IS '解锁所需世界等级';
COMMENT ON COLUMN shop_goods.unlock_player_level IS '解锁所需玩家等级';
COMMENT ON COLUMN shop_goods.stock_limit IS '库存限制';
COMMENT ON COLUMN shop_goods.sales_volume IS '销量';
COMMENT ON COLUMN shop_goods.is_on_sale IS '是否上架 0=下架 1=上架';
COMMENT ON COLUMN shop_goods.description IS '商品描述';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_goods_obj ON shop_goods (goods_type, goods_obj_id);
CREATE INDEX IF NOT EXISTS idx_unlock_level ON shop_goods (unlock_world_level, unlock_player_level);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_shop_goods_updated_at ON shop_goods;
CREATE TRIGGER update_shop_goods_updated_at
    BEFORE UPDATE ON shop_goods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '商店商品配置表创建成功！'
