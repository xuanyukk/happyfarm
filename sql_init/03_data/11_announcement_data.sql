-- ============================================
-- 文件名: 11_announcement_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 公告系统初始数据
-- 执行顺序: 03-11
-- 依赖关系: 02-30_announcement_system.sql
-- ============================================

INSERT INTO announcement_category (name, code, description, icon, sort_order, is_active) VALUES 
('系统公告', 'SYSTEM', '系统相关公告', '📢', 1, true),
('活动公告', 'ACTIVITY', '游戏活动公告', '🎉', 2, true),
('维护公告', 'MAINTENANCE', '服务器维护公告', '🔧', 3, true),
('更新公告', 'UPDATE', '版本更新公告', '⬆️', 4, true),
('补偿公告', 'COMPENSATION', '补偿发放公告', '🎁', 5, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO announcement (title, content, summary, category, priority, status, is_top, view_count, like_count, creator_id) VALUES 
(
    '欢迎来到开心农场！',
    '<h1>欢迎来到开心农场</h1><p>欢迎加入开心农场大家庭！</p><ul><li>种植作物，收获财富</li><li>结交好友，共同成长</li><li>打造属于你的梦幻农场</li></ul>',
    '欢迎新玩家加入开心农场！',
    'SYSTEM',
    'NORMAL',
    'PUBLISHED',
    TRUE,
    100,
    50,
    (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1)
),
(
    '五一劳动节特别活动',
    '<h1>五一劳动节特别活动</h1><p>劳动最光荣！五一期间特别活动上线啦！</p>',
    '五一劳动节特别活动预告',
    'ACTIVITY',
    'HIGH',
    'PUBLISHED',
    TRUE,
    234,
    89,
    (SELECT id FROM sys_user WHERE username = 'admin' LIMIT 1)
)
ON CONFLICT DO NOTHING;
