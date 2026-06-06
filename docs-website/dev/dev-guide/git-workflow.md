# Git 工作流

本文档介绍开心农场项目的 Git 工作流程。

---

## 分支策略

### 主要分支（受保护）

#### main/master分支
- **用途**：生产环境代码，稳定可发布
- **合并来源**：仅接受从 `develop` 分支合并
- **保护规则**：
  - 需要至少1人代码审查
  - 需要CI/CD检查通过
  - 禁止直接推送
- **标签规范**：发布时打版本标签，格式 `vX.Y.Z`

#### develop分支
- **用途**：开发集成分支，所有功能开发完成后合并到这里
- **合并来源**：接受 `feature/*`、`fix/*`、`docs/*` 分支合并
- **保护规则**：
  - 需要CI/CD检查通过
  - 建议进行代码审查

### 功能分支

#### feature/*分支
- **命名规范**：`feature/功能名称` 或 `feature/issue-编号`
- **示例**：
  - `feature/add-friend-system`
  - `feature/issue-123`
- **用途**：开发新功能
- **生命周期**：
  1. 从 `develop` 分支创建
  2. 功能开发完成
  3. 合并回 `develop` 分支
  4. （可选）删除该分支

#### fix/*分支
- **命名规范**：`fix/问题描述` 或 `fix/issue-编号`
- **示例**：
  - `fix/login-error-401`
  - `fix/issue-456`
- **用途**：修复bug
- **生命周期**：同feature分支

#### docs/*分支
- **命名规范**：`docs/文档更新内容`
- **示例**：
  - `docs/update-readme`
  - `docs/add-contributing-guide`
- **用途**：文档更新
- **生命周期**：同feature分支

#### refactor/*分支
- **命名规范**：`refactor/重构内容`
- **示例**：
  - `refactor/di-container`
  - `refactor/state-management`
- **用途**：代码重构，不影响功能
- **生命周期**：同feature分支

---

## 提交信息规范

### 格式

使用统一的提交信息格式：

```
<类型>(<可选范围>): <简短描述>

<可选详细描述>

<可选相关链接>
```

### 类型（type）

- `feat`：新功能
- `fix`：修复bug
- `docs`：文档更新
- `style`：代码格式调整（不影响功能）
- `refactor`：重构
- `perf`：性能优化
- `test`：测试相关
- `chore`：构建/工具相关
- `ci`：CI/CD相关

### 范围（scope，可选）

- `backend`：后端代码
- `frontend`：前端代码
- `db`：数据库相关
- `config`：配置文件
- `deps`：依赖更新

### 示例

#### 功能开发
```
feat: 添加好友系统

- 实现好友申请功能
- 实现好友列表展示
- 集成WebSocket通知

Closes #123
```

#### Bug修复
```
fix(backend): 修复登录401错误

- 修复Token验证逻辑
- 添加Token刷新机制

Fixes #456
```

#### 文档更新
```
docs: 更新README添加优化进度
```

#### 代码重构
```
refactor(frontend): 重构状态管理

- 优化Store结构
- 提升性能
```

---

## 合并流程

### 功能开发流程

1. 创建功能分支
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/功能名称
   ```

2. 进行开发并提交
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

3. 推送分支到远程
   ```bash
   git push origin feature/功能名称
   ```

4. 创建Pull Request
   - 源分支：`feature/功能名称`
   - 目标分支：`develop`
   - 填写PR描述

5. 代码审查（至少1人）
6. CI/CD检查通过
7. 合并到develop

### 发布流程

1. 从develop创建发布分支（可选）
2. 测试和修复
3. 合并到main
4. 打版本标签
   ```bash
   git tag -a vX.Y.Z -m "版本X.Y.Z发布"
   git push origin vX.Y.Z
   ```

---

## 代码审查要求

### PR准备清单

提交PR前确保：
- [ ] 功能已完整实现
- [ ] 代码符合规范
- [ ] 已有相关测试
- [ ] 文档已更新（如需要）
- [ ] 所有CI检查通过
- [ ] PR描述清晰说明变更内容

### 审查要点

代码审查时检查：
- **功能完整性**：功能是否完整实现
- **代码质量**：代码可读性、可维护性
- **安全性**：是否存在安全隐患
- **性能**：是否存在性能问题
- **测试覆盖**：是否有足够测试
- **文档**：文档是否已同步更新

---

## 仓库管理

### 标签规范

- 版本标签：`vX.Y.Z`（语义化版本）
  - `X`：主版本号（重大变更）
  - `Y`：次版本号（新功能）
  - `Z`：修订号（bug修复）

### Issue和PR管理

- 使用Issue跟踪功能和bug
- Issue模板：bug报告、功能请求
- PR关联Issue：Closes #XXX、Fixes #XXX

---

## 常见问题

### Q: 如何处理紧急bug？
A: 从main分支创建hotfix分支，修复后合并回main和develop

### Q: 代码审查发现问题怎么办？
A: 在PR中评论，作者修复后再次审查

### Q: 提交历史很乱怎么办？
A: 使用 `git rebase -i` 整理提交历史

---

## 工具推荐

- **Commitizen**：交互式提交信息工具
- **Husky**：Git hooks管理
- **lint-staged**：提交前检查

---

## CI/CD说明

### GitHub Actions工作流

项目已配置完整的CI/CD流程，包含以下工作流：

#### 1. 主项目CI工作流
- **触发条件**：
  - push到main或develop分支
  - pull request到main或develop分支
- **工作流程**：
  1. 代码检出
  2. 环境设置（Node.js 18+）
  3. 依赖安装
  4. 后端测试
  5. 前端测试
  6. ESLint检查
  7. 构建验证

#### 2. 前端CI工作流
- **触发条件**：frontend目录下的代码变更

### CI/CD最佳实践

- 自动测试：每次提交自动运行完整测试套件
- 代码质量检查：ESLint自动检查、代码格式化验证
- Husky Git钩子：pre-commit钩子自动运行ESLint检查和代码格式化

---

## 相关文档

- [开发规范](/dev-guide/code-standards)
- [测试指南](/dev-guide/testing)
- [贡献指南](/dev-guide/contributing)
- [代码审查检查清单](/dev-guide/code-review)
