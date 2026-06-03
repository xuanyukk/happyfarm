-- ============================================
-- 文件名: 02_system_config.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 系统配置表
-- 执行顺序: 02-02
-- 依赖关系: 02_01_functions.sql
-- ============================================

CREATE TABLE IF NOT EXISTS system_config (
    config_id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_name VARCHAR(200) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) NOT NULL DEFAULT 'STRING',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_config IS '系统配置表';
COMMENT ON COLUMN system_config.config_key IS '配置键';
COMMENT ON COLUMN system_config.config_name IS '配置名称';
COMMENT ON COLUMN system_config.config_value IS '配置值';
COMMENT ON COLUMN system_config.config_type IS '配置类型：STRING, INTEGER, BOOLEAN, JSON';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '系统配置表创建成功！'
