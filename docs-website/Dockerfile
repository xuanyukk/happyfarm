
# 文件名：Dockerfile
# 作者：DevOps团队
# 日期：2026-05-25
# 版本：v1.0.0
# 功能描述：开心农场文档网站 Docker 构建文件

# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制根目录的 package.json 和锁文件
COPY package.json package-lock.json ./

# 安装根目录依赖（包含 vitepress）
RUN npm ci --registry=https://registry.npmmirror.com --no-audit --no-fund

# 复制 docs-website 内容
COPY docs-website ./docs-website

# 构建文档网站
RUN npm run docs:build

# 生产阶段 - 使用 Nginx 服务
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/docs-website/.vitepress/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY docs-website/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

