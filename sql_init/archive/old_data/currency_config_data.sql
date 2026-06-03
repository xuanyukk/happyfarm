-- currency_config_data.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.0
-- 功能: 货币体系公共配置初始数据

-- 插入初始数据
-- 货币配置说明：
-- config_id: 货币配置ID
-- currency_name: 货币名称
-- currency_symbol: 货币符号
-- max_hold: 最大持有量
-- desc: 货币说明
INSERT INTO currency_config (config_id, currency_name, currency_symbol, max_hold, "desc") VALUES
(1, '农场币', '₣', 999999999, '开心农场通用货币，可通过出售作物获得，用于解锁地块、购买种子、购买道具')
ON CONFLICT (config_id) DO NOTHING;

-- 数据验证：
-- 1. 货币ID为1，对应唯一的农场币
-- 2. 货币符号为₣，符合农场币的视觉标识
-- 3. 最大持有量为999,999,999，足够玩家使用
-- 4. 货币说明清晰描述了用途