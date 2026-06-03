-- ============================================
-- 迁移名称: migrate_system_config_to_game_config
-- 版本: v2.0.0
-- 日期: 2026-05-23
-- 描述: 将system_config配置迁移到game_config并废弃system_config表
-- 影响范围: game_config新增多条配置，system_config表重命名为system_config_legacy
-- 回滚操作: ALTER TABLE system_config_legacy RENAME TO system_config; 删除game_config中新增的配置项
-- 依赖: 31_game_config_system.sql
-- ============================================

-- ============================================
-- 文件名: 022_migrate_system_config_to_game_config.sql
-- 作者: Trae AI
-- 日期: 2026-05-23
-- 版本: v1.0.0
-- 功能描述: 将system_config配置迁移到game_config并废弃system_config表
-- 执行顺序: 022
-- 依赖关系: 02-31_game_config_system.sql
-- ============================================

-- ============================================
-- 第一部分：将system_config配置迁移到game_config
-- ============================================

-- 站点相关配置
INSERT INTO game_config (
    key, name, description, category, data_type,
    value, default_value, is_readonly, is_required_approval,
    sort_order, is_active
) VALUES
-- 站点配置（新增SITE分类）
('SITE_NAME', '站点名称', '网站显示名称', 'SITE', 'STRING', '开心农场', '开心农场', false, false, 1, true),
('SITE_DESCRIPTION', '站点描述', '网站简短描述', 'SITE', 'STRING', '最有趣的农场经营游戏', '最有趣的农场经营游戏', false, false, 2, true),
('SITE_KEYWORDS', '站点关键词', 'SEO关键词', 'SITE', 'STRING', '农场,游戏,开心农场,种植', '农场,游戏,开心农场,种植', false, false, 3, true),

-- 玩家系统配置（补充到PLAYER分类）
('PLAYER_INIT_LEVEL', '初始等级', '新玩家初始等级', 'PLAYER', 'INTEGER', '1', '1', false, false, 6, true),
('PLAYER_MAX_LEVEL', '最高等级', '玩家最高等级限制', 'PLAYER', 'INTEGER', '1000', '1000', false, true, 7, true),

-- 农场系统配置（补充到FARM分类）
('FARM_INIT_LAND_COUNT', '初始地块数', '新玩家初始解锁地块数', 'FARM', 'INTEGER', '3', '3', false, false, 5, true),
('FARM_MAX_LAND_COUNT', '最大地块数', '农场最大地块数量', 'FARM', 'INTEGER', '50', '50', false, true, 6, true),

-- 作物系统配置（补充到FARM分类）
('CROP_YIELD_MULTIPLIER', '作物产量倍率', '全局作物产量倍率', 'FARM', 'FLOAT', '1.0', '1.0', false, true, 7, true),
('CROP_SELL_PRICE_MULTIPLIER', '作物售价倍率', '全局作物售价倍率', 'FARM', 'FLOAT', '1.0', '1.0', false, true, 8, true),

-- 道具系统配置（补充到ITEM分类）
('ITEM_DROP_RATE', '道具掉落概率', '道具掉落概率(0-1)', 'ITEM', 'FLOAT', '0.05', '0.05', false, true, 4, true),

-- 经济系统配置（补充到ECONOMY分类）
('ECONOMY_INFLATION_RATE', '通货膨胀率', '每日通货膨胀率', 'ECONOMY', 'FLOAT', '0.001', '0.001', false, true, 5, true),
('ECONOMY_MAX_GOLD_HOLD', '最大金币持有', '玩家最大金币持有量', 'ECONOMY', 'INTEGER', '999999999', '999999999', false, true, 6, true),

-- 安全配置（新增SECURITY分类）
('SECURITY_LOGIN_ATTEMPTS_LIMIT', '登录尝试限制', '登录失败次数限制', 'SECURITY', 'INTEGER', '5', '5', false, false, 1, true),
('SECURITY_LOGIN_LOCKOUT_TIME', '登录锁定时间', '登录失败后的锁定时间(秒)', 'SECURITY', 'INTEGER', '300', '300', false, false, 2, true),
('SECURITY_PASSWORD_MIN_LENGTH', '密码最小长度', '密码最小长度要求', 'SECURITY', 'INTEGER', '6', '6', false, false, 3, true),

-- 缓存配置（新增CACHE分类）
('CACHE_PLAYER_DATA_TTL', '玩家数据缓存时间', '玩家数据缓存有效期(秒)', 'CACHE', 'INTEGER', '3600', '3600', false, false, 1, true),
('CACHE_GAME_CONFIG_TTL', '游戏配置缓存时间', '游戏配置缓存有效期(秒)', 'CACHE', 'INTEGER', '86400', '86400', false, false, 2, true),

-- 通知配置（新增NOTIFICATION分类）
('NOTIFICATION_EMAIL_ENABLED', '邮件通知开启', '是否开启邮件通知', 'NOTIFICATION', 'BOOLEAN', 'false', 'false', false, false, 1, true),
('NOTIFICATION_PUSH_ENABLED', '推送通知开启', '是否开启推送通知', 'NOTIFICATION', 'BOOLEAN', 'false', 'false', false, false, 2, true),

-- 性能配置（新增PERFORMANCE分类）
('PERFORMANCE_MAX_CONNECTIONS', '最大连接数', '数据库最大连接数', 'PERFORMANCE', 'INTEGER', '1000', '1000', false, true, 1, true),
('PERFORMANCE_QUERY_TIMEOUT', '查询超时时间', '数据库查询超时时间(秒)', 'PERFORMANCE', 'INTEGER', '30', '30', false, true, 2, true)

ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 第二部分：备份并废弃system_config表
-- ============================================

-- 重命名system_config表，保留数据作为备份
ALTER TABLE IF EXISTS system_config RENAME TO system_config_legacy;

-- 添加注释说明这是一个废弃的表
COMMENT ON TABLE system_config_legacy IS '系统配置表(已废弃，使用game_config代替)';

-- ============================================
-- 完成信息输出
-- ============================================

\echo '配置系统迁移完成！'
\echo ' - 已将system_config配置迁移到game_config'
\echo ' - 已新增多个配置分类'
\echo ' - 已备份system_config表为system_config_legacy'


