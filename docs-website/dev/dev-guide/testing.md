# 测试指南

本文档介绍开心农场项目的测试相关内容。

## 测试统计

| 项目 | 数量 | 通过 | 失败 |
|------|------|------|------|
| 后端测试用例 | 255 | 226 | 29 |
| 前端测试用例 | 49 | 46 | 3 |
| **总计** | **304** | **272** | **32** |

## 运行后端测试

### 运行测试
```bash
cd backend
npm test
```

### 运行测试并生成覆盖率报告
```bash
cd backend
npm run test:coverage
```

## 运行前端测试

### 运行测试
```bash
cd frontend
npm test
```

### 运行测试并生成覆盖率报告
```bash
cd frontend
npm run test:coverage
```

## CI/CD 与测试

- 项目使用 GitHub Actions 进行自动化测试
- 每次提交和 Pull Request 都会运行完整测试套件
- 测试覆盖率自动上传到 Codecov
- 安全审计自动检查依赖安全问题

## 测试配置

- 后端使用 Jest 配置（`backend/jest.config.js`）
- 前端使用 Vitest 配置（`frontend/vitest.config.js`）
- 测试环境完全隔离，不依赖开发环境服务
- 测试超时配置防止 CI 进程挂起
- 统一的测试初始化文件管理环境变量

## 相关文档

- [开发规范](/dev-guide/code-standards)
- [Git 工作流](/dev-guide/git-workflow)
- [贡献指南](/dev-guide/contributing)
