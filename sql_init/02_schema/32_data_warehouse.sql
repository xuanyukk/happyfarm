-- ============================================
-- 文件名: 32_data_warehouse.sql
-- 作者: Trae AI
-- 日期: 2026-05-09
-- 版本: v1.0.0
-- 功能描述: 数据仓库表结构 - 用于数据分析和BI报表
-- 执行顺序: 02-32
-- 依赖关系: 02-24_monitoring_tables.sql
-- ============================================

-- 维度表：日期维度
CREATE TABLE IF NOT EXISTS dim_date (
    date_id BIGSERIAL PRIMARY KEY,
    full_date DATE NOT NULL UNIQUE,
    year SMALLINT NOT NULL,
    quarter SMALLINT NOT NULL,
    month SMALLINT NOT NULL,
    day_of_month SMALLINT NOT NULL,
    day_of_week SMALLINT NOT NULL,
    day_of_year SMALLINT NOT NULL,
    week_of_year SMALLINT NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN DEFAULT FALSE,
    holiday_name VARCHAR(100),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE dim_date IS '开心农场-日期维度表';
COMMENT ON COLUMN dim_date.date_id IS '日期ID';
COMMENT ON COLUMN dim_date.full_date IS '完整日期';
COMMENT ON COLUMN dim_date.year IS '年份';
COMMENT ON COLUMN dim_date.quarter IS '季度(1-4)';
COMMENT ON COLUMN dim_date.month IS '月份(1-12)';
COMMENT ON COLUMN dim_date.day_of_month IS '月内天数(1-31)';
COMMENT ON COLUMN dim_date.day_of_week IS '周内天数(0-6, 0=周日)';
COMMENT ON COLUMN dim_date.day_of_year IS '年内天数(1-366)';
COMMENT ON COLUMN dim_date.week_of_year IS '年内周数(1-53)';
COMMENT ON COLUMN dim_date.is_weekend IS '是否周末';
COMMENT ON COLUMN dim_date.is_holiday IS '是否节假日';
COMMENT ON COLUMN dim_date.holiday_name IS '节假日名称';
COMMENT ON COLUMN dim_date.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_dim_date_full_date ON dim_date (full_date);
CREATE INDEX IF NOT EXISTS idx_dim_date_year ON dim_date (year);
CREATE INDEX IF NOT EXISTS idx_dim_date_month ON dim_date (month);
CREATE INDEX IF NOT EXISTS idx_dim_date_quarter ON dim_date (quarter);

-- 维度表：玩家维度
CREATE TABLE IF NOT EXISTS dim_player (
    player_id VARCHAR(64) PRIMARY KEY REFERENCES player_base(player_id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    player_level SMALLINT NOT NULL,
    farm_level SMALLINT NOT NULL,
    is_vip BOOLEAN DEFAULT FALSE,
    vip_level SMALLINT DEFAULT 0,
    country VARCHAR(50),
    registration_source VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_date DATE,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE dim_player IS '开心农场-玩家维度表';
COMMENT ON COLUMN dim_player.player_id IS '玩家ID';
COMMENT ON COLUMN dim_player.username IS '用户名';
COMMENT ON COLUMN dim_player.registration_date IS '注册日期';
COMMENT ON COLUMN dim_player.player_level IS '玩家等级';
COMMENT ON COLUMN dim_player.farm_level IS '农场等级';
COMMENT ON COLUMN dim_player.is_vip IS '是否VIP';
COMMENT ON COLUMN dim_player.vip_level IS 'VIP等级';
COMMENT ON COLUMN dim_player.country IS '国家';
COMMENT ON COLUMN dim_player.registration_source IS '注册来源';
COMMENT ON COLUMN dim_player.is_active IS '是否活跃';
COMMENT ON COLUMN dim_player.last_login_date IS '最后登录日期';
COMMENT ON COLUMN dim_player.create_time IS '创建时间';
COMMENT ON COLUMN dim_player.update_time IS '更新时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_dim_player_level ON dim_player (player_level);
CREATE INDEX IF NOT EXISTS idx_dim_player_active ON dim_player (is_active);
CREATE INDEX IF NOT EXISTS idx_dim_player_reg_date ON dim_player (registration_date);

-- 维度表：作物维度
CREATE TABLE IF NOT EXISTS dim_crop (
    crop_id VARCHAR(50) PRIMARY KEY,
    crop_name VARCHAR(50) NOT NULL,
    crop_type VARCHAR(20) NOT NULL,
    crop_rarity VARCHAR(20) NOT NULL,
    base_growth_time INTEGER NOT NULL,
    base_yield INTEGER NOT NULL,
    base_sell_price INTEGER NOT NULL,
    unlock_level SMALLINT NOT NULL,
    is_seasonal BOOLEAN DEFAULT FALSE,
    season VARCHAR(20),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE dim_crop IS '开心农场-作物维度表';
COMMENT ON COLUMN dim_crop.crop_id IS '作物ID';
COMMENT ON COLUMN dim_crop.crop_name IS '作物名称';
COMMENT ON COLUMN dim_crop.crop_type IS '作物类型';
COMMENT ON COLUMN dim_crop.crop_rarity IS '作物稀有度';
COMMENT ON COLUMN dim_crop.base_growth_time IS '基础生长时间(秒)';
COMMENT ON COLUMN dim_crop.base_yield IS '基础产量';
COMMENT ON COLUMN dim_crop.base_sell_price IS '基础售价';
COMMENT ON COLUMN dim_crop.unlock_level IS '解锁等级';
COMMENT ON COLUMN dim_crop.is_seasonal IS '是否季节性';
COMMENT ON COLUMN dim_crop.season IS '季节';
COMMENT ON COLUMN dim_crop.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_dim_crop_type ON dim_crop (crop_type);
CREATE INDEX IF NOT EXISTS idx_dim_crop_rarity ON dim_crop (crop_rarity);

-- 事实表：日活跃玩家事实表
CREATE TABLE IF NOT EXISTS fact_daily_active_players (
    id BIGSERIAL PRIMARY KEY,
    date_id BIGINT NOT NULL REFERENCES dim_date(date_id) ON DELETE CASCADE,
    player_id VARCHAR(64) NOT NULL REFERENCES dim_player(player_id) ON DELETE CASCADE,
    login_count INTEGER DEFAULT 0,
    total_play_duration INTEGER DEFAULT 0,
    plant_count INTEGER DEFAULT 0,
    harvest_count INTEGER DEFAULT 0,
    sell_count INTEGER DEFAULT 0,
    total_revenue BIGINT DEFAULT 0,
    total_expense BIGINT DEFAULT 0,
    level_up_count INTEGER DEFAULT 0,
    social_interaction_count INTEGER DEFAULT 0,
    is_new_player BOOLEAN DEFAULT FALSE,
    is_returning_player BOOLEAN DEFAULT FALSE,
    retention_day SMALLINT,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fact_daily_active_players IS '开心农场-日活跃玩家事实表';
COMMENT ON COLUMN fact_daily_active_players.id IS '事实ID';
COMMENT ON COLUMN fact_daily_active_players.date_id IS '日期ID';
COMMENT ON COLUMN fact_daily_active_players.player_id IS '玩家ID';
COMMENT ON COLUMN fact_daily_active_players.login_count IS '登录次数';
COMMENT ON COLUMN fact_daily_active_players.total_play_duration IS '总游戏时长(秒)';
COMMENT ON COLUMN fact_daily_active_players.plant_count IS '种植次数';
COMMENT ON COLUMN fact_daily_active_players.harvest_count IS '收获次数';
COMMENT ON COLUMN fact_daily_active_players.sell_count IS '出售次数';
COMMENT ON COLUMN fact_daily_active_players.total_revenue IS '总收入';
COMMENT ON COLUMN fact_daily_active_players.total_expense IS '总支出';
COMMENT ON COLUMN fact_daily_active_players.level_up_count IS '升级次数';
COMMENT ON COLUMN fact_daily_active_players.social_interaction_count IS '社交互动次数';
COMMENT ON COLUMN fact_daily_active_players.is_new_player IS '是否新玩家';
COMMENT ON COLUMN fact_daily_active_players.is_returning_player IS '是否回流玩家';
COMMENT ON COLUMN fact_daily_active_players.retention_day IS '留存天数';
COMMENT ON COLUMN fact_daily_active_players.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_fact_dap_date_id ON fact_daily_active_players (date_id);
CREATE INDEX IF NOT EXISTS idx_fact_dap_player_id ON fact_daily_active_players (player_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fact_dap_date_player ON fact_daily_active_players (date_id, player_id);

-- 事实表：每日交易事实表
CREATE TABLE IF NOT EXISTS fact_daily_transactions (
    id BIGSERIAL PRIMARY KEY,
    date_id BIGINT NOT NULL REFERENCES dim_date(date_id) ON DELETE CASCADE,
    player_id VARCHAR(64) NOT NULL REFERENCES dim_player(player_id) ON DELETE CASCADE,
    crop_id VARCHAR(50) REFERENCES dim_crop(crop_id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL,
    transaction_count INTEGER DEFAULT 0,
    total_quantity BIGINT DEFAULT 0,
    total_amount BIGINT DEFAULT 0,
    avg_price DECIMAL(10, 2),
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fact_daily_transactions IS '开心农场-每日交易事实表';
COMMENT ON COLUMN fact_daily_transactions.id IS '事实ID';
COMMENT ON COLUMN fact_daily_transactions.date_id IS '日期ID';
COMMENT ON COLUMN fact_daily_transactions.player_id IS '玩家ID';
COMMENT ON COLUMN fact_daily_transactions.crop_id IS '作物ID';
COMMENT ON COLUMN fact_daily_transactions.transaction_type IS '交易类型：buy, sell';
COMMENT ON COLUMN fact_daily_transactions.transaction_count IS '交易次数';
COMMENT ON COLUMN fact_daily_transactions.total_quantity IS '总数量';
COMMENT ON COLUMN fact_daily_transactions.total_amount IS '总金额';
COMMENT ON COLUMN fact_daily_transactions.avg_price IS '平均价格';
COMMENT ON COLUMN fact_daily_transactions.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_fact_dt_date_id ON fact_daily_transactions (date_id);
CREATE INDEX IF NOT EXISTS idx_fact_dt_player_id ON fact_daily_transactions (player_id);
CREATE INDEX IF NOT EXISTS idx_fact_dt_crop_id ON fact_daily_transactions (crop_id);
CREATE INDEX IF NOT EXISTS idx_fact_dt_transaction_type ON fact_daily_transactions (transaction_type);

-- 事实表：作物种植事实表
CREATE TABLE IF NOT EXISTS fact_crop_planting (
    id BIGSERIAL PRIMARY KEY,
    date_id BIGINT NOT NULL REFERENCES dim_date(date_id) ON DELETE CASCADE,
    player_id VARCHAR(64) NOT NULL REFERENCES dim_player(player_id) ON DELETE CASCADE,
    crop_id VARCHAR(50) NOT NULL REFERENCES dim_crop(crop_id) ON DELETE CASCADE,
    plant_count INTEGER DEFAULT 0,
    harvest_count INTEGER DEFAULT 0,
    total_yield BIGINT DEFAULT 0,
    success_rate DECIMAL(5, 2),
    avg_growth_time INTEGER,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fact_crop_planting IS '开心农场-作物种植事实表';
COMMENT ON COLUMN fact_crop_planting.id IS '事实ID';
COMMENT ON COLUMN fact_crop_planting.date_id IS '日期ID';
COMMENT ON COLUMN fact_crop_planting.player_id IS '玩家ID';
COMMENT ON COLUMN fact_crop_planting.crop_id IS '作物ID';
COMMENT ON COLUMN fact_crop_planting.plant_count IS '种植次数';
COMMENT ON COLUMN fact_crop_planting.harvest_count IS '收获次数';
COMMENT ON COLUMN fact_crop_planting.total_yield IS '总产量';
COMMENT ON COLUMN fact_crop_planting.success_rate IS '成功率';
COMMENT ON COLUMN fact_crop_planting.avg_growth_time IS '平均生长时间';
COMMENT ON COLUMN fact_crop_planting.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_fact_cp_date_id ON fact_crop_planting (date_id);
CREATE INDEX IF NOT EXISTS idx_fact_cp_player_id ON fact_crop_planting (player_id);
CREATE INDEX IF NOT EXISTS idx_fact_cp_crop_id ON fact_crop_planting (crop_id);

-- 事实表：每日收入事实表
CREATE TABLE IF NOT EXISTS fact_daily_revenue (
    id BIGSERIAL PRIMARY KEY,
    date_id BIGINT NOT NULL REFERENCES dim_date(date_id) ON DELETE CASCADE,
    player_id VARCHAR(64) NOT NULL REFERENCES dim_player(player_id) ON DELETE CASCADE,
    revenue_source VARCHAR(50) NOT NULL,
    revenue_amount BIGINT DEFAULT 0,
    revenue_count INTEGER DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fact_daily_revenue IS '开心农场-每日收入事实表';
COMMENT ON COLUMN fact_daily_revenue.id IS '事实ID';
COMMENT ON COLUMN fact_daily_revenue.date_id IS '日期ID';
COMMENT ON COLUMN fact_daily_revenue.player_id IS '玩家ID';
COMMENT ON COLUMN fact_daily_revenue.revenue_source IS '收入来源：crop_sell, achievement_reward, event_reward等';
COMMENT ON COLUMN fact_daily_revenue.revenue_amount IS '收入金额';
COMMENT ON COLUMN fact_daily_revenue.revenue_count IS '收入次数';
COMMENT ON COLUMN fact_daily_revenue.create_time IS '创建时间';

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_fact_dr_date_id ON fact_daily_revenue (date_id);
CREATE INDEX IF NOT EXISTS idx_fact_dr_player_id ON fact_daily_revenue (player_id);
CREATE INDEX IF NOT EXISTS idx_fact_dr_source ON fact_daily_revenue (revenue_source);

-- 数据聚合视图：日活跃用户统计
CREATE OR REPLACE VIEW v_dau_stats AS
SELECT 
    d.full_date,
    d.year,
    d.month,
    d.quarter,
    COUNT(DISTINCT f.player_id) AS dau,
    COUNT(DISTINCT CASE WHEN f.is_new_player THEN f.player_id END) AS new_users,
    COUNT(DISTINCT CASE WHEN f.is_returning_player THEN f.player_id END) AS returning_users,
    AVG(f.total_play_duration) AS avg_play_duration,
    AVG(f.total_revenue) AS avg_revenue_per_user,
    SUM(f.total_revenue) AS total_revenue
FROM fact_daily_active_players f
JOIN dim_date d ON f.date_id = d.date_id
GROUP BY d.full_date, d.year, d.month, d.quarter
ORDER BY d.full_date DESC;

-- 数据聚合视图：作物种植统计
CREATE OR REPLACE VIEW v_crop_stats AS
SELECT 
    d.full_date,
    c.crop_id,
    c.crop_name,
    c.crop_type,
    c.crop_rarity,
    SUM(f.plant_count) AS total_plant_count,
    SUM(f.harvest_count) AS total_harvest_count,
    SUM(f.total_yield) AS total_yield,
    AVG(f.success_rate) AS avg_success_rate
FROM fact_crop_planting f
JOIN dim_date d ON f.date_id = d.date_id
JOIN dim_crop c ON f.crop_id = c.crop_id
GROUP BY d.full_date, c.crop_id, c.crop_name, c.crop_type, c.crop_rarity
ORDER BY d.full_date DESC, total_plant_count DESC;

-- 数据聚合视图：收入统计
CREATE OR REPLACE VIEW v_revenue_stats AS
SELECT 
    d.full_date,
    d.year,
    d.month,
    f.revenue_source,
    COUNT(DISTINCT f.player_id) AS paying_users,
    SUM(f.revenue_amount) AS total_revenue,
    SUM(f.revenue_count) AS total_transactions,
    AVG(f.revenue_amount) AS avg_revenue_per_user
FROM fact_daily_revenue f
JOIN dim_date d ON f.date_id = d.date_id
GROUP BY d.full_date, d.year, d.month, f.revenue_source
ORDER BY d.full_date DESC, total_revenue DESC;

-- 数据聚合视图：留存分析
CREATE OR REPLACE VIEW v_retention_analysis AS
SELECT 
    d.full_date,
    f.retention_day,
    COUNT(DISTINCT f.player_id) AS user_count,
    COUNT(DISTINCT CASE WHEN f.retention_day = 1 THEN f.player_id END) AS day_1_retention,
    COUNT(DISTINCT CASE WHEN f.retention_day = 7 THEN f.player_id END) AS day_7_retention,
    COUNT(DISTINCT CASE WHEN f.retention_day = 14 THEN f.player_id END) AS day_14_retention,
    COUNT(DISTINCT CASE WHEN f.retention_day = 30 THEN f.player_id END) AS day_30_retention
FROM fact_daily_active_players f
JOIN dim_date d ON f.date_id = d.date_id
WHERE f.retention_day IS NOT NULL
GROUP BY d.full_date, f.retention_day
ORDER BY d.full_date DESC, f.retention_day;

-- 初始化日期维度数据（过去2年和未来1年，使用 generate_series 高效生成）
INSERT INTO dim_date (full_date, year, quarter, month, day_of_month, day_of_week, day_of_year, week_of_year, is_weekend)
SELECT
    d::DATE AS full_date,
    EXTRACT(YEAR FROM d)::SMALLINT AS year,
    EXTRACT(QUARTER FROM d)::SMALLINT AS quarter,
    EXTRACT(MONTH FROM d)::SMALLINT AS month,
    EXTRACT(DAY FROM d)::SMALLINT AS day_of_month,
    EXTRACT(DOW FROM d)::SMALLINT AS day_of_week,
    EXTRACT(DOY FROM d)::SMALLINT AS day_of_year,
    EXTRACT(WEEK FROM d)::SMALLINT AS week_of_year,
    EXTRACT(DOW FROM d) IN (0, 6) AS is_weekend
FROM generate_series(
    CURRENT_DATE - INTERVAL '2 years',
    CURRENT_DATE + INTERVAL '1 year',
    INTERVAL '1 day'
) AS d
ON CONFLICT (full_date) DO NOTHING;

-- 数据仓库表创建成功
