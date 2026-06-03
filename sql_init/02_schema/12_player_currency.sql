-- ============================================
-- 文件名: 12_player_currency.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.5.0
-- 功能描述: 玩家货币表(农场币 + 农场宝石币)
-- 执行顺序: 02-12
-- 依赖关系: 02-11_player_base.sql
-- 更新记录：
--   2026-05-25 - v2.5.0 - 新增农场宝石币 gem_num 及相关字段
-- ============================================

CREATE TABLE IF NOT EXISTS player_currency (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    currency_num BIGINT NOT NULL DEFAULT 0,
    total_earn BIGINT NOT NULL DEFAULT 0,
    total_spend BIGINT NOT NULL DEFAULT 0,
    daily_earn BIGINT NOT NULL DEFAULT 0,
    daily_spend BIGINT NOT NULL DEFAULT 0,
    gem_num BIGINT NOT NULL DEFAULT 0,
    gem_total_earn BIGINT NOT NULL DEFAULT 0,
    gem_total_spend BIGINT NOT NULL DEFAULT 0,
    last_earn_time TIMESTAMP DEFAULT NULL,
    last_spend_time TIMESTAMP DEFAULT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id),
    CONSTRAINT fk_currency_player FOREIGN KEY (player_id) REFERENCES player_base (player_id)
);

COMMENT ON TABLE player_currency IS '开心农场-玩家货币账户表（含农场币和农场宝石币）';
COMMENT ON COLUMN player_currency.id IS '主键ID';
COMMENT ON COLUMN player_currency.player_id IS '玩家唯一ID';
COMMENT ON COLUMN player_currency.currency_num IS '农场币持有数量';
COMMENT ON COLUMN player_currency.total_earn IS '累计获得农场币';
COMMENT ON COLUMN player_currency.total_spend IS '累计消耗农场币';
COMMENT ON COLUMN player_currency.daily_earn IS '今日获得农场币';
COMMENT ON COLUMN player_currency.daily_spend IS '今日消耗农场币';
COMMENT ON COLUMN player_currency.gem_num IS '农场宝石币持有数量';
COMMENT ON COLUMN player_currency.gem_total_earn IS '累计获得农场宝石币';
COMMENT ON COLUMN player_currency.gem_total_spend IS '累计消耗农场宝石币';
COMMENT ON COLUMN player_currency.last_earn_time IS '上次获得时间';
COMMENT ON COLUMN player_currency.last_spend_time IS '上次消耗时间';
COMMENT ON COLUMN player_currency.create_time IS '创建时间';
COMMENT ON COLUMN player_currency.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_currency_num ON player_currency (currency_num);
CREATE INDEX IF NOT EXISTS idx_daily_earn ON player_currency (daily_earn);
CREATE INDEX IF NOT EXISTS idx_gem_num ON player_currency (gem_num);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_player_currency_updated_at ON player_currency;
CREATE TRIGGER update_player_currency_updated_at
    BEFORE UPDATE ON player_currency
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '玩家货币表创建成功！'
