# ─────────────────────────────────────────────
# 可视化表单系统 — 多架构 Docker 镜像构建脚本 (Windows PowerShell)
# 支持平台: linux/amd64 (x86_64), linux/arm64 (AArch64), linux/arm/v7 (ARMv7)
# ─────────────────────────────────────────────

# 构建参数（按需修改）
$PLATFORMS = "linux/amd64,linux/arm64,linux/arm/v7"
$IMAGE_NAME = "form-builder"          # 镜像名
$IMAGE_TAG = "latest"                  # 镜像标签
$REGISTRY = ""                         # 推送目标仓库，如 "docker.io/yourname" 或 "ghcr.io/yourname"

# ── 以下是构建逻辑，一般不需要修改 ──

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  可视化表单系统 — 多架构镜像构建" -ForegroundColor Cyan
Write-Host "  平台: $PLATFORMS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Docker buildx 是否可用
Write-Host "[1/4] 检查 Docker buildx 环境..." -ForegroundColor Yellow
$buildxCheck = docker buildx version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Docker buildx 不可用，请确认已安装 Docker Desktop 并启用 buildx。" -ForegroundColor Red
    Write-Host "  下载: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
    exit 1
}
Write-Host "  ✓ buildx 已就绪: $buildxCheck" -ForegroundColor Green

# 2. 创建/复用多架构构建器
Write-Host ""
Write-Host "[2/4] 准备多架构构建器..." -ForegroundColor Yellow
$builderName = "form-builder-multiarch"

# 检查构建器是否已存在
$existingBuilder = docker buildx ls 2>&1 | Select-String $builderName
if ($existingBuilder) {
    Write-Host "  ✓ 复用已有构建器: $builderName" -ForegroundColor Green
} else {
    Write-Host "  创建新构建器: $builderName" -ForegroundColor Gray
    docker buildx create --name $builderName --driver docker-container --bootstrap --use 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ 创建构建器失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ 构建器创建成功" -ForegroundColor Green
}
docker buildx use $builderName 2>&1 | Out-Null

# 3. 组装镜像标签
Write-Host ""
Write-Host "[3/4] 构建多架构镜像..." -ForegroundColor Yellow

if ($REGISTRY -ne "") {
    $fullImage = "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
} else {
    $fullImage = "${IMAGE_NAME}:${IMAGE_TAG}"
}

Write-Host "  镜像: $fullImage" -ForegroundColor Gray
Write-Host "  平台: $PLATFORMS" -ForegroundColor Gray
Write-Host ""

# 如果指定了远程仓库，使用 --push；否则用 --load 只加载到本地
# 注意: 多架构镜像无法用 --load 加载到本地 Docker（Docker 一次只能加载单架构）
#       所以多架构构建必须 --push 到 registry
if ($REGISTRY -ne "") {
    Write-Host "  模式: 推送到远程仓库" -ForegroundColor Gray
    docker buildx build `
        --platform $PLATFORMS `
        -t $fullImage `
        --push `
        .
} else {
    Write-Host "  ⚠ 未指定 REGISTRY，多架构镜像无法加载到本地 Docker。" -ForegroundColor Yellow
    Write-Host "    将以 --push 模式构建并推送至默认 registry。" -ForegroundColor Yellow
    Write-Host "    如需本地运行单架构，请使用: docker compose up -d --build" -ForegroundColor Gray
    Write-Host ""
    docker buildx build `
        --platform $PLATFORMS `
        -t $fullImage `
        --push `
        .
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[4/4] 构建成功!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  镜像: $fullImage" -ForegroundColor Cyan
    Write-Host "  平台: $PLATFORMS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  在目标机器上运行:" -ForegroundColor Yellow
    Write-Host "    docker pull $fullImage" -ForegroundColor White
    Write-Host "    docker run -d -p 8080:80 --name form-builder $fullImage" -ForegroundColor White
    Write-Host ""
    Write-Host "  或使用 docker-compose.yml:" -ForegroundColor Yellow
    Write-Host "    # 将 docker-compose.yml 中的 image 改为: $fullImage" -ForegroundColor White
    Write-Host "    docker compose up -d" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "  ✗ 构建失败，请检查上方错误信息" -ForegroundColor Red
    exit 1
}
