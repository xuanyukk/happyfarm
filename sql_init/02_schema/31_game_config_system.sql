-- ============================================
-- 文件名: 31_game_config_system.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 游戏参数配置管理系统的数据库表结构
-- 执行顺序: 02-31
-- 依赖关系: 02-30_announcement_system.sql
-- ============================================

-- 参数配置表
CREATE TABLE IF NOT EXISTS game_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    value TEXT,
    default_value TEXT,
    validation_rules JSONB,
    enum_options JSONB,
    is_readonly BOOLEAN DEFAULT FALSE,
    is_required_approval BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES sys_user(id),
    CHECK (data_type IN ('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'ENUM', 'JSON', 'ARRAY'))
);

COMMENT ON TABLE game_config IS '游戏参数配置表';
COMMENT ON COLUMN game_config.key IS '配置键';
COMMENT ON COLUMN game_config.name IS '配置名称';
COMMENT ON COLUMN game_config.description IS '配置描述';
COMMENT ON COLUMN game_config.category IS '所属分类';
COMMENT ON COLUMN game_config.data_type IS '数据类型';
COMMENT ON COLUMN game_config.value IS '当前值';
COMMENT ON COLUMN game_config.default_value IS '默认值';
COMMENT ON COLUMN game_config.validation_rules IS '验证规则';
COMMENT ON COLUMN game_config.enum_options IS '枚举选项';
COMMENT ON COLUMN game_config.is_readonly IS '是否只读';
COMMENT ON COLUMN game_config.is_required_approval IS '是否需要审批';

-- 配置版本表
CREATE TABLE IF NOT EXISTS config_version (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES game_config(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type VARCHAR(20),
    changed_by INTEGER REFERENCES sys_user(id),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_id, version),
    CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE'))
);

COMMENT ON TABLE config_version IS '配置版本表';
COMMENT ON COLUMN config_version.old_value IS '变更前值';
COMMENT ON COLUMN config_version.new_value IS '变更后值';
COMMENT ON COLUMN config_version.change_type IS '变更类型';
COMMENT ON COLUMN config_version.change_reason IS '变更原因';

-- 配置审批表
CREATE TABLE IF NOT EXISTS config_approval (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES game_config(id),
    requestor_id INTEGER REFERENCES sys_user(id),
    request_data JSONB,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approver_id INTEGER REFERENCES sys_user(id),
    approval_comment TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

COMMENT ON TABLE config_approval IS '配置审批表';
COMMENT ON COLUMN config_approval.request_data IS '申请配置';
COMMENT ON COLUMN config_approval.reason IS '申请原因';
COMMENT ON COLUMN config_approval.approval_comment IS '审批意见';

-- 配置变更日志
CREATE TABLE IF NOT EXISTS config_change_log (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES game_config(id),
    operator_id INTEGER REFERENCES sys_user(id),
    action VARCHAR(20),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ROLLBACK'))
);

COMMENT ON TABLE config_change_log IS '配置变更日志';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_game_config_category ON game_config(category);
CREATE INDEX IF NOT EXISTS idx_game_config_active ON game_config(is_active);
CREATE INDEX IF NOT EXISTS idx_config_version_config_id ON config_version(config_id);
CREATE INDEX IF NOT EXISTS idx_config_approval_status ON config_approval(status);
CREATE INDEX IF NOT EXISTS idx_config_change_log_config_id ON config_change_log(config_id);
CREATE INDEX IF NOT EXISTS idx_config_change_log_created_at ON config_change_log(created_at DESC);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_game_config_updated_at ON game_config;
CREATE TRIGGER update_game_config_updated_at
BEFORE UPDATE ON game_config
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

\echo '游戏配置系统表创建成功！'
\echo '所有schema创建完成！'
