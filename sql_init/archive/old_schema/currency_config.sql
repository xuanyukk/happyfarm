-- currency_config.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 货币体系公共配置表

-- 表结构
CREATE TABLE IF NOT EXISTS currency_config (
  config_id SERIAL PRIMARY KEY,
  currency_name VARCHAR(20) NOT NULL DEFAULT '农场币',
  currency_symbol VARCHAR(5) NOT NULL DEFAULT '₣',
  max_hold BIGINT NOT NULL DEFAULT 999999999,
  "desc" VARCHAR(200) NOT NULL
);

-- 添加注释
COMMENT ON TABLE currency_config IS '开心农场-货币体系公共配置表';
COMMENT ON COLUMN currency_config.config_id IS '配置ID';
COMMENT ON COLUMN currency_config.currency_name IS '货币名称';
COMMENT ON COLUMN currency_config.currency_symbol IS '货币符号';
COMMENT ON COLUMN currency_config.max_hold IS '最大持有量';
COMMENT ON COLUMN currency_config."desc" IS '货币说明';