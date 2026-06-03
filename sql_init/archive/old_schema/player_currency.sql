-- player_currency.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.1
-- 功能: 玩家货币表(农场币)

-- 表结构
CREATE TABLE IF NOT EXISTS player_currency (
  id SERIAL PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL,
  currency_num BIGINT NOT NULL DEFAULT 0,
  total_earn BIGINT NOT NULL DEFAULT 0,
  total_spend BIGINT NOT NULL DEFAULT 0,
  daily_earn BIGINT NOT NULL DEFAULT 0,
  daily_spend BIGINT NOT NULL DEFAULT 0,
  last_earn_time TIMESTAMP DEFAULT NULL,
  last_spend_time TIMESTAMP DEFAULT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id),
  CONSTRAINT fk_currency_player FOREIGN KEY (player_id) REFERENCES player_base (player_id)
);

-- 添加注释
COMMENT ON TABLE player_currency IS '开心农场-玩家农场币账户表';
COMMENT ON COLUMN player_currency.id IS '主键ID';
COMMENT ON COLUMN player_currency.player_id IS '玩家唯一ID';
COMMENT ON COLUMN player_currency.currency_num IS '农场币持有数量';
COMMENT ON COLUMN player_currency.total_earn IS '累计获得农场币';
COMMENT ON COLUMN player_currency.total_spend IS '累计消耗农场币';
COMMENT ON COLUMN player_currency.daily_earn IS '今日获得农场币';
COMMENT ON COLUMN player_currency.daily_spend IS '今日消耗农场币';
COMMENT ON COLUMN player_currency.last_earn_time IS '上次获得时间';
COMMENT ON COLUMN player_currency.last_spend_time IS '上次消耗时间';
COMMENT ON COLUMN player_currency.create_time IS '创建时间';
COMMENT ON COLUMN player_currency.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_currency_num ON player_currency (currency_num);
CREATE INDEX IF NOT EXISTS idx_daily_earn ON player_currency (daily_earn);

-- 添加更新时间触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_player_currency_modtime' 
        AND tgrelid = 'player_currency'::regclass
    ) THEN
        CREATE TRIGGER update_player_currency_modtime
        BEFORE UPDATE ON player_currency
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
    END IF;
END $$;