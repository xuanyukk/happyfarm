-- ============================================
-- 文件名: 42_daily_discount_goods.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.71.0
-- 功能描述: 每日折扣商品表——记录每日随机折扣商品及折扣信息
-- 执行顺序: 02-42
-- 依赖关系: 02-10_shop_goods.sql
-- 更新记录:
--   2026-05-31 - v4.71.0 - 方案B：新增每日折扣商品表
-- ============================================

CREATE TABLE IF NOT EXISTS daily_discount_goods (
    discount_id SERIAL PRIMARY KEY,
    goods_id INT NOT NULL REFERENCES shop_goods(goods_id) ON DELETE CASCADE,
    discount_rate DECIMAL(3,2) NOT NULL CHECK (discount_rate >= 0.50 AND discount_rate <= 0.95),
    discount_price BIGINT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE daily_discount_goods IS '开心农场-每日折扣商品表';
COMMENT ON COLUMN daily_discount_goods.goods_id IS '关联shop_goods.goods_id';
COMMENT ON COLUMN daily_discount_goods.discount_rate IS '折扣率(0.50-0.95)';
COMMENT ON COLUMN daily_discount_goods.discount_price IS '折扣后价格';
COMMENT ON COLUMN daily_discount_goods.start_time IS '折扣开始时间';
COMMENT ON COLUMN daily_discount_goods.end_time IS '折扣结束时间';
COMMENT ON COLUMN daily_discount_goods.is_active IS '折扣是否有效';

CREATE INDEX IF NOT EXISTS idx_discount_goods_id
    ON daily_discount_goods (goods_id);
CREATE INDEX IF NOT EXISTS idx_discount_active
    ON daily_discount_goods (is_active, end_time);

DROP TRIGGER IF EXISTS update_daily_discount_goods_updated_at ON daily_discount_goods;
CREATE TRIGGER update_daily_discount_goods_updated_at
    BEFORE UPDATE ON daily_discount_goods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '每日折扣商品表创建成功！'