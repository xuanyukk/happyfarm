-- ============================================
-- 文件名: 34_config_change_log.sql
-- 作者: Trae AI
-- 日期: 2026-05-26
-- 版本: v1.0.0
-- 功能描述: 配置变更日志增强表
-- 执行顺序: 02-34
-- 依赖关系: 02-31_game_config_system.sql, 02-29_admin_system.sql
-- 更新记录:
--   2026-05-26 - v1.0.0 - 初始版本，增强版配置变更日志和回滚机制
-- ============================================

-- 删除旧版本的 config_change_log 表（如果存在）
DROP TABLE IF EXISTS config_change_log CASCADE;

-- 配置变更日志表（增强版）
CREATE TABLE IF NOT EXISTS config_change_log (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) NOT NULL,
  change_type VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE, RESTORE
  old_value JSONB,                    -- 变更前的值
  new_value JSONB,                    -- 变更后的值
  changed_fields TEXT[],              -- 变更的字段列表
  operator_id INTEGER,
  operator_name VARCHAR(100),
  ip_address VARCHAR(45),
  change_reason TEXT,
  version INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE config_change_log IS '配置变更日志表（增强版），支持字段级diff和完整回滚';
COMMENT ON COLUMN config_change_log.config_key IS '配置键';
COMMENT ON COLUMN config_change_log.change_type IS '变更类型：CREATE, UPDATE, DELETE, RESTORE';
COMMENT ON COLUMN config_change_log.old_value IS '变更前的值（JSONB格式）';
COMMENT ON COLUMN config_change_log.new_value IS '变更后的值（JSONB格式）';
COMMENT ON COLUMN config_change_log.changed_fields IS '变更的字段列表';
COMMENT ON COLUMN config_change_log.operator_id IS '操作人ID';
COMMENT ON COLUMN config_change_log.operator_name IS '操作人名称';
COMMENT ON COLUMN config_change_log.ip_address IS '操作IP地址';
COMMENT ON COLUMN config_change_log.change_reason IS '变更原因';
COMMENT ON COLUMN config_change_log.version IS '版本号';

-- 索引
CREATE INDEX IF NOT EXISTS idx_config_change_log_key ON config_change_log(config_key);
CREATE INDEX IF NOT EXISTS idx_config_change_log_time ON config_change_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_change_log_version ON config_change_log(config_key, version);
CREATE INDEX IF NOT EXISTS idx_config_change_log_type ON config_change_log(change_type);
CREATE INDEX IF NOT EXISTS idx_config_change_log_operator ON config_change_log(operator_id);

\echo '配置变更日志增强表创建成功！'