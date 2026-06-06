# 每日任务系统

## 概述

每日任务系统为玩家提供每日可完成的任务目标，玩家完成任务后可领取金币、经验、宝石和道具等奖励。系统每天自动刷新任务，鼓励玩家持续参与游戏。

**技术栈：**
- 后端：Express + PostgreSQL
- 认证：JWT Token（`authMiddleware`）
- 数据库：`player_daily_task`（玩家任务进度）、`daily_task_config`（任务配置）

## 任务类型和配置

### 任务分类（task_category）

任务按游戏行为分类，系统通过 `updateTaskProgress` 方法在玩家完成对应操作时自动更新进度：

| 分类 | 说明 | 触发场景 |
|------|------|---------|
| 种植相关 | 种植作物 | 玩家执行种植操作时 |
| 收获相关 | 收获作物 | 玩家执行收获操作时 |
| 浇水相关 | 浇水操作 | 玩家执行浇水操作时 |
| 施肥相关 | 施肥操作 | 玩家执行施肥操作时 |
| 交易相关 | 商店交易 | 玩家在商店购买/出售时 |
| 社交相关 | 社交互动 | 玩家执行社交操作时 |

### 任务配置表（daily_task_config）

每个任务在配置表中定义以下字段：

| 字段 | 说明 |
|------|------|
| `task_id` | 任务唯一标识 |
| `task_name` | 任务名称 |
| `task_description` | 任务描述 |
| `task_category` | 任务分类 |
| `target_count` | 目标完成次数 |
| `unlock_level` | 解锁所需玩家等级 |
| `reward_exp` | 经验奖励 |
| `reward_gold` | 金币奖励 |
| `reward_gems` | 宝石奖励 |
| `reward_items` | 道具奖励（JSON 数组） |
| `sort_order` | 排序序号 |
| `is_active` | 是否启用 |

### 玩家任务进度表（player_daily_task）

| 字段 | 说明 |
|------|------|
| `player_id` | 玩家 ID |
| `task_id` | 任务 ID |
| `progress` | 当前进度 |
| `task_date` | 任务日期（YYYY-MM-DD） |
| `is_completed` | 是否已完成 |
| `is_claimed` | 是否已领取奖励 |

## API 端点列表

### 获取每日任务列表

- **路径：** `GET /api/daily-tasks/`
- **认证：** 需要 JWT Token
- **说明：** 获取当前玩家今日的所有任务及其进度。如果今日任务尚未初始化，系统会自动根据玩家等级生成任务列表。

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "taskId": 101,
      "taskName": "种植3棵作物",
      "taskDescription": "在农场中种植任意3棵作物",
      "taskCategory": "plant",
      "targetCount": 3,
      "progress": 1,
      "isCompleted": false,
      "isClaimed": false,
      "rewardExp": 100,
      "rewardGold": 500,
      "rewardGems": 0,
      "rewardItems": null,
      "sortOrder": 1
    }
  ]
}
```

### 领取任务奖励

- **路径：** `POST /api/daily-tasks/:taskId/claim`
- **认证：** 需要 JWT Token
- **参数：** `taskId`（路径参数，任务 ID）

**响应示例：**

```json
{
  "success": true,
  "data": {
    "success": true,
    "taskId": 101,
    "reward": {
      "exp": 100,
      "gold": 500,
      "gems": 0,
      "items": []
    }
  }
}
```

**错误码：**

| 状态码 | 说明 |
|--------|------|
| 400 | 无效的任务 ID、任务未完成、奖励已领取 |
| 404 | 今日任务不存在 |
| 500 | 服务器内部错误 |

## 任务刷新机制

### 自动初始化

任务系统采用**懒加载**方式初始化：

1. 玩家首次请求每日任务列表时，系统检查 `player_daily_task` 表中是否存在该玩家今日的任务记录
2. 如果不存在，调用 `initializeDailyTasks` 初始化任务
3. 初始化时根据玩家等级（`player_level`）筛选 `daily_task_config` 中 `unlock_level <= 玩家等级` 且 `is_active = TRUE` 的任务
4. 按 `sort_order` 排序后为每个任务创建进度记录（初始进度为 0）

### 每日重置

- 任务按日期（`task_date`）区分，每天是独立的任务集合
- 新的一天请求任务时，系统自动生成当日新任务
- 历史日期的任务数据保留在数据库中

### 进度更新

- 游戏服务中通过调用 `dailyTaskService.updateTaskProgress(playerId, taskCategory, count)` 更新任务进度
- 系统自动匹配当日所有未完成的、属于该分类的任务
- 进度不超过目标值（`target_count`），达到目标值时自动标记为已完成
- 进度更新在事务中执行，保证数据一致性

## 奖励发放逻辑

### 领取条件校验

领取奖励前进行以下校验（在事务中使用 `FOR UPDATE` 锁定行）：

1. **任务存在性**：检查该任务今日是否存在
2. **完成状态**：任务必须已完成（`is_completed = TRUE`）
3. **领取状态**：奖励未领取过（`is_claimed = FALSE`）

### 奖励发放内容

领取成功后，系统发放以下奖励：

| 奖励类型 | 操作 |
|---------|------|
| 经验值（`reward_exp`） | 累加到 `player_base.player_exp` |
| 金币（`reward_gold`） | 累加到 `player_currency.currency_num` 和 `total_earn` |
| 宝石（`reward_gems`） | 累加到 `player_base.premium_currency` |
| 道具（`reward_items`） | 遍历数组，更新 `player_inventory`（已存在则累加数量，不存在则新增） |

### 货币日志记录

金币奖励发放时同步写入 `player_currency_log`：

- `type`：1（收入）
- `source`：`daily_task_reward`
- `related_id`：任务 ID
- `balance_before` / `balance_after`：发放前后的余额

### 数据一致性保障

所有奖励发放操作在单个数据库事务中执行，任何步骤失败都会回滚，确保不会出现部分发放的情况。
