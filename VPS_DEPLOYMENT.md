# VPS 生产环境部署指南

## 环境要求

- Ubuntu 20.04+ / CentOS 8+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- MinIO (可选，推荐)
- Nginx (反向代理)

## 1. 安装依赖

### PostgreSQL
```bash
# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE ccframe_db;
CREATE USER ccframe_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ccframe_db TO ccframe_user;
\q
```

### Redis
```bash
# Ubuntu
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### MinIO (推荐用于文件存储)
```bash
# 下载MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# 创建存储目录
sudo mkdir -p /data/minio
sudo useradd -s /sbin/nologin -d /data/minio minio
sudo chown -R minio:minio /data/minio

# 创建systemd服务
sudo tee /etc/systemd/system/minio.service > /dev/null <<EOF
[Unit]
Description=MinIO
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target
AssertFileIsExecutable=/usr/local/bin/minio

[Service]
WorkingDirectory=/data/minio
User=minio
Group=minio
ExecStart=/usr/local/bin/minio server /data/minio --console-address ":9001"
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=inherit
SyslogIdentifier=minio
KillSignal=SIGTERM
TimeoutStopSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable minio
sudo systemctl start minio
```

## 2. 应用部署

### 克隆项目
```bash
cd /var/www
sudo git clone https://github.com/yourusername/CCFrame.git
cd CCFrame
sudo chown -R $USER:$USER /var/www/CCFrame
```

### 配置环境变量
```bash
# 复制生产环境配置
cp .env.production .env

# 编辑配置文件
nano .env

# 必须修改的配置项：
# - DATABASE_URL
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL
# - ADMIN_EMAIL/ADMIN_PASSWORD
# - S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY
```

### 安装依赖和构建
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 创建系统服务
```bash
sudo tee /etc/systemd/system/ccframe.service > /dev/null <<EOF
[Unit]
Description=CC Frame Photo Gallery
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/CCFrame
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable ccframe
sudo systemctl start ccframe
```

## 3. Nginx 配置

```bash
sudo tee /etc/nginx/sites-available/ccframe > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL配置 (使用Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 文件上传大小限制
    client_max_body_size 100M;

    # 代理到Next.js应用
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # 图片资源缓存
    location /api/image {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000";
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/ccframe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 4. SSL证书 (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 5. 初始化数据

```bash
# 运行数据库迁移
npx prisma migrate deploy

# 创建管理员用户 (如果需要)
npm run seed:admin
```

## 6. 监控和维护

### 系统状态检查
```bash
# 检查服务状态
sudo systemctl status ccframe
sudo systemctl status postgresql
sudo systemctl status redis
sudo systemctl status minio

# 查看日志
sudo journalctl -u ccframe -f
```

### 备份脚本
```bash
#!/bin/bash
# /var/www/CCFrame/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/ccframe"
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump ccframe_db > $BACKUP_DIR/db_$DATE.sql

# 备份文件存储
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /data/minio

# 清理30天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### 定期任务
```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /var/www/CCFrame/backup.sh

# 每周重启应用 (可选)
0 3 * * 0 sudo systemctl restart ccframe
```

## 7. 性能优化

### PostgreSQL 优化
```sql
-- postgresql.conf 建议配置
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Redis 优化
```bash
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务状态
   - 验证DATABASE_URL配置
   - 确认防火墙设置

2. **文件上传失败**
   - 检查MinIO服务状态
   - 验证S3配置
   - 检查存储目录权限

3. **图片显示问题**
   - 确认NEXT_PUBLIC_IMAGE_SERVE_MODE设置
   - 检查Nginx缓存配置
   - 验证CDN设置

### 日志位置
- 应用日志: `sudo journalctl -u ccframe`
- Nginx日志: `/var/log/nginx/`
- PostgreSQL日志: `/var/log/postgresql/`
- MinIO日志: `sudo journalctl -u minio`

这样配置后，你的VPS将运行一个完整的生产级CCFrame实例，具备高性能和可扩展性。