-- ============================================
-- 文件名: 37_daily_task_config.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.69.0
-- 功能描述: 每日任务配置表 + 玩家任务进度表
-- 执行顺序: 02-37
-- 依赖关系: 02-11_player_base.sql
-- 更新记录:
--   2026-05-31 - v4.69.0 - 移除upgrade_land/achievement类别(有上限内容转成就系统)
-- ============================================

-- 每日任务主配置表
CREATE TABLE IF NOT EXISTS daily_task_config (
    task_id SERIAL PRIMARY KEY,
    task_name VARCHAR(100) NOT NULL,
    task_description TEXT NOT NULL,
    task_category VARCHAR(30) NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 1,
    reward_exp INTEGER NOT NULL DEFAULT 0,
    reward_gold BIGINT NOT NULL DEFAULT 0,
    reward_gems INTEGER NOT NULL DEFAULT 0,
    reward_items JSONB DEFAULT NULL,
    unlock_level INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_daily_task_category CHECK (
        task_category IN (
            'plant', 'harvest', 'sell', 'use_item',
            'water', 'fertilize',
            'login', 'stamina'
        )
    )
);

COMMENT ON TABLE daily_task_config IS '开心农场-每日任务配置表';
COMMENT ON COLUMN daily_task_config.task_name IS '任务名称';
COMMENT ON COLUMN daily_task_config.task_description IS '任务描述';
COMMENT ON COLUMN daily_task_config.task_category IS '任务类别：plant=种植 harvest=收获 sell=出售 use_item=使用道具 water=浇水 fertilize=施肥 login=登录 stamina=消耗体力';
COMMENT ON COLUMN daily_task_config.target_count IS '目标完成次数';
COMMENT ON COLUMN daily_task_config.reward_exp IS '奖励经验值';
COMMENT ON COLUMN daily_task_config.reward_gold IS '奖励农场币';
COMMENT ON COLUMN daily_task_config.reward_gems IS '奖励宝石币';
COMMENT ON COLUMN daily_task_config.reward_items IS '奖励道具(JSON)';
COMMENT ON COLUMN daily_task_config.unlock_level IS '解锁所需玩家等级';
COMMENT ON COLUMN daily_task_config.sort_order IS '排序号';
COMMENT ON COLUMN daily_task_config.is_active IS '是否启用';

-- 玩家每日任务进度表
CREATE TABLE IF NOT EXISTS player_daily_task (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    task_id INTEGER NOT NULL,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_count INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_player_daily_task_player
        FOREIGN KEY (player_id) REFERENCES player_base(player_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_player_daily_task_config
        FOREIGN KEY (task_id) REFERENCES daily_task_config(task_id)
        ON DELETE CASCADE,
    CONSTRAINT uk_player_daily_task_unique
        UNIQUE (player_id, task_id, task_date)
);

COMMENT ON TABLE player_daily_task IS '开心农场-玩家每日任务进度表';
COMMENT ON COLUMN player_daily_task.player_id IS '玩家ID';
COMMENT ON COLUMN player_daily_task.task_id IS '任务ID';
COMMENT ON COLUMN player_daily_task.task_date IS '任务日期';
COMMENT ON COLUMN player_daily_task.current_count IS '当前完成次数';
COMMENT ON COLUMN player_daily_task.is_completed IS '是否已完成';
COMMENT ON COLUMN player_daily_task.is_claimed IS '是否已领取奖励';

CREATE INDEX IF NOT EXISTS idx_player_daily_task_player
    ON player_daily_task (player_id, task_date);

DROP TRIGGER IF EXISTS update_daily_task_config_updated_at ON daily_task_config;
CREATE TRIGGER update_daily_task_config_updated_at
    BEFORE UPDATE ON daily_task_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_daily_task_updated_at ON player_daily_task;
CREATE TRIGGER update_player_daily_task_updated_at
    BEFORE UPDATE ON player_daily_task
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '每日任务配置表创建成功！'