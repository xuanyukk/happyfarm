-- ============================================
-- 迁移名称: create_announcement_tables
-- 版本: v2.0.0
-- 日期: 2026-04-30
-- 描述: 创建游戏公告发布系统表
-- 影响范围: 新增 announcement/announcement_read/announcement_category/announcement_draft 表
-- 回滚操作: DROP TABLE IF EXISTS announcement_draft; DROP TABLE IF EXISTS announcement_read; DROP TABLE IF EXISTS announcement_category; DROP TABLE IF EXISTS announcement;
-- 依赖: 17_sys_login.sql（用户表）
-- ============================================

-- ============================================
-- 1. 公告表
-- ============================================
CREATE TABLE IF NOT EXISTS announcement (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    category VARCHAR(30) NOT NULL DEFAULT 'SYSTEM' CHECK (
        category IN ('SYSTEM', 'ACTIVITY', 'MAINTENANCE', 'UPDATE', 'COMPENSATION')
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (
        priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
    ),
    cover_image VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'OFFLINE')
    ),
    is_top BOOLEAN DEFAULT FALSE,
    publish_time TIMESTAMP WITH TIME ZONE,
    offline_time TIMESTAMP WITH TIME ZONE,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    creator_id INTEGER REFERENCES sys_user(id),
    approver_id INTEGER REFERENCES sys_user(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        approval_status IN ('PENDING', 'APPROVED', 'REJECTED')
    ),
    approval_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcement_status ON announcement(status);
CREATE INDEX idx_announcement_category ON announcement(category);
CREATE INDEX idx_announcement_is_top ON announcement(is_top);
CREATE INDEX idx_announcement_publish_time ON announcement(publish_time);
CREATE INDEX idx_announcement_creator_id ON announcement(creator_id);

COMMENT ON TABLE announcement IS '游戏公告表';
COMMENT ON COLUMN announcement.title IS '公告标题';
COMMENT ON COLUMN announcement.content IS '公告内容（富文本）';
COMMENT ON COLUMN announcement.summary IS '摘要';
COMMENT ON COLUMN announcement.category IS '分类：SYSTEM系统、ACTIVITY活动、MAINTENANCE维护、UPDATE更新、COMPENSATION补偿';
COMMENT ON COLUMN announcement.priority IS '优先级：LOW低、NORMAL普通、HIGH高、URGENT紧急';
COMMENT ON COLUMN announcement.cover_image IS '封面图片';
COMMENT ON COLUMN announcement.status IS '状态：DRAFT草稿、PENDING待发布、PUBLISHED已发布、OFFLINE已下线';
COMMENT ON COLUMN announcement.is_top IS '是否置顶';
COMMENT ON COLUMN announcement.publish_time IS '发布时间';
COMMENT ON COLUMN announcement.offline_time IS '下线时间';
COMMENT ON COLUMN announcement.scheduled_time IS '定时发布时间';
COMMENT ON COLUMN announcement.view_count IS '阅读数';
COMMENT ON COLUMN announcement.like_count IS '点赞数';
COMMENT ON COLUMN announcement.approval_status IS '审核状态';
COMMENT ON COLUMN announcement.approval_comment IS '审核意见';

-- ============================================
-- 2. 公告阅读记录表
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_read (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcement(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES sys_user(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(announcement_id, user_id)
);

CREATE INDEX idx_announcement_read_announcement_id ON announcement_read(announcement_id);
CREATE INDEX idx_announcement_read_user_id ON announcement_read(user_id);

COMMENT ON TABLE announcement_read IS '公告阅读记录表';

-- ============================================
-- 3. 公告分类表
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE announcement_category IS '公告分类表';

-- ============================================
-- 4. 草稿自动保存表
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_draft (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcement(id),
    title VARCHAR(200),
    content TEXT,
    content_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcement_draft_announcement_id ON announcement_draft(announcement_id);

COMMENT ON TABLE announcement_draft IS '公告草稿自动保存表';

-- ============================================
-- 初始化数据
-- ============================================

-- 插入公告分类
INSERT INTO announcement_category (name, code, description, icon, sort_order) VALUES 
    ('系统公告', 'SYSTEM', '系统相关公告', '📢', 1),
    ('活动公告', 'ACTIVITY', '游戏活动公告', '🎉', 2),
    ('维护公告', 'MAINTENANCE', '服务器维护公告', '🔧', 3),
    ('更新公告', 'UPDATE', '版本更新公告', '⬆️', 4),
    ('补偿公告', 'COMPENSATION', '补偿发放公告', '🎁', 5)
ON CONFLICT (code) DO NOTHING;

-- 插入示例公告
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
        1
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
        1
    )
ON CONFLICT DO NOTHING;

