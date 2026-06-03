# PM2 进程管理

本文档介绍开心农场项目的 PM2 进程管理配置和使用方法。

## 概述

PM2 是 Node.js 应用的生产进程管理器，提供进程守护、集群模式、日志管理、监控等功能。

## PM2 配置

项目已配置 PM2 生态系统文件，位于 `backend/ecosystem.config.js`。

### 配置内容

```javascript
module.exports = {
  apps: [
    {
      name: 'happy-farm-backend',
      script: './src/server.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '60s',
      max_restarts: 10,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ],
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:happy-farm/repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

### 配置说明

| 配置项 | 说明 |
|--------|------|
| `name` | 应用名称 |
| `script` | 启动脚本路径 |
| `instances` | 实例数量，'max' 表示使用 CPU 核心数 |
| `exec_mode` | 执行模式，'cluster' 表示集群模式 |
| `autorestart` | 是否自动重启 |
| `watch` | 是否监听文件变化 |
| `max_memory_restart` | 最大内存限制，超过后自动重启 |
| `env` | 开发环境变量 |
| `env_production` | 生产环境变量 |
| `error_file` | 错误日志文件 |
| `out_file` | 输出日志文件 |

## 快速开始

### 安装 PM2

```bash
npm install -g pm2
```

### 启动服务

```bash
# 进入后端目录
cd backend

# 使用开发环境启动
npm run start
# 或
pm2 start ecosystem.config.js

# 使用生产环境启动
npm run start:prod
# 或
pm2 start ecosystem.config.js --env production
```

## 常用命令

### 查看状态

```bash
# 查看所有应用状态
npm run status
# 或
pm2 status

# 查看资源使用情况
npm run monit
# 或
pm2 monit
```

### 停止服务

```bash
npm run stop
# 或
pm2 stop ecosystem.config.js

# 停止指定应用
pm2 stop happy-farm-backend
```

### 重启服务

```bash
npm run restart
# 或
pm2 restart ecosystem.config.js

# 优雅重载（零停机时间）
pm2 reload ecosystem.config.js
```

### 删除服务

```bash
pm2 delete ecosystem.config.js
```

### 查看日志

```bash
# 查看所有日志
npm run logs
# 或
pm2 logs

# 查看指定应用日志
pm2 logs happy-farm-backend

# 查看最近的 100 行日志
pm2 logs happy-farm-backend --lines 100

# 只查看错误日志
pm2 logs happy-farm-backend --err
```

### 保存进程列表

```bash
# 保存当前进程列表，开机自启动
pm2 save

# 生成开机自启动脚本
pm2 startup
```

## 监控功能

### 实时监控

```bash
pm2 monit
```

这个命令会打开一个实时监控面板，显示：
- CPU 使用率
- 内存使用量
- 进程状态
- 日志输出

### Web 仪表板

PM2 提供了 Web 仪表板功能：

```bash
# 安装 PM2 Plus
pm2 install pm2-server-monit

# 启用仪表板
pm2 plus
```

## 日志管理

### 日志格式

日志文件位置：
- `backend/logs/pm2-out.log` - 标准输出日志
- `backend/logs/pm2-error.log` - 错误输出日志

日志格式包含：
- 时间戳
- 进程 ID
- 日志级别
- 日志内容

### 日志轮转

PM2 会自动处理日志轮转，避免单文件过大。

## 集群模式

### 优势

- 充分利用多核 CPU
- 自动负载均衡
- 进程崩溃自动恢复
- 零停机重载

### 实例数配置

```javascript
// 使用所有 CPU 核心
instances: 'max'

// 指定核心数
instances: 4
```

## 环境变量

### 开发环境

```javascript
env: {
  NODE_ENV: 'development',
  PORT: 3000
}
```

### 生产环境

```javascript
env_production: {
  NODE_ENV: 'production',
  PORT: 3000
}
```

## 健康检查

配置了以下健康检查参数：
- `min_uptime: '60s'` - 最小运行时间，低于此时间重启不计入重启次数
- `max_restarts: 10` - 最大重启次数
- `kill_timeout: 5000` - 进程杀死超时时间
- `wait_ready: true` - 等待进程就绪信号
- `listen_timeout: 10000` - 监听超时时间

## 部署功能

### 生产部署

```bash
# 设置部署配置
pm2 deploy production setup

# 部署到生产环境
pm2 deploy production

# 更新生产环境
pm2 deploy production update
```

## 最佳实践

1. **使用集群模式** - 充分利用多核 CPU
2. **设置合理的内存限制** - 避免单个进程占用过多内存
3. **配置健康检查** - 及时发现和处理问题
4. **监控日志** - 定期查看和分析日志
5. **使用环境变量** - 区分开发和生产环境
6. **保存进程列表** - 配置开机自启动
7. **定期更新 PM2** - 使用最新版本获得更好的性能和安全性

## 相关文件

- `backend/ecosystem.config.js` - PM2 配置文件
- `backend/package.json` - npm 脚本配置
