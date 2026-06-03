-- ============================================
-- 文件名: 20260530000003_system_enhancements.sql
-- 作者: SOLO
-- 日期: 2026-05-30
-- 版本: v1.0.0
-- 功能描述: 四大系统增强迁移
--   1. 体力值系统: 等级解锁上限 200→1000（player_level>=300）
--   2. 道具效果: yield_boost/speed_boost CHECK约束 1.0~10.0
--   3. 地块星级系统: player_land_status 新增 star_level
--                    新增 land_quality_star 星级配置表
--   4. 背包系统: 新增 game_config 记录 INVENTORY_MAX_SLOTS
-- 影响范围: player_base, player_land_status, game_config, 新建 land_quality_star
-- ============================================

BEGIN;

-- ============================================================
-- 1. 体力值系统：等级解锁上限配置
-- ============================================================

-- 体力值计算公式: maxStamina = playerLevel >= unlockLevel ? unlockedMax : baseMax
INSERT INTO game_config (key, name, value, default_value, description, category, data_type, is_readonly, sort_order, is_active)
VALUES
  ('STAMINA_BASE_MAX', '体力基础上限', '200', '200',
   '体力值基础上限，玩家等级未达到解锁等级时的最大值',
   'player', 'integer', FALSE, 501, TRUE),
  ('STAMINA_UNLOCK_LEVEL', '体力上限解锁等级', '300', '300',
   '玩家达到此等级后，体力上限提升至解锁值',
   'player', 'integer', FALSE, 502, TRUE),
  ('STAMINA_UNLOCKED_MAX', '体力解锁上限', '1000', '1000',
   '玩家达到解锁等级后的体力最大值',
   'player', 'integer', FALSE, 503, TRUE)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- 2. 道具效果：yield_boost/speed_boost CHECK约束
-- ============================================================

ALTER TABLE player_land_status
  DROP CONSTRAINT IF EXISTS chk_yield_boost_range;

ALTER TABLE player_land_status
  ADD CONSTRAINT chk_yield_boost_range
    CHECK (yield_boost >= 1.0 AND yield_boost <= 10.0);

ALTER TABLE player_land_status
  DROP CONSTRAINT IF EXISTS chk_speed_boost_range;

ALTER TABLE player_land_status
  ADD CONSTRAINT chk_speed_boost_range
    CHECK (speed_boost >= 1.0 AND speed_boost <= 10.0);

COMMENT ON CONSTRAINT chk_yield_boost_range ON player_land_status
  IS '产量加成倍率范围 1.0(无加成) ~ 10.0(10倍产量, +900%)';
COMMENT ON CONSTRAINT chk_speed_boost_range ON player_land_status
  IS '速度加成倍率范围 1.0(正常速度) ~ 10.0(10倍速度, 时间缩短至1/10)';

-- ============================================================
-- 3. 地块星级系统
-- ============================================================

-- 3.1 player_land_status 新增星级字段
ALTER TABLE player_land_status
  ADD COLUMN IF NOT EXISTS star_level SMALLINT NOT NULL DEFAULT 1;

COMMENT ON COLUMN player_land_status.star_level
  IS '地块当前星级(1-5)，每品质独立';

ALTER TABLE player_land_status
  ADD CONSTRAINT chk_star_level
    CHECK (star_level >= 1 AND star_level <= 5);

-- 3.2 创建地块品质星级配置表
CREATE TABLE IF NOT EXISTS land_quality_star (
    id SERIAL PRIMARY KEY,
    quality_id SMALLINT NOT NULL,
    star_level SMALLINT NOT NULL,
    star_name VARCHAR(30) NOT NULL,
    yield_bonus DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    speed_bonus DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    upgrade_cost BIGINT NOT NULL DEFAULT 0,
    unlock_player_level SMALLINT NOT NULL DEFAULT 1,
    description VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (quality_id, star_level),
    CONSTRAINT fk_star_quality FOREIGN KEY (quality_id)
      REFERENCES land_quality (quality_id),
    CONSTRAINT chk_star_yield_bonus CHECK (yield_bonus >= 0.0 AND yield_bonus <= 10.0),
    CONSTRAINT chk_star_speed_bonus CHECK (speed_bonus >= 0.0 AND speed_bonus <= 10.0)
);

COMMENT ON TABLE land_quality_star IS '地块品质星级配置表——每种品质各有5个星级';
COMMENT ON COLUMN land_quality_star.quality_id IS '所属品质ID(1-8)';
COMMENT ON COLUMN land_quality_star.star_level IS '星级等级(1-5)';
COMMENT ON COLUMN land_quality_star.star_name IS '星级名称（如"★☆☆☆☆"）';
COMMENT ON COLUMN land_quality_star.yield_bonus IS '该星级产量额外加成（叠加品质基础倍率）';
COMMENT ON COLUMN land_quality_star.speed_bonus IS '该星级速度额外加成（叠加品质基础倍率）';
COMMENT ON COLUMN land_quality_star.upgrade_cost IS '升级到该星级所需农场币';
COMMENT ON COLUMN land_quality_star.unlock_player_level IS '升级到该星级所需玩家等级';
COMMENT ON COLUMN land_quality_star.description IS '星级描述';

-- 3.3 插入8品质 × 5星级 = 40条星级配置数据
-- 品质1(普通) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (1, 1, '★☆☆☆☆', 0.00, 0.00, 0,     1,   '普通一星：初始状态'),
  (1, 2, '★★☆☆☆', 0.05, 0.02, 500,   5,   '普通二星：微幅提升'),
  (1, 3, '★★★☆☆', 0.10, 0.05, 1500,  15,  '普通三星：小幅提升'),
  (1, 4, '★★★★☆', 0.18, 0.08, 4000,  30,  '普通四星：中等提升'),
  (1, 5, '★★★★★', 0.25, 0.12, 10000, 50,  '普通五星：全面强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- 品质2(铜) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (2, 1, '★☆☆☆☆', 0.00, 0.00, 0,      50,  '铜一星：初始状态'),
  (2, 2, '★★☆☆☆', 0.06, 0.03, 2000,   65,  '铜二星：微幅提升'),
  (2, 3, '★★★☆☆', 0.12, 0.06, 6000,   80,  '铜三星：小幅提升'),
  (2, 4, '★★★★☆', 0.20, 0.10, 15000,  100, '铜四星：中等提升'),
  (2, 5, '★★★★★', 0.30, 0.15, 35000,  120, '铜五星：全面强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- 品质3(铁) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (3, 1, '★☆☆☆☆', 0.00, 0.00, 0,      120, '铁一星：初始状态'),
  (3, 2, '★★☆☆☆', 0.08, 0.04, 5000,   140, '铁二星：微幅提升'),
  (3, 3, '★★★☆☆', 0.15, 0.08, 15000,  160, '铁三星：小幅提升'),
  (3, 4, '★★★★☆', 0.25, 0.12, 40000,  180, '铁四星：中等提升'),
  (3, 5, '★★★★★', 0.35, 0.18, 80000,  200, '铁五星：全面强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- 品质4(金) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (4, 1, '★☆☆☆☆', 0.00, 0.00, 0,       200, '金一星：初始状态'),
  (4, 2, '★★☆☆☆', 0.10, 0.05, 10000,   220, '金二星：微幅提升'),
  (4, 3, '★★★☆☆', 0.20, 0.10, 30000,   240, '金三星：小幅提升'),
  (4, 4, '★★★★☆', 0.30, 0.15, 80000,   260, '金四星：中等提升'),
  (4, 5, '★★★★★', 0.45, 0.22, 150000,  280, '金五星：全面强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- 品质5(翡翠) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (5, 1, '★☆☆☆☆', 0.00, 0.00, 0,       280, '翡翠一星：初始状态'),
  (5, 2, '★★☆☆☆', 0.12, 0.06, 15000,   300, '翡翠二星：微幅提升'),
  (5, 3, '★★★☆☆', 0.25, 0.12, 45000,   320, '翡翠三星：小幅提升'),
  (5, 4, '★★★★☆', 0.40, 0.18, 120000,  340, '翡翠四星：中等提升'),
  (5, 5, '★★★★★', 0.55, 0.25, 250000,  360, '翡翠五星：全面强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- 品质6(钻石) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (6, 1, '★☆☆☆☆', 0.00, 0.00, 0,       360, '钻石一星：初始状态'),
  (6, 2, '★★☆☆☆', 0.15, 0.08, 20000,   400, '钻石二星：微幅提升'),
  (6, 3, '★★★☆☆', 0.30, 0.15, 60000,   450, '钻石三星：小幅提升'),
  (6, 4, '★★★★☆', 0.50, 0.25, 180000,  500, '钻石四星：中等提升'),
  (6, 5, '★★★★★', 0.70, 0.35, 400000,  550, '钻石五星：全面强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- 品质7(狱) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (7, 1, '★☆☆☆☆', 0.00, 0.00, 0,       550, '狱一星：初始状态'),
  (7, 2, '★★☆☆☆', 0.20, 0.10, 30000,   600, '狱二星：微幅提升'),
  (7, 3, '★★★☆☆', 0.40, 0.20, 80000,   650, '狱三星：小幅提升'),
  (7, 4, '★★★★☆', 0.65, 0.32, 220000,  700, '狱四星：中等提升'),
  (7, 5, '★★★★★', 0.90, 0.45, 500000,  750, '狱五星：全面强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- 品质8(无尽) 星级数据
INSERT INTO land_quality_star (quality_id, star_level, star_name, yield_bonus, speed_bonus, upgrade_cost, unlock_player_level, description)
VALUES
  (8, 1, '★☆☆☆☆', 0.00, 0.00, 0,       750,  '无尽一星：初始状态'),
  (8, 2, '★★☆☆☆', 0.25, 0.12, 50000,   800,  '无尽二星：微幅提升'),
  (8, 3, '★★★☆☆', 0.50, 0.25, 150000,  850,  '无尽三星：小幅提升'),
  (8, 4, '★★★★☆', 0.80, 0.40, 400000,  900,  '无尽四星：中等提升'),
  (8, 5, '★★★★★', 1.20, 0.60, 1000000, 1000, '无尽五星：终极强化')
ON CONFLICT (quality_id, star_level) DO NOTHING;

-- ============================================================
-- 4. 背包槽位配置迁移至数据库
-- ============================================================

INSERT INTO game_config (key, name, value, default_value, description, category, data_type, is_readonly, sort_order, is_active)
VALUES
  ('INVENTORY_MAX_SLOTS', '背包最大槽位', '200', '200',
   '玩家背包最大槽位数，超出后无法购买道具/种子',
   'inventory', 'integer', FALSE, 601, TRUE)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      description = EXCLUDED.description,
      updated_at = CURRENT_TIMESTAMP;

COMMIT;

\echo '四大系统增强迁移完成！'