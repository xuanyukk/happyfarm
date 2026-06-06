# 每日折扣系统

## 概述

每日折扣系统每天从商店中随机抽取 3 个商品进行限时折扣，折扣率在 70%~90% 之间（以 5% 为梯度），折扣商品当日有效，次日自动刷新。该系统为玩家提供日常优惠，增加商店的活跃度和消费动力。

**技术栈：**
- 后端：Express + PostgreSQL
- 认证：JWT Token（`authMiddleware`）
- 数据库：`daily_discount_goods`（折扣记录表）、`shop_goods`（商品表）

## 折扣规则

### 折扣生成规则

- **每日折扣数量**：固定 3 个商品
- **折扣率范围**：70%、75%、80%、85%、90%（随机生成，5% 为梯度）
- **折扣价格计算**：`Math.floor(原价 × 折扣率)`，最低为 1
- **候选商品条件**：
  - 商品必须处于上架状态（`is_on_sale = TRUE`）
  - 商品类型为道具（`goods_type = 2`）
  - 商品原价大于 0（`price_num > 0`）
  - 近 2 天内未被选为折扣商品（避免重复）
- **选择方式**：`ORDER BY RANDOM()` 随机选取

### 折扣有效期

- **开始时间**：`CURRENT_TIMESTAMP`（生成时的当前时间）
- **结束时间**：当日 23:59:59（北京时间）
- 过期后标记为 `is_active = FALSE`

### 重复生成防护

刷新时先检查当日是否已有 ≥ 3 个有效折扣商品，如果已存在则跳过生成，直接返回现有折扣列表。

## API 端点列表

### 获取当前折扣列表

- **路径：** `GET /api/daily-tasks/discounts`
- **认证：** 需要 JWT Token
- **说明：** 获取当前所有有效的每日折扣商品，按折扣率从低到高排序（折扣力度大的排在前面）。

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "discountId": 1,
      "goodsId": 1001,
      "goodsName": "高级种子包",
      "goodsType": 2,
      "goodsObjId": 501,
      "originalPrice": 1000,
      "discountRate": 0.7,
      "discountPrice": 700,
      "priceType": 1,
      "startTime": "2026-06-05T00:00:00.000Z",
      "endTime": "2026-06-05T15:59:59.000Z",
      "isActive": true,
      "description": "包含稀有种子的礼包",
      "stockLimit": 10,
      "isOnSale": true,
      "discountPercent": 30
    }
  ],
  "count": 3
}
```

### 手动刷新折扣

- **路径：** `POST /api/daily-tasks/discounts/refresh`
- **认证：** 需要 JWT Token
- **说明：** 手动触发每日折扣刷新。如果当日已有折扣则跳过生成，否则重新生成。通常用于管理后台或定时任务调用。

**响应示例：**

```json
{
  "success": true,
  "data": {
    "message": "成功生成3个每日折扣",
    "discounts": [
      {
        "discountId": 1,
        "goodsId": 1001,
        "goodsName": "高级种子包",
        "originalPrice": 1000,
        "discountRate": 0.7,
        "discountPrice": 700
      }
    ]
  }
}
```

## 刷新机制

### 自动刷新流程

折扣刷新逻辑由 `refreshDailyDiscounts` 函数执行，流程如下：

```
开始刷新
    ↓
检查当日是否已有 ≥ 3 个有效折扣
    ↓ 是
跳过生成，返回现有折扣
    ↓ 否
失效过期折扣（end_time < 当前时间且 is_active = TRUE）
    ↓
从 shop_goods 中筛选候选商品
    ↓
随机选取 3 个商品
    ↓
为每个商品生成随机折扣率（70%~90%）
    ↓
计算折扣价格并插入 daily_discount_goods 表
    ↓
返回新生成的折扣列表
```

### 幂等性保障

- 使用 `ON CONFLICT (goods_id, start_time) DO UPDATE` 避免重复插入
- 刷新前检查已有折扣数量，避免重复生成
- 整个流程在事务中执行，保证数据一致性

### 与其他系统的集成

- **商店购买**：购买折扣商品时，可通过 `getDiscountByGoodsId(goodsId)` 查询该商品是否有有效折扣
- **价格计算**：使用 `calculateDiscountPrice(originalPrice, discountRate)` 计算最终价格

### 相关服务函数

| 函数 | 说明 |
|------|------|
| `refreshDailyDiscounts()` | 刷新每日折扣，生成新的折扣商品 |
| `getDailyDiscounts()` | 获取当前所有有效折扣商品列表 |
| `getDiscountByGoodsId(goodsId)` | 根据商品 ID 查询单个折扣信息 |
| `calculateDiscountPrice(originalPrice, discountRate)` | 计算折扣后价格 |
