-- ============================================
-- 迁移名称: add_currency_config_fields
-- 版本: v2.0.0
-- 日期: 2026-05-25
-- 描述: 为currency_config表添加多货币支持字段，为player_currency表添加宝石币字段
-- 影响范围: currency_config表新增currency_code/is_active/format_rules字段；player_currency表新增gem_num/gem_total_earn/gem_total_spend字段
-- 回滚操作: ALTER TABLE currency_config DROP COLUMN IF EXISTS currency_code, DROP COLUMN IF EXISTS is_active, DROP COLUMN IF EXISTS format_rules; ALTER TABLE player_currency DROP COLUMN IF EXISTS gem_num, DROP COLUMN IF EXISTS gem_total_earn, DROP COLUMN IF EXISTS gem_total_spend;
-- 依赖: 08_currency_config.sql, 12_player_currency.sql
-- ============================================

-- ==========================================
-- 第一部分：currency_config 表字段扩展
-- ==========================================

-- 添加货币代码字段
ALTER TABLE currency_config
  ADD COLUMN IF NOT EXISTS currency_code VARCHAR(50) DEFAULT 'farm_coin';

COMMENT ON COLUMN currency_config.currency_code IS '货币代码，用于策略模式映射';

-- 添加启用/禁用状态
ALTER TABLE currency_config
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN currency_config.is_active IS '是否启用该货币类型';

-- 添加格式化规则JSON字段
ALTER TABLE currency_config
  ADD COLUMN IF NOT EXISTS format_rules JSONB DEFAULT NULL;

COMMENT ON COLUMN currency_config.format_rules IS '货币显示格式化规则（JSON格式）';

-- 更新现有农场币数据：上限提升至999亿
UPDATE currency_config
  SET max_hold = 99999999999,
      currency_code = 'farm_coin',
      is_active = TRUE,
      updated_at = CURRENT_TIMESTAMP
  WHERE config_id = 1;

-- 插入农场宝石币配置
INSERT INTO currency_config (config_id, currency_name, currency_symbol, max_hold, description, currency_code, is_active)
VALUES (2, '农场宝石币', '💎', 999999, '高级货币，可通过活动获取或商城购买。目前为基础框架搭建阶段，暂不开放实际使用功能', 'gem', TRUE)
ON CONFLICT (config_id) DO NOTHING;

-- ==========================================
-- 第二部分：player_currency 表添加宝石币字段
-- ==========================================

ALTER TABLE player_currency
  ADD COLUMN IF NOT EXISTS gem_num BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN player_currency.gem_num IS '农场宝石币持有数量';

ALTER TABLE player_currency
  ADD COLUMN IF NOT EXISTS gem_total_earn BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN player_currency.gem_total_earn IS '累计获得农场宝石币';

ALTER TABLE player_currency
  ADD COLUMN IF NOT EXISTS gem_total_spend BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN player_currency.gem_total_spend IS '累计消耗农场宝石币';

-- 为宝石币字段创建索引
CREATE INDEX IF NOT EXISTS idx_gem_num ON player_currency (gem_num);

-- ==========================================
-- 第三部分：更新 currency_config 宝石货币名称
-- ==========================================

UPDATE currency_config
  SET currency_name = '农场宝石币',
      description = '高级货币，可通过活动获取或商城购买。目前为基础框架搭建阶段，暂不开放实际使用功能',
      updated_at = CURRENT_TIMESTAMP
  WHERE config_id = 2;

\echo '货币配置表与玩家货币表迁移完成！'
