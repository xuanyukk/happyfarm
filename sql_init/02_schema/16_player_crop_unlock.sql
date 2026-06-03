-- ============================================
-- 文件名: 16_player_crop_unlock.sql
-- 作者: Trae AI
-- 日期: 2026-05-19
-- 版本: v2.4.1
-- 功能描述: 玩家作物解锁表
-- 执行顺序: 02-16
-- 依赖关系: 02-15_player_land_status.sql
-- 更新记录:
--   2026-05-19 - v2.4.1 - 统一作物ID字段类型从 SMALLINT 改为 INTEGER
-- ============================================

CREATE TABLE IF NOT EXISTS player_crop_unlock (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    crop_id INTEGER NOT NULL,
    unlock_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id, crop_id),
    CONSTRAINT fk_crop_id FOREIGN KEY (crop_id) REFERENCES crop (crop_id)
);

COMMENT ON TABLE player_crop_unlock IS '开心农场-玩家作物解锁表';
COMMENT ON COLUMN player_crop_unlock.id IS '主键ID';
COMMENT ON COLUMN player_crop_unlock.player_id IS '玩家ID';
COMMENT ON COLUMN player_crop_unlock.crop_id IS '已解锁作物ID';
COMMENT ON COLUMN player_crop_unlock.unlock_time IS '解锁时间';

\echo '玩家作物解锁表创建成功！'
