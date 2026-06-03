-- ============================================
-- 文件名: 15_game_event_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-22
-- 版本: v4.50.1
-- 功能描述: 游戏活动系统初始数据
-- 执行顺序: 03-15
-- 依赖关系: 02-33_game_event_system.sql
-- 更新记录:
--   2026-05-13 - v2.5.0 - 初始版本
--   2026-05-22 - v4.50.0 - 版本同步更新
--   2026-05-22 - v4.50.1 - 添加示例活动数据
-- ============================================

-- 插入活动模板
INSERT INTO game_event_templates (template_name, template_type, description, template_config, is_active) VALUES
('每日签到活动', 'daily', '每日签到活动模板', '{
    "name": "每日签到",
    "description": "每日签到领取奖励",
    "icon": "📅",
    "bonus_multiplier": 1.0
}'::jsonb, true),
('周末双倍活动', 'weekly', '周末收益双倍活动模板', '{
    "name": "周末双倍",
    "description": "周末作物收益双倍",
    "icon": "🎉",
    "bonus_multiplier": 2.0
}'::jsonb, true),
('节日庆典活动', 'holiday', '节日庆典活动模板', '{
    "name": "节日庆典",
    "description": "节日特殊活动",
    "icon": "🎊",
    "bonus_multiplier": 1.5
}'::jsonb, true),
('季节活动', 'seasonal', '季节主题活动模板', '{
    "name": "季节活动",
    "description": "应季主题活动",
    "icon": "🍂",
    "bonus_multiplier": 1.3
}'::jsonb, true),
('特殊活动', 'special', '特殊限定活动模板', '{
    "name": "特殊活动",
    "description": "限时特殊活动",
    "icon": "✨",
    "bonus_multiplier": 3.0
}'::jsonb, true)
ON CONFLICT (template_name) DO NOTHING;

-- 插入示例活动
-- 注意：created_by 暂时设置为 NULL，因为可能需要先创建管理员用户
-- 活动1：正在进行的新手福利活动
INSERT INTO game_events (event_name, event_type, event_description, event_banner, start_time, end_time, event_config, is_active, created_by) VALUES
(
    '🎉 新手福利活动', 
    'special', 
    '欢迎来到开心农场！完成任务即可领取丰厚奖励！',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    '{
        "rewards": ["💰 1000金币", "🌱 高级种子x10", "⭐ 经验x500"],
        "rules": "完成新手任务即可领取奖励",
        "icon": "🎁"
    }'::jsonb,
    true,
    NULL
),
(
    '🔥 周末双倍收益',
    'weekly',
    '周末专属活动！所有作物收益翻倍！',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '2 days',
    '{
        "rewards": ["双倍收益加成"],
        "rules": "活动期间收获作物获得双倍收益",
        "icon": "🔥"
    }'::jsonb,
    true,
    NULL
),
(
    '📅 每日签到',
    'daily',
    '每日签到领取奖励，连续签到更有额外惊喜！',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '7 days',
    '{
        "rewards": ["💰 100金币/天", "⭐ 50经验/天", "连续7天额外奖励"],
        "rules": "每日签到即可领取奖励",
        "icon": "📅"
    }'::jsonb,
    true,
    NULL
),
(
    '✨ 即将开启：丰收节',
    'holiday',
    '一年一度的丰收节即将开启，准备好收获了吗？',
    NULL,
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '14 days',
    '{
        "rewards": ["🎁 限定道具", "💰 大量金币", "⭐ 海量经验"],
        "rules": "完成丰收节特殊任务",
        "icon": "🎊"
    }'::jsonb,
    true,
    NULL
);

-- 为第一个活动添加示例任务
-- 获取刚才插入的活动ID
WITH first_event AS (SELECT id FROM game_events WHERE event_name = '🎉 新手福利活动' LIMIT 1)
INSERT INTO game_event_tasks (event_id, task_name, task_type, task_description, task_target, task_rewards, task_order, is_active)
SELECT 
    id,
    '初次收获',
    'harvest',
    '收获任意10个作物',
    10,
    '{
        "currency": { "amount": 500, "description": "新手奖励" },
        "exp": { "amount": 200 }
    }'::jsonb,
    1,
    true
FROM first_event

UNION ALL

SELECT 
    id,
    '种植达人',
    'plant',
    '种植任意20个种子',
    20,
    '{
        "currency": { "amount": 300, "description": "种植奖励" },
        "items": [{ "item_id": 1, "quantity": 5 }]
    }'::jsonb,
    2,
    true
FROM first_event

UNION ALL

SELECT 
    id,
    '勤劳致富',
    'sell',
    '出售任意15个物品',
    15,
    '{
        "currency": { "amount": 800, "description": "出售奖励" },
        "exp": { "amount": 300 }
    }'::jsonb,
    3,
    true
FROM first_event;

-- 为周末双倍活动添加任务
WITH second_event AS (SELECT id FROM game_events WHERE event_name = '🔥 周末双倍收益' LIMIT 1)
INSERT INTO game_event_tasks (event_id, task_name, task_type, task_description, task_target, task_rewards, task_order, is_active)
SELECT 
    id,
    '周末大丰收',
    'harvest',
    '周末期间收获50个作物',
    50,
    '{
        "currency": { "amount": 2000, "description": "丰收奖励" },
        "exp": { "amount": 500 }
    }'::jsonb,
    1,
    true
FROM second_event;

\echo '游戏活动系统初始数据插入成功！'
