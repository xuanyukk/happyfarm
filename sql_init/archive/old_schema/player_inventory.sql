-- player_inventory.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.1
-- 功能: 统一玩家库存表(种子/道具/作物)

-- 表结构
CREATE TABLE IF NOT EXISTS player_inventory (
  id SERIAL PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL,
  item_type SMALLINT NOT NULL,
  item_obj_id INTEGER NOT NULL,
  item_num BIGINT NOT NULL DEFAULT 0,
  lock_num BIGINT NOT NULL DEFAULT 0,
  last_add_time TIMESTAMP DEFAULT NULL,
  last_use_time TIMESTAMP DEFAULT NULL,
  total_add BIGINT NOT NULL DEFAULT 0,
  total_use BIGINT NOT NULL DEFAULT 0,
  create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, item_type, item_obj_id),
  CONSTRAINT fk_inventory_player FOREIGN KEY (player_id) REFERENCES player_base (player_id),
  CHECK (item_num >= 0),
  CHECK (lock_num >= 0),
  CHECK (lock_num <= item_num)
);

-- 添加注释
COMMENT ON TABLE player_inventory IS '开心农场-统一玩家库存表(种子/道具/作物)';
COMMENT ON COLUMN player_inventory.id IS '主键ID';
COMMENT ON COLUMN player_inventory.player_id IS '玩家唯一ID';
COMMENT ON COLUMN player_inventory.item_type IS '物品类型 1=种子 2=道具 3=作物';
COMMENT ON COLUMN player_inventory.item_obj_id IS '物品对象ID(种子对应crop_id，道具对应item_id，作物对应crop_id)';
COMMENT ON COLUMN player_inventory.item_num IS '物品数量';
COMMENT ON COLUMN player_inventory.lock_num IS '锁定数量(任务/活动占用)';
COMMENT ON COLUMN player_inventory.last_add_time IS '上次增加时间';
COMMENT ON COLUMN player_inventory.last_use_time IS '上次使用时间';
COMMENT ON COLUMN player_inventory.total_add IS '累计增加数量';
COMMENT ON COLUMN player_inventory.total_use IS '累计使用数量';
COMMENT ON COLUMN player_inventory.create_time IS '创建时间';
COMMENT ON COLUMN player_inventory.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_player_id ON player_inventory (player_id);
CREATE INDEX IF NOT EXISTS idx_item_type ON player_inventory (item_type);

-- 添加更新时间触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_player_inventory_modtime' 
        AND tgrelid = 'player_inventory'::regclass
    ) THEN
        CREATE TRIGGER update_player_inventory_modtime
        BEFORE UPDATE ON player_inventory
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
    END IF;
END $$;