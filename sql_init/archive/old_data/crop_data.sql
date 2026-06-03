-- crop_data.sql
-- 作者: Trae AI
-- 日期: 2026-03-16
-- 版本: 1.1
-- 功能: 作物公共配置初始数据

-- 插入初始数据
-- 世界1-10级（普通地块）：15种基础作物（数量最多，刷农场币用）
INSERT INTO crop (crop_name, world_id, growth_cycle, base_yield, sell_price, seed_cost, gp_per_min, crop_type, unlock_desc) VALUES
('小麦',1,5,30,2,5,11.00,'basic','新手默认解锁'),
('玉米',1,8,25,3,8,8.12,'basic','等级2解锁'),
('土豆',1,10,20,5,12,8.80,'basic','等级3解锁'),
('胡萝卜',1,6,28,4,10,14.00,'basic','等级4解锁'),
('青菜',1,4,35,1,3,8.00,'basic','等级5解锁'),
('大豆',1,12,18,5,15,6.25,'basic','等级6解锁'),
('番茄',1,15,15,8,20,8.00,'basic','等级7解锁'),
('黄瓜',1,10,22,6,15,11.70,'basic','等级8解锁'),
('辣椒',1,13,16,7,18,8.62,'basic','等级9解锁'),
('茄子',10,14,14,10,25,9.50,'basic','等级10解锁'),
('白菜',1,3,40,2,4,24.00,'basic','默认解锁'),
('生菜',1,5,32,3,6,18.00,'basic','等级2解锁'),
('菠菜',1,4,30,3,5,21.25,'basic','等级3解锁'),
('芹菜',1,7,26,5,12,17.71,'basic','等级4解锁'),
('韭菜',1,6,29,4,8,18.17,'basic','等级5解锁')
ON CONFLICT DO NOTHING;

-- 世界11-30级（铜/铁地块）：5种经济型作物
INSERT INTO crop (crop_name, world_id, growth_cycle, base_yield, sell_price, seed_cost, gp_per_min, crop_type, unlock_desc) VALUES
('草莓',20,20,12,20,50,10.20,'economic','铜品质解锁'),
('西瓜',20,25,10,25,60,7.60,'economic','铜品质解锁'),
('葡萄',20,30,8,30,70,6.27,'economic','铜品质解锁'),
('芒果',30,35,6,50,150,6.43,'economic','铁品质解锁'),
('榴莲',30,40,5,80,200,8.75,'economic','铁品质解锁')
ON CONFLICT DO NOTHING;

-- 世界31-60级（金/翡翠/钻石）：3种稀有作物
INSERT INTO crop (crop_name, world_id, growth_cycle, base_yield, sell_price, seed_cost, gp_per_min, crop_type, unlock_desc) VALUES
('蓝莓',40,45,4,100,300,7.11,'rare','金品质解锁'),
('车厘子',50,50,3,200,800,8.80,'rare','翡翠品质解锁'),
('燕窝果',50,60,2,500,2000,13.33,'rare','钻石品质解锁')
ON CONFLICT DO NOTHING;

-- 世界81-100级（狱/无尽）：1种顶级作物
INSERT INTO crop (crop_name, world_id, growth_cycle, base_yield, sell_price, seed_cost, gp_per_min, crop_type, unlock_desc) VALUES
('永恒圣果',100,120,1,2000,5000,12.50,'top','无尽品质专属，开心农场顶级作物')
ON CONFLICT DO NOTHING;