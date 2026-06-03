-- player_currency_log.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 玩家货币交易记录表

-- 表结构
CREATE TABLE IF NOT EXISTS player_currency_log (
  id BIGSERIAL PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL,
  type SMALLINT NOT NULL,
  amount BIGINT NOT NULL,
  source VARCHAR(50) NOT NULL,
  related_id BIGINT DEFAULT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_player FOREIGN KEY (player_id) REFERENCES player_base (player_id)
);

-- 添加注释
COMMENT ON TABLE player_currency_log IS '开心农场-玩家货币交易记录表';
COMMENT ON COLUMN player_currency_log.id IS '交易ID';
COMMENT ON COLUMN player_currency_log.player_id IS '玩家ID';
COMMENT ON COLUMN player_currency_log.type IS '交易类型：1=收入 2=支出';
COMMENT ON COLUMN player_currency_log.amount IS '交易金额';
COMMENT ON COLUMN player_currency_log.source IS '交易来源：crop_sell(出售作物), land_unlock(解锁地块), quality_cover(品质覆盖), seed_buy(购买种子), item_buy(购买道具)';
COMMENT ON COLUMN player_currency_log.related_id IS '相关ID：作物ID、地块ID等';
COMMENT ON COLUMN player_currency_log.balance_before IS '交易前余额';
COMMENT ON COLUMN player_currency_log.balance_after IS '交易后余额';
COMMENT ON COLUMN player_currency_log.create_time IS '交易时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_player_id ON player_currency_log (player_id);
CREATE INDEX IF NOT EXISTS idx_type ON player_currency_log (type);
CREATE INDEX IF NOT EXISTS idx_source ON player_currency_log (source);
CREATE INDEX IF NOT EXISTS idx_create_time ON player_currency_log (create_time);

-- 分区表设计，按月份分区，提高查询性能
-- PostgreSQL分区表语法
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

-- CREATE TABLE player_currency_log_p202604 PARTITION OF player_currency_log
--   FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- 以此类推添加更多分区