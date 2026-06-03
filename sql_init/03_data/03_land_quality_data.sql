-- ============================================
-- 文件名: 03_land_quality_data.sql
-- 作者: Trae AI
-- 日期: 2026-05-01
-- 版本: v2.5.0
-- 功能描述: 地块品质公共配置初始数据 + 星级配置数据
-- 执行顺序: 03-03
-- 依赖关系: 02-05_land_quality.sql
-- ============================================

INSERT INTO land_quality (quality_id, quality_name, yield_rate, grow_speed, unlock_player_level, unlock_farm_level, unlock_world_level, cover_cost_type, cover_cost_id, cover_cost_num, total_cover_cost, description) VALUES
(1, '普通', 1.0, 1.0, 200, 100, 10, 2, NULL, 0, 0, '基础地块品质，无额外加成'),
(2, '铜', 1.2, 0.9, 400, 200, 20, 2, NULL, 5000, 250000, '铜品质地块，产量小幅提升'),
(3, '铁', 1.5, 0.8, 600, 300, 30, 2, NULL, 20000, 1000000, '铁品质地块，产量中等提升'),
(4, '金', 2.0, 0.7, 700, 350, 40, 2, NULL, 50000, 2500000, '金品质地块，产量大幅提升'),
(5, '翡翠', 2.5, 0.6, 800, 400, 50, 2, NULL, 200000, 10000000, '翡翠品质地块，产量显著提升'),
(6, '钻石', 3.0, 0.5, 850, 450, 60, 2, NULL, 500000, 25000000, '钻石品质地块，产量极高'),
(7, '狱', 4.0, 0.3, 950, 480, 80, 2, NULL, 2000000, 100000000, '狱品质地块，产量恐怖'),
(8, '无尽', 5.0, 0.1, 1000, 500, 100, 2, NULL, 10000000, 500000000, '无尽品质地块，产量极限')
ON CONFLICT (quality_id) DO NOTHING;

-- ============================================================
-- 地块品质星级配置数据（8品质 × 5星级 = 40条）
-- ============================================================

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
  (7, 1, '★☆☆☆☆', 0.00, 0.00, 0,       550,  '狱一星：初始状态'),
  (7, 2, '★★☆☆☆', 0.20, 0.10, 30000,   600,  '狱二星：微幅提升'),
  (7, 3, '★★★☆☆', 0.40, 0.20, 80000,   650,  '狱三星：小幅提升'),
  (7, 4, '★★★★☆', 0.65, 0.32, 220000,  700,  '狱四星：中等提升'),
  (7, 5, '★★★★★', 0.90, 0.45, 500000,  750,  '狱五星：全面强化')
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
