# 可视化表单系统

基于 React + TypeScript + Vite 的可视化表单构建器，支持拖拽建表、数据收集与导出。

## 技术栈

- **前端**: React 19 + TypeScript + Vite 7
- **UI**: Tailwind CSS + shadcn/ui (Radix UI)
- **拖拽**: @dnd-kit
- **数据**: Zustand (状态管理) + react-hook-form + zod
- **图表**: Recharts
- **导出**: xlsx + jszip
- **部署**: Docker + Nginx + GitHub Actions CI/CD

---

## Docker 部署（推荐）

镜像支持多架构：**x86_64 (amd64)** | **ARM64 (aarch64)** | **ARMv7 (树莓派等)**

### 拉取镜像

```bash
docker pull ghcr.io/lentll/visual-form-builder:latest
```

### 直接运行

```bash
docker run -d \
  --name form-builder \
  -p 8080:80 \
  ghcr.io/lentll/visual-form-builder:latest
```

访问 `http://localhost:8080` 即可使用。

---

## Docker Compose 部署（一键部署）

项目已内置 `docker-compose.yml`：

```bash
# 克隆项目
git clone https://github.com/lentll/Visual-form-builder.git
cd Visual-form-builder

# 一键启动
docker compose up -d
```

完整 `docker-compose.yml` 内容：

```yaml
services:
  form-builder:
    image: ghcr.io/lentll/visual-form-builder:latest
    container_name: form-builder
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
```

修改端口映射只需改 `ports` 左侧数字，例如 `- "3000:80"` 则访问 `http://localhost:3000`。

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（热更新）
npm run dev

# 构建生产产物
npm run build

# 预览生产构建
npm run preview
```

---

## 多架构说明

本项目 Docker 镜像同时支持以下平台：

| 平台 | 适用设备 |
|---|---|
| `linux/amd64` | Intel / AMD 处理器 (x86_64) |
| `linux/arm64` | Apple Silicon Mac、AWS Graviton、树莓派 4/5 (64位) |
| `linux/arm/v7` | 树莓派 2/3 (32位)、旧 ARM 设备 |

Docker 会自动选择与宿主机架构匹配的镜像，无需手动指定。

---

## CI/CD

推送代码到 `main` 分支或创建版本 Tag（`v*`）时，GitHub Actions 自动构建三架构 Docker 镜像并推送到 `ghcr.io`。

工作流配置：`.github/workflows/docker-build.yml`

---

## 项目结构

```
├── src/
│   ├── components/       # UI 组件
│   ├── pages/            # 页面级组件
│   ├── store/            # Zustand 状态管理
│   └── types/            # TypeScript 类型定义
├── Dockerfile            # 多阶段 Docker 构建
├── docker-compose.yml    # Docker Compose 编排
├── nginx.conf            # Nginx 配置 (SPA + gzip + 缓存)
├── build-multiarch.ps1   # Windows 本地多架构构建脚本
└── build-multiarch.sh    # Linux/macOS 本地多架构构建脚本
```
