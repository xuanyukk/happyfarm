# 开发环境配置指南

**文档版本：** v4.71.7  
**最后更新：** 2026-06-02  
**适用版本：** 开心农场 v4.71.7+  


---

## 📋 目录

- [系统要求](#系统要求)
- [必需软件安装](#必需软件安装)
- [项目初始化](#项目初始化)
- [后端开发环境](#后端开发环境)
- [前端开发环境](#前端开发环境)
- [数据库配置](#数据库配置)
- [运行与调试](#运行与调试)
- [常见问题](#常见问题)

---

## 💻 系统要求

### Windows 开发环境

| 组件 | 要求 |
|------|------|
| **操作系统** | Windows 10/11（64位） |
| **内存** | 建议 8GB 以上 |
| **磁盘空间** | 至少 10GB 可用空间 |
| **Node.js** | v18+ |
| **PostgreSQL** | v14+ |
| **Redis** | v7+ |

### macOS / Linux 开发环境

| 组件 | 要求 |
|------|------|
| **操作系统** | macOS 11+ 或 Ubuntu 20.04+ |
| **内存** | 建议 8GB 以上 |
| **磁盘空间** | 至少 10GB 可用空间 |
| **Node.js** | v18+ |
| **PostgreSQL** | v14+ |
| **Redis** | v7+ |

---

## 🔧 必需软件安装

### 1. Node.js 安装

#### Windows

1. 访问 https://nodejs.org/
2. 下载 LTS 版本（推荐 v18.x 或 v20.x）
3. 运行安装程序，按默认设置安装
4. 验证安装：
   ```powershell
   node --version
   npm --version
   ```

#### macOS（使用 Homebrew）

```bash
brew install node@18
```

#### Linux（Ubuntu）

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 数据库安装

#### PostgreSQL

**Windows**
- 下载：https://www.postgresql.org/download/windows/
- 运行安装程序，设置密码（记住此密码）
- 默认端口：5432

**macOS**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux（Ubuntu）**
```bash
sudo apt-get install postgresql-14
sudo service postgresql start
```

#### Redis

**Windows**
- 使用 Memurai（Redis 的 Windows 版本）或 WSL2
- 或使用 Docker：
  ```powershell
  docker run -d -p 6379:6379 redis:7-alpine
  ```

**macOS**
```bash
brew install redis
brew services start redis
```

**Linux（Ubuntu）**
```bash
sudo apt-get install redis-server
sudo service redis-server start
```

### 3. 代码编辑器

推荐使用：
- **VS Code**（推荐）：https://code.visualstudio.com/
- **WebStorm**：https://www.jetbrains.com/webstorm/

---

## 🚀 项目初始化

### 1. 获取项目代码

```powershell
# 进入项目目录
cd g:\youxi\ceshi\happy-farm

# （可选）如果是新克隆的项目
git clone <repository-url>
cd happy-farm
```

### 2. 安装依赖

#### 后端依赖

```powershell
cd backend
npm install
```

#### 前端依赖

```powershell
cd frontend
npm install
```

#### 文档网站依赖

```powershell
cd docs-website
npm install
```

---

## 🔙 后端开发环境

### 1. 环境变量配置

在 `backend/` 目录下创建 `.env` 文件：

```env
# ========================================
# 数据库配置
# ========================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=happy_farm
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# ========================================
# Redis 配置
# ========================================
REDIS_HOST=localhost
REDIS_PORT=6379

# ========================================
# 应用配置
# ========================================
NODE_ENV=development
PORT=3000
JWT_SECRET=your_development_jwt_secret_key
```

### 2. 创建数据库

```powershell
# 使用 psql 连接 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE happy_farm;

# 退出
\q
```

### 3. 运行数据库迁移

```powershell
cd backend
npm run migrate
npm run seed
```

### 4. 启动后端服务

```powershell
# 开发模式（支持热重载）
npm run dev

# 生产模式
npm run start
```

后端服务将在 http://localhost:3000 启动

---

## 🎨 前端开发环境

### 1. 环境变量配置

在 `frontend/` 目录下创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2. 启动前端服务

```powershell
cd frontend
npm run dev
```

前端服务将在 http://localhost:5173 启动

---

## 🗄️ 数据库配置

### PostgreSQL 配置

#### 创建用户（可选）

```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 创建用户
CREATE USER happy_farm WITH PASSWORD 'happy_farm_password';

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE happy_farm TO happy_farm;

-- 连接到数据库
\c happy_farm

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO happy_farm;
```

### 数据库连接测试

```powershell
# 测试 PostgreSQL 连接
psql -h localhost -p 5432 -U postgres -d happy_farm

# 测试 Redis 连接
redis-cli ping
# 应该返回 PONG
```

---

## ▶️ 运行与调试

### 完整开发环境启动步骤

```powershell
# 终端 1：启动后端
cd backend
npm run dev

# 终端 2：启动前端
cd frontend
npm run dev

# 终端 3：启动文档网站（可选）
cd docs-website
npm run docs:dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:5173 |
| 后端 API | http://localhost:3001/api |
| API 文档 | http://localhost:3001/api-docs |
| 文档网站 | http://localhost:5174 |

### 调试技巧

#### 后端调试（VS Code）

1. 在 VS Code 中打开项目
2. 按 F5 或点击调试面板
3. 选择 "Node.js" 配置
4. 在代码中设置断点

#### 前端调试

1. 使用 Chrome DevTools
2. 按 F12 打开开发者工具
3. 在 Sources 面板中设置断点
4. 使用 Vue DevTools 扩展（推荐）

---

## ❓ 常见问题

### 问题 1：端口被占用

**错误信息**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**
```powershell
# 查找占用端口的进程
netstat -ano | findstr ":3000"

# 结束进程（替换 PID）
taskkill /PID <进程ID> /F
```

### 问题 2：数据库连接失败

**错误信息**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案**
1. 确认 PostgreSQL 服务正在运行
2. 检查 `.env` 文件中的数据库配置
3. 验证用户名和密码

### 问题 3：依赖安装失败

**解决方案**
```powershell
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rmdir /s /q node_modules
del package-lock.json

# 重新安装
npm install
```

### 问题 4：Redis 连接失败

**错误信息**
```
Error: Redis connection to 127.0.0.1:6379 failed
```

**解决方案**
1. 确认 Redis 服务正在运行
2. 使用 Docker 启动 Redis（如果本地安装有问题）
   ```powershell
   docker run -d -p 6379:6379 redis:7-alpine
   ```

---

## 📚 相关文档

- [代码规范](./code-standards)
- [Git 工作流](./git-workflow)
- [测试指南](./testing)
- [Docker 部署指南](../deployment/docker-full)

---

**开发环境配置完成！** 💻
