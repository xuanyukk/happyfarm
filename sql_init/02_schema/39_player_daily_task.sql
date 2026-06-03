/**
 * 文件名：39_player_daily_task.sql
 * 作者：Trae AI
 * 日期：2026-05-31
 * 版本：v1.0.0
 * 功能描述：玩家每日任务进度表 - 记录玩家每日任务完成进度和奖励领取状态
 * 更新记录：
 *   2026-05-31 - v1.0.0 - LG-02修复：创建player_daily_task表
 */

CREATE TABLE IF NOT EXISTS player_daily_task (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    task_id INTEGER NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_player_daily_task_player
        FOREIGN KEY (player_id)
        REFERENCES player_base(player_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_player_daily_task_config
        FOREIGN KEY (task_id)
        REFERENCES daily_task_config(task_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_player_daily_task_date
        UNIQUE (player_id, task_id, task_date)
);

COMMENT ON TABLE player_daily_task IS '玩家每日任务进度表';
COMMENT ON COLUMN player_daily_task.player_id IS '玩家ID';
COMMENT ON COLUMN player_daily_task.task_id IS '任务ID，关联daily_task_config';
COMMENT ON COLUMN player_daily_task.progress IS '当前完成进度';
COMMENT ON COLUMN player_daily_task.is_completed IS '是否已完成目标';
COMMENT ON COLUMN player_daily_task.is_claimed IS '是否已领取奖励';
COMMENT ON COLUMN player_daily_task.task_date IS '任务日期';

CREATE INDEX IF NOT EXISTS idx_player_daily_task_player_date
    ON player_daily_task(player_id, task_date);
CREATE INDEX IF NOT EXISTS idx_player_daily_task_task
    ON player_daily_task(task_id);