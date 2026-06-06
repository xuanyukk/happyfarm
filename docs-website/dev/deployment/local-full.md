# 本地部署指南

**文档版本：** v1.0.0  
**最后更新：** 2026-05-16  
**适用版本：** 开心农场 v4.71.7

---

## 📋 目录

- [前置准备](#前置准备)
- [软件安装](#软件安装)
- [数据库配置](#数据库配置)
- [Redis 配置](#redis-配置)
- [后端部署](#后端部署)
- [前端部署](#前端部署)
- [日志聚合平台](#日志聚合平台)
- [访问地址](#访问地址)
- [故障排查](#故障排查)

---

## 📦 前置准备

### 系统要求

- **操作系统：** Windows 10/11、Linux、或 macOS
- **内存：** 至少 4GB RAM
- **磁盘空间：** 至少 5GB 可用空间

---

## 💾 软件安装

### 1. Node.js (>= 16.x)

#### 下载安装
- **官方下载地址：** https://nodejs.org/
- **推荐版本：** LTS（长期支持版）
- **安装说明：** 下载后运行安装程序，默认安装即可

#### 验证安装
```powershell
node --version
npm --version
```

---

### 2. PostgreSQL (>= 13)

#### 下载安装
- **下载地址：** https://www.postgresql.org/download/windows/
- **推荐版本：** PostgreSQL 16
- **安装说明：**
  - 运行安装程序，按默认设置安装
  - 设置超级用户密码（请记住此密码）
  - 默认端口：5432
  - 安装完成后会打开 Stack Builder，可以取消

#### 验证安装
```powershell
psql --version
```

---

### 3. Redis (>= 7)

#### Windows 安装选项

**选项一：使用 Memurai（推荐）**
- **下载地址：** https://www.memurai.com/get-memurai
- Memurai 是 Windows 上的 Redis 兼容版本

**选项二：使用 Chocolatey 安装**
```powershell
# 先安装 Chocolatey（如果没有）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装 Redis
choco install redis-64
```

**选项三：WSL2 安装 Redis**
- 适用于已安装 WSL2 的用户
- 在 WSL2 中按照 Linux 方式安装 Redis

#### 验证安装
```powershell
redis-cli --version
```

---

### 4. Git（可选但推荐）

- **下载地址：** https://git-scm.com/download/win
- 安装后可以方便地获取代码更新

---

## 🗄️ 数据库配置

### 1️⃣ 启动 PostgreSQL 服务

```powershell
# 方式一：通过服务管理器启动
# 搜索 "服务"，找到 "postgresql-x64-16"，右键启动

# 方式二：命令行启动（以管理员身份）
cd "C:\Program Files\PostgreSQL\16\bin"
pg_ctl start -D "C:\Program Files\PostgreSQL\16\data"
```

### 2️⃣ 创建数据库和用户

```powershell
# 连接到 PostgreSQL（使用安装时设置的密码）
psql -U postgres
```

在 psql 中执行以下 SQL：

```sql
-- 创建数据库
CREATE DATABASE happy_farm;

-- 创建用户
CREATE USER happy_farm WITH PASSWORD 'happy_farm_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE happy_farm TO happy_farm;

-- 退出
\q
```

### 3️⃣ 初始化数据库结构

```powershell
# 进入项目的 sql_init 目录
cd g:\youxi\ceshi\happy-farm\sql_init

# 执行完整初始化脚本
psql -U happy_farm -d happy_farm -f full_init.sql
```

---

## 🟥 Redis 配置

### 1️⃣ 启动 Redis

```powershell
# 如果安装的是 Memurai
memurai

# 如果安装的是 Redis
redis-server

# 或者如果安装为服务
net start redis
```

### 2️⃣ 验证 Redis 运行

```powershell
# 新开一个终端
redis-cli ping

# 应该返回 PONG
```

---

## 🚀 后端部署

### 1️⃣ 配置环境变量

```powershell
# 进入 backend 目录
cd g:\youxi\ceshi\happy-farm\backend

# 复制环境变量示例文件
copy .env.example .env
```

编辑 `.env` 文件，配置以下内容：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# 数据库配置
DATABASE_URL="postgresql://happy_farm:happy_farm_password@localhost:5432/happy_farm"

# Redis 配置
REDIS_URL="redis://localhost:6379"

# JWT 密钥（可以保持默认或自己修改）
JWT_SECRET="your-jwt-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"
```

### 2️⃣ 安装依赖

```powershell
# 安装后端依赖
npm install
```

### 3️⃣ 启动后端

```powershell
# 启动后端开发服务器
npm run dev
```

---

## 🌐 前端部署

### 1️⃣ 配置环境变量

```powershell
# 进入 frontend 目录（新开一个终端）
cd g:\youxi\ceshi\happy-farm\frontend

# 复制环境变量示例文件
copy .env.example .env
```

编辑 `.env` 文件：

```env
VITE_API_URL="http://localhost:3001/api"
```

### 2️⃣ 安装依赖

```powershell
# 安装前端依赖
npm install
```

### 3️⃣ 启动前端

```powershell
# 启动前端开发服务器
npm run dev
```

---

## 📊 日志聚合平台

### 可选：本地部署日志聚合平台

#### Loki 部署

1. **下载 Loki**
   - 下载地址：https://github.com/grafana/loki/releases
   - 下载文件：loki-windows-amd64.zip

2. **配置并启动**
```powershell
# 解压到合适的目录，例如：g:\loki
# 复制项目中的 loki-config.yml
copy g:\youxi\ceshi\happy-farm\loki-config.yml g:\loki\local-config.yml

# 启动 Loki
cd g:\loki
loki-windows-amd64.exe -config.file=local-config.yml
```

#### Promtail 部署

1. **下载 Promtail**
   - 下载地址：https://github.com/grafana/loki/releases
   - 下载文件：promtail-windows-amd64.zip

2. **配置并启动**
```powershell
# 解压到合适的目录，例如：g:\promtail
# 复制项目中的 promtail-config.yml
copy g:\youxi\ceshi\happy-farm\promtail-config.yml g:\promtail\config.yml

# 编辑 config.yml，修改日志路径指向实际的后端日志目录（g:\youxi\ceshi\happy-farm\backend\logs）

# 启动 Promtail
cd g:\promtail
promtail-windows-amd64.exe -config.file=config.yml
```

#### Grafana 部署

1. **下载 Grafana**
   - 下载地址：https://grafana.com/grafana/download?platform=windows

2. **安装并配置**
```powershell
# 安装后，复制项目的 provisioning 目录到 Grafana 的配置目录
# Grafana 默认配置目录：C:\Program Files\GrafanaLabs\grafana\conf\provisioning

# 复制所有配置
xcopy g:\youxi\ceshi\happy-farm\grafana\provisioning "C:\Program Files\GrafanaLabs\grafana\conf\provisioning" /E /I /Y

# 启动 Grafana（通常安装后作为服务自动启动）
# 或手动启动：
cd "C:\Program Files\GrafanaLabs\grafana\bin"
grafana-server.exe
```

---

## 🌐 访问地址

### 主应用访问

| 服务 | 地址 |
|------|------|
| **前端应用** | http://localhost:5173 |
| **后端 API** | http://localhost:3001/api |
| **API 文档** | http://localhost:3001/api-docs |
| **Grafana** | http://localhost:3001 (默认用户 admin，默认密码 admin) |

### 默认测试账号

| 类型 | 用户名 | 密码 |
|------|--------|------|
| **应用管理员** | admin | 123456 |
| **应用用户** | test_user | 123456 |
| **Grafana** | admin | admin（首次登录需修改） |

---

## 🔍 故障排查

### PostgreSQL 相关问题

#### 无法连接到数据库
```powershell
# 检查 PostgreSQL 服务是否运行
# 在服务管理器中查看 "postgresql-x64-16"

# 检查端口占用
netstat -ano | findstr ":5432"

# 查看 PostgreSQL 日志
# 日志通常在：C:\Program Files\PostgreSQL\16\data\log\
```

#### 数据库初始化失败
```powershell
# 重新连接检查
psql -U happy_farm -d happy_farm

# 查看数据库表
\dt

# 如果表为空，重新执行初始化脚本
cd g:\youxi\ceshi\happy-farm\sql_init
psql -U happy_farm -d happy_farm -f full_init.sql
```

---

### Redis 相关问题

#### 无法连接到 Redis
```powershell
# 检查 Redis 是否运行
redis-cli ping

# 如果没有返回 PONG，重新启动 Redis
redis-server
```

---

### 后端启动问题

#### 端口被占用
```powershell
# 检查端口占用
netstat -ano | findstr ":3000"

# 修改 .env 中的 PORT 配置
PORT=3001
```

#### 依赖安装失败
```powershell
# 清除缓存重试
cd backend
npm cache clean --force
npm install
```

#### 数据库连接失败
- 检查 `.env` 中的 `DATABASE_URL` 配置是否正确
- 确认 PostgreSQL 服务正在运行
- 查看后端控制台的错误信息

---

### 前端启动问题

#### 端口被占用
```powershell
# Vite 会自动尝试下一个端口（5174, 5175...）
# 或者修改 vite.config.js 中的 server.port 配置
```

#### API 请求失败
- 检查 `.env` 中的 `VITE_API_URL` 是否正确
- 确认后端服务正在运行
- 检查浏览器控制台的网络请求错误

---

## 💡 开发提示

### 启动顺序建议

1. 启动 PostgreSQL
2. 启动 Redis
3. 启动后端
4. 启动前端
5. （可选）启动日志聚合平台

### 热重载

- 后端：使用 `npm run dev` 会自动重启
- 前端：使用 `npm run dev` 会热更新

---

## 📚 相关文档

- [Docker 部署指南](./docker-full)
- [日志系统完整指南](./logging)
- [数据库管理完整指南](./database)
- [常见问题FAQ](../faq)

---

## 📞 获取帮助

如有问题，请：
1. 查看本文档的故障排查部分
2. 查看服务控制台的错误日志
3. 参考 [常见问题FAQ](../faq)
4. 提交 Issue

---

**祝您部署顺利！** 🎉
