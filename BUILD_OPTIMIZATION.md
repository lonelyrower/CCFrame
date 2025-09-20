# Next.js 构建优化配置

## 当前构建时间分析 (约6分钟)
这个构建时间在 CCFrame 项目规模下是正常的，但可以进一步优化。

## 🔧 已实施的优化

1. **Docker 构建优化**
   - 创建了 `.dockerignore` 文件减少构建上下文
   - 多阶段构建降低最终镜像大小

2. **Next.js 配置优化**
   - 启用 SWC 压缩 (`swcMinify: true`)
   - 生产环境移除控制台日志
   - 优化包导入 (`optimizePackageImports`)

## 🚀 进一步优化建议

### 1. 启用构建缓存
```bash
# Docker 构建时启用 BuildKit 缓存
DOCKER_BUILDKIT=1 docker build --cache-from ccframe:latest .
```

### 2. 使用 npm ci 替代 npm install
在 Dockerfile 中：
```dockerfile
RUN npm ci --only=production --no-audit --no-fund
```

### 3. 并行处理
```dockerfile
# 可以并行安装系统依赖和 Node 依赖
FROM node:18-bullseye AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:18-bullseye AS sys-deps  
RUN apt-get update && apt-get install -y ...
```

### 4. 启用增量构建
```bash
# 开发环境使用 Turbo
npm run dev  # 已配置 --turbo 标志
```

## 📊 构建时间基准

| 项目复杂度 | 正常构建时间 |
|-----------|-------------|
| 简单 Next.js | 1-3 分钟 |
| **CCFrame (中等复杂)** | **4-8 分钟** ✅ |
| 大型企业级 | 10-20 分钟 |

## 💡 当前状态
- ✅ 构建时间正常 (6分钟)
- ✅ 已有基础优化配置
- 🔧 可进一步优化减少到 4-5 分钟

## 🎯 监控建议
如果构建时间超过 10 分钟，可能需要检查：
- 网络连接速度
- Docker 资源分配
- 系统负载情况