-- ============================================
-- 文件名: 08_currency_config.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.5.0
-- 功能描述: 货币体系公共配置表（支持多货币扩展）
-- 执行顺序: 02-08
-- 依赖关系: 02-07_crop.sql
-- 更新记录：
--   2026-05-25 - v2.5.0 - 增加 currency_code、is_active、format_rules 字段，max_hold 提升至 999亿
-- ============================================

CREATE TABLE IF NOT EXISTS currency_config (
    config_id SERIAL PRIMARY KEY,
    currency_name VARCHAR(20) NOT NULL DEFAULT '农场币',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT '₣',
    max_hold BIGINT NOT NULL DEFAULT 99999999999,
    description VARCHAR(200) NOT NULL,
    currency_code VARCHAR(50) DEFAULT 'farm_coin',
    is_active BOOLEAN DEFAULT TRUE,
    format_rules JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE currency_config IS '开心农场-货币体系公共配置表（支持多货币扩展）';
COMMENT ON COLUMN currency_config.config_id IS '配置ID';
COMMENT ON COLUMN currency_config.currency_name IS '货币名称';
COMMENT ON COLUMN currency_config.currency_symbol IS '货币符号';
COMMENT ON COLUMN currency_config.max_hold IS '最大持有量（默认999亿=99999999999）';
COMMENT ON COLUMN currency_config.description IS '货币说明';
COMMENT ON COLUMN currency_config.currency_code IS '货币代码，用于策略模式映射';
COMMENT ON COLUMN currency_config.is_active IS '是否启用该货币类型';
COMMENT ON COLUMN currency_config.format_rules IS '货币显示格式化规则（JSON格式），配置阈值/单位/小数位等';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_currency_config_updated_at ON currency_config;
CREATE TRIGGER update_currency_config_updated_at
    BEFORE UPDATE ON currency_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '货币体系配置表创建成功！'
