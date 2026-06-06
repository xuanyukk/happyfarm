-- ============================================
-- 文件名: docker_init.sql
-- 作者: Trae AI
-- 日期: 2026-05-26
-- 版本: v4.72.0
-- 功能描述: Docker容器专用 - 轻量级引导脚本
-- 更新记录:
--   2026-05-14 - v3.0.0 - 重构为引导脚本，使用 \i 引用模块化文件
--   2026-05-16 - v3.1.0 - 添加系统配置、管理员系统和游戏事件数据文件
--   2026-05-22 - v4.50.0 - 完善世界等级和作物数据
--   2026-05-22 - v4.51.0 - 添加游戏活动系统短中期优化（触发器、统计、模板系统、定时任务）
--   2026-05-23 - v4.52.0 - 版本同步至项目最新版本
--   2026-05-23 - v4.53.0 - 移除 system_config 旧表，统一使用 game_config
--   2026-05-25 - v4.60.1 - 同步项目版本号，表总数确认为69张
--   2026-05-26 - v4.61.0 - 新增配置变更日志增强表（34_config_change_log），增强回滚机制
--   2026-06-06 - v4.72.0 - 修复缺失39_player_daily_task.sql，同步版本号
-- ============================================

\echo '========================================'
\echo '  开心农场数据库初始化'
\echo '  Docker 环境专用'
\echo '========================================'

-- ============================================
-- 第一阶段：启用扩展
-- ============================================
\echo ''
\echo '[1/4] 启用数据库扩展...'
\i '/docker-entrypoint-initdb.d/sql_init/04_extensions/01_enable_pgcrypto.sql'
\echo '✅ 扩展启用完成'

-- ============================================
-- 第二阶段：创建表结构
-- ============================================
\echo ''
\echo '[2/4] 创建表结构...'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/01_functions.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/03_world_level.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/04_farm_level.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/05_land_quality.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/06_farm_land.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/07_crop.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/08_currency_config.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/09_item_config.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/10_shop_goods.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/11_player_base.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/12_player_currency.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/13_player_currency_log.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/14_player_inventory.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/15_player_land_status.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/16_player_crop_unlock.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/17_sys_login.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/18_refresh_tokens.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/19_password_reset_tokens.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/20_user_devices.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/21_two_factor_auth.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/22_audit_logs.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/23_game_activity_log.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/24_monitoring_tables.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/25_monitoring_procedures.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/26_emergency_procedures.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/27_optimization.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/28_achievement_system.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/29_admin_system.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/30_announcement_system.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/31_game_config_system.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/32_data_warehouse.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/33_game_event_system.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/34_config_change_log.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/35_player_shop_daily_limit.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/36_player_level_config.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/37_daily_task_config.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/38_item_drop_config.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/39_player_daily_task.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/40_player_item_usage_log.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/41_player_combo_tracker.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/42_daily_discount_goods.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/43_player_skin_record.sql'
\i '/docker-entrypoint-initdb.d/sql_init/02_schema/44_farm_decoration.sql'
\echo '✅ 表结构创建完成!'

-- ============================================
-- 第三阶段：插入初始数据
-- ============================================
\echo ''
\echo '[3/4] 插入初始数据...'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/01_world_level_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/02_farm_level_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/03_land_quality_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/04_farm_land_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/05_crop_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/06_currency_config_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/07_item_config_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/08_shop_goods_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/09_sys_login_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/10_achievement_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/11_announcement_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/12_game_config_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/14_admin_system_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/15_game_event_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/16_player_level_config_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/17_daily_task_config_data.sql'
\i '/docker-entrypoint-initdb.d/sql_init/03_data/18_item_drop_config_data.sql'
\echo '✅ 初始数据插入完成!'

-- ============================================
-- 完成
-- ============================================
\echo ''
\echo '========================================'
\echo '🎉 数据库初始化完成！'
\echo '📊 共 69 张核心表（含分区表）'
\echo '👤 默认账户: admin / 123456'
\echo '========================================'
