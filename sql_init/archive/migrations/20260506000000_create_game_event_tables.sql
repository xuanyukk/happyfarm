-- ============================================
-- 迁移名称: create_game_event_tables
-- 版本: v2.0.0
-- 日期: 2026-05-06
-- 描述: 创建游戏活动管理系统数据表
-- 影响范围: 新增 game_event_templates/game_events/game_event_tasks/player_event_progress/game_event_rewards 表
-- 回滚操作: DROP TABLE IF EXISTS game_event_rewards; DROP TABLE IF EXISTS player_event_progress; DROP TABLE IF EXISTS game_event_tasks; DROP TABLE IF EXISTS game_events; DROP TABLE IF EXISTS game_event_templates;
-- 依赖: 33_game_event_system.sql
-- ============================================

-- 创建活动模板表
CREATE TABLE IF NOT EXISTS game_event_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 活动类型：daily/weekly/holiday/seasonal/special
    template_description TEXT,
    template_config JSONB NOT NULL, -- 活动模板配置
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建活动表
CREATE TABLE IF NOT EXISTS game_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    event_banner VARCHAR(500), -- 活动横幅图片
    template_id INTEGER REFERENCES game_event_templates(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    event_config JSONB NOT NULL, -- 活动配置
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建活动任务表
CREATE TABLE IF NOT EXISTS game_event_tasks (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 任务类型：harvest/plant/sell/buy/use_item/unlock/upgrade
    task_description TEXT,
    task_target INTEGER NOT NULL, -- 任务目标值
    task_rewards JSONB NOT NULL, -- 任务奖励
    task_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建玩家活动进度表
CREATE TABLE IF NOT EXISTS player_event_progress (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES game_event_tasks(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    is_rewarded BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, event_id, task_id)
);

-- 创建活动奖励记录表
CREATE TABLE IF NOT EXISTS game_event_rewards (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES game_event_tasks(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL, -- 奖励类型：currency/item/exp
    reward_data JSONB NOT NULL, -- 奖励数据
    distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_game_events_start_end ON game_events(start_time, end_time);
CREATE INDEX idx_game_events_active ON game_events(is_active);
CREATE INDEX idx_game_event_tasks_event ON game_event_tasks(event_id);
CREATE INDEX idx_player_event_progress_player ON player_event_progress(player_id);
CREATE INDEX idx_player_event_progress_event ON player_event_progress(event_id);
CREATE INDEX idx_game_event_rewards_player ON game_event_rewards(player_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表创建更新时间触发器
CREATE TRIGGER update_game_event_templates_updated_at 
    BEFORE UPDATE ON game_event_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_events_updated_at 
    BEFORE UPDATE ON game_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_event_tasks_updated_at 
    BEFORE UPDATE ON game_event_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_event_progress_updated_at 
    BEFORE UPDATE ON player_event_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

