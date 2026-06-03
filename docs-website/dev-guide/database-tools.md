# 数据库开发工具

本指南介绍项目提供的数据库开发工具，包括 Schema 验证、ER 图生成等。

---

## 数据库 Schema 验证工具

### 概述

`schema-validator.js` 是一个强大的数据库 Schema 验证工具，用于：
- 验证实际数据库表结构与预期定义是否一致
- 检查字段类型、约束、索引等
- 自动检测差异并生成修复建议

### 使用方式

在 `backend/` 目录下执行：

```bash
cd backend
```

#### 验证数据库 Schema

```bash
npm run schema:validate
```

这会读取 `sql_init/02_schema/` 目录下的所有 SQL 定义，与当前数据库实际 Schema 进行比较，并输出差异报告。

#### 生成修复 SQL 语句

```bash
npm run schema:validate:fix
```

当检测到差异时，会自动生成修复 SQL 语句，方便快速修复问题。

#### 输出详细的差异报告

```bash
npm run schema:validate:report
```

将完整的差异报告输出到 `sql_init/schema_diff_report.json`，便于详细分析。

### 验证的内容

| 检查项 | 说明 |
|--------|------|
| 表存在性 | 检查预期的表是否都已创建 |
| 字段存在性 | 检查表是否包含所有预期的字段 |
| 字段类型 | 验证字段类型是否匹配（支持类型别名如 INT/INTEGER） |
| NULL 约束 | 检查 NOT NULL 约束是否正确 |
| 主键 | 验证主键配置是否正确 |
| 索引 | 检查索引是否存在及索引类型 |

---

## 数据库 ER 图自动生成工具

### 概述

`generate-er-diagram.js` 可以自动从数据库提取 Schema 信息，生成可视化的 ER 图，支持 Mermaid 和 HTML 两种格式。

### 使用方式

```bash
cd backend
```

#### 生成 Mermaid 和 HTML 双格式（推荐）

```bash
npm run er:generate
```

这会生成两个文件：
- `sql_init/database_er_diagram.md` - Mermaid 格式的 ER 图（Markdown 文档）
- `sql_init/database_er_diagram.html` - HTML 格式的可视化 ER 图（带样式）

#### 仅生成 Mermaid 格式

```bash
npm run er:generate:mermaid
```

#### 仅生成 HTML 格式

```bash
npm run er:generate:html
```

### 配置数据库连接

工具会从 `backend/.env` 读取数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=happy_farm
```

如果需要临时指定，可以：

```bash
node scripts/generate-er-diagram.js \
    --db-host localhost \
    --db-port 5432 \
    --db-user postgres \
    --db-pass your_password \
    --db-name happy_farm \
    --format both
```

### ER 图包含的内容

- **表信息**：表名、字段名、数据类型
- **主键外键**：明确的关系标注
- **表统计**：总表数、字段数、关系数
- **版本信息**：生成时间戳

### 查看 ER 图

- **Mermaid 格式**：直接在 GitHub、VS Code 或 Markdown 编辑器中查看（需要 Mermaid 支持）
- **HTML 格式**：在浏览器中打开 `sql_init/database_er_diagram.html` 查看美观的可视化图

---

## 迁移历史管理

### 归档迁移文件

项目历史迁移文件已规范化归档至 `sql_init/archive/migrations/`，遵循命名规范：

```
YYYYMMDDHHMMSS_description.sql
```

### 查看迁移历史

详细迁移历史请查看：`sql_init/archive/MIGRATION_HISTORY.md`

包含：
- 所有迁移文件清单
- 执行顺序与回滚策略
- 每个迁移的描述与影响范围
