# 文件名：Dockerfile
# 作者：DevOps团队
# 日期：2026-05-09
# 版本：v1.1.0
# 功能描述：开心农场前端应用Dockerfile
# 更新记录：
#   2026-05-09 - v1.0.0 - 初始版本创建
#   2026-05-09 - v1.1.0 - 优化构建过程，添加缓存支持

# 第一阶段：依赖安装阶段
FROM node:20-alpine AS deps

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖（使用淘宝镜像加速，跳过prepare脚本）
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --ignore-scripts

# 第二阶段：构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 从deps阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 第三阶段：生产阶段 - 使用Nginx作为Web服务器
FROM nginx:alpine AS production

# 安装必要工具
RUN apk add --no-cache curl

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
