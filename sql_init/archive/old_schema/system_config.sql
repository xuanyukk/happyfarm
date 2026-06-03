-- system_config.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 系统配置表，用于防崩机制和兜底调控

-- 表结构
CREATE TABLE IF NOT EXISTS system_config (
  config_id SERIAL PRIMARY KEY,
  config_key VARCHAR(50) NOT NULL,
  config_value VARCHAR(255) NOT NULL,
  config_type VARCHAR(20) NOT NULL,
  description VARCHAR(200) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (config_key)
);

-- 添加注释
COMMENT ON TABLE system_config IS '开心农场-系统配置表';
COMMENT ON COLUMN system_config.config_id IS '配置ID';
COMMENT ON COLUMN system_config.config_key IS '配置键';
COMMENT ON COLUMN system_config.config_value IS '配置值';
COMMENT ON COLUMN system_config.config_type IS '配置类型：currency(货币), growth(成长), system(系统)';
COMMENT ON COLUMN system_config.description IS '配置描述';
COMMENT ON COLUMN system_config.is_active IS '是否激活';
COMMENT ON COLUMN system_config.create_time IS '创建时间';
COMMENT ON COLUMN system_config.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_config_type ON system_config (config_type);

-- 添加更新时间触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_system_config_modtime' 
        AND tgrelid = 'system_config'::regclass
    ) THEN
        CREATE TRIGGER update_system_config_modtime
        BEFORE UPDATE ON system_config
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
    END IF;
END $$;

-- 初始配置数据
INSERT INTO system_config (config_key, config_value, config_type, description, is_active) VALUES
-- 货币体系防崩配置
('max_daily_earn', '1000000', 'currency', '玩家单日最大获得农场币', true),
('max_gp_per_min', '100', 'currency', '顶级地块+顶级作物的最大GP/min', true),
('min_growth_cycle', '3', 'growth', '作物最小生长周期(分钟)', true),
('exp_coefficient', '0.5', 'growth', '农场币转经验系数', true),
-- 系统防崩配置
('enable_circuit_breaker', '0', 'system', '是否启用熔断机制', false),
('max_transaction_amount', '10000000', 'currency', '单次交易最大金额', true),
('monitor_threshold', '1.5', 'currency', '产出/消耗比预警阈值', true),
-- 兜底调控配置
('inflation_control_enabled', '0', 'currency', '是否启用通胀控制', false),
('deflation_control_enabled', '0', 'currency', '是否启用通缩控制', false),
('emergency_fund_amount', '0', 'currency', '紧急补偿农场币数量', false)
ON CONFLICT (config_key) DO NOTHING;