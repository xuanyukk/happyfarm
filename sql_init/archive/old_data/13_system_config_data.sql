-- ============================================
-- 文件名: 13_system_config_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-22
-- 版本: v4.50.0
-- 功能描述: 系统配置初始数据
-- 执行顺序: 03-13
-- 依赖关系: 02-02_system_config.sql
-- 更新记录:
--   2026-05-13 - v2.5.0 - 初始版本
--   2026-05-22 - v4.50.0 - 版本同步更新
-- ============================================

-- 基础系统配置
INSERT INTO system_config (config_key, config_name, config_value, config_type, description, is_active) VALUES
('SITE_NAME', '网站名称', '开心农场', 'STRING', '网站显示名称', true),
('SITE_DESCRIPTION', '网站描述', '最有趣的农场经营游戏', 'STRING', '网站简短描述', true),
('SITE_KEYWORDS', '网站关键词', '农场,游戏,开心农场,种植', 'STRING', 'SEO关键词', true),
('REGISTRATION_ENABLED', '允许注册', 'true', 'BOOLEAN', '是否允许新用户注册', true),
('LOGIN_ENABLED', '允许登录', 'true', 'BOOLEAN', '是否允许用户登录', true),
('MAINTENANCE_MODE', '维护模式', 'false', 'BOOLEAN', '是否开启维护模式', true),
('MAINTENANCE_MESSAGE', '维护提示', '系统正在维护中，请稍后再试', 'STRING', '维护模式显示的提示信息', true),

-- 玩家初始配置
('PLAYER_INIT_GOLD', '初始金币', '1000', 'INTEGER', '新玩家初始金币数量', true),
('PLAYER_INIT_LEVEL', '初始等级', '1', 'INTEGER', '新玩家初始等级', true),
('PLAYER_MAX_LEVEL', '最高等级', '1000', 'INTEGER', '玩家最高等级限制', true),
('PLAYER_DAILY_LOGIN_REWARD', '每日登录奖励', '100', 'INTEGER', '每日登录奖励金币数', true),

-- 农场配置
('FARM_INIT_LAND_COUNT', '初始地块数量', '3', 'INTEGER', '新玩家初始解锁地块数', true),
('FARM_MAX_LAND_COUNT', '最大地块数量', '50', 'INTEGER', '农场最大地块数量', true),
('FARM_LAND_UNLOCK_COST_BASE', '地块解锁基础费用', '100', 'INTEGER', '解锁新地块的基础费用', true),

-- 作物配置
('CROP_GROWTH_SPEED_MULTIPLIER', '作物生长速度倍率', '1.0', 'FLOAT', '全局作物生长速度倍率', true),
('CROP_YIELD_MULTIPLIER', '作物产量倍率', '1.0', 'FLOAT', '全局作物产量倍率', true),
('CROP_SELL_PRICE_MULTIPLIER', '作物售价倍率', '1.0', 'FLOAT', '全局作物售价倍率', true),

-- 道具配置
('ITEM_USE_LIMIT_PER_DAY', '道具每日使用限制', '100', 'INTEGER', '每日使用道具数量限制', true),
('ITEM_DROP_RATE', '道具掉落概率', '0.05', 'FLOAT', '道具掉落概率（0-1）', true),

-- 经济系统配置
('ECONOMY_INFLATION_RATE', '通货膨胀率', '0.001', 'FLOAT', '每日通货膨胀率', true),
('ECONOMY_TAX_RATE', '交易税率', '0.05', 'FLOAT', '玩家间交易税率', true),
('ECONOMY_MAX_GOLD_HOLD', '最大金币持有量', '999999999', 'INTEGER', '玩家最大金币持有量', true),

-- 活动配置
('EVENT_ENABLED', '活动功能开启', 'true', 'BOOLEAN', '是否开启活动功能', true),
('EVENT_NOTIFICATION_ENABLED', '活动通知开启', 'true', 'BOOLEAN', '是否发送活动通知', true),
('EVENT_BONUS_MULTIPLIER', '活动额外奖励倍率', '1.5', 'FLOAT', '活动期间的额外奖励倍率', true),

-- 社交配置
('SOCIAL_FRIEND_MAX', '好友数量上限', '100', 'INTEGER', '玩家最多好友数量', true),
('SOCIAL_CHAT_ENABLED', '聊天功能开启', 'true', 'BOOLEAN', '是否开启聊天功能', true),
('SOCIAL_GIFT_ENABLED', '赠送功能开启', 'true', 'BOOLEAN', '是否开启好友赠送功能', true),

-- 安全配置
('SECURITY_LOGIN_ATTEMPTS_LIMIT', '登录尝试限制', '5', 'INTEGER', '登录失败次数限制', true),
('SECURITY_LOGIN_LOCKOUT_TIME', '登录锁定时间', '300', 'INTEGER', '登录失败后的锁定时间（秒）', true),
('SECURITY_PASSWORD_MIN_LENGTH', '密码最小长度', '6', 'INTEGER', '密码最小长度要求', true),

-- 缓存配置
('CACHE_PLAYER_DATA_TTL', '玩家数据缓存时间', '3600', 'INTEGER', '玩家数据缓存有效期（秒）', true),
('CACHE_GAME_CONFIG_TTL', '游戏配置缓存时间', '86400', 'INTEGER', '游戏配置缓存有效期（秒）', true),

-- 通知配置
('NOTIFICATION_EMAIL_ENABLED', '邮件通知开启', 'false', 'BOOLEAN', '是否开启邮件通知', true),
('NOTIFICATION_PUSH_ENABLED', '推送通知开启', 'false', 'BOOLEAN', '是否开启推送通知', true),

-- 性能配置
('PERFORMANCE_MAX_CONNECTIONS', '最大连接数', '1000', 'INTEGER', '数据库最大连接数', true),
('PERFORMANCE_QUERY_TIMEOUT', '查询超时时间', '30', 'INTEGER', '数据库查询超时时间（秒）', true)

ON CONFLICT (config_key) DO NOTHING;

\echo '系统配置初始数据插入成功！'
