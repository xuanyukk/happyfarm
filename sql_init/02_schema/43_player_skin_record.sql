-- ============================================
-- 文件名: 43_player_skin_record.sql
-- 作者: Trae AI
-- 日期: 2026-05-31
-- 版本: v4.71.0
-- 功能描述: 玩家皮肤记录表——记录玩家拥有的皮肤及激活状态、剩余时间
-- 执行顺序: 02-43
-- 依赖关系: 02-11_player_base.sql, 02-09_item_config.sql
-- 更新记录:
--   2026-05-31 - v4.71.0 - 方案B：新增玩家皮肤记录表
-- ============================================

CREATE TABLE IF NOT EXISTS player_skin_record (
    record_id SERIAL PRIMARY KEY,
    player_id VARCHAR(64) NOT NULL,
    skin_item_id INT NOT NULL REFERENCES item_config(item_id),
    skin_name VARCHAR(50) NOT NULL,
    total_duration_minutes INT NOT NULL DEFAULT 0,
    used_minutes INT NOT NULL DEFAULT 0,
    remaining_minutes INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    obtained_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE player_skin_record IS '开心农场-玩家皮肤记录表';
COMMENT ON COLUMN player_skin_record.skin_item_id IS '关联item_config.item_id(限26-28)';
COMMENT ON COLUMN player_skin_record.total_duration_minutes IS '该皮肤总持续时间(分钟)';
COMMENT ON COLUMN player_skin_record.used_minutes IS '已使用时间(分钟)';
COMMENT ON COLUMN player_skin_record.remaining_minutes IS '剩余可用时间(分钟)';
COMMENT ON COLUMN player_skin_record.is_active IS '当前是否激活';
COMMENT ON COLUMN player_skin_record.activated_at IS '激活时间';
COMMENT ON COLUMN player_skin_record.expires_at IS '预计过期时间';
COMMENT ON COLUMN player_skin_record.paused_at IS '暂停时间(切换皮肤时记录)';

CREATE INDEX IF NOT EXISTS idx_skin_player_id
    ON player_skin_record (player_id);
CREATE INDEX IF NOT EXISTS idx_skin_active
    ON player_skin_record (player_id, is_active);

DROP TRIGGER IF EXISTS update_player_skin_record_updated_at ON player_skin_record;
CREATE TRIGGER update_player_skin_record_updated_at
    BEFORE UPDATE ON player_skin_record
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '玩家皮肤记录表创建成功！'