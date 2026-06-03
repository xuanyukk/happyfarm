# 开心农场数据库迁移历史文档

> **生成时间**: 2026-05-26
> **项目版本**: v2.0.0
> **文档维护**: 当新增迁移文件时，需同步更新本文档

---

## 一、概述

本文档记录了开心农场项目从 v1.0.0 到 v2.0.0 期间所有的数据库迁移操作。所有迁移文件存
放在 `sql_init/archive/migrations/` 目录下，文件命名遵循
`YYYYMMDDHHMMSS_description.sql` 规范。

---

## 二、迁移执行顺序说明

### 2.1 迁移策略

迁移文件按照时间戳顺序严格顺序执行，每个迁移文件基于上一个迁移完成后的数据库状态。
迁移文件设计为**幂等**（使用 `IF NOT EXISTS` / `IF EXISTS` 模式），支持重复执行。

### 2.2 执行原则

1. **顺序执行**: 按文件名时间戳升序依次执行
2. **幂等保证**: 每个迁移文件可安全重复执行
3. **依赖检查**: 执行前确认依赖的表/字段已存在
4. **回滚准备**: 每个迁移文件都提供了回滚操作方案

### 2.3 执行命令

```bash
# 单文件执行
psql -U username -d database -f <迁移文件>

# 批量执行
cd sql_init/archive/migrations/
for f in $(ls *.sql | sort); do
  psql -U username -d database -f "$f"
done
```

---

## 三、回滚策略说明

### 3.1 标准回滚流程

1. 找到需要回滚的迁移文件
2. 查看文件头的"回滚操作"字段
3. 按文件头记录的回滚 SQL 语句执行逆向操作
4. 如果回滚涉及多个迁移，按**时间戳降序**依次回滚

### 3.2 回滚注意事项

- 回滚前建议备份数据库
- 回滚中包含 `DROP TABLE` 操作的会导致数据丢失
- 某些回滚操作是"破坏性"的，不可逆
- 回滚后需更新迁移记录，确保版本一致性

---

## 四、迁移详细清单

| 编号 | 文件名 | 迁移名称 | 版本 | 日期 | 描述 | 影响范围 |
|------|--------|----------|------|------|------|----------|
| 1 | `20260318000000_add_refresh_tokens_table.sql` | add_refresh_tokens_table | v2.0.0 | 2026-03-18 | 添加JWT刷新令牌表 | refresh_tokens表 |
| 2 | `20260318000001_add_password_reset_tokens_table.sql` | add_password_reset_tokens_table | v2.0.0 | 2026-03-18 | 添加密码重置令牌表 | password_reset_tokens表 |
| 3 | `20260318000002_add_indexes.sql` | add_indexes | v2.0.0 | 2026-03-18 | 数据库索引优化 | sys_user表索引 |
| 4 | `20260319000000_add_audit_logs_table.sql` | add_audit_logs_table | v2.0.0 | 2026-03-19 | 添加操作审计日志表 | audit_logs表 |
| 5 | `20260319000001_add_user_devices_table.sql` | add_user_devices_table | v2.0.0 | 2026-03-19 | 添加用户设备管理表 | user_devices表 |
| 6 | `20260321000000_add_item_effect_fields.sql` | add_item_effect_fields | v2.0.0 | 2026-03-21 | 添加道具效果字段 | player_land_status表字段扩展 |
| 7 | `20260324000000_add_avatar_field.sql` | add_avatar_field | v2.0.0 | 2026-03-24 | 添加头像字段 | player_base表字段扩展 |
| 8 | `20260324000001_add_farm_world_exp_fields.sql` | add_farm_world_exp_fields | v2.0.0 | 2026-03-24 | 添加经验值字段 | player_base表字段扩展 |
| 9 | `20260325000000_add_crop_yield_range_and_exp_fields.sql` | add_crop_yield_range_and_exp_fields | v2.0.0 | 2026-03-25 | 添加产量和经验值字段 | crop表字段扩展 |
| 10 | `20260326000000_create_game_activity_log_table.sql` | create_game_activity_log_table | v2.0.0 | 2026-03-26 | 创建游戏活动日志表 | game_activity_log表 |
| 11 | `20260327000000_create_achievement_tables.sql` | create_achievement_tables | v2.0.0 | 2026-03-27 | 创建成就系统表 | 3个成就相关表 |
| 12 | `20260430000000_create_rbac_tables.sql` | create_rbac_tables | v2.0.0 | 2026-04-30 | 创建RBAC权限系统表 | 6个权限管理表 |
| 13 | `20260430000001_create_announcement_tables.sql` | create_announcement_tables | v2.0.0 | 2026-04-30 | 创建公告发布系统表 | 4个公告相关表 |
| 14 | `20260430000002_create_game_config_tables.sql` | create_game_config_tables | v2.0.0 | 2026-04-30 | 创建参数配置管理系统表 | 4个配置管理表 |
| 15 | `20260430000003_create_batch_tables.sql` | create_batch_tables | v2.0.0 | 2026-04-30 | 创建批量操作功能表 | 3个批量操作表 |
| 16 | `20260430000004_create_alert_tables.sql` | create_alert_tables | v2.0.0 | 2026-04-30 | 创建预警推送系统表 | 4个预警管理表 |
| 17 | `20260506000000_create_game_event_tables.sql` | create_game_event_tables | v2.0.0 | 2026-05-06 | 创建游戏活动管理系统表 | 5个活动系统表 |
| 18 | `20260512000000_performance_optimization_indexes.sql` | performance_optimization_indexes | v2.0.0 | 2026-05-12 | 性能优化索引 | 多表索引优化 |
| 19 | `20260522000000_add_game_event_short_term_optimization.sql` | add_game_event_short_term_optimization | v2.0.0 | 2026-05-22 | 活动系统短期优化 | 4个活动优化表 |
| 20 | `20260522000001_add_game_event_medium_term.sql` | add_game_event_medium_term | v2.0.0 | 2026-05-22 | 活动系统中期优化 | 4个模板/定时任务表 |
| 21 | `20260523000000_migrate_system_config_to_game_config.sql` | migrate_system_config_to_game_config | v2.0.0 | 2026-05-23 | 配置系统迁移 | system_config→game_config迁移 |
| 22 | `20260525000000_add_currency_config_fields.sql` | add_currency_config_fields | v2.0.0 | 2026-05-25 | 多货币支持 | 货币配置及宝石币字段 |
| 23 | `20260524000000_add_item_system_configs.sql` | add_item_system_configs | v2.0.0 | 2026-05-24 | 道具系统配置 | game_config道具配置项 |

---

## 五、各迁移详细信息

### 迁移 1: add_refresh_tokens_table

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-18 |
| **描述** | 添加JWT刷新令牌表，用于管理用户登录会话的刷新令牌 |
| **影响范围** | 新增 `refresh_tokens` 表 |
| **回滚操作** | `DROP TABLE IF EXISTS refresh_tokens;` |
| **依赖** | `sys_login.sql`（用户表） |
| **表字段** | id, user_id, token, expires_at, created_at, revoked_at, ip_address, user_agent |
| **索引** | idx_refresh_tokens_user_id, idx_refresh_tokens_token, idx_refresh_tokens_expires_at |

### 迁移 2: add_password_reset_tokens_table

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-18 |
| **描述** | 添加密码重置令牌表，支持用户通过邮件/验证码重置密码 |
| **影响范围** | 新增 `password_reset_tokens` 表 |
| **回滚操作** | `DROP TABLE IF EXISTS password_reset_tokens;` |
| **依赖** | `sys_login.sql`（用户表） |
| **表字段** | id, user_id, token, expires_at, created_at, used_at, ip_address |
| **索引** | idx_password_reset_tokens_user_id, idx_password_reset_tokens_token, idx_password_reset_tokens_expires_at |

### 迁移 3: add_indexes

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-18 |
| **描述** | 为 `sys_user` 表添加用户名、邮箱和激活状态的查询索引，优化登录和用户管理性能 |
| **影响范围** | `sys_user` 表新增 3 个索引 |
| **回滚操作** | `DROP INDEX IF EXISTS idx_sys_user_username; DROP INDEX IF EXISTS idx_sys_user_email; DROP INDEX IF EXISTS idx_sys_user_is_active;` |
| **依赖** | `17_sys_login.sql` |
| **索引** | idx_sys_user_username, idx_sys_user_email, idx_sys_user_is_active |

### 迁移 4: add_audit_logs_table

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-19 |
| **描述** | 添加操作审计日志表，用于记录系统所有关键操作，支持数据追踪和安全审计 |
| **影响范围** | 新增 `audit_logs` 表及其索引 |
| **回滚操作** | `DROP TABLE IF EXISTS audit_logs;` |
| **依赖** | `sys_login.sql`（用户表） |
| **表字段** | id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, request_id, created_at, status |
| **索引** | idx_audit_logs_user_id, idx_audit_logs_action, idx_audit_logs_created_at, idx_audit_logs_request_id |

### 迁移 5: add_user_devices_table

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-19 |
| **描述** | 添加用户设备管理表，用于记录用户登录的设备信息，支持设备管理和安全控制 |
| **影响范围** | 新增 `user_devices` 表及其索引 |
| **回滚操作** | `DROP TABLE IF EXISTS user_devices;` |
| **依赖** | `sys_login.sql`（用户表） |
| **表字段** | id, user_id, device_id, device_name, device_type, browser, os, ip_address, last_active_at, created_at, is_revoked, revoked_at |
| **索引** | idx_user_devices_user_id, idx_user_devices_device_id, idx_user_devices_last_active |

### 迁移 6: add_item_effect_fields

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-21 |
| **描述** | 为 `player_land_status` 表添加增产、加速道具效果字段 |
| **影响范围** | `player_land_status` 表新增 3 个字段 |
| **回滚操作** | `ALTER TABLE player_land_status DROP COLUMN IF EXISTS yield_boost, DROP COLUMN IF EXISTS speed_boost, DROP COLUMN IF EXISTS speed_boost_end_time;` |
| **依赖** | `15_player_land_status.sql` |
| **新增字段** | yield_boost (DECIMAL), speed_boost (DECIMAL), speed_boost_end_time (TIMESTAMP) |

### 迁移 7: add_avatar_field

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-24 |
| **描述** | 为 `player_base` 表添加玩家头像字段，支持 Emoji 表情头像 |
| **影响范围** | `player_base` 表新增 1 个字段 |
| **回滚操作** | `ALTER TABLE player_base DROP COLUMN IF EXISTS avatar;` |
| **依赖** | `11_player_base.sql` |
| **新增字段** | avatar (VARCHAR(50), DEFAULT '') |

### 迁移 8: add_farm_world_exp_fields

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-24 |
| **描述** | 为 `player_base` 表添加农场经验和世界经验字段，支撑双经验系统 |
| **影响范围** | `player_base` 表新增 2 个字段 |
| **回滚操作** | `ALTER TABLE player_base DROP COLUMN IF EXISTS farm_exp, DROP COLUMN IF EXISTS world_exp;` |
| **依赖** | `11_player_base.sql` |
| **新增字段** | farm_exp (BIGINT, DEFAULT 0), world_exp (BIGINT, DEFAULT 0) |

### 迁移 9: add_crop_yield_range_and_exp_fields

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-25 |
| **描述** | 为 `crop` 表添加产量范围字段和三种等级（玩家/农场/世界）经验值字段 |
| **影响范围** | `crop` 表新增 5 个字段 |
| **回滚操作** | `ALTER TABLE crop DROP COLUMN...`（5个字段） |
| **依赖** | `07_crop.sql` |
| **新增字段** | min_yield, max_yield, player_exp_base, farm_exp_base, world_exp_base |

### 迁移 10: create_game_activity_log_table

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-26 |
| **描述** | 创建游戏活动日志表，记录玩家在游戏中的所有关键操作 |
| **影响范围** | 新增 `game_activity_log` 表及其索引 |
| **回滚操作** | `DROP TABLE IF EXISTS game_activity_log;` |
| **依赖** | `11_player_base.sql`（玩家表） |
| **表字段** | id, player_id, activity_type, activity_category, message, metadata, create_time |
| **索引** | idx_game_activity_player_id, idx_game_activity_type, idx_game_activity_category, idx_game_activity_create_time |

### 迁移 11: create_achievement_tables

| 项目 | 内容 |
|------|------|
| **日期** | 2026-03-27 |
| **描述** | 创建成就系统表，包含成就定义、玩家进度和解锁日志，含13条初始成就数据 |
| **影响范围** | 新增 3 个成就相关表 |
| **回滚操作** | `DROP TABLE IF EXISTS achievement_unlock_log; DROP TABLE IF EXISTS player_achievement; DROP TABLE IF EXISTS achievement_definition;` |
| **依赖** | `11_player_base.sql`（玩家表） |
| **表清单** | achievement_definition (13条数据), player_achievement, achievement_unlock_log |

### 迁移 12: create_rbac_tables

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-30 |
| **描述** | 创建RBAC权限管理系统，实现角色权限精细化管理，含4个初始角色和19个初始权限 |
| **影响范围** | 新增 6 个权限管理表 |
| **回滚操作** | `DROP TABLE`（6个表逆序删除） |
| **依赖** | `17_sys_login.sql`（系统用户表） |
| **表清单** | admin_role, admin_permission, role_permission, user_role, data_permission, permission_audit_log |

### 迁移 13: create_announcement_tables

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-30 |
| **描述** | 创建游戏公告发布系统，支持分类、优先级、定时发布、阅读记录、草稿自动保存等功能 |
| **影响范围** | 新增 4 个公告相关表 |
| **回滚操作** | `DROP TABLE`（4个表逆序删除） |
| **依赖** | `17_sys_login.sql`（用户表） |
| **表清单** | announcement (2条示例), announcement_read, announcement_category (5条), announcement_draft |

### 迁移 14: create_game_config_tables

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-30 |
| **描述** | 创建游戏参数配置管理系统，支持多类型配置、版本管理、审批流程和变更日志 |
| **影响范围** | 新增 4 个配置管理表 |
| **回滚操作** | `DROP TABLE`（4个表逆序删除） |
| **依赖** | `29_admin_system.sql`（管理员表） |
| **表清单** | game_config (19条初始配置), config_version, config_approval, config_change_log |

### 迁移 15: create_batch_tables

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-30 |
| **描述** | 创建批量操作功能表，支持批量操作记录、详情追踪和文件管理 |
| **影响范围** | 新增 3 个批量操作表 |
| **回滚操作** | `DROP TABLE`（3个表逆序删除） |
| **依赖** | `29_admin_system.sql`（管理员表） |
| **表清单** | batch_operation, batch_operation_detail, batch_file |

### 迁移 16: create_alert_tables

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-30 |
| **描述** | 创建实时预警推送系统，支持预警规则配置、记录追踪、推送日志和WebSocket连接管理 |
| **影响范围** | 新增 4 个预警管理表 |
| **回滚操作** | `DROP TABLE`（4个表逆序删除） |
| **依赖** | `29_admin_system.sql`（管理员表） |
| **表清单** | alert_rule (5条初始规则), alert_record, alert_push_log, ws_connection |

### 迁移 17: create_game_event_tables

| 项目 | 内容 |
|------|------|
| **日期** | 2026-05-06 |
| **描述** | 创建游戏活动管理系统，支持活动模板、活动管理、任务配置、玩家进度追踪和奖励记录 |
| **影响范围** | 新增 5 个活动系统表 |
| **回滚操作** | `DROP TABLE`（5个表逆序删除） |
| **依赖** | `33_game_event_system.sql` |
| **表清单** | game_event_templates, game_events, game_event_tasks, player_event_progress, game_event_rewards |

### 迁移 18: performance_optimization_indexes

| 项目 | 内容 |
|------|------|
| **日期** | 2026-05-12 |
| **描述** | 性能优化——为多个业务表添加复合索引和覆盖索引，大幅提升查询性能 |
| **影响范围** | 玩家作物表、活动日志、公告、审计日志、玩家基础、游戏事件、刷新令牌等表新增索引 |
| **回滚操作** | 多个 `DROP INDEX` 操作（需逐条回滚） |
| **依赖** | 所有已创建的业务表 |

### 迁移 19: add_game_event_short_term_optimization

| 项目 | 内容 |
|------|------|
| **日期** | 2026-05-22 |
| **描述** | 游戏活动系统短期优化——添加触发器表、执行日志、活动统计和漏斗分析表 |
| **影响范围** | 新增 4 个活动优化表 |
| **回滚操作** | `DROP TABLE`（4个表逆序删除） |
| **依赖** | `33_game_event_system.sql` |
| **表清单** | game_event_triggers, game_event_trigger_logs, game_event_stats, game_event_funnel |

### 迁移 20: add_game_event_medium_term

| 项目 | 内容 |
|------|------|
| **日期** | 2026-05-22 |
| **描述** | 游戏活动系统中期优化——活动模板版本管理、模板变量、定时任务调度和执行日志 |
| **影响范围** | `game_event_templates` 表增强，新增 4 个表 |
| **回滚操作** | `DROP TABLE`（4个表逆序删除） |
| **依赖** | `33_game_event_system.sql` |
| **表清单** | game_event_template_versions, game_event_template_variables, game_event_scheduled_tasks, game_event_task_logs |

### 迁移 21: migrate_system_config_to_game_config

| 项目 | 内容 |
|------|------|
| **日期** | 2026-05-23 |
| **描述** | 将 `system_config` 表的配置数据迁移到统一的 `game_config` 表，废弃旧表。新增 SITE/SECURITY/CACHE/NOTIFICATION/PERFORMANCE 等分类 |
| **影响范围** | 新增 18 条 game_config 配置项；system_config 重命名为 system_config_legacy |
| **回滚操作** | 逆向重命名表，删除新增配置 |
| **依赖** | `31_game_config_system.sql` |

### 迁移 22: add_currency_config_fields

| 项目 | 内容 |
|------|------|
| **日期** | 2026-05-25 |
| **描述** | 为 `currency_config` 表添加多货币支持字段（currency_code, is_active, format_rules），为 `player_currency` 表添加宝石币系统（gem_num, gem_total_earn, gem_total_spend） |
| **影响范围** | currency_config 表新增 3 个字段，player_currency 表新增 3 个字段，1 个新索引 |
| **回滚操作** | `ALTER TABLE...DROP COLUMN`（6个字段） |
| **依赖** | `08_currency_config.sql`, `12_player_currency.sql` |

### 迁移 23: add_item_system_configs

| 项目 | 内容 |
|------|------|
| **日期** | 2026-05-24 |
| **描述** | 添加道具系统相关配置项到 `game_config` 表，包括金币袋、农场手册、世界之书、体力药水、丰收之神、幸运种子等道具的数值配置 |
| **影响范围** | `game_config` 表新增 12 条道具系统配置项 |
| **回滚操作** | `DELETE FROM game_config WHERE key IN (道具相关keys);` |
| **依赖** | `31_game_config_system.sql` |

---

## 六、版本对应关系

| 项目版本 | 包含迁移 | 迁移数 |
|----------|----------|--------|
| v1.0.0 → v1.1.0 | 迁移 1-5 | 5 |
| v1.1.0 → v1.2.0 | 迁移 6-11 | 6 |
| v2.0.0 | 迁移 12-23 | 12 |

---

## 七、维护说明

1. **新增迁移**：在 `sql_init/archive/migrations/` 下按时间戳格式创建新文件，更新本文档
2. **回滚操作**：参考文件头中的"回滚操作"字段，按时间戳降序执行
3. **版本号**：迁移文件版本号应与项目主版本号保持一致

---

> *文档最后更新: 2026-05-26*