# 前端渲染优化指南

**文档版本：** v2.0.0  
**最后更新：** 2026-05-01  
**适用项目：** 开心农场 (Happy Farm)

---

## 概述

本文档说明开心农场项目前端渲染优化方案，特别是针对50块地块同时渲染的性能优化。

---

## 当前现状分析

### 当前实现
- 一次渲染50个地块组件
- 每个地块独立渲染
- 状态更新时重新渲染所有地块

### 性能瓶颈
- 大量DOM元素渲染
- 重复计算和重绘
- 内存占用高

---

## 优化方案

### 方案1：虚拟滚动（推荐用于大量地块）

当地块数量很多（如超过100个）时，可以考虑虚拟滚动。

#### 实现思路
```
可视区域内只渲染可见的地块
滚动时动态加载和卸载地块
```

#### 技术选型
- `vue-virtual-scroller`
- `vue-virtual-scroll-list`
- 或自定义实现

#### 优点
- 大幅减少DOM节点数量
- 滚动性能优秀
- 内存占用低

---

### 方案2：分页加载（推荐用于当前规模）

对于50个地块，可以分页加载。

#### 实现方案
- 第一页显示前20个地块
- 滚动到底部时加载下一页
- 或使用"查看更多"按钮

#### 优点
- 实现简单
- 用户体验良好
- 不需要额外依赖

---

### 方案3：组件优化（推荐优先采用）

优化现有组件，减少不必要的渲染。

#### 具体优化

1. **使用 v-once 或 v-memo**
   ```vue
   <LandItem v-for="land in lands" 
             :key="land.id" 
             :land="land" 
             v-memo="[land.status]"/>
   ```

2. **计算属性缓存**
   ```javascript
   const processedLands = computed(() => {
     return lands.value.map(land => {
       // 处理逻辑
       return processedLand;
     });
   });
   ```

3. **使用 shallowRef 和 shallowReactive**
   - 对于大对象使用浅响应式
   - 减少响应式跟踪开销

---

### 方案4：懒加载与预加载

#### 图片懒加载
```vue
<img v-lazy="imageUrl" loading="lazy"/>
```

#### 组件懒加载
```javascript
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
);
```

---

## Keep-Alive 缓存机制

### 已实现的功能

为了提升页面切换体验，我们为高频复用页面添加了 keep-alive 缓存：

- **Home** - 农场主页
- **ShopPage** - 商店页面  
- **InventoryPage** - 库存页面

### 配置方式

```vue
<router-view v-slot="{ Component, route }">
  <keep-alive :include="['Home', 'ShopPage', 'InventoryPage']" :max="3">
    <component :is="Component" :key="route.path" />
  </keep-alive>
</router-view>
```

### 组件命名

需要在组件中定义名称：

```javascript
defineOptions({
  name: 'Home'
});
```

---

## 性能优化工具

### Bundle 分析

使用以下命令分析打包体积：

```bash
cd frontend
npm run build:analyze
```

会自动打开 stats.html 显示打包分析结果。

### Lighthouse 测试

使用 Chrome DevTools 的 Lighthouse 进行性能评估。

---

## 相关文档

- [路由与组件优化实施报告](../05-优化指南/路由与组件优化实施报告.md)
- [打包与静态资源优化实施报告](../05-优化指南/打包与静态资源优化实施报告.md)
- [性能优化](../tech/performance.md)

---

*文档最后更新: 2026-05-21*
