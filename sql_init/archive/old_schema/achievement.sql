/**
 * 文件名：achievement.sql
 * 作者：开发者
 * 日期：2026-03-27
 * 版本：v1.0.0
 * 功能描述：成就系统数据库表结构
 * 更新记录：
 *   2026-03-27 - v1.0.0 - 新建文件，创建成就系统相关表结构
 */

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