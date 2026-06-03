-- player_crop_unlock.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 玩家作物解锁表

-- 表结构
CREATE TABLE IF NOT EXISTS player_crop_unlock (
  id SERIAL PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL,
  crop_id SMALLINT NOT NULL,
  unlock_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, crop_id),
  CONSTRAINT fk_crop_id FOREIGN KEY (crop_id) REFERENCES crop (crop_id)
);

-- 添加注释
COMMENT ON TABLE player_crop_unlock IS '开心农场-玩家作物解锁表';
COMMENT ON COLUMN player_crop_unlock.id IS '主键ID';
COMMENT ON COLUMN player_crop_unlock.player_id IS '玩家ID';
COMMENT ON COLUMN player_crop_unlock.crop_id IS '已解锁作物ID';
COMMENT ON COLUMN player_crop_unlock.unlock_time IS '解锁时间';