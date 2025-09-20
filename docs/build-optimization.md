# 构建性能优化指南

## 问题诊断

### 发现的问题
1. **缓存膨胀**: `.next/cache/webpack` 目录达到 222.9MB，导致增量构建比全新构建更慢
2. **内存使用**: 大型项目构建时可能遇到内存不足
3. **并行处理**: 缺乏优化的并行处理策略

### 性能分析结果
```bash
# 缓存大小分析
.next/cache/webpack: 222.9M  # 主要问题
.next/cache/eslint:  60.0K   # 正常
.next/server:        2.7M    # 正常
.next/static:        6.1M    # 正常
```

## 解决方案

### 1. 智能缓存管理
创建了 `scripts/optimize-build.js` 来：
- 自动检测缓存大小 (限制 100MB)
- 超过限制时自动清理
- 提供快速构建模式

### 2. Next.js 构建优化
优化了 `next.config.js`：
- 文件系统缓存配置
- 限制并行处理数量
- 优化模块分包策略
- 缓存版本控制

### 3. 新的构建命令

```bash
# 智能构建（推荐）
npm run build

# 快速构建（清理所有缓存）
npm run build:fast

# 分析构建
npm run build:analyze

# 仅清理缓存
npm run build:clean

# 原始构建（不优化）
npm run build:original
```

## 使用建议

### 日常开发
```bash
npm run build        # 智能构建，自动管理缓存
```

### 遇到构建问题时
```bash
npm run build:fast   # 强制清理缓存重新构建
```

### 性能分析时
```bash
npm run build:analyze  # 生成构建分析报告
```

### CI/CD 环境
```bash
npm run build:fast    # 确保干净环境
```

## 性能提升预期

### 优化前
- 增量构建: 3-5 分钟
- 缓存清理后: 1-2 分钟

### 优化后
- 智能构建: 1-2 分钟
- 快速构建: 45-90 秒
- 缓存自动管理

## 监控和维护

### 缓存健康检查
```bash
# 检查缓存大小
du -sh .next/cache/

# 检查详细分布
du -sh .next/cache/*
```

### 定期维护
- 每周运行一次 `npm run build:clean`
- 大版本更新后使用 `npm run build:fast`
- 部署前确保使用优化构建

## 故障排除

### 构建内存不足
```bash
NODE_OPTIONS='--max-old-space-size=8192' npm run build
```

### 构建卡住
```bash
npm run build:clean && npm run build:fast
```

### 缓存损坏
```bash
rm -rf .next/cache && npm run build
```