# ─────────────────────────────────────────────
# 可视化表单系统 — 多阶段构建（多架构）
# 支持平台: linux/amd64, linux/arm64, linux/arm/v7
#
# 架构: Express (API + 静态文件) 单容器部署
# ─────────────────────────────────────────────

# ── 阶段1：构建前端（固定在宿主机原生架构上执行）──
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install --no-audit --no-fund; \
    fi
COPY . .
RUN npm run build
RUN ls -la dist/ && test -f dist/index.html


# ── 阶段2：生产运行（Node.js + Express）──
FROM node:22-alpine

WORKDIR /app

# 安装服务端依赖（含数据库驱动）
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev 2>/dev/null || npm ci

# 复制前端构建产物
COPY --from=builder /app/dist ./dist

# 复制服务端源码
COPY server/tsconfig.json ./server/
COPY server/src ./server/src

# 设置时区
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npx", "tsx", "server/src/index.ts"]
