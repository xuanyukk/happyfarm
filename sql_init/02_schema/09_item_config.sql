-- ============================================
-- 文件名: 09_item_config.sql
-- 作者: Trae AI
-- 日期: 2026-05-13
-- 版本: v2.7.0
-- 功能描述: 道具公共配置表
-- 执行顺序: 02-09
-- 依赖关系: 02-08_currency_config.sql
-- 更新记录:
--   2026-05-31 - v2.7.0 - 修正speed_multiplier注释：<1→>1，适配新加速剂数值
-- ============================================

CREATE TABLE IF NOT EXISTS item_config (
    item_id SERIAL PRIMARY KEY,
    item_type SMALLINT NOT NULL,
    item_name VARCHAR(50) NOT NULL,
    item_desc VARCHAR(200) NOT NULL,
    effect_value DECIMAL(10,2) NOT NULL,
    effect_category VARCHAR(50) NOT NULL DEFAULT 'yield_multiplier',
    effect_duration INTEGER DEFAULT NULL,
    unlock_world_level SMALLINT NOT NULL DEFAULT 1,
    unlock_player_level SMALLINT NOT NULL DEFAULT 1,
    max_stack BIGINT NOT NULL DEFAULT 9999,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE item_config IS '开心农场-道具公共配置表';
COMMENT ON COLUMN item_config.item_id IS '道具ID';
COMMENT ON COLUMN item_config.item_type IS '道具类型 1=初级增产剂 2=中级增产剂 3=高级增产剂 4=初级加速剂 5=中级加速剂 6=高级加速剂 7=超级增产剂 8=超级加速剂 9=幸运种子 10=时光沙漏 11=丰收之神 12=土地祝福 13=经验药水 14=金币袋 15=神秘宝箱 16=农场手册 17=世界之书 18=体力药水 19=高级体力药水 20=超级体力药水';
COMMENT ON COLUMN item_config.item_name IS '道具名称';
COMMENT ON COLUMN item_config.item_desc IS '道具说明';
COMMENT ON COLUMN item_config.effect_value IS '效果值(增产倍率/加速倍率/恢复量等)';
COMMENT ON COLUMN item_config.effect_category IS '效果类别: yield_multiplier=增产倍率(>1) / speed_multiplier=加速倍率(>1) / restore_amount=恢复量 / exp_amount=经验量 / gold_range=金币范围 / double_chance=双倍概率 / quality_boost=品质提升 / instant_mature=立即成熟';
COMMENT ON COLUMN item_config.effect_duration IS '效果持续时间(分钟，部分道具必填)';
COMMENT ON COLUMN item_config.unlock_world_level IS '解锁所需世界等级';
COMMENT ON COLUMN item_config.unlock_player_level IS '解锁所需玩家等级';
COMMENT ON COLUMN item_config.max_stack IS '最大堆叠数量';

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_item_config_updated_at ON item_config;
CREATE TRIGGER update_item_config_updated_at
    BEFORE UPDATE ON item_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

\echo '道具公共配置表创建成功！'
