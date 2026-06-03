/**
 * 文件名：README.md
 * 作者：TraeAI、xuanyukk
 * 日期：2026-06-01
 * 版本：v4.71.6
 * 功能描述：开心农场数据库初始化说明文档
 * 更新记录：
 *   2026-05-26 - v4.63.0 - 配置变更日志增强与回滚机制
 *   2026-06-01 - v4.71.6 - 同步最新版本，更新表数量统计
 */

# 开心农场数据库初始化

### 📋 配置变更日志增强与回滚机制
**更新日期**：2026-05-26  
**更新内容**：
- **新增**：配置变更日志增强表（34_config_change_log.sql）
- **增强**：支持字段级diff、版本对比、完整回滚预览
- **优化**：使用JSONB存储变更数据，支持changed_fields追踪
- **完善**：操作人员、IP地址、变更原因完整记录

## 最新更新 (v4.71.6)

### 📋 文档同步与一致性修复
**更新日期**：2026-05-25  
**更新内容**：
- **版本同步**：所有文件版本号统一至 v4.71.6
- **表数量统一**：确认表总数为 84 张（核心表 + 数据仓库表 + 游戏活动表）
- **端口说明修正**：明确区分本地开发（3001）与 Docker（3000）后端端口
- **文档引用修正**：修复多处文件名引用错误和过时的配置说明

## 最新更新 (v4.53.0)

### 📋 移除旧版 system_config 表，统一使用 game_config
**更新日期**：2026-05-23  
**更新内容**：
- **移除旧版 system_config 表**：
  - 将 02_system_config.sql 和 13_system_config_data.sql 归档到 archive/old_schema/ 和 archive/old_data/
  - 更新所有初始化脚本，移除对 system_config 的引用
  - 统一使用 game_config 作为配置系统
  - game_config 已包含完整的配置分类（PLAYER、FARM、ECONOMY、SITE、SECURITY、CACHE、NOTIFICATION、PERFORMANCE）
- **版本同步更新**：
  - 更新所有相关文件的版本号至v4.53.0

## 最新更新 (v4.51.0)

### 📋 游戏活动系统全面升级与表数量统计更新
**更新日期**：2026-05-23  
**更新内容**：
- **数据库表数量统一更新**：
  - 更新表总数为84张（完整统计）
  - 游戏活动系统表已扩展至13张（基础表+短期优化+中期规划）
  - 更新所有相关文件的版本号至v4.51.0
  - 更新执行顺序说明.md中的验证SQL和表数量描述
  - 更新数据库检查报告.md
  - 更新full_init.sql和docker_init.sql中的完成提示
- **游戏活动系统完整实现**：
  - 短期优化：活动触发器、活动统计系统
  - 中期规划：活动模板系统、定时任务系统
  - 长期愿景：3-5年技术发展规划文档

## 最新更新 (v4.50.0)

### 📋 数据库数据完整性修复与文档系统全面升级
**更新日期：2026-05-22**  
**更新内容：**
- **数据库数据完整性修复：
  - 补全世界等级数据，完整1-100级配置，解决作物表外键引用问题
  - 修正作物解锁描述，统一为"世界等级X解锁"，与实际游戏逻辑一致
  - 修复full_init.sql，添加缺失的3个数据文件（13_system_config_data.sql、14_admin_system_data.sql、15_game_event_data.sql），与docker_init.sql保持一致
  - 更新所有SQL文件版本统一至v4.50.0
  - 更新执行顺序说明.md，完整列出所有33个表结构和15个数据文件

### 📋 文档系统全面升级与优化完成
**更新日期：2026-05-21**  
**更新内容：**
- 完成docs-website文档网站整合，新增TypeScript迁移指南、数据库迁移管理、性能基准测试等技术文档
- 新增docs-website/.vitepress/config.mjs配置文件，完善文档导航
- 更新所有文档版本统一至v4.50.0
- 完善frontend/README.md和新增backend/README.md详细文档
- 更新项目状态为所有优化工作全部完成
- 完成打包与静态资源优化
- 完成路由与组件优化（keep-alive缓存、响应式优化）
- 完整文档交叉引用系统建立

## 最新更新 (v4.49.0)

### 📋 路由与组件优化完成
**更新日期：2026-05-20**  
**更新内容：**
- 完成路由懒加载完善
- 实现keep-alive缓存优化
- 响应式优化（shallowRef/shallowReactive使用）
- 虚拟滚动优化
- 图片懒加载完善
- 所有文档版本更新至v4.49.0

## 最新更新 (v4.48.0)

### 📋 所有阶段优化全部完成
**更新日期：2026-05-20**  
**更新内容：**
- 完成第一阶段、第二阶段、第三阶段全部优化工作
- 性能优化全面升级
- 文档系统全面优化
- 所有文档版本更新至v4.48.0
- 项目状态更新为所有优化工作全部完成

## 最新更新 (v4.47.0)

### 📋 核心指标监控面板完成
**更新日期：2026-05-20**  
**更新内容：**
- 完成核心指标监控面板（Grafana业务指标面板 + Loki + Promtail）
- 完善docker-compose.yml监控栈（v1.3.0）
- 第一阶段优化全部完成
- 更新项目完成情况报告至v4.47.0
- 更新项目全面优化实施方案至v1.1.0

## 最新更新 (v4.46.0)

### 📋 项目全面优化实施方案
**更新日期：2026-05-19**  
**更新内容：**
- 新增项目全面优化实施方案文档（v4.46.0）
- 完成API限流中间件开发
- 完成JWT优化（双令牌体系）
- 完成数据库迁移管理系统
- 完成性能基准测试框架
- 完成缓存失效策略文档
- 完成TypeScript迁移指南
- 更新所有文档版本至v4.46.0

## 最新更新 (v4.44.0)

### 📋 业务指标监控系统完成
**更新日期：2026-05-18**  
**更新内容：**
- 新增业务指标监控系统（7个API端点）
- 新增实时指标查询、趋势分析、异常检测等功能
- 完成数据库查询优化
- 新增数据初始化脚本
- 更新项目完成情况报告至v4.44.0
- 更新所有相关文档

## 最新更新 (v4.29.1)

### 📋 核心代码与日志系统优化
**更新日期：2026-05-15**  
**更新内容：**
- 修复 `itemService.js` 中引用不存在的 `gameConfigService` 问题
- 替换为正确的 `configService` 引用
- `configService.js` 新增便捷方法 `getConfig()` 支持多类型转换、默认值和验证器
- 修复后端 `logger.js` 同时支持默认导出和命名导出
- 修复前端 `logger.js` 新增命名导出支持
- 完整技术变更已创建文档记录

## 最新更新 (v4.0.0)

### 📋 数据库管理工具重大升级
**更新日期：2026-05-14**  
**更新内容：**
- Node.js 版 `db_manager.js` 升级至 v4.0.0
  - 扩展至 8 种操作模式（完整重置、创建数据库、创建表结构、导入数据、清空数据、备份、恢复、查看状态）
  - 新增备份恢复功能（使用 pg_dump 和 psql）
  - 新增命令行参数支持（--mode, --file, --force, --verbose, --help）
  - 增强的错误处理和用户提示
- 新增 Python 版 `db_manager.py`（v1.0.0）
  - 完整的功能，与 Node.js 版完全一致
  - 面向对象设计（DatabaseManager 类）
  - 清晰的代码结构，易于扩展
- 新增 Python 依赖文件 `requirements.txt`
- 新增详细使用文档 `docs/数据库管理工具-Python版使用指南.md`
- 保持 .env 配置方式不变

## 最新更新 (v3.1.0)

### 📋 环境变量配置整合完成
**更新日期：2026-05-14**  
**更新内容：**
- 将数据库管理相关配置整合到后端环境变量文件中
- 删除了 sql_init/.env.example 文件
- 数据库管理脚本现在会从 backend/.env 中读取配置
- 更新了所有相关文档以反映新的配置方式

## 最新更新 (v3.0.0)

### 📋 数据库系统重构完成
**更新日期**：2026-05-14  
**更新内容**：
- docker_init.sql 重构为轻量级引导脚本（从2700+行缩减到约90行）
- full_init.sql 重构为轻量级引导脚本
- 新增 db_manager.js 交互式数据库管理脚本
- 新增 数据库检查报告.md 文件完整性检查报告
- 使用 `\i` 命令引用模块化SQL文件，保持可维护性
- 提供3种数据库初始化方式：Node.js脚本、Docker引导脚本、交互式管理

## 最新更新 (v2.7.0)

### 📋 游戏活动管理系统 + 性能优化完成
**更新日期**：2026-05-12  
**更新内容**：
- 新增游戏活动管理系统（5张表：活动模板、活动、任务、进度、奖励）
- 新增10+性能优化索引，覆盖核心查询场景
- 缓存系统全面升级（预热、击穿/穿透防护）
- 玩家作物解锁查询优化
- 游戏活动日志查询优化
- 公告系统查询优化
- 审计日志查询优化
- 玩家排行查询优化
- 刷新令牌管理优化
- 双因素认证查询优化
- 完整单文件初始化脚本更新至47张表

---

## 最新更新 (v2.6.0)

### 📋 数据仓库与BI分析系统完成
**更新日期**：2026-05-10  
**更新内容**：
- 新增数据仓库表（8张表：维度表+事实表）
- 新增BI分析视图（4个聚合视图）
- 完整单文件初始化脚本更新至42张表
- Docker专用初始化脚本同步更新
- Node.js脚本更新支持数据仓库表
- 更新所有文档和版本信息

---

## 最新更新 (v2.5.0)

### 📋 数据库初始化标准化完成
**整理日期**：2026-05-10  
**整理内容**：
- 创建完整的单文件初始化脚本（full_init.sql）
- 创建Docker专用初始化脚本（docker_init.sql）
- 去除重复定义和冗余数据
- 确保执行顺序符合依赖关系
- 保留原有目录结构供参考

---

## 最新更新 (v2.4.1)

### 📋 项目整理完成
**整理日期**：2026-05-01  
**整理内容**：
- 重新组织目录结构，按执行顺序分类
- 为所有SQL文件添加标准文件头注释
- 创建详细的执行顺序说明文档
- 更新 init_db.js 以支持新结构
- 归档旧文件

---

## 目录结构

### 新结构 (v4.53.0+)
```
sql_init/
├── 01_database/             # 数据库创建脚本（第一阶段）
│   └── 01_create_database.sql
├── 02_schema/               # 表结构创建脚本（第二阶段，按依赖顺序）
│   ├── 01_functions.sql
│   ├── 03_world_level.sql
│   ├── 04_farm_level.sql
│   ├── 05_land_quality.sql
│   ├── 06_farm_land.sql
│   ├── 07_crop.sql
│   ├── 08_currency_config.sql
│   ├── 09_item_config.sql
│   ├── 10_shop_goods.sql
│   ├── 11_player_base.sql
│   ├── 12_player_currency.sql
│   ├── 13_player_currency_log.sql
│   ├── 14_player_inventory.sql
│   ├── 15_player_land_status.sql
│   ├── 16_player_crop_unlock.sql
│   ├── 17_sys_login.sql
│   ├── 18_refresh_tokens.sql
│   ├── 19_password_reset_tokens.sql
│   ├── 20_user_devices.sql
│   ├── 21_two_factor_auth.sql
│   ├── 22_audit_logs.sql
│   ├── 23_game_activity_log.sql
│   ├── 24_monitoring_tables.sql
│   ├── 25_monitoring_procedures.sql
│   ├── 26_emergency_procedures.sql
│   ├── 27_optimization.sql
│   ├── 28_achievement_system.sql
│   ├── 29_admin_system.sql
│   ├── 30_announcement_system.sql
│   ├── 31_game_config_system.sql
│   ├── 32_data_warehouse.sql
│   ├── 33_game_event_system.sql
│   └── 34_config_change_log.sql
├── 03_data/                # 初始数据插入脚本（第三阶段）
│   ├── 01_world_level_data.sql
│   ├── 02_farm_level_data.sql
│   ├── 03_land_quality_data.sql
│   ├── 04_farm_land_data.sql
│   ├── 05_crop_data.sql
│   ├── 06_currency_config_data.sql
│   ├── 07_item_config_data.sql
│   ├── 08_shop_goods_data.sql
│   ├── 09_sys_login_data.sql
│   ├── 10_achievement_data.sql
│   ├── 11_announcement_data.sql
│   ├── 12_game_config_data.sql
│   ├── 14_admin_system_data.sql
│   └── 15_game_event_data.sql
├── 04_extensions/          # 扩展启用脚本
│   └── 01_enable_pgcrypto.sql
├── archive/                # 归档文件
│   ├── migrations/         # 历史迁移脚本
│   ├── old_schema/         # 旧版本表结构
│   └── old_data/          # 旧版本数据
├── full_init.sql           # 完整的轻量级引导脚本（推荐使用）
├── docker_init.sql         # Docker容器专用轻量级引导脚本
├── init_db.js              # 统一的数据库初始化脚本（Node.js）
├──| db_manager.js           | 交互式数据库管理脚本（Node.js 版，v4.60.0，推荐） |
├── db_manager.py           | 交互式数据库管理脚本（Python 版，v4.60.0，新增） |
├── requirements.txt         # Python 依赖文件（新增）
├── 数据库检查报告.md        # 数据库文件完整性检查报告
├── 执行顺序说明.md         # 详细执行顺序和依赖关系说明
└── README.md                  # 本说明文档
```

### 目录说明

#### 01_database/ - 数据库创建
| 文件 | 说明 |
|------|------|
| 01_create_database.sql | 创建 `happy_farm` 数据库的脚本，需要在 postgres 数据库中执行 |

#### 02_schema/ - 表结构定义（33个文件）
这些文件按依赖关系编号，必须按顺序执行：

| 文件编号 | 文件名 | 说明 | 依赖 |
|---------|-------|------|------|
| 01 | functions.sql | 通用函数定义，包括 `update_updated_at_column()` 触发器函数 | 无 |
| 02 | world_level.sql | 世界等级公共配置表 | 01_functions.sql |
| 04 | farm_level.sql | 农场等级公共配置表 | 01_functions.sql |
| 05 | land_quality.sql | 地块品质公共配置表 | 01_functions.sql |
| 06 | farm_land.sql | 公共地块配置表 | 01_functions.sql |
| 07 | crop.sql | 作物公共配置表（含产量范围和经验值） | 01_functions.sql |
| 08 | currency_config.sql | 货币体系公共配置表 | 01_functions.sql |
| 09 | item_config.sql | 道具公共配置表 | 01_functions.sql |
| 10 | shop_goods.sql | 商店公共配置表 | 01_functions.sql |
| 11 | player_base.sql | 玩家基础信息表 | 01_functions.sql, 03_world_level.sql, 04_farm_level.sql |
| 12 | player_currency.sql | 玩家货币表 | 01_functions.sql, 08_currency_config.sql, 11_player_base.sql |
| 13 | player_currency_log.sql | 玩家货币交易记录表 | 01_functions.sql, 12_player_currency.sql |
| 14 | player_inventory.sql | 玩家库存表 | 01_functions.sql, 09_item_config.sql, 11_player_base.sql |
| 15 | player_land_status.sql | 玩家地块状态表 | 01_functions.sql, 05_land_quality.sql, 06_farm_land.sql, 11_player_base.sql |
| 16 | player_crop_unlock.sql | 玩家作物解锁表 | 01_functions.sql, 07_crop.sql, 11_player_base.sql |
| 17 | sys_login.sql | 登录系统表（用户、角色、权限） | 01_functions.sql |
| 18 | refresh_tokens.sql | JWT刷新令牌表 | 01_functions.sql, 17_sys_login.sql |
| 19 | password_reset_tokens.sql | 密码重置令牌表 | 01_functions.sql, 17_sys_login.sql |
| 20 | user_devices.sql | 用户设备管理表 | 01_functions.sql, 17_sys_login.sql |
| 21 | two_factor_auth.sql | 双因素认证表 | 01_functions.sql, 17_sys_login.sql |
| 22 | audit_logs.sql | 操作审计日志表 | 01_functions.sql, 17_sys_login.sql |
| 23 | game_activity_log.sql | 游戏活动日志表 | 01_functions.sql, 11_player_base.sql |
| 24 | monitoring_tables.sql | 监控和预警相关表 | 01_functions.sql |
| 25 | monitoring_procedures.sql | 监控和对账存储过程 | 24_monitoring_tables.sql |
| 26 | emergency_procedures.sql | 紧急调控存储过程 | 24_monitoring_tables.sql |
| 27 | optimization.sql | 性能优化和约束增强 | 所有前面的表 |
| 28 | achievement_system.sql | 成就系统表 | 01_functions.sql, 11_player_base.sql |
| 29 | admin_system.sql | 管理员系统表 | 01_functions.sql, 17_sys_login.sql |
| 30 | announcement_system.sql | 公告系统表 | 01_functions.sql, 17_sys_login.sql |
| 31 | game_config_system.sql | 游戏参数配置系统表 | 01_functions.sql, 29_admin_system.sql |
| 32 | data_warehouse.sql | 数据仓库表（BI分析：维度表、事实表、聚合视图） | 01_functions.sql, 07_crop.sql, 11_player_base.sql, 12_player_currency.sql |
| 33 | game_event_system.sql | 游戏事件系统表 | 01_functions.sql, 11_player_base.sql, 17_sys_login.sql |
| 34 | config_change_log.sql | 配置变更日志增强表（字段级diff、版本对比、回滚） | 01_functions.sql, 31_game_config_system.sql, 29_admin_system.sql |

#### 03_data/ - 初始数据（14个文件）
这些文件按依赖关系编号，必须按顺序执行：

| 文件编号 | 文件名 | 说明 | 依赖表 |
|---------|-------|------|---------|
| 01 | world_level_data.sql | 世界等级配置数据 | world_level |
| 02 | farm_level_data.sql | 农场等级配置数据 | farm_level |
| 03 | land_quality_data.sql | 地块品质配置数据 | land_quality |
| 04 | farm_land_data.sql | 公共地块配置数据 | farm_land |
| 05 | crop_data.sql | 作物配置数据（24种作物） | crop |
| 06 | currency_config_data.sql | 货币体系配置数据 | currency_config |
| 07 | item_config_data.sql | 道具配置数据 | item_config |
| 08 | shop_goods_data.sql | 商店商品数据 | shop_goods |
| 09 | sys_login_data.sql | 登录系统数据（admin、test_user用户） | sys_user, sys_role, sys_permission |
| 10 | achievement_data.sql | 成就系统数据 | achievement_definition |
| 11 | announcement_data.sql | 公告系统数据 | announcement, announcement_category |
| 12 | game_config_data.sql | 游戏配置系统数据 | game_config |
| 13 | admin_system_data.sql | 管理员系统数据 | admin_system |
| 14 | game_event_data.sql | 游戏事件数据 | game_event_system |

#### 04_extensions/ - 扩展启用
| 文件 | 说明 |
|------|------|
| 01_enable_pgcrypto.sql | 启用 pgcrypto 扩展，用于密码加密 |

#### archive/ - 归档文件
| 目录 | 说明 |
|------|------|
| migrations/ | 历史迁移脚本，已整合到新结构中，保留用于参考 |
| old_schema/ | 旧版本的表结构文件 |
| old_data/ | 旧版本的初始数据文件 |

#### 根目录文件
| 文件 | 说明 |
|------|------|
| full_init.sql | 完整的单文件初始化脚本（推荐使用），包含所有表结构、数据和索引 |
| docker_init.sql | Docker容器专用初始化脚本，去除了数据库创建部分 |
| init_db.js | Node.js 数据库初始化脚本，自动化执行整个流程 |
| 执行顺序说明.md | 详细的 SQL 执行顺序和依赖关系文档 |
| README.md | 本说明文档 |

## 核心功能特性

### 1. 玩家等级系统
- 玩家等级、农场等级、世界等级三等级体系
- 完整的经验值计算和升级机制
- 各等级独立的经验值字段

### 2. 作物产量系统
- 作物产量范围（min_yield, max_yield）
- 三种等级独立的基础经验值
- 随机产量生成机制

### 3. JWT认证系统
- refresh_tokens表：存储刷新令牌
- password_reset_tokens表：密码重置令牌
- user_devices表：用户设备管理

### 4. 日志系统
- audit_logs：操作审计日志
- game_activity_log：游戏活动日志
- 完整的索引和查询优化

### 5. 数据仓库与BI分析系统（v2.6.0新增）
- 维度表：dim_date（日期维度）、dim_player（玩家维度）、dim_crop（作物维度）
- 事实表：fact_daily_active_players（DAU）、fact_daily_transactions（交易）、fact_crop_planting（种植）、fact_daily_revenue（收入）
- 聚合视图：v_dau_stats、v_crop_stats、v_revenue_stats、v_retention_analysis
- 支持完整的BI分析和数据统计

## 快速开始

### 方式一：使用交互式管理脚本（推荐，最灵活）

#### Node.js 版（v4.0.0）
```bash
cd sql_init
npm install pg
node db_manager.js
```
提供 8 种操作模式：完整重置、创建数据库、创建表结构、导入数据、清空数据、备份、恢复、查看状态

#### Python 版（v1.0.0，新增）
```bash
cd sql_init
pip install -r requirements.txt
python db_manager.py
```
功能与 Node.js 版完全一致，提供面向对象的代码结构，适合 Python 开发者

---

### 方式二：使用 Node.js 初始化脚本
```bash
cd sql_init
npm install pg
node init_db.js
```

---

### 方式三：使用轻量级 SQL 引导脚本

#### 1. 在本地 PostgreSQL 中执行
```bash
# 1. 连接到 postgres 数据库，创建数据库
psql -U postgres -d postgres -f 01_database/01_create_database.sql

# 2. 在 happy_farm 数据库中执行完整初始化
psql -U postgres -d happy_farm -f full_init.sql
```

#### 2. 在 Docker 中使用
直接使用 `docker_init.sql` 脚本，会在容器启动时自动执行。

---

### 方式四：手动执行 SQL（分文件）
详细步骤请查看 [执行顺序说明.md](./执行顺序说明.md)

---

## 使用方法

### 前提条件
- 已安装 PostgreSQL 数据库（推荐版本 13+）
- 已安装 Node.js 环境

### 配置数据库连接

数据库管理脚本现在会从以下位置按优先级读取配置：
1. `../backend/.env` - 后端环境变量（推荐）
2. `./.env` - 本地环境变量（可选）
3. 硬编码默认值

详细的环境变量配置示例请参考 `../backend/.env.example`（参见后端环境配置文件）

### 执行初始化

```bash
cd sql_init
node init_db.js
```

### 初始化流程

1. **连接数据库** - 连接到PostgreSQL数据库
2. **删除旧表** - 按依赖关系反序删除所有表
3. **删除函数** - 删除所有存储函数
4. **创建表结构** - 按依赖顺序创建所有表
5. **插入初始数据** - 导入公共配置数据
6. **验证完整性** - 检查数据是否完整导入

### 测试账户

初始化完成后，可以使用以下测试账户：

- **管理员账户**：
  - 用户名：`admin`
  - 密码：`123456`

- **普通用户账户**：
  - 用户名：`test_user`
  - 密码：`123456`

## 详细初始化步骤

### 步骤一：环境准备

#### 1.1 检查 PostgreSQL 版本
确保 PostgreSQL 版本 >= 13：
```bash
psql --version
```

#### 1.2 检查数据库连接
确保可以连接到 PostgreSQL：
```bash
psql -U postgres -h localhost -p 5432
```

### 步骤二：数据库创建

#### 2.1 连接到 postgres 数据库
```bash
psql -U postgres -d postgres
```

#### 2.2 执行数据库创建脚本
```bash
psql -U postgres -d postgres -f 01_database/01_create_database.sql
```

#### 2.3 验证数据库创建
```bash
psql -U postgres -d happy_farm -c "\l"
```

### 步骤三：执行完整初始化

#### 3.1 使用单文件脚本（推荐）
```bash
psql -U postgres -d happy_farm -f full_init.sql
```

#### 3.2 使用分文件脚本
按以下顺序执行：
1. `04_extensions/01_enable_pgcrypto.sql`
2. `02_schema/01_functions.sql`
3. `02_schema/02_system_config.sql` 至 `02_schema/33_game_event_system.sql` （注：02_system_config.sql 已归档，从03开始）
4. `03_data/01_world_level_data.sql` 至 `03_data/12_game_config_data.sql`

### 步骤四：验证初始化

#### 4.1 检查表结构
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

#### 4.2 检查初始数据
```sql
-- 检查世界等级数据
SELECT * FROM world_level;

-- 检查作物数据
SELECT crop_id, crop_name, growth_time FROM crop;

-- 检查测试用户
SELECT user_id, username, email FROM sys_user;
```

#### 4.3 测试登录
使用以下账户测试：
- 管理员：`admin` / `123456`
- 测试用户：`test_user` / `123456`

### 配置说明

#### 数据库连接配置
**方式一：通过 init_db.js 配置**
编辑 `init_db.js` 文件：
```javascript
const config = {
    host: 'localhost',           // 数据库主机
    port: 5432,                  // 数据库端口
    user: 'postgres',            // 数据库用户名
    password: 'your_password',   // 数据库密码
    database: 'happy_farm'       // 数据库名称
};
```

**方式二：通过环境变量配置**
创建 `.env` 文件：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=happy_farm
```

#### Docker 环境配置
在 Docker 环境中，使用以下环境变量：
```env
POSTGRES_USER=happy_farm
POSTGRES_PASSWORD=happy_farm_password
POSTGRES_DB=happy_farm
```

### 表结构变更记录

#### v2.7.0 (2026-05-12)
- **新增**：10+性能优化索引
- **优化**：`full_init.sql` 和 `docker_init.sql` 更新至包含完整索引
- **新增**：archive/migrations/019_performance_optimization_indexes.sql

#### v2.6.0 (2026-05-10)
- **新增**：数据仓库表（dim_date, dim_player, dim_crop 等）
- **新增**：BI 分析视图（v_dau_stats, v_crop_stats 等）
- **优化**：`full_init.sql` 和 `docker_init.sql` 更新至包含完整 42 张表

#### v2.5.0 (2026-05-10)
- **新增**：`full_init.sql` - 完整单文件初始化脚本
- **新增**：`docker_init.sql` - Docker 专用初始化脚本
- **优化**：所有表添加 `IF NOT EXISTS` 保证幂等性
- **优化**：数据插入添加 `ON CONFLICT DO NOTHING`

#### v2.4.1 (2026-05-01)
- **重构**：表结构文件按依赖关系重新编号
- **整理**：归档历史迁移脚本至 `archive/migrations/`
- **文档**：添加完整的执行顺序说明

#### v2.0.0 (2026-03-26)
- **新增**：`refresh_tokens` - JWT 刷新令牌表
- **新增**：`password_reset_tokens` - 密码重置令牌表
- **新增**：`user_devices` - 用户设备管理表
- **新增**：`two_factor_auth` - 双因素认证表
- **新增**：`audit_logs` - 审计日志表
- **新增**：`game_activity_log` - 游戏活动日志表
- **优化**：`crop` 表添加产量范围和经验值字段

#### v1.0.0 (2026-03-17)
- **初始**：创建所有基础表结构
- **初始**：插入所有初始配置数据

### 注意事项

1. **备份数据**：执行初始化前请确保已备份现有数据
2. **权限要求**：数据库用户需要有创建表和插入数据的权限
3. **字符编码**：确保数据库使用UTF-8编码
4. **初始化不可逆**：此操作会删除所有现有表和数据
5. **幂等执行**：使用 `full_init.sql` 可重复执行，不会重复创建表和数据
6. **Docker 特定**：Docker 环境中数据库由容器自动创建，只需执行 `docker_init.sql`
7. **密码安全**：生产环境请修改默认密码
8. **连接池**：后端使用连接池，配置最大连接数为25

## 归档说明

`archive/migrations/` 目录包含历史迁移脚本，这些脚本的功能已经整合到 `schema/` 目录的表结构文件中。归档保留用于参考，不再使用。

---

## 单文件初始化脚本说明

### full_init.sql
这是一个完整的、独立的初始化脚本，包含：
- 数据库创建（需在postgres数据库执行）
- 扩展启用（pgcrypto）
- 函数创建
- 所有表结构（69个表：62个核心表+7个数据仓库表）
- 所有初始数据
- 索引创建
- 数据仓库视图创建
- 日期维度数据初始化
- 支持幂等执行（使用 IF NOT EXISTS）

### docker_init.sql
专为Docker环境设计的初始化脚本：
- 移除了数据库创建部分（Docker容器已配置好数据库）
- 保留了其他所有功能
- 包含完整69个表和数据仓库
- 可挂载到 Docker 容器的 `/docker-entrypoint-initdb.d/` 目录自动执行

---

## 版本历史

- **v4.53.0** (2026-05-23)
  - 移除旧版 system_config 表，统一使用 game_config
  - 将 02_system_config.sql 和 13_system_config_data.sql 归档
  - 02_schema/ 减少为 32 个文件，03_data/ 减少为 14 个文件
  - 更新所有初始化脚本和文档
  - 表总数更新为 69 张（62 张核心表 + 7 张数据仓库表）

- **v4.51.0** (2026-05-23)
  - 更新表总数为70张（63张核心表 + 7张数据仓库表）
  - 游戏活动系统表扩展至13张
  - 统一所有相关文件的版本号
  - 更新执行顺序说明和数据库检查报告

- **v4.50.0** (2026-05-22)
  - 数据库数据完整性修复
  - 文档系统全面升级
  - 所有文件版本统一

- **v2.7.0** (2026-05-12)
  - 新增10+性能优化索引
  - 缓存系统全面升级（预热、击穿/穿透防护）
  - 数据库查询全面优化
  - 更新 full_init.sql 和 docker_init.sql 至 v2.7.0
  - 新增迁移脚本 019_performance_optimization_indexes.sql

- **v2.6.0** (2026-05-10)
  - 新增数据仓库表（8张表）
  - 新增BI分析视图（4个视图）
  - 完整初始化脚本更新至42张表
  - 同步更新所有文档和脚本
  - 更新 init_db.js 支持数据仓库

- **v2.5.0** (2026-05-10)
  - 创建完整的单文件初始化脚本 full_init.sql
  - 创建 Docker 专用初始化脚本 docker_init.sql
  - 整理并优化 SQL 文件，去除重复定义
  - 更新 README 文档

- **v2.4.1** (2026-05-01)
  - 重新组织目录结构，按执行顺序分类
  - 为所有SQL文件添加标准文件头注释
  - 创建详细的执行顺序说明文档
  - 更新 init_db.js 以支持新结构
  - 归档旧文件

- **v2.1** (2026-03-27)
  - 优化游戏活动日志表结构
  - 完善数据库初始化流程
  - 更新测试账户信息
  - 优化索引和查询性能

- **v2.0** (2026-03-26)
  - 整合所有表结构到schema目录
  - 统一使用init_db.js作为初始化脚本
  - 添加作物产量范围和三种等级经验值
  - 添加游戏活动日志表
  - 添加JWT相关表
  - 清理冗余文件

- **v1.0** (2026-03-17)
  - 初始版本
