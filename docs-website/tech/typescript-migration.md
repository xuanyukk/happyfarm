---
title: TypeScript迁移指南
description: 开心农场项目TypeScript迁移详细指南和最佳实践
---

# TypeScript迁移指南

::: tip 文档信息
- **版本**: v4.50.0
- **日期**: 2026-05-21
- **项目版本**: v4.50.0
:::

## 概述

本指南详细说明TypeScript迁移的第一阶段：为核心文件添加JSDoc类型注解，配置TypeScript检查JavaScript文件，提升类型安全意识，不必立即迁移代码。

---

## 阶段一目标

1. **添加JSDoc类型注解到核心文件
2. **配置TypeScript检查JavaScript文件
3. **建立类型安全最佳实践文档

---

## 一、TypeScript配置说明

### 后端配置 (`backend/tsconfig.json`)

当前配置已完善，包含：
- 严格类型检查 (`strict: true`)
- 包含JS文件检查 (`checkJs: true` (待开启))
- 类型声明生成 (`declaration: true`)

### 前端配置 (`frontend/tsconfig.json`)

当前配置已完善，包含：
- 支持Vue文件
- 路径别名配置
- 严格类型检查

---

## 二、JSDoc类型注解最佳实践

### 2.1 基本类型注解

```javascript
/**
 * @param {string} playerId - 玩家ID
 * @param {number} qualityId - 品质ID (1-8)
 * @returns {Promise<boolean>} 是否成功
 */
function processCrop(playerId, qualityId) {
  return Promise.resolve(true);
}
```

### 2.2 对象类型注解

```javascript
/**
 * @typedef {Object} PlayerData
 * @property {string} id - 玩家ID
 * @property {string} username - 用户名
 * @property {number} level - 玩家等级
 * @property {number} exp - 经验值
 */

/**
 * @param {PlayerData} player - 玩家数据
 * @returns {boolean}
 */
function validatePlayer(player) {
  return true;
}
```

### 2.3 函数类型注解

```javascript
/**
 * @typedef {Function} CropHarvestHandler
 * @param {string} cropId - 作物ID
 * @param {string} playerId - 玩家ID
 * @returns {Promise<HarvestResult>}
 */
```

---

## 三、迁移优先级建议

### 优先级1（核心文件）
- `backend/src/services/*.js` - 核心业务服务
- `backend/src/middleware/*.js` - 中间件
- `frontend/src/stores/*.js` - 状态管理

### 优先级2（重要文件）
- `frontend/src/api/*.js` - API服务
- `frontend/src/utils/*.js` - 工具函数
- `backend/src/utils/*.js` - 后端工具函数

### 优先级3（其他文件）
- 组件文件（`frontend/src/components/*.vue`）
- 路由配置文件

---

## 四、类型安全检查策略

### 4.1 逐步开启检查

建议按以下步骤开启TypeScript检查：

1. 第一阶段：仅在CI中开启检查（不阻塞）
2. 第二阶段：在开发环境开启警告
3. 第三阶段：在生产环境开启错误检查

### 4.2 VS Code配置

推荐在`.vscode/settings.json`中添加：

```json
{
  "javascript.implicitProjectConfig.checkJs": true,
  "javascript.suggest.autoImports": true
}
```

---

## 五、类型文档示例

更多详细示例和规范，请参考项目内部资源。

---

## 总结

当前阶段重点是通过JSDoc注解提升类型安全性，不必立即重构为TypeScript。这是一个渐进式的过程，可在不影响功能的前提下提升代码质量。
