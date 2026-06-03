# 数据库设计

本文档介绍开心农场项目的数据库设计。

> **v4.60.1 更新**：已完成全面的数据库性能优化（P0/P1/P2共12项修复）。

> **v4.61.0 更新**：实现多货币体系架构，`currency_config` 表新增 `currency_code`、`is_active`、`format_rules` 字段，所有货币上限提升至 999 亿（99,999,999,999）。

## 数据库概述

项目使用 PostgreSQL 作为主要数据库，包含 84 张数据表（核心表 + 数据仓库表）。

## 核心表结构

### 用户相关表
- `players` - 玩家基础信息
- `player_currency` - 玩家货币
- `sys_login` - 登录记录
- `user_devices` - 用户设备

### 农场相关表
- `farm_land` - 地块配置
- `player_land_status` - 玩家地块状态
- `player_crop_unlock` - 作物解锁
- `crops` - 作物配置

### 经济相关表
- `currency_config` - 货币体系公共配置（支持多货币扩展，含格式化规则）
- `player_currency` - 玩家货币
- `player_currency_log` - 货币流水
- `player_inventory` - 玩家背包
- `shop_goods` - 商店商品

### 成就相关表
- `achievements` - 成就配置
- `player_achievements` - 玩家成就进度

### 管理相关表
- `admins` - 管理员
- `roles` - 角色
- `permissions` - 权限
- `audit_logs` - 审计日志

### 数据仓库表
- `dim_date` - 日期维度
- `dim_player` - 玩家维度
- `fact_daily_active` - 日活跃事实
- `fact_daily_transaction` - 日交易事实

## 数据库初始化

项目提供完整的 SQL 初始化脚本，位于 `sql_init/` 目录。

初始化顺序：
1. 创建数据库
2. 执行 schema 脚本
3. 执行 data 脚本
4. 启用扩展

## 相关文档

- [系统架构](./system)
- [多货币体系架构](#多货币体系)

---

## 多货币体系

### 概述

v4.61.0 实现了多货币体系架构，采用策略模式（Strategy Pattern）设计：

- `currency_config` 表存储所有货币类型的配置（名称、符号、上限、格式化规则）
- 后端 `currencyConfigService.js` 提供统一的管理接口
- 支持通过 `CurrencyConfigFactory` 动态注册新的货币类型

### 当前货币类型

| config_id | 货币名称 | 代码 | 符号 | 上限 | 状态 |
|-----------|----------|------|------|------|------|
| 1 | 农场币 | farm_coin | ₣ | 999亿 | 启用 |
| 2 | 农场宝石币 | gem | 💎 | 999,999 | 启用（基础框架） |

### 农场币显示格式化

采用中文"万/亿"单位体系：

| 数值 | 显示结果 |
|------|----------|
| 0 | 0 |
| 1,000 | 1,000 |
| 10,000 | 1万 |
| 1,500,000 | 150万 |
| 120,000,000 | 1.2亿 |
| 99,999,999,999 | 999.9亿 |

### 配置字段说明

`currency_config` 表新增字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `currency_code` | VARCHAR(50) | 货币代码，用于策略模式映射 |
| `is_active` | BOOLEAN | 是否启用该货币类型 |
| `format_rules` | JSONB | 格式化规则（wanThreshold、yiThreshold、decimals、stripTrailingZero） |

### 管理界面

后台管理系统中「货币配置」页面（`/admin/currency-config`）提供可视化配置：
- 各货币类型的数值上限配置
- 货币显示格式化规则配置（阈值、单位、小数位数）
- 货币启用/禁用状态管理
