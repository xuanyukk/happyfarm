-- ============================================
-- 迁移名称: create_game_config_tables
-- 版本: v2.0.0
-- 日期: 2026-04-30
-- 描述: 创建游戏参数配置管理系统表
-- 影响范围: 新增 game_config/config_version/config_approval/config_change_log 表
-- 回滚操作: DROP TABLE IF EXISTS config_change_log; DROP TABLE IF EXISTS config_approval; DROP TABLE IF EXISTS config_version; DROP TABLE IF EXISTS game_config;
-- 依赖: 29_admin_system.sql（管理员表）
-- ============================================

-- 参数配置表
CREATE TABLE IF NOT EXISTS game_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    name VARCHAR(100) NOT NULL COMMENT '配置名称',
    description TEXT COMMENT '配置描述',
    category VARCHAR(50) NOT NULL COMMENT '所属分类',
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('STRING', 'INTEGER', 'FLOAT', 'BOOLEAN', 'ENUM', 'JSON', 'ARRAY')),
    value TEXT COMMENT '当前值',
    default_value TEXT COMMENT '默认值',
    validation_rules JSONB COMMENT '验证规则',
    enum_options JSONB COMMENT '枚举选项（如果是ENUM类型）',
    is_readonly BOOLEAN DEFAULT FALSE COMMENT '是否只读',
    is_required_approval BOOLEAN DEFAULT FALSE COMMENT '是否需要审批',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES admins(id)
);

-- 配置版本表
CREATE TABLE IF NOT EXISTS config_version (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES game_config(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    old_value TEXT COMMENT '变更前值',
    new_value TEXT COMMENT '变更后值',
    change_type VARCHAR(20) CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE')),
    changed_by INTEGER REFERENCES admins(id),
    change_reason TEXT COMMENT '变更原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_id, version)
);

-- 配置审批表
CREATE TABLE IF NOT EXISTS config_approval (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES game_config(id),
    requestor_id INTEGER REFERENCES admins(id),
    request_data JSONB COMMENT '申请配置',
    reason TEXT COMMENT '申请原因',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approver_id INTEGER REFERENCES admins(id),
    approval_comment TEXT COMMENT '审批意见',
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 配置变更日志
CREATE TABLE IF NOT EXISTS config_change_log (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES game_config(id),
    operator_id INTEGER REFERENCES admins(id),
    action VARCHAR(20) CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ROLLBACK')),
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_game_config_category ON game_config(category);
CREATE INDEX IF NOT EXISTS idx_game_config_active ON game_config(is_active);
CREATE INDEX IF NOT EXISTS idx_config_version_config_id ON config_version(config_id);
CREATE INDEX IF NOT EXISTS idx_config_approval_status ON config_approval(status);
CREATE INDEX IF NOT EXISTS idx_config_change_log_config_id ON config_change_log(config_id);
CREATE INDEX IF NOT EXISTS idx_config_change_log_created_at ON config_change_log(created_at DESC);

-- 插入初始配置数据
INSERT INTO game_config (key, name, description, category, data_type, value, default_value, is_readonly, is_required_approval, sort_order) VALUES
-- 玩家系统
('INIT_GOLD', '初始金币', '新玩家初始金币数', 'PLAYER', 'INTEGER', '1000', '1000', FALSE, FALSE, 1),
('INIT_STAMINA', '初始体力', '新玩家初始体力值', 'PLAYER', 'INTEGER', '100', '100', FALSE, FALSE, 2),
('EXP_RATE', '经验值倍率', '全局经验值获取倍率', 'PLAYER', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 3),

-- 农场系统
('LAND_UNLOCK_COST', '地块解锁费用', '每块新地块的解锁费用', 'FARM', 'INTEGER', '500', '500', FALSE, FALSE, 1),
('QUALITY_UPGRADE_COST', '品质升级费用', '品质升级的基础费用', 'FARM', 'INTEGER', '1000', '1000', FALSE, FALSE, 2),
('GROWTH_RATE', '作物生长倍率', '全局作物生长速度倍率', 'FARM', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 3),

-- 经济系统
('TRANSACTION_TAX', '交易税率', '玩家交易的税率（百分比）', 'ECONOMY', 'FLOAT', '5.0', '5.0', FALSE, TRUE, 1),
('GOLD_DECAY', '金币衰减率', '大额金币的每日衰减率（百分比）', 'ECONOMY', 'FLOAT', '0.1', '0.1', FALSE, TRUE, 2),
('OUTPUT_RATE', '产出倍率', '全局产出倍率', 'ECONOMY', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 3),

-- 活动系统
('EVENT_BONUS', '活动加成倍率', '活动期间的额外加成倍率', 'EVENT', 'FLOAT', '1.0', '1.0', FALSE, FALSE, 1),
('DROP_RATE', '掉落倍率', '活动期间的道具掉落倍率', 'EVENT', 'FLOAT', '1.0', '1.0', FALSE, FALSE, 2),

-- 系统设置
('MAINTENANCE_MODE', '维护模式', '是否开启维护模式，开启后普通玩家无法登录', 'SYSTEM', 'BOOLEAN', 'false', 'false', TRUE, TRUE, 1),
('REGISTRATION_ENABLED', '注册开关', '是否允许新玩家注册', 'SYSTEM', 'BOOLEAN', 'true', 'true', FALSE, TRUE, 2)
ON CONFLICT (key) DO NOTHING;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为game_config表添加更新时间触发器
DROP TRIGGER IF EXISTS update_game_config_updated_at ON game_config;
CREATE TRIGGER update_game_config_updated_at
    BEFORE UPDATE ON game_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

