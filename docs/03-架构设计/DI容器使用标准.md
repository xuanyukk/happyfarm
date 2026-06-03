/**
 * 文件名：DI容器使用标准.md
 * 作者：TraeAI、xuanyukk
 * 日期：2026-06-01
 * 版本：v4.71.6
 * 功能描述：DI容器使用最佳实践和标准
 * 更新记录：
 *   2026-05-01 - v1.0.0 - 初始版本
 *   2026-05-21 - v4.50.0 - 更新项目版本，统一文档标准
 *   2026-06-01 - v4.71.6 - 同步最新版本
 */

# DI容器使用标准（v1.0.0）

## 概述

本文档定义了开心农场项目中DI容器的使用标准、最佳实践和代码模板，确保代码架构的一致性和可维护性。

## 1. 使用方式（3种选择）

### 1.1 推荐方式：智能代理（自动降级）

**适用场景**：新代码，希望利用DI容器优势

```javascript
const { services } = require("./config/services");

// 直接使用服务
const farmService = services.farmService;
const cropService = services.cropService;

exports.createCrop = async (req, res) => {
  try {
    const result = await cropService.createCrop(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**优点**：
- 优先使用DI容器
- 自动降级到直接require
- 无需修改现有代码
- 零风险

---

### 1.2 进阶方式：直接使用DI容器

**适用场景**：完全接受DI容器的新代码

```javascript
const serviceProvider = require("./config/serviceProvider");

const farmService = serviceProvider.get("farmService");
const cropService = serviceProvider.get("cropService");
```

---

### 1.3 保持原样：传统require方式

**适用场景**：现有代码，无需修改

```javascript
const farmService = require("./services/farmService");
const cropService = require("./services/cropService");
```

---

## 2. 服务名称清单

### 基础设施服务（Value类型）

| 服务名 | 说明 | 获取方式 |
|------|------|---------|
| `logger` | 日志系统 | `services.logger` |
| `pool` | PostgreSQL连接池 | `services.pool` |
| `redisClient` | Redis客户端 | `services.redisClient` |

### 业务服务（Singleton类型）

| 服务名 | 说明 | 获取方式 |
|------|------|---------|
| `cacheService` | 缓存服务 | `services.cacheService` |
| `queueService` | 队列服务 | `services.queueService` |
| `emailService` | 邮件服务 | `services.emailService` |
| `websocketService` | WebSocket服务 | `services.websocketService` |
| `backupService` | 备份服务 | `services.backupService` |
| `rbacService` | 权限服务 | `services.rbacService` |
| `cropService` | 作物服务 | `services.cropService` |
| `farmService` | 农场服务 | `services.farmService` |
| `playerService` | 玩家服务 | `services.playerService` |
| `economyService` | 经济服务 | `services.economyService` |
| `itemService` | 道具服务 | `services.itemService` |
| `gameActivityService` | 游戏活动服务 | `services.gameActivityService` |
| `achievementService` | 成就服务 | `services.achievementService` |
| `announcementService` | 公告服务 | `services.announcementService` |
| `configService` | 配置服务 | `services.configService` |
| `shopService` | 商店服务 | `services.shopService` |
| `adminService` | 管理服务 | `services.adminService` |
| `alertService` | 预警服务 | `services.alertService` |
| `auditService` | 审计服务 | `services.auditService` |
| `batchService` | 批量服务 | `services.batchService` |
| `cropMonitorService` | 作物监控服务 | `services.cropMonitorService` |
| `deviceService` | 设备服务 | `services.deviceService` |
| `docsExportService` | 文档导出服务 | `services.docsExportService` |
| `encryptionService` | 加密服务 | `services.encryptionService` |
| `initService` | 初始化服务 | `services.initService` |
| `monitoringService` | 监控服务 | `services.monitoringService` |
| `schedulerService` | 调度服务 | `services.schedulerService` |
| `twoFactorService` | 双因素认证服务 | `services.twoFactorService` |

---

## 3. 在Controller中的完整示例

### 3.1 基础Controller示例

```javascript
const { body, validationResult } = require("express-validator");
const { services } = require("../config/services");

const farmService = services.farmService;
const achievementService = services.achievementService;
const logger = services.logger;

exports.getLands = async (req, res) => {
  try {
    const playerId = req.user.id.toString();
    const lands = await farmService.getPlayerLands(playerId);
    res.status(200).json({ success: true, data: lands });
  } catch (error) {
    logger.error("获取地块失败", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unlockLand = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const playerId = req.user.id.toString();
    const landNum = parseInt(req.params.landNum);
    const result = await farmService.unlockLand(playerId, landNum);

    await achievementService.checkAndUpdateAchievements(playerId, "farm");

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("解锁地块失败", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 4. 路由文件示例

```javascript
const express = require("express");
const router = express.Router();
const farmController = require("../controllers/farmController");
const { authMiddleware } = require("../middleware/authMiddleware");

// 获取所有地块
router.get("/lands", authMiddleware, farmController.getLands);

// 解锁地块
router.post("/lands/:landNum/unlock", authMiddleware, farmController.unlockLand);

module.exports = router;
```

---

## 5. 测试文件示例（使用Mock）

```javascript
const serviceProvider = require("../src/config/serviceProvider");
const diContainer = require("../src/config/diContainer");

describe("FarmService", () => {
  beforeAll(() => {
    serviceProvider.registerAll();
  });

  beforeEach(() => {
    // 可选：mock特定服务
  });

  it("should create farm service", () => {
    const farmService = serviceProvider.get("farmService");
    expect(farmService).toBeDefined();
  });

  it("should get player lands", async () => {
    const farmService = serviceProvider.get("farmService");
    const lands = await farmService.getPlayerLands("test-player-id");
    expect(lands).toBeDefined();
  });
});
```

---

## 6. 最佳实践

### 6.1 何时使用哪种方式？

| 场景 | 推荐方式 | 理由 |
|------|---------|------|
| 完全新代码 | 智能代理（1.1） | 最佳实践，自动降级 |
| 修改现有代码 | 保持原样（1.3） | 最小风险 |
| 测试代码 | 直接使用DI容器（1.2） | 方便Mock |

### 6.2 代码组织原则

1. **服务获取放在文件顶部**：与require方式保持一致
2. **不要在函数内部频繁获取服务**：性能考虑
3. **异常处理保持不变**：错误处理方式无需改变

---

## 7. 渐进式迁移路径

| 阶段 | 时间范围 | 目标 |
|------|---------|------|
| 阶段一 | 已完成 | 建立DI容器架构，创建文档 |
| 阶段二 | 1-2个月 | 新代码使用智能代理 |
| 阶段三 | 3-6个月 | 逐步迁移关键服务 |
| 阶段四 | 可选 | 完全迁移到TypeScript |

---

## 8. 常见问题FAQ

### Q1：DI容器比直接require慢吗？

A：不会有明显性能差异。DI容器在启动时就完成了初始化，运行时只是简单的Map查找。

### Q2：现有代码一定要迁移吗？

A：不需要！完全向后兼容，现有代码可以继续使用require方式。

### Q3：如何在测试中mock服务？

A：使用DI容器可以非常轻松地替换服务，见第5节示例。

### Q4：如果DI容器出问题会怎样？

A：智能代理会自动降级到直接require方式，系统不会崩溃。

---

## 9. 更新记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2026-05-01 | 初始版本创建 |
