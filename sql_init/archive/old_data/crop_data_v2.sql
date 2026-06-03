-- crop_data_v2.sql
-- 作者: 开发者
-- 日期: 2026-03-25
-- 版本: 2.0
-- 功能: 作物公共配置初始数据（包含产量范围和三种等级经验值）

-- 更新现有作物数据，添加产量范围和经验值
-- 基础作物（世界1-10级）
UPDATE crop SET min_yield = 25, max_yield = 35, player_exp_base = 5, farm_exp_base = 3, world_exp_base = 2 WHERE crop_name = '小麦';
UPDATE crop SET min_yield = 20, max_yield = 30, player_exp_base = 8, farm_exp_base = 5, world_exp_base = 3 WHERE crop_name = '玉米';
UPDATE crop SET min_yield = 15, max_yield = 25, player_exp_base = 10, farm_exp_base = 7, world_exp_base = 4 WHERE crop_name = '土豆';
UPDATE crop SET min_yield = 23, max_yield = 33, player_exp_base = 6, farm_exp_base = 4, world_exp_base = 3 WHERE crop_name = '胡萝卜';
UPDATE crop SET min_yield = 30, max_yield = 40, player_exp_base = 4, farm_exp_base = 2, world_exp_base = 1 WHERE crop_name = '青菜';
UPDATE crop SET min_yield = 14, max_yield = 22, player_exp_base = 12, farm_exp_base = 8, world_exp_base = 5 WHERE crop_name = '大豆';
UPDATE crop SET min_yield = 12, max_yield = 18, player_exp_base = 15, farm_exp_base = 10, world_exp_base = 6 WHERE crop_name = '番茄';
UPDATE crop SET min_yield = 18, max_yield = 26, player_exp_base = 10, farm_exp_base = 6, world_exp_base = 4 WHERE crop_name = '黄瓜';
UPDATE crop SET min_yield = 13, max_yield = 19, player_exp_base = 13, farm_exp_base = 9, world_exp_base = 5 WHERE crop_name = '辣椒';
UPDATE crop SET min_yield = 11, max_yield = 17, player_exp_base = 14, farm_exp_base = 10, world_exp_base = 6 WHERE crop_name = '茄子';
UPDATE crop SET min_yield = 35, max_yield = 45, player_exp_base = 3, farm_exp_base = 2, world_exp_base = 1 WHERE crop_name = '白菜';
UPDATE crop SET min_yield = 27, max_yield = 37, player_exp_base = 5, farm_exp_base = 3, world_exp_base = 2 WHERE crop_name = '生菜';
UPDATE crop SET min_yield = 25, max_yield = 35, player_exp_base = 4, farm_exp_base = 3, world_exp_base = 2 WHERE crop_name = '菠菜';
UPDATE crop SET min_yield = 21, max_yield = 31, player_exp_base = 7, farm_exp_base = 5, world_exp_base = 3 WHERE crop_name = '芹菜';
UPDATE crop SET min_yield = 24, max_yield = 34, player_exp_base = 6, farm_exp_base = 4, world_exp_base = 3 WHERE crop_name = '韭菜';

-- 经济型作物（世界11-30级）
UPDATE crop SET min_yield = 10, max_yield = 14, player_exp_base = 25, farm_exp_base = 18, world_exp_base = 12 WHERE crop_name = '草莓';
UPDATE crop SET min_yield = 8, max_yield = 12, player_exp_base = 30, farm_exp_base = 22, world_exp_base = 15 WHERE crop_name = '西瓜';
UPDATE crop SET min_yield = 6, max_yield = 10, player_exp_base = 35, farm_exp_base = 26, world_exp_base = 18 WHERE crop_name = '葡萄';
UPDATE crop SET min_yield = 5, max_yield = 7, player_exp_base = 50, farm_exp_base = 38, world_exp_base = 25 WHERE crop_name = '芒果';
UPDATE crop SET min_yield = 4, max_yield = 6, player_exp_base = 80, farm_exp_base = 60, world_exp_base = 40 WHERE crop_name = '榴莲';

-- 稀有作物（世界31-60级）
UPDATE crop SET min_yield = 3, max_yield = 5, player_exp_base = 100, farm_exp_base = 75, world_exp_base = 50 WHERE crop_name = '蓝莓';
UPDATE crop SET min_yield = 2, max_yield = 4, player_exp_base = 150, farm_exp_base = 115, world_exp_base = 75 WHERE crop_name = '车厘子';
UPDATE crop SET min_yield = 1, max_yield = 3, player_exp_base = 200, farm_exp_base = 150, world_exp_base = 100 WHERE crop_name = '燕窝果';

-- 顶级作物（世界81-100级）
UPDATE crop SET min_yield = 1, max_yield = 1, player_exp_base = 500, farm_exp_base = 380, world_exp_base = 250 WHERE crop_name = '永恒圣果';

-- 验证数据更新
SELECT crop_id, crop_name, crop_type, base_yield, min_yield, max_yield, 
       player_exp_base, farm_exp_base, world_exp_base
FROM crop
ORDER BY crop_id;
