# 数据仓库

## 功能介绍
数据仓库提供完整的 BI 分析功能。

## 主要功能
### 维度表
- 日期维度（dim_date）
- 玩家维度（dim_player）
- 作物维度（dim_crop）

### 事实表
- 日活跃玩家（fact_daily_active）
- 每日交易（fact_daily_transactions）
- 作物种植（fact_crop_planting）
- 每日收入（fact_daily_income）

### 聚合视图
- DAU 统计（view_dau_stats）
- 作物统计（view_crop_stats）
- 收入统计（view_income_stats）
- 留存分析（view_retention_analysis）

### ETL 任务
- 自动数据抽取、转换、加载
- 定时任务调度
- 数据完整性校验
