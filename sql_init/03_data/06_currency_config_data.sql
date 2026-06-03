-- ============================================
-- 文件名: 06_currency_config_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-21
-- 版本: v4.50.0
-- 功能描述: 货币体系公共配置初始数据
-- 执行顺序: 03-06
-- 依赖关系: 02-08_currency_config.sql
-- 更新记录:
--   2026-05-21 - v4.50.0 - 优化货币配置，增加详细说明和配置
-- ============================================

INSERT INTO currency_config (config_id, currency_name, currency_symbol, max_hold, description) VALUES
(1, '农场币', '₣', 99999999999, '开心农场通用货币，可通过出售作物获得，用于解锁地块、购买种子、购买道具。是游戏中最基础的货币。上限999亿')
ON CONFLICT (config_id) DO NOTHING;

INSERT INTO currency_config (config_id, currency_name, currency_symbol, max_hold, description, currency_code, is_active)
VALUES (2, '农场宝石币', '💎', 999999, '高级货币，可通过活动获取或商城购买。目前为基础框架搭建阶段，暂不开放实际使用功能', 'gem', TRUE)
ON CONFLICT (config_id) DO NOTHING;
