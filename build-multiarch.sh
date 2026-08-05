#!/usr/bin/env bash
# ─────────────────────────────────────────────
# 可视化表单系统 — 多架构 Docker 镜像构建脚本 (Linux/macOS)
# 支持平台: linux/amd64 (x86_64), linux/arm64 (AArch64), linux/arm/v7 (ARMv7)
# ─────────────────────────────────────────────
set -euo pipefail

# 构建参数（按需修改）
PLATFORMS="linux/amd64,linux/arm64,linux/arm/v7"
IMAGE_NAME="form-builder"              # 镜像名
IMAGE_TAG="latest"                      # 镜像标签
REGISTRY="${REGISTRY:-}"               # 推送目标仓库，如 "docker.io/yourname" 或 "ghcr.io/yourname"

# ── 以下是构建逻辑，一般不需要修改 ──

echo ""
echo "============================================"
echo "  可视化表单系统 — 多架构镜像构建"
echo "  平台: ${PLATFORMS}"
echo "============================================"
echo ""

# 1. 检查 Docker buildx 是否可用
echo "[1/4] 检查 Docker buildx 环境..."
if ! docker buildx version >/dev/null 2>&1; then
    echo "  ✗ Docker buildx 不可用，请先安装 Docker 并启用 buildx。"
    echo "  安装: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "  ✓ buildx 已就绪: $(docker buildx version)"

# 2. 创建/复用多架构构建器
echo ""
echo "[2/4] 准备多架构构建器..."
BUILDER_NAME="form-builder-multiarch"

if docker buildx ls 2>/dev/null | grep -q "$BUILDER_NAME"; then
    echo "  ✓ 复用已有构建器: $BUILDER_NAME"
else
    echo "  创建新构建器: $BUILDER_NAME"
    docker buildx create --name "$BUILDER_NAME" --driver docker-container --bootstrap --use
    echo "  ✓ 构建器创建成功"
fi
docker buildx use "$BUILDER_NAME" >/dev/null 2>&1

# 3. 组装镜像标签
echo ""
echo "[3/4] 构建多架构镜像..."

if [ -n "$REGISTRY" ]; then
    FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
else
    FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
fi

echo "  镜像: $FULL_IMAGE"
echo "  平台: $PLATFORMS"
echo ""

# 多架构镜像无法用 --load 加载到本地 Docker（一次只能加载单架构）
# 所以多架构构建必须 --push 到 registry
if [ -n "$REGISTRY" ]; then
    echo "  模式: 推送到远程仓库"
    docker buildx build \
        --platform "$PLATFORMS" \
        -t "$FULL_IMAGE" \
        --push \
        .
else
    echo "  ⚠ 未指定 REGISTRY 环境变量，多架构镜像无法加载到本地 Docker。"
    echo "    将以 --push 模式构建并推送至默认 registry。"
    echo "    如需本地运行单架构，请使用: docker compose up -d --build"
    echo ""
    docker buildx build \
        --platform "$PLATFORMS" \
        -t "$FULL_IMAGE" \
        --push \
        .
fi

# 4. 结果
if [ $? -eq 0 ]; then
    echo ""
    echo "[4/4] 构建成功!"
    echo ""
    echo "  镜像: $FULL_IMAGE"
    echo "  平台: $PLATFORMS"
    echo ""
    echo "  在目标机器上运行:"
    echo "    docker pull $FULL_IMAGE"
    echo "    docker run -d -p 8080:80 --name form-builder $FULL_IMAGE"
    echo ""
    echo "  或使用 docker-compose.yml:"
    echo "    # 将 docker-compose.yml 中的 image 改为: $FULL_IMAGE"
    echo "    docker compose up -d"
    echo ""
else
    echo ""
    echo "  ✗ 构建失败，请检查上方错误信息"
    exit 1
fi
