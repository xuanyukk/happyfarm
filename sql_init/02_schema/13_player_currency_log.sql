-- ============================================
-- 文件名: 13_player_currency_log.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v4.72.0
-- 功能描述: 玩家货币交易记录表（按月分区）
-- 执行顺序: 02-13
-- 依赖关系: 02-12_player_currency.sql
-- 更新记录:
--   2026-06-06 - v4.72.0 - 从普通表改为按月分区表，预建当前+未来3个月分区
-- ============================================

CREATE TABLE IF NOT EXISTS player_currency_log (
    id BIGSERIAL,
    player_id VARCHAR(64) NOT NULL,
    type SMALLINT NOT NULL,
    amount BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL,
    related_id BIGINT DEFAULT NULL,
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_player FOREIGN KEY (player_id) REFERENCES player_base (player_id),
    PRIMARY KEY (id, create_time)
) PARTITION BY RANGE (create_time);

COMMENT ON TABLE player_currency_log IS '开心农场-玩家货币交易记录表（按月分区）';
COMMENT ON COLUMN player_currency_log.id IS '交易ID';
COMMENT ON COLUMN player_currency_log.player_id IS '玩家ID';
COMMENT ON COLUMN player_currency_log.type IS '交易类型：1=收入 2=支出';
COMMENT ON COLUMN player_currency_log.amount IS '交易金额';
COMMENT ON COLUMN player_currency_log.source IS '交易来源：crop_sell(出售作物), land_unlock(解锁地块), quality_cover(品质覆盖), seed_buy(购买种子), item_buy(购买道具)';
COMMENT ON COLUMN player_currency_log.related_id IS '相关ID：作物ID、地块ID等';
COMMENT ON COLUMN player_currency_log.balance_before IS '交易前余额';
COMMENT ON COLUMN player_currency_log.balance_after IS '交易后余额';
COMMENT ON COLUMN player_currency_log.create_time IS '交易时间';

-- ============================================
-- 预创建当前及未来3个月分区
-- ============================================

CREATE TABLE player_currency_log_2026_06 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE player_currency_log_2026_07 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE player_currency_log_2026_08 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE player_currency_log_2026_09 PARTITION OF player_currency_log
FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

-- ============================================
-- 分区索引（在父表上创建，自动继承到所有分区）
-- ============================================

CREATE INDEX IF NOT EXISTS idx_currency_log_player_id ON player_currency_log (player_id);
CREATE INDEX IF NOT EXISTS idx_currency_log_type ON player_currency_log (type);
CREATE INDEX IF NOT EXISTS idx_currency_log_source ON player_currency_log (source);
CREATE INDEX IF NOT EXISTS idx_currency_log_create_time ON player_currency_log (create_time DESC);

\echo '玩家货币交易记录表（按月分区）创建成功！'