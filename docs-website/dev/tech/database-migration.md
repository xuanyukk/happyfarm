---
title: 数据库迁移管理指南
description: 开心农场项目数据库变更管理详细指南
---

# 数据库迁移管理指南

::: tip 文档信息
- **版本**: v4.50.0
- **日期**: 2026-05-21
- **项目版本**: v4.50.0
:::

## 概述

本指南详细说明数据库变更的管理流程、迁移脚本编写规范、回滚策略等重要内容。

---

## 一、迁移脚本规范

### 1.1 文件命名约定

所有迁移脚本按以下格式命名：

```
V{版本号}__{描述}.sql
```

示例：
- `V1.0.0__create_users_table.sql`
- `V1.1.0__add_level_column.sql`

### 1.2 脚本结构

每个迁移脚本应包含：

```sql
-- 迁移开始
-- 版本: 1.0.0
-- 描述: 创建用户表
-- 日期: 2026-05-21

-- 1. 创建表结构
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 添加索引
CREATE INDEX idx_users_username ON users(username);

-- 3. 添加注释
COMMENT ON TABLE users IS '用户表';
```

---

## 二、迁移流程

### 2.1 开发环境迁移

```bash
# 进入后端目录
cd backend

# 运行迁移（使用npm脚本）
npm run db:migrate

# 或者使用工具
node scripts/migrate.js
```

### 2.2 生产环境迁移

生产环境迁移需遵循：

1. **备份数据库** - 执行完整备份
2. **试运行脚本** - 在测试环境验证
3. **执行迁移** - 按计划执行
4. **验证结果** - 检查数据完整性
5. **监控性能** - 确保性能正常

---

## 三、回滚策略

### 3.1 自动回滚脚本

每个迁移应包含对应的回滚脚本，命名规则：

```
U{版本号}__{描述}.sql
```

### 3.2 回滚流程

1. 停止应用服务
2. 执行回滚脚本
3. 验证数据完整性
4. 重启应用服务

---

## 四、常见迁移场景

### 4.1 添加新列

```sql
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
```

### 4.2 创建索引

```sql
CREATE INDEX idx_crops_player_id ON crops(player_id);
```

### 4.3 修改列定义

```sql
-- 添加新列，然后复制数据
ALTER TABLE crops ADD COLUMN new_quality INT;
UPDATE crops SET new_quality = quality;
ALTER TABLE crops DROP COLUMN quality;
ALTER TABLE crops RENAME COLUMN new_quality TO quality;
```

---

## 五、数据备份与恢复

### 5.1 备份命令

```bash
# PostgreSQL备份
pg_dump -U username -d database > backup.sql

# Docker环境备份
docker exec -it postgres pg_dump -U postgres happyfarm > backup.sql
```

### 5.2 恢复命令

```bash
# PostgreSQL恢复
psql -U username -d database < backup.sql

# Docker环境恢复
docker exec -i postgres psql -U postgres happyfarm < backup.sql
```

---

## 六、数据库版本管理

### 6.1 迁移记录表

项目使用`schema_migrations`表记录已应用的迁移：

| 版本 | 应用时间 | 状态 |
|------|---------|------|
| 1.0.0 | 2026-05-01 | 已应用 |
| 1.1.0 | 2026-05-15 | 已应用 |

---

## 七、最佳实践

1. **每个迁移做一件事** - 避免在一个脚本中做多个大变更
2. **保持幂等性** - 脚本可多次执行不报错
3. **包含回滚脚本** - 每个迁移都要有对应的回滚
4. **先测试后上线** - 在测试环境验证迁移
5. **记录执行日志** - 保存每次迁移的执行日志

---

## 总结

数据库迁移是重要的运维操作，需要严谨对待。遵循本指南的规范，可以保证数据库变更的安全、可控。

更多详细示例和复杂场景处理，请参考项目内部资源。
