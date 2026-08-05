# 可视化表单系统

基于 React + TypeScript + Vite 的可视化表单构建器，支持拖拽建表、数据收集与导出。

## 技术栈

- **前端**: React 19 + TypeScript + Vite 7
- **UI**: Tailwind CSS + shadcn/ui (Radix UI)
- **拖拽**: @dnd-kit
- **数据**: Zustand (状态管理) + react-hook-form + zod
- **图表**: Recharts
- **导出**: xlsx + jszip
- **部署**: Docker + Express + GitHub Actions CI/CD

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
  -p 8080:3000 \
  -v form-builder-data:/app/data \
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
      - "8080:3000"        # 宿主机端口 : 容器端口
    restart: unless-stopped
    volumes:
      - form-builder-data:/app/data      # SQLite 数据库持久化
      - ./uploads:/app/uploads           # 上传文件持久化（如有）
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  form-builder-data:        # 命名卷，Docker 自动管理
```

修改端口映射只需改 `ports` 左侧数字，例如 `- "3000:3000"` 则访问 `http://localhost:3000`。

---

## 数据持久化

容器销毁后数据会丢失，必须映射持久化目录。

### 哪些数据需要持久化

| 数据 | 容器内路径 | 说明 |
|---|---|---|
| SQLite 数据库 | `/app/data/` | 使用 SQLite 作为存储时，`.db` 文件存放于此 |
| 用户上传文件 | `/app/uploads/` | 表单附件、头像等上传资源 |

### Docker run 方式

```bash
docker run -d \
  --name form-builder \
  -p 8080:3000 \
  -v /opt/form-builder/data:/app/data \       # 宿主机目录映射
  -v /opt/form-builder/uploads:/app/uploads \ # 可选：上传文件目录
  ghcr.io/lentll/visual-form-builder:latest
```

### Docker Compose 方式

在 `docker-compose.yml` 中配置 `volumes`：

```yaml
services:
  form-builder:
    # ... 其他配置 ...
    volumes:
      # 方式一：命名卷（推荐，Docker 自动管理）
      - form-builder-data:/app/data

      # 方式二：宿主机绝对路径（适合需要直接访问 db 文件的场景）
      # - /opt/form-builder/data:/app/data

      # 方式三：相对路径（相对于 docker-compose.yml 所在目录）
      # - ./data:/app/data

volumes:
  form-builder-data:
```

### 备份与恢复

```bash
# 方式一：从宿主机目录直接备份（推荐，简单直接）
cp -r /opt/form-builder/data ./backup-$(date +%Y%m%d)

# 方式二：从 Docker 命名卷备份
docker run --rm \
  -v form-builder-data:/src \
  -v $(pwd)/backup:/dst \
  alpine cp -r /src /dst/

# 恢复
docker run --rm \
  -v form-builder-data:/dst \
  -v $(pwd)/backup/data:/src \
  alpine cp -r /src/. /dst/
```

> **提示**：如果使用外部 MySQL/PostgreSQL/MongoDB，数据由这些数据库自身负责持久化，无需额外映射。

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
├── server/               # Express 后端 API
│   └── src/
│       ├── routes/       # 路由（数据库连接测试等）
│       └── services/     # 业务逻辑（MySQL/PG/MongoDB/SQLite 连接器）
├── Dockerfile            # 多阶段 Docker 构建
├── docker-compose.yml    # Docker Compose 编排
└── .github/workflows/    # GitHub Actions CI/CD
```
