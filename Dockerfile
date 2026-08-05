# ─────────────────────────────────────────────
# 可视化表单系统 — 多阶段构建（多架构）
# 支持平台: linux/amd64, linux/arm64, linux/arm/v7
#
# 核心优化: Vite 产物是平台无关的静态文件（HTML/CSS/JS），
# 所以构建阶段在宿主机原生架构上运行（--platform=$BUILDPLATFORM），
# 避免用 QEMU 模拟 ARM 跑 Node.js（会慢 10~50 倍）。
# 部署阶段则为每个目标平台生成对应的 Nginx 镜像。
# ─────────────────────────────────────────────

# ── 阶段1：构建（固定在宿主机原生架构上执行，不跟随目标平台）──
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存
COPY package.json ./
COPY package-lock.json* ./

# 有 lock 用 ci（确定性、更快），无 lock 用 install（兼容网盘下载版）
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install --no-audit --no-fund; \
    fi

# 复制源码并构建
COPY . .

# 构建生产产物（tsc 类型检查 + vite 打包 → dist/）
RUN npm run build

# 验证产物存在（构建失败时提前报错）
RUN ls -la dist/ && test -f dist/index.html


# ── 阶段2：部署（为每个目标平台生成对应架构的 Nginx 镜像）──
FROM nginx:alpine

# 清除默认配置，使用项目自定义配置
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物到 Nginx 静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 设置时区（中文环境日志可读性）
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

EXPOSE 80

# 前台运行 Nginx
# 多架构构建命令:
#   docker buildx build --platform linux/amd64,linux/arm64,linux/arm/v7 \
#     -t form-builder:latest --push .
# 或使用项目内的构建脚本:
#   PowerShell:  ./build-multiarch.ps1
#   Bash:        ./build-multiarch.sh
CMD ["nginx", "-g", "daemon off;"]
