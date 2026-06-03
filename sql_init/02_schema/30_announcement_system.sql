-- ============================================
-- 文件名: 30_announcement_system.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.4.0
-- 功能描述: 游戏公告发布系统表结构
-- 执行顺序: 02-30
-- 依赖关系: 02-29_admin_system.sql
-- ============================================

-- 公告表
CREATE TABLE IF NOT EXISTS announcement (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary VARCHAR(500),
    category VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    cover_image VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    is_top BOOLEAN DEFAULT FALSE,
    publish_time TIMESTAMP WITH TIME ZONE,
    offline_time TIMESTAMP WITH TIME ZONE,
    scheduled_time TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    creator_id INTEGER REFERENCES sys_user(id),
    approver_id INTEGER REFERENCES sys_user(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    approval_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (category IN ('SYSTEM', 'ACTIVITY', 'MAINTENANCE', 'UPDATE', 'COMPENSATION')),
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    CHECK (status IN ('DRAFT', 'PENDING', 'PUBLISHED', 'OFFLINE')),
    CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

COMMENT ON TABLE announcement IS '游戏公告表';
COMMENT ON COLUMN announcement.title IS '公告标题';
COMMENT ON COLUMN announcement.content IS '公告内容（富文本）';
COMMENT ON COLUMN announcement.summary IS '摘要';
COMMENT ON COLUMN announcement.category IS '分类';
COMMENT ON COLUMN announcement.priority IS '优先级';
COMMENT ON COLUMN announcement.cover_image IS '封面图片';
COMMENT ON COLUMN announcement.status IS '状态';
COMMENT ON COLUMN announcement.is_top IS '是否置顶';
COMMENT ON COLUMN announcement.publish_time IS '发布时间';
COMMENT ON COLUMN announcement.offline_time IS '下线时间';
COMMENT ON COLUMN announcement.scheduled_time IS '定时发布时间';
COMMENT ON COLUMN announcement.view_count IS '阅读数';
COMMENT ON COLUMN announcement.like_count IS '点赞数';
COMMENT ON COLUMN announcement.approval_status IS '审核状态';
COMMENT ON COLUMN announcement.approval_comment IS '审核意见';

CREATE INDEX idx_announcement_status ON announcement(status);
CREATE INDEX idx_announcement_category ON announcement(category);
CREATE INDEX idx_announcement_is_top ON announcement(is_top);
CREATE INDEX idx_announcement_publish_time ON announcement(publish_time);
CREATE INDEX idx_announcement_creator_id ON announcement(creator_id);

-- 公告阅读记录表
CREATE TABLE IF NOT EXISTS announcement_read (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcement(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES sys_user(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(announcement_id, user_id)
);

COMMENT ON TABLE announcement_read IS '公告阅读记录表';

CREATE INDEX idx_announcement_read_announcement_id ON announcement_read(announcement_id);
CREATE INDEX idx_announcement_read_user_id ON announcement_read(user_id);

-- 公告分类表
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

-- 公告草稿自动保存表
CREATE TABLE IF NOT EXISTS announcement_draft (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER REFERENCES announcement(id),
    title VARCHAR(200),
    content TEXT,
    content_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE announcement_draft IS '公告草稿自动保存表';

CREATE INDEX idx_announcement_draft_announcement_id ON announcement_draft(announcement_id);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_announcement_updated_at ON announcement;
CREATE TRIGGER update_announcement_updated_at
BEFORE UPDATE ON announcement
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcement_draft_updated_at ON announcement_draft;
CREATE TRIGGER update_announcement_draft_updated_at
BEFORE UPDATE ON announcement_draft
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

\echo '公告系统表创建成功！'
