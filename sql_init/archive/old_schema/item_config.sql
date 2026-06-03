-- item_config.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 道具公共配置表(增产/加速)

-- 表结构
CREATE TABLE IF NOT EXISTS item_config (
  item_id SERIAL PRIMARY KEY,
  item_type SMALLINT NOT NULL,
  item_name VARCHAR(50) NOT NULL,
  item_desc VARCHAR(200) NOT NULL,
  effect_value DECIMAL(3,2) NOT NULL,
  effect_duration INTEGER DEFAULT NULL,
  unlock_world_level SMALLINT NOT NULL DEFAULT 1,
  unlock_player_level SMALLINT NOT NULL DEFAULT 1,
  max_stack BIGINT NOT NULL DEFAULT 9999
);

-- 添加注释
COMMENT ON TABLE item_config IS '开心农场-道具公共配置表';
COMMENT ON COLUMN item_config.item_id IS '道具ID';
COMMENT ON COLUMN item_config.item_type IS '道具类型 1=增产道具 2=加速道具';
COMMENT ON COLUMN item_config.item_name IS '道具名称';
COMMENT ON COLUMN item_config.item_desc IS '道具说明';
COMMENT ON COLUMN item_config.effect_value IS '效果值(增产倍率/加速倍率)';
COMMENT ON COLUMN item_config.effect_duration IS '效果持续时间(分钟，加速道具必填)';
COMMENT ON COLUMN item_config.unlock_world_level IS '解锁所需世界等级';
COMMENT ON COLUMN item_config.unlock_player_level IS '解锁所需玩家等级';
COMMENT ON COLUMN item_config.max_stack IS '最大堆叠数量';