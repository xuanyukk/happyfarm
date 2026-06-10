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

-- 注：player_daily_task 表由 39_player_daily_task.sql 唯一定义
-- (D8修复：消除37号文件中的重复定义，避免current_count vs progress字段冲突)

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