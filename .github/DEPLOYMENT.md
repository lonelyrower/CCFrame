# CCFrame 部署指南

## 部署方式

CCFrame 支持两种部署方式：

### 1. 镜像部署（推荐）
- ✅ 快速部署，无需本地构建
- ✅ 资源占用少，内存消耗低
- ✅ 自动化构建，版本管理清晰
- ✅ 适合生产环境

### 2. 源码构建
- ⚙️ 支持自定义修改代码
- ⚙️ 适合开发环境和测试
- ⚠️ 需要较多内存和时间

---

## 快速开始（镜像部署）

```bash
# 下载管理脚本
curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/ccframe.sh -o ccframe.sh
chmod +x ccframe.sh

# 使用镜像安装
bash ccframe.sh install --from-image
```

访问 `http://您的服务器IP` 即可使用。

---

## 源码构建部署

```bash
# 下载管理脚本
curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/ccframe.sh -o ccframe.sh
chmod +x ccframe.sh

# 使用源码安装（需要 2GB+ 内存）
bash ccframe.sh install
```

---

## 脚本命令说明

| 命令 | 说明 |
|------|------|
| `bash ccframe.sh install` | 源码构建安装 |
| `bash ccframe.sh install --from-image` | 镜像部署安装 |
| `bash ccframe.sh update` | 源码更新 |
| `bash ccframe.sh update --from-image` | 镜像更新 |
| `bash ccframe.sh switch-mode` | 切换部署模式 |
| `bash ccframe.sh start` | 启动服务 |
| `bash ccframe.sh stop` | 停止服务 |
| `bash ccframe.sh restart` | 重启服务 |
| `bash ccframe.sh status` | 查看状态 |
| `bash ccframe.sh logs [服务名]` | 查看日志 |
| `bash ccframe.sh health` | 健康检查 |
| `bash ccframe.sh uninstall` | 卸载（保留数据） |
| `bash ccframe.sh uninstall --purge` | 完全卸载（删除所有数据） |

---

## 部署模式选择

脚本会在安装时提示选择部署模式：

### 1. IP 模式（HTTP）
- 适合内网使用或开发测试
- 使用服务器 IP 直接访问
- 不需要域名

### 2. 域名模式（Let's Encrypt HTTPS）
- 自动申请 SSL 证书
- 需要域名已解析到服务器
- 适合公网部署

### 3. Cloudflare/CDN 模式
- 使用 Cloudflare 等 CDN 提供 HTTPS
- 服务器只需 HTTP，代理层处理 HTTPS
- 适合使用 CDN 加速的场景

---

## 切换部署方式

从源码构建切换到镜像部署：

```bash
bash ccframe.sh switch-mode
# 选择 1) 镜像部署
```

从镜像部署切换到源码构建：

```bash
bash ccframe.sh switch-mode
# 选择 2) 源码构建
```

---

## GitHub Actions 自动构建

项目已配置 GitHub Actions 自动构建：

- **触发条件**：
  - 推送到 `main` 分支
  - 创建版本标签（如 `v1.0.0`）
  - 手动触发

- **镜像地址**：`ghcr.io/lonelyrower/ccframe`

- **支持平台**：
  - `linux/amd64`
  - `linux/arm64`

- **可用标签**：
  - `latest` - 最新稳定版
  - `main` - 主分支最新提交
  - `v1.0.0` - 版本标签
  - `main-sha123456` - 特定提交

---

## 环境变量配置

脚本会自动生成 `.env` 文件，主要配置项：

```bash
# 认证配置
NEXTAUTH_SECRET=<自动生成>
NEXTAUTH_URL=http://您的域名或IP
ADMIN_EMAIL=admin@local.dev
ADMIN_PASSWORD=<自动生成>

# 数据库配置
DATABASE_URL=postgresql://...

# 存储配置
S3_ACCESS_KEY_ID=<自动生成>
S3_SECRET_ACCESS_KEY=<自动生成>
S3_BUCKET_NAME=ccframe

# Redis
REDIS_URL=redis://redis:6379

# HTTPS 配置
FORCE_HTTPS=false  # 域名模式会自动设为 true
```

---

## 常见问题

### 1. 内存不足导致构建失败

**解决方案**：使用镜像部署

```bash
bash ccframe.sh install --from-image
```

### 2. 已安装想切换部署方式

```bash
bash ccframe.sh switch-mode
```

### 3. 更新到最新版本

镜像部署：
```bash
bash ccframe.sh update --from-image
```

源码构建：
```bash
bash ccframe.sh update
```

### 4. 查看容器日志

```bash
# 查看所有服务日志
bash ccframe.sh logs

# 查看特定服务日志
bash ccframe.sh logs web
bash ccframe.sh logs worker
```

### 5. 完全卸载

```bash
# 卸载但保留数据
bash ccframe.sh uninstall

# 完全删除（包括数据）
bash ccframe.sh uninstall --purge
```

---

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | Nginx | HTTP 访问入口 |
| 443 | Nginx | HTTPS 访问入口（域名模式） |
| 3000 | Next.js | 应用服务（内部） |
| 9000 | MinIO | S3 API（内部） |
| 9001 | MinIO | 管理控制台 |

---

## 系统要求

### 镜像部署
- **内存**：512MB+
- **磁盘**：5GB+
- **系统**：Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)

### 源码构建
- **内存**：2GB+
- **磁盘**：10GB+
- **系统**：Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)

---

## 生产环境建议

1. **使用镜像部署**，避免资源浪费
2. **配置域名 + HTTPS**，提升安全性
3. **定期备份数据卷**：
   ```bash
   docker run --rm -v pgdata:/data -v $(pwd):/backup \
     alpine tar czf /backup/pgdata-backup.tar.gz -C /data .
   ```
4. **监控容器状态**：
   ```bash
   bash ccframe.sh status
   bash ccframe.sh health
   ```

---

## 支持

- 问题反馈：[GitHub Issues](https://github.com/lonelyrower/CCFrame/issues)
- 文档：[项目 README](https://github.com/lonelyrower/CCFrame)
