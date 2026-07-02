# ============================================================
# 云端软路由控制面板 - Dockerfile
# 多阶段构建：先编译前后端，最终生成最小生产镜像
# ============================================================

# Stage 1: 构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 workspace 配置
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# 安装所有依赖
RUN npm install --legacy-peer-deps

# 复制源码
COPY . .

# 构建前端
RUN npm -w apps/web run build || true

# 确保生产依赖
RUN npm install --production --legacy-peer-deps

# Stage 2: 生产运行
FROM node:20-alpine

# 安装 mihomo（可选，如果需要在容器内运行）
# RUN apk add --no-cache curl

WORKDIR /app

# 复制构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./

# 创建数据和日志目录
RUN mkdir -p /app/data /app/logs

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "apps/api/dist/index.js"]
