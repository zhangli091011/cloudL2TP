# ============================================================
# 云端软路由控制面板 - Dockerfile
# 多阶段构建：编译前端，tsx 直接运行 TypeScript 后端
# ============================================================

# Stage 1: 构建前端资源
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 workspace 配置
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# 安装所有依赖（含 devDeps，供 vite/tsc 构建用）
RUN npm install --legacy-peer-deps

# 复制全部源码
COPY . .

# 构建前端静态资源（vite build 生成 apps/web/dist）
RUN npm -w apps/web run build

# Stage 2: 生产运行（tsx 直接运行 TS，无需 tsc 编译）
FROM node:20-alpine

# 安装 curl 用于连通性诊断
RUN apk add --no-cache curl

WORKDIR /app

# 复制 workspace 配置并安装依赖（不含 devDeps，但 tsx 已移至 dependencies）
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm install --production --legacy-peer-deps

# 复制共享类型源码（tsx 运行时需要）
COPY packages/shared/src ./packages/shared/src

# 复制后端源码
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# 复制前端构建产物
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# 复制根 package.json（workspaces 配置）
COPY package.json ./

# 复制启动脚本
COPY scripts/wait-for-mihomo.sh /usr/local/bin/wait-for-mihomo.sh
RUN chmod +x /usr/local/bin/wait-for-mihomo.sh

# 创建数据和日志目录
RUN mkdir -p /app/data /app/logs

EXPOSE 3001

ENV NODE_ENV=production

# 启动前等待 mihomo 就绪，然后 tsx 直接运行 TypeScript 源码
CMD ["/usr/local/bin/wait-for-mihomo.sh"]
