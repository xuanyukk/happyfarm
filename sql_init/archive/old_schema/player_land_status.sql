-- player_land_status.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.1
-- 功能: 玩家私有地块状态表(核心)

-- 表结构
CREATE TABLE IF NOT EXISTS player_land_status (
  id SERIAL PRIMARY KEY,
  player_id VARCHAR(64) NOT NULL,
  land_num SMALLINT NOT NULL,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  current_quality SMALLINT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'idle',
  crop_id SMALLINT DEFAULT NULL,
  planted_time TIMESTAMP DEFAULT NULL,
  harvest_time TIMESTAMP DEFAULT NULL,
  last_harvest_time TIMESTAMP DEFAULT NULL,
  unlock_time TIMESTAMP DEFAULT NULL,
  cover_time TIMESTAMP DEFAULT NULL,
  update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (player_id, land_num),
  CONSTRAINT fk_land_num FOREIGN KEY (land_num) REFERENCES farm_land (land_num),
  CONSTRAINT fk_crop_id FOREIGN KEY (crop_id) REFERENCES crop (crop_id),
  CONSTRAINT fk_quality_id FOREIGN KEY (current_quality) REFERENCES land_quality (quality_id)
);

-- 添加注释
COMMENT ON TABLE player_land_status IS '开心农场-玩家私有地块状态表(核心)';
COMMENT ON COLUMN player_land_status.id IS '主键ID';
COMMENT ON COLUMN player_land_status.player_id IS '玩家ID';
COMMENT ON COLUMN player_land_status.land_num IS '地块序号1-50';
COMMENT ON COLUMN player_land_status.is_unlocked IS '是否已解锁 0=未解锁 1=已解锁';
COMMENT ON COLUMN player_land_status.current_quality IS '当前地块品质';
COMMENT ON COLUMN player_land_status.status IS '地块状态：idle(空闲), planting(种植中), harvestable(可收获)';
COMMENT ON COLUMN player_land_status.crop_id IS '当前种植的作物ID';
COMMENT ON COLUMN player_land_status.planted_time IS '种植时间';
COMMENT ON COLUMN player_land_status.harvest_time IS '预计收获时间';
COMMENT ON COLUMN player_land_status.last_harvest_time IS '上次收获时间';
COMMENT ON COLUMN player_land_status.unlock_time IS '解锁时间';
COMMENT ON COLUMN player_land_status.cover_time IS '品质覆盖时间';
COMMENT ON COLUMN player_land_status.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_player_id ON player_land_status (player_id);
CREATE INDEX IF NOT EXISTS idx_land_num ON player_land_status (land_num);
CREATE INDEX IF NOT EXISTS idx_status ON player_land_status (status);

-- 添加更新时间触发器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_player_land_status_modtime' 
        AND tgrelid = 'player_land_status'::regclass
    ) THEN
        CREATE TRIGGER update_player_land_status_modtime
        BEFORE UPDATE ON player_land_status
        FOR EACH ROW
        EXECUTE PROCEDURE update_modified_column();
    END IF;
END $$;