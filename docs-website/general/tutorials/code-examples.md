# 代码示例

本页面提供开心农场项目关键模块的代码示例路径及说明，方便开发者快速定位核心代码。

## 代码仓库

项目代码托管在 GitHub，欢迎 Star ⭐ 和贡献！

> 🔗 **仓库地址**：[https://github.com/your-repo/happy-farm](https://github.com/your-repo/happy-farm)

### 分支信息

| 分支名 | 说明 |
|--------|------|
| `main` | 主分支，生产环境稳定版本 |
| `develop` | 开发分支，集成最新功能特性 |
| `feature/*` | 功能分支，新功能开发（如 `feature/multi-currency`） |

## 关键示例文件

### 后端代码

#### 农场系统控制器

**文件路径**：`backend/src/controllers/farmController.js`

负责处理农场相关的 HTTP 请求，包括农场创建、查询、升级等操作。

```js
// 农场控制器示例结构
class FarmController {
  // 创建农场
  async createFarm(req, res) { /* ... */ }

  // 获取农场信息
  async getFarm(req, res) { /* ... */ }

  // 升级农场
  async upgradeFarm(req, res) { /* ... */ }
}
```

#### 作物服务示例

**文件路径**：`backend/src/services/cropService.js`

封装作物种植、浇水、收获等核心业务逻辑。

```js
// 作物服务示例结构
class CropService {
  // 种植作物
  async plant(farmId, cropTypeId) { /* ... */ }

  // 浇水
  async water(farmId, tileIndex) { /* ... */ }

  // 收获作物
  async harvest(farmId, tileIndex) { /* ... */ }
}
```

### 前端代码

#### 首页组件示例

**文件路径**：`frontend/src/pages/Home.vue`

项目首页组件，展示农场概览信息和快捷入口。

```vue
<!-- 首页组件示例结构 -->
<template>
  <div class="home-page">
    <FarmOverview />
    <QuickActions />
  </div>
</template>

<script setup>
import FarmOverview from '@/components/FarmOverview.vue'
import QuickActions from '@/components/QuickActions.vue'
</script>
```

#### 农场状态管理示例

**文件路径**：`frontend/src/stores/farm.js`

使用 Pinia 管理农场全局状态，包含农场数据、作物状态等。

```js
// 农场状态管理示例结构
export const useFarmStore = defineStore('farm', () => {
  const farmInfo = ref(null)
  const crops = ref([])

  // 获取农场数据
  async function fetchFarm() { /* ... */ }

  // 更新作物状态
  function updateCrop(tileIndex, data) { /* ... */ }

  return { farmInfo, crops, fetchFarm, updateCrop }
})
```

### 数据库代码

#### 数据库表结构示例

**目录路径**：`sql_init/02_schema/`

存放数据库建表脚本，包含 62 张核心表的 DDL 语句。

```sql
-- 示例：农场表结构
CREATE TABLE farms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 项目结构速览

```
happy-farm/
├── backend/                  # 后端项目
│   └── src/
│       ├── controllers/      # 控制器层（处理 HTTP 请求）
│       ├── services/         # 服务层（核心业务逻辑）
│       ├── middleware/        # 中间件（鉴权、限流、日志）
│       └── models/           # 数据模型
├── frontend/                 # 前端项目
│   └── src/
│       ├── pages/            # 页面组件
│       ├── components/       # 公共组件
│       ├── stores/           # Pinia 状态管理
│       └── router/           # Vue Router 路由
├── sql_init/                 # 数据库初始化脚本
│   └── 02_schema/            # 建表脚本
└── docs-website/             # 文档站点（当前所在）
```

---

::: tip 提示
💡 更多代码示例请直接访问 [GitHub 仓库](https://github.com/your-repo/happy-farm) 查看完整源码。
:::