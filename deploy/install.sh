#!/bin/bash

# CCFrame 一键安装脚本 - 生产环境
# 支持 Ubuntu 20.04+ / Debian 11+ / CentOS 8+

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_error "请不要使用 root 用户运行此脚本！"
        log_info "请创建普通用户: sudo adduser ccframe && sudo usermod -aG sudo ccframe"
        exit 1
    fi
}

# 检测系统类型
detect_system() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "无法检测系统类型"
        exit 1
    fi

    log_info "检测到系统: $OS $VER"
}

# 安装基础依赖
install_dependencies() {
    log_info "更新系统包管理器..."

    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update && sudo apt upgrade -y
        sudo apt install -y curl wget git unzip software-properties-common gnupg2
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo yum update -y
        sudo yum install -y curl wget git unzip
    else
        log_error "不支持的系统类型: $OS"
        exit 1
    fi

    log_success "系统依赖安装完成"
}

# 安装 Node.js 20
install_nodejs() {
    log_info "安装 Node.js 20..."

    # 使用 NodeSource 官方源
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # 验证安装
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)

    log_success "Node.js 安装完成: $NODE_VERSION"
    log_success "NPM 版本: $NPM_VERSION"

    # 安装 PM2
    sudo npm install -g pm2
    log_success "PM2 安装完成"
}

# 安装 PostgreSQL
install_postgresql() {
    log_info "安装 PostgreSQL..."

    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql

    log_success "PostgreSQL 安装完成"
}

# 配置 PostgreSQL
setup_postgresql() {
    log_info "配置 PostgreSQL 数据库..."

    # 生成随机密码
    DB_PASSWORD=$(openssl rand -base64 32)
    DB_NAME="photo_gallery"
    DB_USER="gallery_user"

    # 创建数据库和用户
    sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

    # 保存数据库信息
    cat > ~/ccframe-db-config.txt << EOF
数据库配置信息：
数据库名: $DB_NAME
用户名: $DB_USER
密码: $DB_PASSWORD
连接字符串: postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

⚠️  请妥善保存此信息，安装完成后此文件将被删除！
EOF

    log_success "PostgreSQL 配置完成"
    log_warning "数据库密码已保存到 ~/ccframe-db-config.txt"
}

# 安装 Redis (可选)
install_redis() {
    read -p "是否安装 Redis 缓存服务？(推荐) [Y/n]: " install_redis_choice
    install_redis_choice=${install_redis_choice:-Y}

    if [[ "$install_redis_choice" =~ ^[Yy]$ ]]; then
        log_info "安装 Redis..."
        sudo apt install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server

        # 配置 Redis
        sudo sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
        sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
        sudo systemctl restart redis-server

        log_success "Redis 安装并配置完成"
        REDIS_URL="redis://localhost:6379"
    else
        log_info "跳过 Redis 安装"
        REDIS_URL=""
    fi
}

# 安装 Nginx
install_nginx() {
    log_info "安装 Nginx..."

    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx

    # 配置防火墙
    sudo ufw allow 'Nginx Full' 2>/dev/null || true

    log_success "Nginx 安装完成"
}

# 部署应用
deploy_application() {
    log_info "部署 CCFrame 应用..."

    # 获取项目
    APP_DIR="/var/www/ccframe"
    sudo mkdir -p /var/www
    sudo chown $USER:$USER /var/www

    if [ -d "$APP_DIR" ]; then
        log_warning "应用目录已存在，正在更新..."
        cd $APP_DIR
        git pull
    else
        log_info "克隆项目..."
        git clone https://github.com/your-username/ccframe.git $APP_DIR
        cd $APP_DIR
    fi

    # 安装依赖
    log_info "安装项目依赖..."
    npm install --production

    # 创建环境配置文件
    create_env_file

    # 数据库迁移
    log_info "执行数据库迁移..."
    npx prisma generate
    npx prisma migrate deploy

    # 构建生产版本
    log_info "构建生产版本..."
    npm run build

    log_success "应用部署完成"
}

# 创建环境配置文件
create_env_file() {
    log_info "创建生产环境配置文件..."

    # 生成密钥
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    cat > .env.production << EOF
# 生产环境配置 - 自动生成于 $(date)

# 数据库
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# 认证
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"

# Redis (如果安装了)
${REDIS_URL:+REDIS_URL="$REDIS_URL"}

# 存储 (使用本地存储)
STORAGE_PROVIDER="local"

# 环境
NODE_ENV="production"

# 管理员账户
ADMIN_EMAIL="admin@ccframe.local"
ADMIN_PASSWORD="$(openssl rand -base64 16)"

# 性能优化
NEXT_TELEMETRY_DISABLED=1
EOF

    log_success "环境配置文件创建完成"
}

# 配置 Nginx 反向代理
configure_nginx() {
    log_info "配置 Nginx 反向代理..."

    read -p "请输入您的域名 (留空使用服务器IP): " domain_name

    if [ -z "$domain_name" ]; then
        domain_name=$(curl -s http://checkip.amazonaws.com || echo "localhost")
        log_info "将使用 IP 地址: $domain_name"
    fi

    # 创建 Nginx 配置
    sudo tee /etc/nginx/sites-available/ccframe << EOF
server {
    listen 80;
    server_name $domain_name;

    client_max_body_size 100M;

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

    # 图片资源缓存优化
    location /api/image/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }

    # 静态资源缓存
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, immutable";
        expires 1y;
    }
}
EOF

    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/ccframe /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default

    # 测试配置
    sudo nginx -t && sudo systemctl reload nginx

    log_success "Nginx 配置完成"
}

# 创建 PM2 配置
create_pm2_config() {
    log_info "创建 PM2 进程管理配置..."

    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ccframe',
    script: './node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/ccframe',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max_old_space_size=1024'
  }]
}
EOF

    # 创建日志目录
    mkdir -p logs

    log_success "PM2 配置完成"
}

# 启动服务
start_services() {
    log_info "启动 CCFrame 服务..."

    cd $APP_DIR

    # 启动 PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup | tail -1 | bash

    log_success "CCFrame 服务启动完成"
}

# 安装 SSL 证书 (Let's Encrypt)
install_ssl() {
    if [ "$domain_name" != "localhost" ] && [[ ! "$domain_name" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        read -p "是否安装 SSL 证书？(需要有效域名) [Y/n]: " install_ssl_choice
        install_ssl_choice=${install_ssl_choice:-Y}

        if [[ "$install_ssl_choice" =~ ^[Yy]$ ]]; then
            log_info "安装 Let's Encrypt SSL 证书..."

            sudo apt install -y certbot python3-certbot-nginx
            sudo certbot --nginx -d $domain_name --non-interactive --agree-tos --email admin@$domain_name

            log_success "SSL 证书安装完成"
        fi
    fi
}

# 显示安装完成信息
show_completion_info() {
    log_success "🎉 CCFrame 安装完成！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 访问地址："
    if [[ "$domain_name" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [ "$domain_name" = "localhost" ]; then
        echo "   http://$domain_name"
    else
        echo "   https://$domain_name"
    fi
    echo ""
    echo "🔑 管理员账户："
    echo "   邮箱: admin@ccframe.local"
    echo "   密码: $(grep ADMIN_PASSWORD .env.production | cut -d'=' -f2 | tr -d '"')"
    echo ""
    echo "📁 应用目录: $APP_DIR"
    echo "📝 配置文件: $APP_DIR/.env.production"
    echo "📊 日志目录: $APP_DIR/logs"
    echo ""
    echo "🛠️ 常用命令："
    echo "   查看服务状态: pm2 status"
    echo "   查看日志: pm2 logs ccframe"
    echo "   重启服务: pm2 restart ccframe"
    echo "   停止服务: pm2 stop ccframe"
    echo ""
    echo "📚 更多信息请查看: https://github.com/your-username/ccframe"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 清理敏感文件
    rm -f ~/ccframe-db-config.txt
}

# 主安装流程
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎨 CCFrame 个人相册系统 - 一键安装脚本"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    check_root
    detect_system

    log_info "开始安装 CCFrame..."

    install_dependencies
    install_nodejs
    install_postgresql
    setup_postgresql
    install_redis
    install_nginx
    deploy_application
    configure_nginx
    create_pm2_config
    start_services
    install_ssl
    show_completion_info

    log_success "安装程序执行完毕！"
}

# 错误处理
trap 'log_error "安装过程中出现错误，请检查日志"; exit 1' ERR

# 执行主程序
main "$@"