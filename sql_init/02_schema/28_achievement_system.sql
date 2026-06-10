-- ============================================
-- 文件名: 28_achievement_system.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 成就系统数据库表结构
-- 执行顺序: 02-28
-- 依赖关系: 02-27_optimization.sql
-- ============================================

-- 成就定义表
CREATE TABLE IF NOT EXISTS achievement_definition (
    achievement_id SERIAL PRIMARY KEY,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆',
    category VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common',
    required_count INT NOT NULL,
    reward_type VARCHAR(20) DEFAULT 'none',
    reward_amount INT DEFAULT 0,
    reward_item_id INT DEFAULT NULL,
    reward_title VARCHAR(100) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 玩家成就进度表
CREATE TABLE IF NOT EXISTS player_achievement (
    player_id VARCHAR(64) NOT NULL REFERENCES player_base(player_id) ON DELETE CASCADE,
    achievement_id INT NOT NULL REFERENCES achievement_definition(achievement_id) ON DELETE CASCADE,
    current_count INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id, achievement_id)
);

-- 成就解锁日志表
CREATE TABLE IF NOT EXISTS achievement_unlock_log (
    log_id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL REFERENCES player_base(player_id) ON DELETE CASCADE,
    achievement_id INT NOT NULL REFERENCES achievement_definition(achievement_id) ON DELETE CASCADE,
    unlock_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_player_achievement_player_id ON player_achievement(player_id);
CREATE INDEX IF NOT EXISTS idx_player_achievement_achievement_id ON player_achievement(achievement_id);
-- D12修复：添加复合索引加速按玩家+完成状态查询
CREATE INDEX IF NOT EXISTS idx_player_achievement_player_completed ON player_achievement(player_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_achievement_unlock_log_player_id ON achievement_unlock_log(player_id);
CREATE INDEX IF NOT EXISTS idx_achievement_definition_category ON achievement_definition(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definition_rarity ON achievement_definition(rarity);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_achievement_definition_updated_at ON achievement_definition;
CREATE TRIGGER update_achievement_definition_updated_at
BEFORE UPDATE ON achievement_definition
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_achievement_updated_at ON player_achievement;
CREATE TRIGGER update_player_achievement_updated_at
BEFORE UPDATE ON player_achievement
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

\echo '成就系统表创建成功！'
