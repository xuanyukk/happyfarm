-- ============================================
-- 文件名: 10_achievement_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-13
-- 版本: v4.70.0
-- 功能描述: 成就系统初始数据（含道具稀有度分级标准文档）
-- 执行顺序: 03-10
-- 依赖关系: 02-28_achievement_system.sql
-- 更新记录:
--   2026-05-31 - v4.69.0 - 为里程碑成就添加道具奖励：
--     * 种植大师→高级增产剂×5  * 收获大师→幸运种子×10
--     * 大地主→中瓶体力药水×5    * 品质大师→超级增产剂×3
--     * 商业大亨→金币袋×5        * 满级大佬→神秘宝箱×3
--     * 道具宗师→超级加速剂×3    * 永恒圣果→大瓶体力药水×5
--   2026-05-31 - v4.71.0 - 方案B：新增20条成就（隐藏7+连击6+收藏7），62条→82条
--     * 新增22个成就，补全所有7个类别的梯度断层
--     * 新增种植传说(50000)、丰收大师(5000)、商业巨头(50000)
--     * 新增农场骨干(10)/达人(30)/巨擘(40)地块解锁梯度
--     * 新增品质工匠(5)/专家(10)/达人(25)品质升级梯度
--     * 新增突破瓶颈(300级)、农场达人(100)/大师(300)/至尊(500)
--     * 新增世界旅者(50级)、道具传奇(1000)/之神(3000)
--     * 新增签到新手(7)/大师(100)/传说(365)、人气之星(50)/社交之王(100)
--     * 新增活动常客(10)/专家(50)/传奇(100)
--     * 添加rarity分级标准、reward_type字段说明、视觉标识规则文档
-- ============================================

-- ============================================
-- 道具/成就稀有度分级标准文档
-- ============================================
--
-- 【稀有度等级划分】
-- rarity字段定义5级稀有度，按获得难度和价值递增排列：
--
-- | 稀有度      | 英文名       | 颜色标识         | 视觉特效       | 成就数量要求范围     | 典型道具价值     |
-- |------------|-------------|-----------------|---------------|---------------------|-----------------|
-- | 普通(白)    | common      | #B0B0B0 灰白色   | 无特效          | 1 ~ 100             | 基础消耗品        |
-- | 稀有(蓝)    | uncommon    | #4A90D9 蓝色     | 微光边框        | 101 ~ 500           | 初级增益道具      |
-- | 史诗(紫)    | rare        | #9B59B6 紫色     | 闪烁边框        | 501 ~ 5000          | 中级增益道具      |
-- | 传奇(橙)    | epic        | #E67E22 橙色     | 流光边框+粒子    | 5001 ~ 10000        | 高级增益道具      |
-- | 神话(金)    | legendary   | #FFD700 金色     | 流光+光晕+特殊图标 | 10001+ 或特殊条件   | 顶级/稀有道具     |
--
-- 【reward_type 奖励类型对照】
-- | 值        | 含义              | reward_amount含义     | reward_item_id含义 |
-- |-----------|-------------------|----------------------|-------------------|
-- | currency  | 金币奖励           | 金币数量              | 忽略(NULL)         |
-- | item      | 道具奖励           | 道具数量              | item_config.item_id |
-- | none      | 仅成就称号(无奖励)  | 忽略                  | 忽略               |
--
-- 【reward_title 称号说明】
-- 非NULL时，成就达成后授予此称号，显示在玩家资料中。
-- 仅legendary级别和部分epic级别成就授予称号。
--
-- 【文件头注释中的视觉标识规则速查】
-- rarity字段配合前端CSS class使用：
--   .rarity-common { color: #B0B0B0; }
--   .rarity-uncommon { color: #4A90D9; text-shadow: 0 0 4px rgba(74,144,217,0.3); }
--   .rarity-rare { color: #9B59B6; text-shadow: 0 0 6px rgba(155,89,182,0.4); animation: shimmer 2s infinite; }
--   .rarity-epic { color: #E67E22; text-shadow: 0 0 8px rgba(230,126,34,0.5); animation: glow 1.5s infinite; }
--   .rarity-legendary { color: #FFD700; text-shadow: 0 0 12px rgba(255,215,0,0.6); animation: glow 1s infinite; }
--
-- @keyframes shimmer {
--   0%, 100% { opacity: 1; } 50% { opacity: 0.7; }
-- }
-- @keyframes glow {
--   0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); }
-- }
-- ============================================

INSERT INTO achievement_definition (achievement_name, description, icon, category, rarity, required_count, reward_type, reward_amount, reward_item_id, reward_title, is_active) VALUES
-- ============================================
-- farming 类别 — 种植/收获相关成就
-- ============================================
-- 种植梯度
('初出茅庐', '种植第一颗作物', '🌱', 'farming', 'common', 1, 'currency', 100, NULL, NULL, true),
('小试牛刀', '种植10颗作物', '🌿', 'farming', 'common', 10, 'currency', 200, NULL, NULL, true),
('勤劳农夫', '种植100颗作物', '🌾', 'farming', 'common', 100, 'currency', 500, NULL, NULL, true),
('种植能手', '种植500颗作物', '👨‍🌾', 'farming', 'uncommon', 500, 'currency', 1000, NULL, NULL, true),
('种植大师', '种植1000颗作物', '🧑‍🌾', 'farming', 'rare', 1000, 'item', 5, 3, NULL, true),
('种植宗师', '种植5000颗作物', '🌳', 'farming', 'epic', 5000, 'currency', 5000, NULL, NULL, true),
('种植之神', '种植10000颗作物', '🌟', 'farming', 'legendary', 10000, 'currency', 10000, NULL, '种植之神', true),
('种植传说', '种植50000颗作物', '👑', 'farming', 'legendary', 50000, 'currency', 50000, NULL, '种植传说', true),

-- 收获梯度
('首次收获', '收获第一颗作物', '🎑', 'farming', 'common', 1, 'currency', 50, NULL, NULL, true),
('收获满满', '收获100颗作物', '🎉', 'farming', 'common', 100, 'currency', 500, NULL, NULL, true),
('五谷丰登', '收获1000颗作物', '🏆', 'farming', 'rare', 1000, 'currency', 2500, NULL, NULL, true),
('丰收大师', '收获5000颗作物', '🎯', 'farming', 'epic', 5000, 'currency', 5000, NULL, NULL, true),
('粮仓满盈', '收获10000颗作物', '🏰', 'farming', 'legendary', 10000, 'item', 10, 9, NULL, true),

-- ============================================
-- farm 类别 — 地块解锁/品质升级相关成就
-- ============================================
-- 地块解锁梯度 (游戏上限50块)
('农场新手', '解锁第5块地块', '🏡', 'farm', 'common', 5, 'currency', 300, NULL, NULL, true),
('农场骨干', '解锁第10块地块', '🌄', 'farm', 'common', 10, 'currency', 500, NULL, NULL, true),
('农场主', '解锁第20块地块', '🏘️', 'farm', 'uncommon', 20, 'currency', 1000, NULL, NULL, true),
('农场达人', '解锁第30块地块', '🏕️', 'farm', 'rare', 30, 'currency', 3000, NULL, NULL, true),
('农场巨擘', '解锁第40块地块', '🏗️', 'farm', 'epic', 40, 'currency', 5000, NULL, NULL, true),
('大地主', '解锁所有50块地块', '🏞️', 'farm', 'legendary', 50, 'item', 5, 19, '大地主', true),

-- 品质升级梯度 (游戏品质8档: 1普通→2铜→3银→4金→5铂金→6钻石→7无尽→8永恒)
('品质入门', '将一块地块提升到铜品质', '🥉', 'farm', 'common', 1, 'currency', 200, NULL, NULL, true),
('品质追求者', '将一块地块提升到最高品质', '✨', 'farm', 'rare', 1, 'currency', 3000, NULL, NULL, true),
('品质工匠', '将5块地块提升到最高品质', '🔨', 'farm', 'uncommon', 5, 'currency', 5000, NULL, NULL, true),
('品质专家', '将10块地块提升到最高品质', '💠', 'farm', 'rare', 10, 'currency', 10000, NULL, NULL, true),
('品质达人', '将25块地块提升到最高品质', '🔮', 'farm', 'epic', 25, 'item', 3, 8, NULL, true),
('品质大师', '将所有50块地块提升到最高品质', '💎', 'farm', 'legendary', 50, 'item', 3, 7, '品质大师', true),

-- ============================================
-- economy 类别 — 财富/出售相关成就
-- ============================================
-- 财富梯度
('小有积蓄', '拥有10000农场币', '🪙', 'economy', 'common', 10000, 'currency', 500, NULL, NULL, true),
('富甲一方', '拥有100000农场币', '💰', 'economy', 'uncommon', 100000, 'currency', 10000, NULL, NULL, true),
('富可敌国', '拥有1000000农场币', '🏦', 'economy', 'legendary', 1000000, 'currency', 100000, NULL, '富可敌国', true),

-- 出售梯度
('小商小贩', '出售100颗作物', '🛒', 'economy', 'common', 100, 'currency', 200, NULL, NULL, true),
('买卖能手', '出售1000颗作物', '🏪', 'economy', 'rare', 1000, 'currency', 2000, NULL, NULL, true),
('商业大亨', '出售10000颗作物', '🏢', 'economy', 'epic', 10000, 'item', 5, 14, NULL, true),
('商业巨头', '出售50000颗作物', '🏭', 'economy', 'legendary', 50000, 'item', 5, 14, '商业巨头', true),

-- ============================================
-- level 类别 — 等级相关成就
-- ============================================
-- 玩家等级梯度 (游戏上限1000级)
('小有所成', '玩家等级达到10级', '⭐', 'level', 'common', 10, 'currency', 100, NULL, NULL, true),
('等级提升', '玩家等级达到100级', '🌟', 'level', 'uncommon', 100, 'currency', 1000, NULL, NULL, true),
('突破瓶颈', '玩家等级达到300级', '⚡', 'level', 'rare', 300, 'currency', 3000, NULL, NULL, true),
('登峰造极', '玩家等级达到500级', '🌠', 'level', 'epic', 500, 'currency', 10000, NULL, NULL, true),
('满级大佬', '玩家等级达到1000级', '👑', 'level', 'legendary', 1000, 'item', 3, 17, '满级大佬', true),

-- 农场等级梯度 (游戏上限500级)
('农场达人', '农场等级达到100级', '🏡', 'level', 'uncommon', 100, 'currency', 5000, NULL, NULL, true),
('农场大师', '农场等级达到300级', '🏘️', 'level', 'rare', 300, 'currency', 10000, NULL, NULL, true),
('农场至尊', '农场等级达到500级', '🏰', 'level', 'legendary', 500, 'item', 5, 19, '农场至尊', true),

-- 世界等级梯度 (游戏上限100级)
('世界公民', '世界等级达到10级', '🌍', 'level', 'rare', 10, 'currency', 5000, NULL, NULL, true),
('世界旅者', '世界等级达到50级', '🌎', 'level', 'epic', 50, 'currency', 10000, NULL, NULL, true),
('世界主宰', '世界等级达到100级', '🌐', 'level', 'legendary', 100, 'currency', 50000, NULL, '世界主宰', true),

-- ============================================
-- item 类别 — 道具使用相关成就
-- ============================================
('道具新手', '使用10次道具', '🎒', 'item', 'common', 10, 'currency', 200, NULL, NULL, true),
('道具专家', '使用50次道具', '🎯', 'item', 'common', 50, 'currency', 1000, NULL, NULL, true),
('道具大师', '使用100次道具', '🎁', 'item', 'uncommon', 100, 'currency', 2000, NULL, NULL, true),
('道具宗师', '使用500次道具', '🎪', 'item', 'rare', 500, 'item', 3, 8, NULL, true),
('道具传奇', '使用1000次道具', '🎖️', 'item', 'epic', 1000, 'item', 3, 8, NULL, true),
('道具之神', '使用3000次道具', '🏅', 'item', 'legendary', 3000, 'item', 3, 7, '道具之神', true),

-- 一键收获专项成就
('一键收获', '使用一键收获功能10次', '⚡', 'farming', 'common', 10, 'currency', 500, NULL, NULL, true),

-- ============================================
-- social 类别 — 社交相关成就
-- ============================================
-- 签到梯度
('签到新手', '累计签到7天', '📅', 'social', 'common', 7, 'currency', 500, NULL, NULL, true),
('签到达人', '累计签到30天', '📆', 'social', 'uncommon', 30, 'currency', 3000, NULL, NULL, true),
('签到大师', '累计签到100天', '📋', 'social', 'rare', 100, 'currency', 10000, NULL, NULL, true),
('签到传说', '累计签到365天', '🗓️', 'social', 'legendary', 365, 'currency', 50000, NULL, '签到传说', true),

-- 好友梯度
('社交达人', '添加10个好友', '👥', 'social', 'common', 10, 'currency', 500, NULL, NULL, true),
('人气之星', '添加50个好友', '⭐', 'social', 'uncommon', 50, 'currency', 2000, NULL, NULL, true),
('社交之王', '添加100个好友', '🌟', 'social', 'rare', 100, 'currency', 5000, NULL, '社交之王', true),

-- ============================================
-- event 类别 — 活动参与相关成就
-- ============================================
('节日活动', '参与5次节日活动', '🎊', 'event', 'common', 5, 'currency', 2000, NULL, NULL, true),
('活动常客', '参与10次活动', '🎈', 'event', 'uncommon', 10, 'currency', 3000, NULL, NULL, true),
('活动达人', '参与20次活动', '🎉', 'event', 'rare', 20, 'currency', 5000, NULL, NULL, true),
('活动专家', '参与50次活动', '🎪', 'event', 'epic', 50, 'currency', 10000, NULL, NULL, true),
('活动传奇', '参与100次活动', '🎭', 'event', 'legendary', 100, 'item', 3, 15, '活动传奇', true),

-- ============================================
-- 特殊成就 — 唯一/隐藏条件成就
-- ============================================
('永恒圣果', '种植第一颗永恒圣果', '🍎', 'farming', 'legendary', 1, 'item', 5, 20, '圣果种植者', true),
-- ============================================
-- 方案B 新增成就：隐藏成就（7条）——特殊条件触发
-- ============================================
('天选之人', '连续3次收获时触发双倍奖励', '🎰', 'farming', 'epic', 3, 'currency', 5000, NULL, NULL, true),
('风水宝地', '同时有10块地块处于完美灌溉状态', '⛲', 'farm', 'rare', 10, 'currency', 2000, NULL, NULL, true),
('时间旅行者', '使用时光沙漏让同一地块立即成熟3次', '⏰', 'farming', 'rare', 3, 'currency', 3000, NULL, NULL, true),
('午夜农夫', '服务器时间00:00-05:00期间收获10次', '🌙', 'farming', 'uncommon', 10, 'currency', 1000, NULL, NULL, true),
('败家子', '单次购买超过50000金币的种子/道具', '💸', 'economy', 'uncommon', 50000, 'currency', 2000, NULL, NULL, true),
('完美主义', '连续10次种植/收获操作无失误（未枯死、未超时）', '✨', 'farming', 'epic', 10, 'currency', 10000, NULL, NULL, true),
('倾家荡产', '农场币余额降到0以下（含购买后正好归零）', '🤑', 'economy', 'common', 0, 'currency', 500, NULL, NULL, true),
-- ============================================
-- 方案B 新增成就：连击成就（6条）——连续操作累积
-- ============================================
('三日农夫', '连续3天登录并收获至少1次', '📅', 'social', 'common', 3, 'currency', 500, NULL, NULL, true),
('七日不息', '连续7天完成至少3个每日任务', '🔥', 'social', 'uncommon', 7, 'currency', 2000, NULL, NULL, true),
('月度劳模', '连续30天完成所有每日任务', '🏅', 'social', 'rare', 30, 'currency', 10000, NULL, NULL, true),
('百天坚持', '连续100天登录游戏', '💯', 'social', 'epic', 100, 'currency', 50000, NULL, NULL, true),
('连击达人', '在一次登录会话中连续收获50次', '⚡', 'farming', 'uncommon', 50, 'currency', 3000, NULL, NULL, true),
('闪电之手', '在一次登录会话中连续种植100次', '🌪️', 'farming', 'epic', 100, 'currency', 8000, NULL, NULL, true),
-- ============================================
-- 方案B 新增成就：收藏成就（7条）——收集类全图鉴
-- ============================================
('种子收藏家', '解锁所有84种作物种子', '📚', 'farm', 'rare', 84, 'currency', 5000, NULL, NULL, true),
('道具达人', '背包中同时拥有超过15种不同类型的道具', '🎒', 'item', 'uncommon', 15, 'currency', 2000, NULL, NULL, true),
('道具收藏家', '使用过所有30种道具', '🎁', 'item', 'epic', 30, 'currency', 20000, NULL, NULL, true),
('皮肤收藏家', '拥有3款限时皮肤', '🎨', 'item', 'rare', 3, 'currency', 0, NULL, NULL, true),
('装饰大师', '放置全部2种装饰物各至少1个', '🏗️', 'farm', 'common', 2, 'currency', 1000, NULL, NULL, true),
('全图鉴收集', '完成所有84种作物的种植和收获各1次', '🏆', 'farming', 'legendary', 84, 'currency', 100000, NULL, '全图鉴大师', true),
('成就猎人', '完成除本成就外的所有81条成就', '👑', 'item', 'legendary', 81, 'currency', 50000, NULL, '成就猎人', true)

ON CONFLICT DO NOTHING;