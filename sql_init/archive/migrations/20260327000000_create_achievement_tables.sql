-- ============================================
-- 迁移名称: create_achievement_tables
-- 版本: v2.0.0
-- 日期: 2026-03-27
-- 描述: 创建成就系统表
-- 影响范围: 新增 achievement_definition/player_achievement/achievement_unlock_log 表
-- 回滚操作: DROP TABLE IF EXISTS achievement_unlock_log; DROP TABLE IF EXISTS player_achievement; DROP TABLE IF EXISTS achievement_definition;
-- 依赖: 11_player_base.sql（玩家表）
-- ============================================

-- 成就定义表
CREATE TABLE IF NOT EXISTS achievement_definition (
    achievement_id SERIAL PRIMARY KEY,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆',
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
    required_count INT NOT NULL,
    reward_type VARCHAR(20) DEFAULT 'none', -- none, currency, item, title
    reward_amount INT DEFAULT 0,
    reward_item_id INT DEFAULT NULL,
    reward_title VARCHAR(100) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 玩家成就进度表
CREATE TABLE IF NOT EXISTS player_achievement (
    player_id VARCHAR(36) NOT NULL,
    achievement_id INT NOT NULL,
    current_count INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, achievement_id),
    FOREIGN KEY (player_id) REFERENCES player_base(player_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievement_definition(achievement_id) ON DELETE CASCADE
);

-- 成就解锁日志表
CREATE TABLE IF NOT EXISTS achievement_unlock_log (
    log_id SERIAL PRIMARY KEY,
    player_id VARCHAR(36) NOT NULL,
    achievement_id INT NOT NULL,
    unlock_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES player_base(player_id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievement_definition(achievement_id) ON DELETE CASCADE
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_player_achievement_player_id ON player_achievement(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievement_achievement_id ON player_achievement(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_unlock_log_player_id ON achievement_unlock_log(player_id);
CREATE INDEX IF NOT EXISTS idx_achievement_definition_category ON achievement_definition(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definition_rarity ON achievement_definition(rarity);

-- 插入初始成就数据
INSERT INTO achievement_definition (achievement_name, description, icon, category, rarity, required_count, reward_type, reward_amount)
VALUES
    ('初出茅庐', '种植第一颗作物', '🌱', 'farming', 'common', 1, 'currency', 100),
    ('收获满满', '收获100颗作物', '🌾', 'farming', 'common', 100, 'currency', 500),
    ('种植大师', '种植1000颗作物', '👨‍🌾', 'farming', 'rare', 1000, 'currency', 2000),
    ('大地主', '解锁所有50块地块', '🏞️', 'farm', 'epic', 50, 'currency', 5000),
    ('品质追求者', '将一块地块提升到最高品质', '✨', 'farm', 'rare', 1, 'currency', 3000),
    ('富甲一方', '拥有100000农场币', '💰', 'economy', 'epic', 100000, 'currency', 10000),
    ('买卖能手', '出售1000颗作物', '🛒', 'economy', 'rare', 1000, 'currency', 2000),
    ('等级提升', '玩家等级达到100级', '⭐', 'level', 'common', 100, 'currency', 1000),
    ('农场升级', '农场等级达到50级', '🏠', 'level', 'rare', 50, 'currency', 2000),
    ('世界公民', '世界等级达到10级', '🌍', 'level', 'epic', 10, 'currency', 3000),
    ('道具专家', '使用50次道具', '🎯', 'item', 'common', 50, 'currency', 1000),
    ('一键收获', '使用一键收获功能10次', '⚡', 'farming', 'common', 10, 'currency', 500);

-- 插入完成后更新更新时间
UPDATE achievement_definition SET updated_at = CURRENT_TIMESTAMP;
