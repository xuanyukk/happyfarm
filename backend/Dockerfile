# 文件名：Dockerfile
# 作者：DevOps团队
# 日期：2026-05-09
# 版本：v1.1.0
# 功能描述：开心农场后端服务Dockerfile
# 更新记录：
#   2026-05-09 - v1.0.0 - 初始版本创建
#   2026-05-09 - v1.1.0 - 添加更多优化，包括缓存层、更好的健康检查

# 使用官方Node.js LTS镜像作为基础
FROM node:20-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装必要的系统工具
RUN apk add --no-cache curl

# 构建阶段：安装依赖
FROM base AS deps

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（使用淘宝镜像加速，跳过prepare脚本）
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --production --ignore-scripts

# 构建阶段：复制代码
FROM base AS builder

# 从deps阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 生产阶段
FROM base AS production

# 从builder阶段复制文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# 创建非root用户运行应用
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 设置正确的权限
RUN chown -R appuser:appgroup /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 切换到非root用户
USER appuser

# 健康检查脚本
COPY --chown=appuser:appgroup <<'EOF' /app/healthcheck.js
const http = require('http');
const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  timeout: 2000
};
const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  process.exit(res.statusCode === 200 ? 0 : 1);
});
request.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});
request.end();
EOF

# 健康检查配置
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node /app/healthcheck.js || exit 1

# 启动应用
CMD ["node", "src/server.js"]
