-- ============================================
-- 文件名: 12_game_config_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-24
-- 版本: v4.68.0
-- 功能描述: 游戏配置系统初始数据（完整配置集）
-- 执行顺序: 03-12
-- 依赖关系: 02-31_game_config_system.sql
-- 更新记录:
--   2026-05-31 - v4.68.0 - 版本同步v4.68.0；更新GAME_VERSION配置项
--   2026-05-24 - v4.54.0 - 添加道具系统相关配置项（金币袋、农场手册、世界之书、体力药水、丰收之神、幸运种子、神秘宝箱）
--   2026-05-23 - v4.53.0 - 补充MAINTENANCE_MESSAGE、EVENT_ENABLED、EVENT_NOTIFICATION_ENABLED配置项，版本同步v4.53.0
--   2026-05-13 - v2.6.0 - 新增SITE、SECURITY、CACHE、NOTIFICATION、PERFORMANCE分类配置，
--                         补充PLAYER、FARM、ECONOMY、ITEM分类的缺失配置项
-- ============================================

INSERT INTO game_config (key, name, description, category, data_type, value, default_value, is_readonly, is_required_approval, sort_order, is_active) VALUES
-- 玩家系统
('INIT_GOLD', '初始金币', '新玩家初始金币数', 'PLAYER', 'INTEGER', '1000', '1000', FALSE, FALSE, 1, true),
('INIT_STAMINA', '初始体力', '新玩家初始体力值', 'PLAYER', 'INTEGER', '100', '100', FALSE, FALSE, 2, true),
('MAX_STAMINA', '最大体力', '玩家最大体力值', 'PLAYER', 'INTEGER', '200', '200', FALSE, FALSE, 3, true),
('STAMINA_REGEN', '体力恢复', '每分钟恢复的体力值', 'PLAYER', 'INTEGER', '1', '1', FALSE, FALSE, 4, true),
('EXP_RATE', '经验值倍率', '全局经验值获取倍率', 'PLAYER', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 5, true),
('PLAYER_INIT_LEVEL', '初始等级', '新玩家初始等级', 'PLAYER', 'INTEGER', '1', '1', FALSE, FALSE, 6, true),
('PLAYER_MAX_LEVEL', '最高等级', '玩家最高等级限制', 'PLAYER', 'INTEGER', '1000', '1000', FALSE, TRUE, 7, true),

-- 农场系统
('LAND_UNLOCK_COST', '地块解锁费用', '每块新地块的解锁费用', 'FARM', 'INTEGER', '500', '500', FALSE, FALSE, 1, true),
('LAND_UNLOCK_COST_MULTIPLIER', '解锁费用递增', '每块地块解锁费用的递增倍数', 'FARM', 'FLOAT', '1.5', '1.5', FALSE, FALSE, 2, true),
('QUALITY_UPGRADE_COST', '品质升级费用', '品质升级的基础费用', 'FARM', 'INTEGER', '1000', '1000', FALSE, FALSE, 3, true),
('GROWTH_RATE', '作物生长倍率', '全局作物生长速度倍率', 'FARM', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 4, true),
('FARM_INIT_LAND_COUNT', '初始地块数', '新玩家初始解锁地块数', 'FARM', 'INTEGER', '3', '3', FALSE, FALSE, 5, true),
('FARM_MAX_LAND_COUNT', '最大地块数', '农场最大地块数量', 'FARM', 'INTEGER', '50', '50', FALSE, TRUE, 6, true),
('CROP_YIELD_MULTIPLIER', '作物产量倍率', '全局作物产量倍率', 'FARM', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 7, true),
('CROP_SELL_PRICE_MULTIPLIER', '作物售价倍率', '全局作物售价倍率', 'FARM', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 8, true),

-- 经济系统
('TRANSACTION_TAX', '交易税率', '玩家交易的税率（百分比）', 'ECONOMY', 'FLOAT', '5.0', '5.0', FALSE, TRUE, 1, true),
('GOLD_DECAY', '金币衰减率', '大额金币的每日衰减率（百分比）', 'ECONOMY', 'FLOAT', '0.1', '0.1', FALSE, TRUE, 2, true),
('GOLD_DECAY_THRESHOLD', '金币衰减阈值', '开始衰减的最低金币数', 'ECONOMY', 'INTEGER', '1000000', '1000000', FALSE, TRUE, 3, true),
('OUTPUT_RATE', '产出倍率', '全局产出倍率', 'ECONOMY', 'FLOAT', '1.0', '1.0', FALSE, TRUE, 4, true),
('ECONOMY_INFLATION_RATE', '通货膨胀率', '每日通货膨胀率', 'ECONOMY', 'FLOAT', '0.001', '0.001', FALSE, TRUE, 5, true),
('ECONOMY_MAX_GOLD_HOLD', '最大金币持有', '玩家最大金币持有量', 'ECONOMY', 'INTEGER', '99999999999', '99999999999', FALSE, TRUE, 6, true),

-- 活动系统
('EVENT_ENABLED', '活动功能开启', '是否开启活动功能', 'EVENT', 'BOOLEAN', 'true', 'true', FALSE, FALSE, 1, true),
('EVENT_NOTIFICATION_ENABLED', '活动通知开启', '是否发送活动通知', 'EVENT', 'BOOLEAN', 'true', 'true', FALSE, FALSE, 2, true),
('EVENT_BONUS', '活动加成倍率', '活动期间的额外加成倍率', 'EVENT', 'FLOAT', '1.0', '1.0', FALSE, FALSE, 3, true),
('DROP_RATE', '掉落倍率', '活动期间的道具掉落倍率', 'EVENT', 'FLOAT', '1.0', '1.0', FALSE, FALSE, 4, true),
('DAILY_LOGIN_REWARD', '每日登录奖励', '每日登录获得的金币数', 'EVENT', 'INTEGER', '100', '100', FALSE, FALSE, 5, true),
('ACHIEVEMENT_BONUS', '成就奖励倍数', '成就奖励的倍数', 'EVENT', 'FLOAT', '1.0', '1.0', FALSE, FALSE, 6, true),

-- 系统设置
('MAINTENANCE_MODE', '维护模式', '是否开启维护模式，开启后普通玩家无法登录', 'SYSTEM', 'BOOLEAN', 'false', 'false', TRUE, TRUE, 1, true),
('MAINTENANCE_MESSAGE', '维护提示', '维护模式显示的提示信息', 'SYSTEM', 'STRING', '系统正在维护中，请稍后再试', '系统正在维护中，请稍后再试', FALSE, TRUE, 2, true),
('REGISTRATION_ENABLED', '注册开关', '是否允许新玩家注册', 'SYSTEM', 'BOOLEAN', 'true', 'true', FALSE, TRUE, 3, true),
('LOGIN_ENABLED', '登录开关', '是否允许玩家登录', 'SYSTEM', 'BOOLEAN', 'true', 'true', FALSE, TRUE, 4, true),
('GAME_VERSION', '游戏版本', '当前游戏版本号', 'SYSTEM', 'STRING', 'v4.68.0', 'v4.68.0', TRUE, FALSE, 5, true),
('MAX_ONLINE_PLAYERS', '最大在线人数', '同时在线的最大玩家数', 'SYSTEM', 'INTEGER', '10000', '10000', FALSE, FALSE, 6, true),

-- 社交系统
('FRIEND_MAX_COUNT', '好友上限', '玩家最多可以添加的好友数', 'SOCIAL', 'INTEGER', '100', '100', FALSE, FALSE, 1, true),
('CHAT_ENABLED', '聊天功能', '是否开启聊天功能', 'SOCIAL', 'BOOLEAN', 'true', 'true', FALSE, FALSE, 2, true),
('GIFT_ENABLED', '赠送功能', '是否开启道具赠送功能', 'SOCIAL', 'BOOLEAN', 'true', 'true', FALSE, FALSE, 3, true),
('GIFT_COOLDOWN', '赠送冷却', '赠送道具的冷却时间（分钟）', 'SOCIAL', 'INTEGER', '60', '60', FALSE, FALSE, 4, true),

-- 道具系统
('ITEM_USE_COOLDOWN', '道具使用冷却', '使用道具的冷却时间（秒）', 'ITEM', 'INTEGER', '1', '1', FALSE, FALSE, 1, true),
('MAX_ITEM_STACK', '道具堆叠上限', '单个道具的最大堆叠数量（上限999亿）', 'ITEM', 'INTEGER', '99999999999', '99999999999', FALSE, FALSE, 2, true),
('DAILY_ITEM_USE_LIMIT', '每日道具使用上限', '每日使用道具的数量限制', 'ITEM', 'INTEGER', '100', '100', FALSE, FALSE, 3, true),
('ITEM_DROP_RATE', '道具掉落概率', '道具掉落概率(0-1)', 'ITEM', 'FLOAT', '0.05', '0.05', FALSE, TRUE, 4, true),

-- 站点配置（新增SITE分类）
('SITE_NAME', '站点名称', '网站显示名称', 'SITE', 'STRING', '开心农场', '开心农场', FALSE, FALSE, 1, true),
('SITE_DESCRIPTION', '站点描述', '网站简短描述', 'SITE', 'STRING', '最有趣的农场经营游戏', '最有趣的农场经营游戏', FALSE, FALSE, 2, true),
('SITE_KEYWORDS', '站点关键词', 'SEO关键词', 'SITE', 'STRING', '农场,游戏,开心农场,种植', '农场,游戏,开心农场,种植', FALSE, FALSE, 3, true),

-- 安全配置（新增SECURITY分类）
('SECURITY_LOGIN_ATTEMPTS_LIMIT', '登录尝试限制', '登录失败次数限制', 'SECURITY', 'INTEGER', '5', '5', FALSE, FALSE, 1, true),
('SECURITY_LOGIN_LOCKOUT_TIME', '登录锁定时间', '登录失败后的锁定时间(秒)', 'SECURITY', 'INTEGER', '300', '300', FALSE, FALSE, 2, true),
('SECURITY_PASSWORD_MIN_LENGTH', '密码最小长度', '密码最小长度要求', 'SECURITY', 'INTEGER', '6', '6', FALSE, FALSE, 3, true),

-- 缓存配置（新增CACHE分类）
('CACHE_PLAYER_DATA_TTL', '玩家数据缓存时间', '玩家数据缓存有效期(秒)', 'CACHE', 'INTEGER', '3600', '3600', FALSE, FALSE, 1, true),
('CACHE_GAME_CONFIG_TTL', '游戏配置缓存时间', '游戏配置缓存有效期(秒)', 'CACHE', 'INTEGER', '86400', '86400', FALSE, FALSE, 2, true),

-- 通知配置（新增NOTIFICATION分类）
('NOTIFICATION_EMAIL_ENABLED', '邮件通知开启', '是否开启邮件通知', 'NOTIFICATION', 'BOOLEAN', 'false', 'false', FALSE, FALSE, 1, true),
('NOTIFICATION_PUSH_ENABLED', '推送通知开启', '是否开启推送通知', 'NOTIFICATION', 'BOOLEAN', 'false', 'false', FALSE, FALSE, 2, true),

-- 性能配置（新增PERFORMANCE分类）
('PERFORMANCE_MAX_CONNECTIONS', '最大连接数', '数据库最大连接数', 'PERFORMANCE', 'INTEGER', '1000', '1000', FALSE, TRUE, 1, true),
('PERFORMANCE_QUERY_TIMEOUT', '查询超时时间', '数据库查询超时时间(秒)', 'PERFORMANCE', 'INTEGER', '30', '30', FALSE, TRUE, 2, true),

-- 道具系统扩展配置
('GOLD_BAG_MIN_GOLD', '金币袋最小金币', '使用金币袋获得的最小金币数', 'ITEM', 'INTEGER', '1000', '1000', FALSE, FALSE, 10, true),
('GOLD_BAG_MAX_GOLD', '金币袋最大金币', '使用金币袋获得的最大金币数', 'ITEM', 'INTEGER', '10000', '10000', FALSE, FALSE, 11, true),
('FARM_BOOK_EXP', '农场手册经验', '使用农场手册获得的农场经验值', 'ITEM', 'INTEGER', '5000', '5000', FALSE, FALSE, 12, true),
('WORLD_BOOK_EXP', '世界之书经验', '使用世界之书获得的世界经验值', 'ITEM', 'INTEGER', '2000', '2000', FALSE, FALSE, 13, true),
('STAMINA_POTION_1_RESTORE', '初级体力药水恢复', '初级体力药水恢复的体力值', 'ITEM', 'INTEGER', '50', '50', FALSE, FALSE, 14, true),
('STAMINA_POTION_2_RESTORE', '高级体力药水恢复', '高级体力药水恢复的体力值', 'ITEM', 'INTEGER', '200', '200', FALSE, FALSE, 15, true),
('HARVEST_GOD_DURATION', '丰收之神持续时间', '丰收之神效果持续时间（小时）', 'ITEM', 'INTEGER', '24', '24', FALSE, FALSE, 16, true),
('HARVEST_GOD_YIELD_BOOST', '丰收之神产量加成', '丰收之神提供的产量加成倍数', 'ITEM', 'FLOAT', '1.5', '1.5', FALSE, FALSE, 17, true),
('LUCKY_SEED_DOUBLE_CHANCE', '幸运种子双倍概率', '幸运种子触发双倍收益的概率(0-1)', 'ITEM', 'FLOAT', '0.5', '0.5', FALSE, FALSE, 18, true),
('MYSTERY_BOX_REWARDS', '神秘宝箱奖励', '神秘宝箱可能掉落的道具配置(JSON数组)', 'ITEM', 'JSON', '[{"itemId":1,"min":1,"max":5},{"itemId":4,"min":1,"max":5},{"itemId":18,"min":1,"max":3},{"itemId":2,"min":0,"max":2},{"itemId":5,"min":0,"max":2}]', '[{"itemId":1,"min":1,"max":5},{"itemId":4,"min":1,"max":5},{"itemId":18,"min":1,"max":3},{"itemId":2,"min":0,"max":2},{"itemId":5,"min":0,"max":2}]', FALSE, FALSE, 19, true),
('MYSTERY_BOX_MIN_REWARDS', '神秘宝箱最小奖励数', '神秘宝箱每次最少掉落的道具种类数', 'ITEM', 'INTEGER', '1', '1', FALSE, FALSE, 20, true),
('MYSTERY_BOX_MAX_REWARDS', '神秘宝箱最大奖励数', '神秘宝箱每次最多掉落的道具种类数', 'ITEM', 'INTEGER', '3', '3', FALSE, FALSE, 21, true),
-- 体力值系统配置（v4.68.0新增）
('STAMINA_BASE_MAX', '体力基础上限', '体力值基础上限，玩家等级未达到解锁等级时的最大值', 'PLAYER', 'INTEGER', '200', '200', FALSE, FALSE, 501, TRUE),
('STAMINA_UNLOCK_LEVEL', '体力上限解锁等级', '玩家达到此等级后，体力上限提升至解锁值', 'PLAYER', 'INTEGER', '300', '300', FALSE, FALSE, 502, TRUE),
('STAMINA_UNLOCKED_MAX', '体力解锁上限', '玩家达到解锁等级后的体力最大值', 'PLAYER', 'INTEGER', '1000', '1000', FALSE, FALSE, 503, TRUE),
-- 背包系统配置（v4.68.0新增）
('INVENTORY_MAX_SLOTS', '背包最大槽位', '玩家背包最大槽位数，超出后无法购买道具/种子', 'INVENTORY', 'INTEGER', '200', '200', FALSE, FALSE, 601, TRUE)
ON CONFLICT (key) DO NOTHING;
