# CCFrame 完整部署指南

本文档整合了所有部署方式的说明，包括一键脚本、Docker、VPS 和手动部署。

---

## 📑 目录

1. [快速开始](#快速开始)
2. [部署方式选择](#部署方式选择)
3. [ccframe.sh 统一脚本部署（推荐）](#ccframesh-统一脚本部署推荐)
4. [Docker Compose 部署](#docker-compose-部署)
5. [VPS 手动部署](#vps-手动部署)
6. [Docker 镜像构建](#docker-镜像构建)
7. [环境变量配置](#环境变量配置)
8. [Nginx 配置](#nginx-配置)
9. [SSL/HTTPS 配置](#sslhttps-配置)
10. [监控与维护](#监控与维护)
11. [性能优化](#性能优化)
12. [故障排除](#故障排除)

---

## 快速开始

### 方式一：ccframe.sh 一键脚本（推荐）

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/ccframe.sh -o ccframe.sh
chmod +x ccframe.sh

# 选择部署方式
bash ccframe.sh install              # 源码构建模式
bash ccframe.sh install --from-image # 镜像部署模式（更快）
```

**特点**：
- ✅ 自动安装所有依赖（Docker, Docker Compose）
- ✅ 支持源码构建和镜像部署两种模式
- ✅ 自动配置 Nginx、PostgreSQL、Redis、MinIO
- ✅ 支持 IP、Let's Encrypt、Cloudflare 三种 HTTPS 模式
- ✅ 提供完整的管理命令（start/stop/restart/logs）

### 方式二：传统 install.sh（已弃用，建议使用 ccframe.sh）

```bash
curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/install.sh | bash
```

---

## 部署方式选择

| 方式 | 适用场景 | 难度 | 性能 | 推荐度 |
|------|---------|------|------|--------|
| **ccframe.sh (镜像)** | 生产环境，快速部署 | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **ccframe.sh (源码)** | 需要自定义修改 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Docker Compose** | 开发/测试环境 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **VPS 手动部署** | 特殊需求 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

---

## ccframe.sh 统一脚本部署（推荐）

### 功能特点

- 🚀 支持源码构建和镜像部署两种模式
- 🔄 一键安装、更新、切换模式
- 🌐 自动配置 HTTP/HTTPS（IP、Let's Encrypt、Cloudflare）
- 📦 完整的容器编排（Web、Worker、DB、Redis、MinIO、Nginx）
- 🛡️ 内置健康检查和自动恢复

### 安装步骤

#### 1. 下载脚本

```bash
curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/ccframe.sh -o ccframe.sh
chmod +x ccframe.sh
```

#### 2. 选择部署模式

##### 镜像部署模式（推荐，更快）

```bash
# 使用预构建的 Docker 镜像
bash ccframe.sh install --from-image

# 使用特定版本
IMAGE_TAG=v1.0.0 bash ccframe.sh install --from-image
```

**优势**：
- ⚡ 安装速度快（10-15 分钟）
- 💾 资源占用少（不需要构建）
- 🔄 更新简单（拉取新镜像即可）

##### 源码构建模式

```bash
# 从源码构建
bash ccframe.sh install
```

**优势**：
- 🛠️ 可以自定义代码
- 🔧 适合开发和调试

#### 3. 配置部署方式

脚本会提示选择部署模式：

```
请选择部署模式：
  1) IP 模式（仅 HTTP，使用服务器 IP 访问）
  2) 域名模式（自动申请 Let's Encrypt HTTPS）
  3) 域名 + 反向代理模式（HTTPS 由 Cloudflare/CDN 提供）
```

- **选项 1**：适合测试或内网环境
- **选项 2**：适合有域名的生产环境
- **选项 3**：适合使用 Cloudflare 等 CDN 的环境

#### 4. 等待安装完成

安装完成后会显示：
- 访问地址（前台 + 后台）
- 管理员账号密码
- 常用管理命令

### 常用命令

```bash
# 启动服务
bash ccframe.sh start

# 停止服务
bash ccframe.sh stop

# 重启服务
bash ccframe.sh restart

# 查看状态
bash ccframe.sh status

# 查看日志
bash ccframe.sh logs        # 所有服务
bash ccframe.sh logs web    # Web 服务
bash ccframe.sh logs worker # Worker 服务

# 更新应用
bash ccframe.sh update                # 源码模式
bash ccframe.sh update --from-image   # 镜像模式

# 切换部署模式
bash ccframe.sh switch-mode

# 健康检查
bash ccframe.sh health

# 卸载（保留数据）
bash ccframe.sh uninstall

# 完全卸载（删除所有数据）
bash ccframe.sh uninstall --purge
```

### 目录结构

```
/opt/ccframe/
├── docker-compose.yml  # Docker Compose 配置
├── nginx.conf          # Nginx 配置
├── .env                # 环境变量
├── prisma/             # 数据库 Schema
└── ... (源码模式下包含完整代码)
```

---

## Docker Compose 部署

适合开发和测试环境。

### 前置要求

- Docker 20.10+
- Docker Compose V2

### 部署步骤

```bash
# 1. 克隆仓库
git clone https://github.com/lonelyrower/CCFrame.git
cd CCFrame

# 2. 复制环境变量
cp .env.docker.example .env

# 3. 编辑环境变量
nano .env
# 必须修改：
# - NEXTAUTH_SECRET
# - ADMIN_EMAIL
# - ADMIN_PASSWORD
# - 数据库密码
# - S3 凭据

# 4. 启动服务
docker compose up -d --build

# 5. 查看状态
docker compose ps
docker compose logs -f web
```

### 服务说明

Docker Compose 包含以下服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| **web** | 3000 | Next.js 应用主服务 |
| **worker** | - | BullMQ 后台任务处理 |
| **db** | 5432 | PostgreSQL 数据库 |
| **redis** | 6379 | Redis 缓存和队列 |
| **minio** | 9000, 9001 | MinIO 对象存储 |
| **nginx** | 80, 443 | Nginx 反向代理 |

### Docker Compose 命令

```bash
# 查看日志
docker compose logs -f [service]

# 重启服务
docker compose restart [service]

# 停止所有服务
docker compose down

# 停止并删除数据
docker compose down -v

# 重新构建
docker compose up -d --build --force-recreate
```

---

## VPS 手动部署

适合需要完全控制的场景。

### 系统要求

- **操作系统**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU**: 2 核心+
- **内存**: 2GB+ （推荐 4GB）
- **磁盘**: 20GB+ SSD
- **Node.js**: 20.x
- **PostgreSQL**: 13+
- **Redis**: 6+

### 安装依赖

#### 1. 安装 Node.js

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v20.x
npm --version
```

#### 2. 安装 PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE ccframe_db;
CREATE USER ccframe_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ccframe_db TO ccframe_user;
\\q
EOF
```

#### 3. 安装 Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### 4. 安装 MinIO（可选但推荐）

```bash
# 下载 MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# 创建存储目录
sudo mkdir -p /data/minio
sudo useradd -s /sbin/nologin -d /data/minio minio
sudo chown -R minio:minio /data/minio

# 创建 systemd 服务
sudo tee /etc/systemd/system/minio.service > /dev/null <<EOF
[Unit]
Description=MinIO Object Storage
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
WorkingDirectory=/data/minio
User=minio
Group=minio
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=minioadmin123"
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always
RestartSec=5
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable minio
sudo systemctl start minio
```

### 部署应用

#### 1. 克隆项目

```bash
cd /var/www
sudo git clone https://github.com/lonelyrower/CCFrame.git ccframe
cd ccframe
sudo chown -R $USER:$USER /var/www/ccframe
```

#### 2. 安装依赖

```bash
npm install --production
```

#### 3. 配置环境变量

```bash
cp .env.example .env
nano .env
```

必须修改的配置：
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- `S3_*` 配置

#### 4. 数据库迁移

```bash
npx prisma generate
npx prisma migrate deploy
```

#### 5. 构建应用

```bash
npm run build
```

#### 6. 创建 systemd 服务

```bash
sudo tee /etc/systemd/system/ccframe-web.service > /dev/null <<EOF
[Unit]
Description=CCFrame Web Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/ccframe
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/ccframe-worker.service > /dev/null <<EOF
[Unit]
Description=CCFrame Worker Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/ccframe
Environment="NODE_ENV=production"
Environment="START_WORKERS=true"
ExecStart=/usr/bin/node scripts/start-worker.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable ccframe-web ccframe-worker
sudo systemctl start ccframe-web ccframe-worker
```

#### 7. 验证部署

```bash
# 检查服务状态
sudo systemctl status ccframe-web
sudo systemctl status ccframe-worker

# 查看日志
sudo journalctl -u ccframe-web -f
sudo journalctl -u ccframe-worker -f

# 测试应用
curl http://localhost:3000/api/health
```

---

## Docker 镜像构建

如果需要自定义构建 Docker 镜像。

### 自动构建脚本

```bash
# 自动检测内存并构建
./build-docker.sh

# 手动指定内存限制
./build-docker.sh -m 1024  # 1GB
./build-docker.sh -m 2048  # 2GB
```

### 手动构建

```bash
# 自动检测
docker build -t ccframe:latest .

# 指定内存限制
docker build --build-arg MANUAL_MEMORY_MB=1024 -t ccframe:latest .

# 多平台构建
docker buildx build --platform linux/amd64,linux/arm64 -t ccframe:latest .
```

### 内存要求

| 可用内存 | 构建策略 | 预期时间 |
|---------|---------|----------|
| < 512MB | 极简模式，可能失败 | 很慢 |
| 512MB - 1GB | 保守模式 | 较慢 |
| 1GB - 2GB | 平衡模式 | 正常 |
| > 2GB | 优化模式 | 快速 |

### 推送到镜像仓库

```bash
# 登录 GitHub Container Registry
docker login ghcr.io -u YOUR_USERNAME

# 标记镜像
docker tag ccframe:latest ghcr.io/YOUR_USERNAME/ccframe:latest

# 推送
docker push ghcr.io/YOUR_USERNAME/ccframe:latest
```

---

## 环境变量配置

所有部署方式共享相同的环境变量配置。

### 必需变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@localhost:5432/ccframe` |
| `NEXTAUTH_SECRET` | NextAuth 密钥（32+ 字符） | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 应用公开访问地址 | `https://your-domain.com` |
| `ADMIN_EMAIL` | 管理员邮箱 | `admin@example.com` |
| `ADMIN_PASSWORD` | 管理员密码 | - |

### 推荐变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `REDIS_URL` | Redis 连接地址 | `redis://localhost:6379` |
| `INTERNAL_BASE_URL` | 内部服务地址 | `http://localhost:3000` |

### 存储配置

#### 本地存储

```env
STORAGE_PROVIDER=local
# 文件将保存在 uploads/ 目录
```

#### S3 兼容存储

```env
STORAGE_PROVIDER=s3
S3_BUCKET_NAME=ccframe
S3_REGION=us-east-1
S3_ENDPOINT=http://minio:9000  # MinIO
# S3_ENDPOINT=https://s3.amazonaws.com  # AWS S3
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
CDN_BASE_URL=https://cdn.your-domain.com  # 可选
```

### 图片处理配置

```env
IMAGE_PUBLIC_VARIANTS=false         # 是否公开访问变体
IMAGE_FORMATS=webp,jpeg             # 支持的格式
IMAGE_VARIANT_NAMES=thumb,small,medium  # 变体名称
NEXT_PUBLIC_IMAGE_SERVE_MODE=stream     # 服务模式
```

### 其他配置

```env
# 日志级别
LOG_LEVEL=info

# 速率限制
RATE_LIMIT_ENABLED=true

# 缓存 TTL（秒）
CACHE_TTL=3600
IMAGE_CACHE_TTL=31536000

# 遥测
NEXT_TELEMETRY_DISABLED=1
```

### 生成密钥

```bash
# 生成 NEXTAUTH_SECRET
openssl rand -base64 32

# 生成密码
openssl rand -base64 16
```

---

## Nginx 配置

### HTTP 配置（仅测试）

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### HTTPS 配置（生产环境）

```nginx
# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # 现代 SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头部
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 文件上传大小
    client_max_body_size 100M;

    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # 图片资源缓存
    location /api/image {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000";
    }
}
```

### 保存配置

```bash
# Ubuntu/Debian
sudo nano /etc/nginx/sites-available/ccframe
sudo ln -s /etc/nginx/sites-available/ccframe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# CentOS/RHEL
sudo nano /etc/nginx/conf.d/ccframe.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/HTTPS 配置

### Let's Encrypt（推荐）

#### 使用 Certbot

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置
sudo certbot --nginx -d your-domain.com

# 手动配置
sudo certbot certonly --standalone -d your-domain.com
```

#### 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# Certbot 会自动创建 cron job，也可以手动添加：
sudo crontab -e

# 添加以下行（每天检查）
0 3 * * * certbot renew --post-hook "systemctl reload nginx"
```

### Cloudflare（CDN）

如果使用 Cloudflare：

1. **DNS 设置**：
   - 添加 A 记录指向服务器 IP
   - 启用橙色云朵（代理模式）

2. **SSL/TLS 模式**：
   - 选择 "Full" 或 "Full (strict)"

3. **Nginx 配置**：
   - 监听 80 端口即可
   - Cloudflare 会在边缘提供 HTTPS

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Cloudflare 真实 IP
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    # ... 其他 Cloudflare IP 段
    real_ip_header CF-Connecting-IP;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... 其他配置
    }
}
```

---

## 监控与维护

### 健康检查

```bash
# 应用健康检查
curl http://localhost:3000/api/health-simple

# 返回示例
{
  "ok": true,
  "timestamp": "2025-10-01T12:00:00.000Z"
}
```

### Prometheus 指标

访问 `/api/metrics` 获取 Prometheus 格式的指标：

```bash
curl http://localhost:3000/api/metrics
```

主要指标：
- `ccframe_upload_events_total` - 上传事件计数
- `ccframe_http_request_duration_seconds` - HTTP 请求延迟
- `ccframe_db_query_duration_seconds` - 数据库查询延迟
- `ccframe_queue_processing_duration_seconds` - 队列处理时间

### 日志管理

#### systemd 日志

```bash
# 查看应用日志
sudo journalctl -u ccframe-web -f
sudo journalctl -u ccframe-worker -f

# 查看特定时间
sudo journalctl -u ccframe-web --since "1 hour ago"

# 导出日志
sudo journalctl -u ccframe-web > ccframe.log
```

#### Docker 日志

```bash
# 查看容器日志
docker compose logs -f web
docker compose logs -f worker

# 查看最近 100 行
docker compose logs --tail=100 web
```

### 备份策略

#### 数据库备份

```bash
#!/bin/bash
# /opt/ccframe/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ccframe"
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -h localhost -U ccframe_user ccframe_db > $BACKUP_DIR/db_$DATE.sql

# 压缩
gzip $BACKUP_DIR/db_$DATE.sql

# 清理 30 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Database backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

#### MinIO/存储备份

```bash
#!/bin/bash
# /opt/ccframe/backup-storage.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ccframe"
mkdir -p $BACKUP_DIR

# 备份 MinIO 数据
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /data/minio/

# 清理 30 天前的备份
find $BACKUP_DIR -name "storage_*.tar.gz" -mtime +30 -delete

echo "Storage backup completed: $BACKUP_DIR/storage_$DATE.tar.gz"
```

#### 自动备份定时任务

```bash
# 编辑 crontab
crontab -e

# 添加定时任务
# 每天凌晨 2 点备份数据库
0 2 * * * /opt/ccframe/backup-db.sh >> /var/log/ccframe-backup.log 2>&1

# 每周日凌晨 3 点备份存储
0 3 * * 0 /opt/ccframe/backup-storage.sh >> /var/log/ccframe-backup.log 2>&1
```

### 恢复

#### 恢复数据库

```bash
# 解压备份
gunzip /var/backups/ccframe/db_20250101_020000.sql.gz

# 恢复数据库
psql -h localhost -U ccframe_user ccframe_db < /var/backups/ccframe/db_20250101_020000.sql
```

#### 恢复存储

```bash
# 停止 MinIO
sudo systemctl stop minio

# 恢复数据
tar -xzf /var/backups/ccframe/storage_20250101_030000.tar.gz -C /

# 启动 MinIO
sudo systemctl start minio
```

---

## 性能优化

### PostgreSQL 优化

编辑 `/etc/postgresql/13/main/postgresql.conf`：

```conf
# 内存配置（根据服务器内存调整）
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
maintenance_work_mem = 64MB
work_mem = 4MB

# 连接配置
max_connections = 100

# 检查点配置
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# 查询优化
default_statistics_target = 100
random_page_cost = 1.1              # SSD: 1.1, HDD: 4
effective_io_concurrency = 200      # SSD: 200, HDD: 2

# 日志配置
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d.log'
log_statement = 'none'
log_duration = off
log_min_duration_statement = 1000   # 记录超过 1 秒的查询
```

重启 PostgreSQL：
```bash
sudo systemctl restart postgresql
```

### Redis 优化

编辑 `/etc/redis/redis.conf`：

```conf
# 内存限制
maxmemory 512mb
maxmemory-policy allkeys-lru

# 持久化（根据需求选择）
# RDB: 定期快照
save 900 1
save 300 10
save 60 10000

# AOF: 每次写入记录（更安全但慢）
appendonly yes
appendfsync everysec

# 性能优化
tcp-backlog 511
timeout 300
tcp-keepalive 300
```

重启 Redis：
```bash
sudo systemctl restart redis
```

### Next.js 优化

#### 环境变量

```env
# 生产环境优化
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048

# 禁用遥测
NEXT_TELEMETRY_DISABLED=1
```

#### 图片优化

```env
# 图片格式
IMAGE_FORMATS=webp,jpeg

# CDN 加速
CDN_BASE_URL=https://cdn.your-domain.com
```

### Nginx 优化

```nginx
# 工作进程数（通常等于 CPU 核心数）
worker_processes auto;

# 文件描述符限制
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # 缓冲区
    client_body_buffer_size 128k;
    client_max_body_size 100m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    output_buffers 1 32k;
    postpone_output 1460;

    # 超时设置
    client_header_timeout 3m;
    client_body_timeout 3m;
    send_timeout 3m;

    # 连接优化
    keepalive_timeout 65;
    keepalive_requests 100;

    # 文件缓存
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

---

## 故障排除

### 常见问题

#### 1. 数据库连接失败

**症状**：
- 应用无法启动
- 日志显示 "Connection refused" 或 "Authentication failed"

**排查**：
```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 测试连接
psql -h localhost -U ccframe_user -d ccframe_db

# 查看 PostgreSQL 日志
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

**解决**：
- 确认 `DATABASE_URL` 配置正确
- 检查用户权限：`GRANT ALL PRIVILEGES ON DATABASE ccframe_db TO ccframe_user;`
- 确认 PostgreSQL 监听地址（`postgresql.conf` 中的 `listen_addresses`）
- 检查防火墙规则

#### 2. Redis 连接失败

**症状**：
- 队列无法工作
- 缓存失效

**排查**：
```bash
# 检查 Redis 状态
sudo systemctl status redis

# 测试连接
redis-cli ping  # 应该返回 PONG

# 查看 Redis 日志
sudo tail -f /var/log/redis/redis-server.log
```

**解决**：
- 确认 `REDIS_URL` 配置正确
- 检查 Redis 配置文件中的 `bind` 地址
- 确保 Redis 端口（6379）未被占用

#### 3. 文件上传失败

**症状**：
- 上传接口返回错误
- 文件无法保存

**排查**：
```bash
# 检查存储配置
curl http://localhost:3000/api/health

# 本地存储：检查目录权限
ls -la uploads/

# MinIO：检查服务状态
sudo systemctl status minio
curl http://localhost:9000/minio/health/live
```

**解决**：

**本地存储**：
```bash
# 确保目录存在且可写
mkdir -p uploads
chmod 755 uploads
chown -R $USER:$USER uploads
```

**MinIO**：
```bash
# 检查 MinIO 配置
mc alias set local http://localhost:9000 minioadmin minioadmin123

# 检查 bucket
mc ls local/

# 重启 MinIO
sudo systemctl restart minio
```

#### 4. 图片无法显示

**症状**：
- 图片链接返回 404 或 500
- 缩略图不生成

**排查**：
```bash
# 检查 Sharp 库
npm list sharp

# 检查图片处理队列
curl http://localhost:3000/api/metrics | grep queue

# 查看 Worker 日志
sudo journalctl -u ccframe-worker -f
```

**解决**：
```bash
# 重新安装 Sharp
npm install sharp --force

# 重启 Worker
sudo systemctl restart ccframe-worker

# 检查环境变量
# IMAGE_FORMATS=webp,jpeg
# IMAGE_VARIANT_NAMES=thumb,small,medium
```

#### 5. Nginx 502 Bad Gateway

**症状**：
- 访问网站返回 502 错误

**排查**：
```bash
# 检查应用是否运行
curl http://localhost:3000/api/health

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查 Nginx 配置
sudo nginx -t
```

**解决**：
```bash
# 重启应用
sudo systemctl restart ccframe-web

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 重启 Nginx
sudo systemctl restart nginx
```

#### 6. 内存不足

**症状**：
- 应用频繁崩溃
- 日志显示 "Out of Memory"

**排查**：
```bash
# 查看内存使用
free -h
htop

# 查看进程内存
ps aux --sort=-%mem | head
```

**解决**：

**增加 Swap**：
```bash
# 创建 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**优化 Node.js**：
```bash
# 减少内存使用
NODE_OPTIONS="--max-old-space-size=1024"  # 限制为 1GB
```

#### 7. 速率限制触发

**症状**：
- API 返回 429 Too Many Requests

**排查**：
```bash
# 查看速率限制指标
curl http://localhost:3000/api/metrics | grep rate_limit
```

**解决**：
```env
# 临时禁用速率限制（仅测试环境）
RATE_LIMIT_ENABLED=false

# 或调整限制
# 编辑代码中的速率限制配置
```

#### 8. 构建失败

**症状**：
- `npm run build` 报错
- TypeScript 编译错误

**排查**：
```bash
# 清理缓存
rm -rf .next node_modules
npm install

# 检查 TypeScript
npm run type-check

# 检查 ESLint
npm run lint
```

**解决**：
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新生成 Prisma Client
npx prisma generate

# 重新构建
npm run build
```

### 日志位置

| 组件 | 日志位置 |
|------|----------|
| **应用 (systemd)** | `sudo journalctl -u ccframe-web` |
| **应用 (Docker)** | `docker compose logs web` |
| **Nginx** | `/var/log/nginx/error.log` |
| **PostgreSQL** | `/var/log/postgresql/` |
| **Redis** | `/var/log/redis/` |
| **MinIO** | `sudo journalctl -u minio` |

### 性能诊断

```bash
# 检查系统负载
top
htop

# 检查磁盘 I/O
iostat -x 1

# 检查网络
netstat -tunlp
ss -tunlp

# 检查数据库性能
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# 检查慢查询
sudo -u postgres psql -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### 安全检查

```bash
# 检查开放端口
sudo netstat -tulpn

# 检查防火墙
sudo ufw status

# 检查 SSL 证书
sudo certbot certificates

# 检查文件权限
find /var/www/ccframe -type f -perm /o+w
find /var/www/ccframe -type d -perm /o+w
```

---

## 附录

### 系统要求总结

**最小配置**：
- CPU: 1 核心
- 内存: 2GB
- 磁盘: 10GB
- 网络: 1Mbps

**推荐配置**：
- CPU: 2-4 核心
- 内存: 4-8GB
- 磁盘: 50GB+ SSD
- 网络: 10Mbps+

### 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | Nginx | HTTP |
| 443 | Nginx | HTTPS |
| 3000 | Next.js | 应用主端口 |
| 5432 | PostgreSQL | 数据库 |
| 6379 | Redis | 缓存和队列 |
| 9000 | MinIO | 对象存储 API |
| 9001 | MinIO | 管理控制台 |

### 有用的命令

```bash
# 快速重启所有服务
sudo systemctl restart ccframe-web ccframe-worker nginx postgresql redis minio

# 查看所有服务状态
sudo systemctl status ccframe-web ccframe-worker nginx postgresql redis minio

# 清理磁盘空间
docker system prune -a
sudo journalctl --vacuum-time=7d
sudo apt-get autoremove
sudo apt-get autoclean

# 导出配置
sudo tar -czf /tmp/ccframe-config-$(date +%Y%m%d).tar.gz \
  /var/www/ccframe/.env \
  /etc/nginx/sites-available/ccframe \
  /etc/systemd/system/ccframe-*.service

# 测试邮件（如果配置了）
curl -X POST http://localhost:3000/api/test-email

# 生成新的管理员密码
openssl rand -base64 16
```

### 相关链接

- **GitHub 仓库**: https://github.com/lonelyrower/CCFrame
- **Docker Hub**: https://hub.docker.com/r/lonelyrower/ccframe
- **GHCR**: https://ghcr.io/lonelyrower/ccframe
- **文档**: 项目 README.md

---

**文档版本**: 1.0.0  
**最后更新**: 2025-01-01  
**整合来源**: DEPLOYMENT.md, VPS_DEPLOYMENT.md, DOCKER_BUILD.md

如有问题，请在 GitHub Issues 中反馈。
