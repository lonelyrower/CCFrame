#!/bin/bash

#==============================================================================
# CCFrame 一键部署管理脚本
# 用于快速部署、更新和管理 CCFrame 摄影展示项目
#==============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本版本
SCRIPT_VERSION="1.1.0"
SCRIPT_URL="https://raw.githubusercontent.com/lonelyrower/CCFrame/main/ccframe.sh"

# 默认配置
PROJECT_NAME="ccframe"
INSTALL_DIR="/opt/${PROJECT_NAME}"
DATA_DIR="${INSTALL_DIR}/data"
BACKUP_DIR="${INSTALL_DIR}/backups"
DOCKER_IMAGE="ghcr.io/lonelyrower/ccframe:latest"
GITHUB_REPO="https://github.com/lonelyrower/CCFrame.git"

#==============================================================================
# 工具函数
#==============================================================================

# 当脚本通过管道 (curl ... | bash) 运行时，stdin 不是终端，
# 交互式 read 会失败。尝试将 stdin 重新绑定到 /dev/tty 以允许交互输入。
ensure_tty_stdin() {
    if [ ! -t 0 ] && [ -e /dev/tty ]; then
        exec </dev/tty
    fi
}

# 移除 docker-compose 旧版 'version' 字段，消除警告
sanitize_compose_file() {
    local file="$INSTALL_DIR/docker-compose.yml"
    if [ -f "$file" ] && grep -q '^version:' "$file"; then
        print_info "修正 docker-compose.yml：删除已废弃的 version 字段"
        # 仅删除第一行的 version: 定义
        sed -i '/^version:/d' "$file"
    fi
}

# 从现有 .env 解析数据库密码（若存在且匹配常规格式）
parse_db_password_from_env() {
    local env_file="$INSTALL_DIR/.env"
    if [ -f "$env_file" ]; then
        local url
        url=$(grep -E '^DATABASE_URL=' "$env_file" | head -n1 | cut -d'=' -f2-)
        if [ -n "$url" ]; then
            # 提取密码（支持任意主机/端口），形如 postgresql://user:PASS@host:port/db
            local pass
            pass=$(printf '%s' "$url" | sed -n 's#^postgresql://[^:]*:\([^@]*\)@.*#\1#p')
            if [ -n "$pass" ]; then
                echo "$pass"
                return 0
            fi
        fi
    fi
    return 1
}

# 检测 Postgres 数据目录是否已初始化
postgres_data_exists() {
    [ -f "$DATA_DIR/postgres/PG_VERSION" ]
}

# 为镜像安装模式准备 DB 密码：若已有数据，则尽量复用现有 .env 中的密码
prepare_db_password_image() {
    if postgres_data_exists; then
        local existing
        if existing=$(parse_db_password_from_env); then
            DB_PASSWORD="$existing"
            export DB_PASSWORD
            print_info "检测到已存在的数据库数据，复用已有密码。"
            return 0
        fi
        print_warning "检测到已存在的数据库数据，但无法从 .env 解析密码。将继续使用新密码，数据库容器会忽略并沿用旧密码；请确保 .env 中的密码与数据库一致。"
    fi
    # 若无数据或无法解析，则维持外部生成的 DB_PASSWORD
    return 0
}

# 创建 .env（若不存在）；若已存在则不覆盖，避免破坏现有配置
ensure_env_file_image() {
    local env_file="$INSTALL_DIR/.env"
    if [ -f "$env_file" ]; then
        print_info ".env 已存在，跳过创建以保留现有配置。"
        return 0
    fi
    cat > "$env_file" <<EOF
DATABASE_URL=postgresql://ccframe:${DB_PASSWORD}@postgres:5432/ccframe
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${BASE_URL}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
BASE_URL=${BASE_URL}
EOF
}

# 计算 Compose 网络名（默认使用安装目录名作为 project name）
compose_network_name() {
    local project_name
    project_name=$(basename "$INSTALL_DIR")
    echo "${project_name}_ccframe-network"
}

ensure_prisma_binaries_image_mode() {
    print_info "刷新 Prisma Client 二进制 (容器内)..."
    if docker compose exec -T app npx prisma generate \
        --schema prisma/schema.prisma \
        --binary-targets native linux-musl linux-musl-openssl-3.0.x >/dev/null; then
        return 0
    fi
    return 1
}

# 在镜像容器内尝试运行迁移
run_migrations_image_mode() {
    print_info "运行数据库迁移 (容器内)..."
    if docker compose exec -T app npx prisma migrate deploy; then
        return 0
    fi
    return 1
}

# 使用临时 Debian Node 容器运行 Prisma 迁移（db push 回退）
run_migrations_ephemeral() {
    print_info "运行数据库迁移 (回退: Debian 临时容器)..."

    local network
    network=$(compose_network_name)

    # 准备临时目录并从应用容器拷贝 prisma 目录
    local tmp_dir="$INSTALL_DIR/tmp-prisma"
    rm -rf "$tmp_dir"
    mkdir -p "$tmp_dir"
    if ! docker cp ${PROJECT_NAME}-app:/app/prisma "$tmp_dir/" 2>/dev/null; then
        print_error "无法从应用容器拷贝 prisma 目录"
        return 1
    fi

    # 若无 migrations，则使用 db push 直接按 schema 同步
    local schema_path="/work/prisma/schema.prisma"
    local cmd_db_push="npx -y prisma@5.22.0 db push --schema=${schema_path} --skip-generate --accept-data-loss"

    if ! docker run --rm \
        --network "$network" \
        -e DATABASE_URL="postgresql://ccframe:${DB_PASSWORD}@postgres:5432/ccframe" \
        -v "$tmp_dir:/work" \
        node:18-bullseye bash -lc "${cmd_db_push}"; then
        return 1
    fi

    return 0
}

# 使用临时 Debian Node 容器运行种子脚本
run_seed_ephemeral() {
    print_info "创建管理员账户 (回退: Debian 临时容器)..."

    local network
    network=$(compose_network_name)

    local tmp_dir="$INSTALL_DIR/tmp-prisma"
    local tmp_scripts="$INSTALL_DIR/tmp-scripts"
    rm -rf "$tmp_scripts"
    mkdir -p "$tmp_scripts"
    if ! docker cp ${PROJECT_NAME}-app:/app/scripts "$tmp_scripts/" 2>/dev/null; then
        print_error "无法从应用容器拷贝 scripts 目录"
        return 1
    fi

    local schema_path="/work/prisma/schema.prisma"
    local seed_path="/work/scripts/seed-admin.js"

    local bootstrap="\
set -e; \
cd /work; \
npm -y init >/dev/null 2>&1; \
npm i -y prisma@5.22.0 @prisma/client@5.22.0 bcryptjs >/dev/null 2>&1; \
npx prisma generate --schema=${schema_path} --binary-targets native linux-musl linux-musl-openssl-3.0.x >/dev/null 2>&1; \
node ${seed_path}"

    if ! docker run --rm \
        --network "$network" \
        -e DATABASE_URL="postgresql://ccframe:${DB_PASSWORD}@postgres:5432/ccframe" \
        -e ADMIN_EMAIL="$ADMIN_EMAIL" \
        -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
        -v "$INSTALL_DIR/tmp-prisma:/work/prisma" \
        -v "$tmp_scripts:/work/scripts" \
        node:18-bullseye bash -lc "$bootstrap"; then
        return 1
    fi

    return 0
}

# 综合执行（镜像安装模式）：先尝试容器内迁移与种子，失败则用回退方案
run_migrations_and_seed_image_mode() {
    # 优先尝试在应用容器内完成
    if run_migrations_image_mode; then
        print_info "迁移成功，创建管理员账户..."
        local prisma_refreshed=true
        if ! ensure_prisma_binaries_image_mode; then
            print_warning "容器内刷新 Prisma Client 失败，可能存在缺失的二进制，将尝试回退方案..."
            prisma_refreshed=false
        fi
        if docker compose exec -T \
            -e ADMIN_EMAIL="$ADMIN_EMAIL" \
            -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
            app npm run seed; then
            return 0
        else
            print_warning "容器内种子失败，尝试回退方案..."
        fi
        if [ "$prisma_refreshed" = false ]; then
            print_warning "由于 Prisma Client 未成功刷新，回退方案可能仍会失败。"
        fi
    else
        print_warning "容器内迁移失败，检查数据库是否为全新实例..."
        # 检查是否为全新数据库（public schema 下用户表数量）
        local table_count
        table_count=$(docker compose exec -T postgres psql -U ccframe -d ccframe -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d '[:space:]')
        if [ -z "$table_count" ]; then
            table_count=0
        fi
        if [ "$table_count" -gt 0 ]; then
            print_error "检测到数据库已有表，出于安全考虑不使用回退方案（db push）。"
            return 1
        fi
        print_info "数据库为空，使用回退方案初始化..."
    fi

    # 回退：使用 Debian 临时容器完成迁移与种子
    if ! run_migrations_ephemeral; then
        return 1
    fi
    if ! run_seed_ephemeral; then
        return 1
    fi
    # 清理临时目录
    rm -rf "$INSTALL_DIR/tmp-prisma" "$INSTALL_DIR/tmp-scripts" 2>/dev/null || true
    return 0
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  CCFrame 摄影展示项目 - 部署管理脚本 v${SCRIPT_VERSION}            ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

pause_for_menu() {
    echo ""
    read -p "按 Enter 返回主菜单..." _
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "此脚本需要 root 权限运行"
        echo "请使用: sudo bash $0"
        exit 1
    fi
}

check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        print_error "无法检测操作系统"
        exit 1
    fi

    print_info "检测到操作系统: $OS $OS_VERSION"
}

#==============================================================================
# 系统依赖安装
#==============================================================================

install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker 已安装: $(docker --version)"
        return
    fi

    print_info "开始安装 Docker..."

    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y ca-certificates curl gnupg lsb-release

            # 添加 Docker 官方 GPG key
            mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

            # 设置仓库
            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
              $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

            # 安装 Docker
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;

        centos|rhel|fedora)
            yum install -y yum-utils
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            systemctl start docker
            systemctl enable docker
            ;;

        *)
            print_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac

    print_success "Docker 安装完成"
}

install_dependencies() {
    print_info "安装系统依赖..."

    case $OS in
        ubuntu|debian)
            apt-get update
            apt-get install -y curl git wget nano vim
            ;;
        centos|rhel|fedora)
            yum install -y curl git wget nano vim
            ;;
    esac

    print_success "系统依赖安装完成"
}

#==============================================================================
# SSL 证书管理
#==============================================================================

install_nginx() {
    if command -v nginx &> /dev/null; then
        print_success "Nginx 已安装"
        return
    fi

    print_info "安装 Nginx..."

    case $OS in
        ubuntu|debian)
            apt-get install -y nginx
            ;;
        centos|rhel|fedora)
            yum install -y nginx
            ;;
    esac

    systemctl enable nginx
    print_success "Nginx 安装完成"
}

install_certbot() {
    if command -v certbot &> /dev/null; then
        print_success "Certbot 已安装"
        return
    fi

    print_info "安装 Certbot..."

    case $OS in
        ubuntu|debian)
            apt-get install -y certbot python3-certbot-nginx
            ;;
        centos|rhel|fedora)
            yum install -y certbot python3-certbot-nginx
            ;;
    esac

    print_success "Certbot 安装完成"
}

setup_letsencrypt() {
    local domain=$1
    local email=$2

    print_info "为域名 $domain 申请 Let's Encrypt SSL 证书..."

    # 停止 Nginx 以释放 80 端口
    systemctl stop nginx 2>/dev/null || true

    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$email" \
        -d "$domain"

    if [ $? -eq 0 ]; then
        print_success "SSL 证书申请成功"

        # 设置自动续期
        (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
        print_info "已设置证书自动续期（每天凌晨3点检查）"
    else
        print_error "SSL 证书申请失败"
        exit 1
    fi
}

#==============================================================================
# Nginx 配置
#==============================================================================

configure_nginx_ssl() {
    local domain=$1
    local mode=$2  # letsencrypt 或 cloudflare

    print_info "配置 Nginx SSL..."

    # 选择配置目录（Debian系使用 sites-available，RHEL系使用 conf.d）
    local nginx_conf_dir
    local use_sites=true
    case $OS in
        ubuntu|debian)
            nginx_conf_dir="/etc/nginx/sites-available"
            ;;
        centos|rhel|fedora)
            nginx_conf_dir="/etc/nginx/conf.d"
            use_sites=false
            ;;
        *)
            nginx_conf_dir="/etc/nginx/conf.d"
            use_sites=false
            ;;
    esac

    mkdir -p "$nginx_conf_dir"

    local target_conf
    if [ "$use_sites" = true ]; then
        target_conf="/etc/nginx/sites-available/${PROJECT_NAME}"
    else
        target_conf="${nginx_conf_dir}/${PROJECT_NAME}.conf"
    fi

    if [ "$mode" == "letsencrypt" ]; then
        cat > "$target_conf" <<EOF
server {
    listen 80;
    server_name ${domain};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    else
        # Cloudflare 模式：不需要 SSL 证书文件，Cloudflare 会处理
        cat > "$target_conf" <<EOF
server {
    listen 80;
    server_name ${domain};

    # Cloudflare Real IP
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    real_ip_header CF-Connecting-IP;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    fi

    # Debian/Ubuntu: 启用站点配置
    if [ "$use_sites" = true ]; then
        mkdir -p /etc/nginx/sites-enabled
        ln -sf "$target_conf" /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    else
        rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
    fi

    # 测试配置
    nginx -t

    # 重启 Nginx
    systemctl restart nginx
    systemctl enable nginx

    print_success "Nginx 配置完成"
}

configure_nginx_simple() {
    print_info "配置 Nginx (无 SSL)..."

    # 选择配置目录（Debian系使用 sites-available，RHEL系使用 conf.d）
    local nginx_conf_dir
    local use_sites=true
    case $OS in
        ubuntu|debian)
            nginx_conf_dir="/etc/nginx/sites-available"
            ;;
        centos|rhel|fedora)
            nginx_conf_dir="/etc/nginx/conf.d"
            use_sites=false
            ;;
        *)
            nginx_conf_dir="/etc/nginx/conf.d"
            use_sites=false
            ;;
    esac

    mkdir -p "$nginx_conf_dir"

    local target_conf
    if [ "$use_sites" = true ]; then
        target_conf="/etc/nginx/sites-available/${PROJECT_NAME}"
    else
        target_conf="${nginx_conf_dir}/${PROJECT_NAME}.conf"
    fi

    cat > "$target_conf" <<EOF
server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    if [ "$use_sites" = true ]; then
        mkdir -p /etc/nginx/sites-enabled
        ln -sf "$target_conf" /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    else
        rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
    fi
    nginx -t
    systemctl restart nginx
    systemctl enable nginx

    print_success "Nginx 配置完成"
}

#==============================================================================
# Docker 部署
#==============================================================================

install_from_image() {
    print_info "从 Docker 镜像安装..."

    # 创建必要目录（新结构：public/private 分离）
    mkdir -p "$DATA_DIR"/{public_uploads,private_uploads,backups}
    mkdir -p "$INSTALL_DIR"

    # 若已有数据库数据，则复用原有密码；否则维持新随机密码
    prepare_db_password_image

    # 创建 .env（首次安装创建，已存在则保留）
    ensure_env_file_image

    # 创建 docker-compose.yml
    cat > "$INSTALL_DIR/docker-compose.yml" <<EOF
services:
  postgres:
    image: postgres:16-alpine
    container_name: ${PROJECT_NAME}-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ccframe
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ccframe
    volumes:
      - ${DATA_DIR}/postgres:/var/lib/postgresql/data
    networks:
      - ccframe-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ccframe"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: ${DOCKER_IMAGE}
    container_name: ${PROJECT_NAME}-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ${DATA_DIR}/public_uploads:/app/public/uploads
      - ${DATA_DIR}/private_uploads:/app/private/uploads
      - ${DATA_DIR}/backups:/app/backups
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ccframe-network

networks:
  ccframe-network:
    driver: bridge
EOF

    # 拉取镜像
    print_info "拉取 Docker 镜像..."
    docker pull "$DOCKER_IMAGE"

    # 启动服务
    cd "$INSTALL_DIR"
    sanitize_compose_file
    docker compose up -d

    # 等待服务启动
    print_info "等待服务启动..."
    sleep 10

    # 运行数据库迁移（含回退方案）
    if ! run_migrations_and_seed_image_mode; then
        print_error "初始化数据库与管理员失败"
        print_info "请查看日志并考虑选择 源码安装 模式重试"
        exit 1
    fi

    print_success "从镜像安装完成"
}

install_from_source() {
    print_info "从源码安装..."

    # 安装 Node.js 18
    if ! command -v node &> /dev/null; then
        print_info "安装 Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        case $OS in
            ubuntu|debian)
                apt-get install -y nodejs
                ;;
            centos|rhel|fedora)
                yum install -y nodejs
                ;;
        esac
    fi

    # 准备源码目录
    local temp_repo=""
    if [ -d "$INSTALL_DIR/.git" ]; then
        print_warning "检测到安装目录已存在 Git 仓库，将重置为远程 main 分支。"
        read -p "是否继续覆盖现有源码? [y/N]: " source_reset_confirm
        if [[ ! "$source_reset_confirm" =~ ^[Yy]$ ]]; then
            print_error "已取消源码安装"
            return
        fi
        print_info "同步远程源码..."
        git -C "$INSTALL_DIR" fetch origin
        git -C "$INSTALL_DIR" reset --hard origin/main
    else
        if [ -d "$INSTALL_DIR" ] && [ "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
            print_warning "检测到安装目录已存在内容，将保留 data/ 与 backups/ 目录，其余文件会被覆盖。"
            read -p "确认继续? [y/N]: " wipe_confirm
            if [[ ! "$wipe_confirm" =~ ^[Yy]$ ]]; then
                print_error "已取消源码安装"
                return
            fi
        fi

        print_info "克隆代码仓库..."
        temp_repo=$(mktemp -d)
        if ! git clone "$GITHUB_REPO" "$temp_repo/repo"; then
            print_error "克隆仓库失败，请检查网络或仓库地址"
            rm -rf "$temp_repo"
            return
        fi

        mkdir -p "$INSTALL_DIR"
        local item base
        shopt -s dotglob nullglob
        for item in "$INSTALL_DIR"/*; do
            base=$(basename "$item")
            if [ "$base" = "data" ] || [ "$base" = "backups" ]; then
                continue
            fi
            rm -rf "$item"
        done
        shopt -u dotglob nullglob

        cp -a "$temp_repo/repo"/. "$INSTALL_DIR"/
        rm -rf "$temp_repo"
    fi

    cd "$INSTALL_DIR"

    # 创建必要目录（源码模式保留本地上传目录在项目内）
    mkdir -p "$DATA_DIR"/{backups,postgres}
    mkdir -p "$INSTALL_DIR/public/uploads" "$INSTALL_DIR/private/uploads"

    # 创建 .env 文件（若不存在）。如存在数据库数据则优先复用旧密码
    if postgres_data_exists; then
        local existing
        if existing=$(parse_db_password_from_env); then
            DB_PASSWORD="$existing"
            export DB_PASSWORD
            print_info "检测到已存在的数据库数据，复用已有密码。"
        fi
    fi
    if [ ! -f "$INSTALL_DIR/.env" ]; then
        cat > "$INSTALL_DIR/.env" <<EOF
DATABASE_URL=postgresql://ccframe:${DB_PASSWORD}@localhost:5432/ccframe
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=${BASE_URL}
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
BASE_URL=${BASE_URL}
EOF
    else
        print_info ".env 已存在，跳过创建以保留现有配置。"
    fi

    # 启动 PostgreSQL（Compose）
    cat > "$INSTALL_DIR/docker-compose.yml" <<EOF
services:
  postgres:
    image: postgres:16-alpine
    container_name: ${PROJECT_NAME}-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ccframe
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ccframe
    volumes:
      - ${DATA_DIR}/postgres:/var/lib/postgresql/data
EOF

    docker compose up -d
    sleep 5

    # 安装依赖
    print_info "安装 NPM 依赖..."
    npm ci

    # 生成 Prisma Client
    print_info "生成 Prisma Client..."
    npx prisma generate

    # 运行数据库迁移
    print_info "运行数据库迁移..."
    npx prisma migrate deploy

    # 创建管理员
    print_info "创建管理员账户..."
    npm run seed

    # 构建应用
    print_info "构建应用..."
    npm run build

    # 创建 systemd 服务
    cat > /etc/systemd/system/${PROJECT_NAME}.service <<EOF
[Unit]
Description=CCFrame Photography Showcase
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ${PROJECT_NAME}
    systemctl start ${PROJECT_NAME}

    print_success "从源码安装完成"
}

#==============================================================================
# 安装主流程
#==============================================================================

do_install() {
    print_header

    echo "请选择部署模式："
    echo "1. 完整部署 (域名 + Let's Encrypt SSL + HTTPS)"
    echo "2. Cloudflare部署 (域名 + Cloudflare SSL + HTTPS)"
    echo "3. 简单部署 (仅IP访问，无SSL)"
    echo ""
    read -p "请输入选项 [1-3, 默认1]: " deploy_mode
    deploy_mode=${deploy_mode:-1}

    case $deploy_mode in
        1)
            DEPLOY_MODE="letsencrypt"
            read -p "请输入您的域名: " DOMAIN
            read -p "请输入您的邮箱 (用于SSL证书): " EMAIL
            BASE_URL="https://${DOMAIN}"
            ;;
        2)
            DEPLOY_MODE="cloudflare"
            read -p "请输入您的域名: " DOMAIN
            BASE_URL="https://${DOMAIN}"
            print_warning "请确保已在 Cloudflare 中设置 SSL 为 Full 模式"
            ;;
        3)
            DEPLOY_MODE="simple"
            SERVER_IP=$(curl -s ifconfig.me || true)
            if [ -z "$SERVER_IP" ]; then
                SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
            fi
            if [ -z "$SERVER_IP" ]; then
                SERVER_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++){if($i=="src"){print $(i+1); exit}}}')
            fi
            if [ -z "$SERVER_IP" ]; then
                SERVER_IP="127.0.0.1"
            fi
            DOMAIN=""
            BASE_URL="http://${SERVER_IP}"
            print_info "检测到服务器IP: $SERVER_IP"
            ;;
        *)
            print_error "无效选项"
            exit 1
            ;;
    esac

    # 配置参数
    read -p "管理员邮箱 [admin@example.com]: " ADMIN_EMAIL
    ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}

    local admin_password_auto=false
    read -sp "管理员密码 (留空自动生成): " ADMIN_PASSWORD
    echo ""
    if [ -z "$ADMIN_PASSWORD" ]; then
        ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-18)
        admin_password_auto=true
        print_warning "已为您自动生成随机管理员密码。"
    fi

    # 生成随机密钥
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    print_info "配置总结:"
    echo "  部署模式: $DEPLOY_MODE"
    echo "  访问地址: $BASE_URL"
    echo "  管理员邮箱: $ADMIN_EMAIL"
    echo ""

    read -p "确认安装? [y/N]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_error "安装已取消"
        exit 0
    fi

    # 检查系统
    check_root
    check_os

    # 安装依赖
    install_dependencies
    install_docker

    # 配置 Nginx 和 SSL
    if [ "$DEPLOY_MODE" != "simple" ]; then
        install_nginx
        if [ "$DEPLOY_MODE" == "letsencrypt" ]; then
            install_certbot
            setup_letsencrypt "$DOMAIN" "$EMAIL"
            configure_nginx_ssl "$DOMAIN" "letsencrypt"
        else
            configure_nginx_ssl "$DOMAIN" "cloudflare"
        fi
    else
        install_nginx
        configure_nginx_simple
    fi

    # 选择安装方式
    echo ""
    echo "请选择安装方式："
    echo "1. 镜像安装 (推荐，速度快)"
    echo "2. 源码安装 (适合开发)"
    echo ""
    read -p "请输入选项 [1-2, 默认1]: " install_type
    install_type=${install_type:-1}

    case $install_type in
        1)
            install_from_image
            ;;
        2)
            install_from_source
            ;;
        *)
            print_error "无效选项"
            exit 1
            ;;
    esac

    print_success "========================================"
    print_success "CCFrame 安装完成！"
    print_success "========================================"
    echo ""
    echo "访问地址: $BASE_URL"
    echo "管理员邮箱: $ADMIN_EMAIL"
    echo "管理员密码: $ADMIN_PASSWORD"
    echo ""
    echo "管理后台: $BASE_URL/admin/login"
    echo ""
    print_warning "请妥善保管您的登录凭据！"
    if [ "$admin_password_auto" = true ]; then
        print_warning "管理员密码为系统随机生成，建议首次登录后及时修改。"
    fi
    echo ""
}

#==============================================================================
# 更新功能
#==============================================================================

do_update() {
    print_header
    print_info "开始更新 CCFrame..."

    if [ ! -d "$INSTALL_DIR" ]; then
        print_error "未检测到安装，请先运行安装"
        exit 1
    fi

    cd "$INSTALL_DIR"

    echo "请选择更新方式："
    echo "1. 镜像更新 (推荐，速度快)"
    echo "2. 源码更新"
    echo ""
    read -p "请输入选项 [1-2, 默认1]: " update_type
    update_type=${update_type:-1}

    # 备份数据
    print_info "备份当前数据..."
    backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR/$backup_name"

    if [ -f "docker-compose.yml" ]; then
        docker compose exec -T postgres pg_dump -U ccframe ccframe > "$BACKUP_DIR/$backup_name/database.sql"
    fi

    # 备份上传目录（容器模式与源码模式兼容）
    if [ -d "$DATA_DIR/public_uploads" ] || [ -d "$DATA_DIR/private_uploads" ]; then
        mkdir -p "$BACKUP_DIR/$backup_name/uploads"
        [ -d "$DATA_DIR/public_uploads" ] && cp -r "$DATA_DIR/public_uploads" "$BACKUP_DIR/$backup_name/uploads/" 2>/dev/null || true
        [ -d "$DATA_DIR/private_uploads" ] && cp -r "$DATA_DIR/private_uploads" "$BACKUP_DIR/$backup_name/uploads/" 2>/dev/null || true
    else
        if [ -d "$INSTALL_DIR/public/uploads" ] || [ -d "$INSTALL_DIR/private/uploads" ]; then
            mkdir -p "$BACKUP_DIR/$backup_name/uploads/public" "$BACKUP_DIR/$backup_name/uploads/private"
            [ -d "$INSTALL_DIR/public/uploads" ] && cp -r "$INSTALL_DIR/public/uploads" "$BACKUP_DIR/$backup_name/uploads/public/" 2>/dev/null || true
            [ -d "$INSTALL_DIR/private/uploads" ] && cp -r "$INSTALL_DIR/private/uploads" "$BACKUP_DIR/$backup_name/uploads/private/" 2>/dev/null || true
        fi
    fi

    print_success "数据备份完成: $BACKUP_DIR/$backup_name"

    case $update_type in
        1)
            print_info "拉取最新镜像..."
            docker pull "$DOCKER_IMAGE"

            print_info "重启服务..."
            sanitize_compose_file
            docker compose up -d --force-recreate

            sleep 5

            print_info "运行数据库迁移..."
            if ! run_migrations_image_mode; then
                print_error "数据库迁移失败"
                print_info "请检查日志: docker compose logs app"
                print_info "如为全新安装，建议使用安装菜单的 镜像安装 或 源码安装；如为升级，建议先修复应用镜像中的 Prisma 引擎后再更新。"
                exit 1
            fi
            ;;
        2)
            if [ ! -d "$INSTALL_DIR/.git" ]; then
                print_error "未检测到源码安装目录 (.git)，无法执行源码更新。"
                print_info "请使用镜像更新，或先通过源码安装重新部署。"
                return
            fi
            print_info "拉取最新代码..."
            git pull origin main

            print_info "安装依赖..."
            npm ci

            print_info "生成 Prisma Client..."
            npx prisma generate

            print_info "运行数据库迁移..."
            npx prisma migrate deploy

            print_info "重新构建..."
            npm run build

            print_info "重启服务..."
            if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
                systemctl restart ${PROJECT_NAME}
            else
                docker compose up -d --force-recreate
            fi
            ;;
        *)
            print_error "无效选项"
            exit 1
            ;;
    esac

    print_success "更新完成！"
}

#==============================================================================
# 管理功能
#==============================================================================

do_status() {
    print_header
    print_info "CCFrame 服务状态："
    echo ""

    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
    cd "$INSTALL_DIR"
    sanitize_compose_file
    docker compose ps
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        echo ""
        systemctl status ${PROJECT_NAME} --no-pager
    fi

    echo ""
    print_info "Nginx 状态:"
    systemctl status nginx --no-pager | head -5
}

do_logs() {
    print_header

    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        cd "$INSTALL_DIR"
        echo "Docker 服务日志 (按 Ctrl+C 退出):"
        echo ""
        docker compose logs -f --tail=100
    elif [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        echo "系统服务日志 (按 Ctrl+C 退出):"
        echo ""
        journalctl -u ${PROJECT_NAME} -f -n 100
    else
        print_error "未找到服务"
    fi
}

do_restart() {
    print_header
    print_info "重启 CCFrame 服务..."

    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        cd "$INSTALL_DIR"
        docker compose restart
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        systemctl restart ${PROJECT_NAME}
    fi

    print_info "重启 Nginx..."
    systemctl restart nginx

    print_success "服务重启完成"
}

do_stop() {
    print_header
    print_info "停止 CCFrame 服务..."

    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        cd "$INSTALL_DIR"
        docker compose stop
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        systemctl stop ${PROJECT_NAME}
    fi

    print_success "服务已停止"
}

do_start() {
    print_header
    print_info "启动 CCFrame 服务..."

    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        cd "$INSTALL_DIR"
        docker compose start
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        systemctl start ${PROJECT_NAME}
    fi

    print_success "服务已启动"
}

#==============================================================================
# 备份和恢复
#==============================================================================

do_backup() {
    print_header
    print_info "创建备份..."

    backup_name="manual-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR/$backup_name"

    # 备份数据库
    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        cd "$INSTALL_DIR"
        print_info "备份数据库..."
        docker compose exec -T postgres pg_dump -U ccframe ccframe > "$BACKUP_DIR/$backup_name/database.sql"
    fi

    # 备份上传文件
    print_info "备份上传文件..."
    # 容器模式：使用 data 目录下的 public/private_uploads
    if [ -d "$DATA_DIR/public_uploads" ] || [ -d "$DATA_DIR/private_uploads" ]; then
        mkdir -p "$BACKUP_DIR/$backup_name/uploads"
        if [ -d "$DATA_DIR/public_uploads" ]; then
            cp -r "$DATA_DIR/public_uploads" "$BACKUP_DIR/$backup_name/uploads/" 2>/dev/null || true
        fi
        if [ -d "$DATA_DIR/private_uploads" ]; then
            cp -r "$DATA_DIR/private_uploads" "$BACKUP_DIR/$backup_name/uploads/" 2>/dev/null || true
        fi
    else
        # 源码模式：直接从项目目录下的 public/private/uploads
        if [ -d "$INSTALL_DIR/public/uploads" ] || [ -d "$INSTALL_DIR/private/uploads" ]; then
            mkdir -p "$BACKUP_DIR/$backup_name/uploads/public" "$BACKUP_DIR/$backup_name/uploads/private"
            if [ -d "$INSTALL_DIR/public/uploads" ]; then
                cp -r "$INSTALL_DIR/public/uploads" "$BACKUP_DIR/$backup_name/uploads/public/" 2>/dev/null || true
            fi
            if [ -d "$INSTALL_DIR/private/uploads" ]; then
                cp -r "$INSTALL_DIR/private/uploads" "$BACKUP_DIR/$backup_name/uploads/private/" 2>/dev/null || true
            fi
        fi
    fi

    # 备份配置
    print_info "备份配置文件..."
    cp "$INSTALL_DIR/.env" "$BACKUP_DIR/$backup_name/" 2>/dev/null || true

    # 创建压缩包
    cd "$BACKUP_DIR"
    tar -czf "${backup_name}.tar.gz" "$backup_name"
    rm -rf "$backup_name"

    print_success "备份完成: $BACKUP_DIR/${backup_name}.tar.gz"
}

do_restore() {
    print_header

    echo "可用的备份:"
    echo ""
    ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "  (无备份文件)"
    echo ""

    read -p "请输入备份文件名 (不含路径): " backup_file

    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        print_error "备份文件不存在"
        exit 1
    fi

    read -p "确认恢复备份? 这将覆盖当前数据! [y/N]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_error "恢复已取消"
        exit 0
    fi

    # 解压备份
    cd "$BACKUP_DIR"
    tar -xzf "$backup_file"
    backup_dir="${backup_file%.tar.gz}"

    # 恢复数据库
    if [ -f "$backup_dir/database.sql" ]; then
        print_info "恢复数据库..."
        cd "$INSTALL_DIR"
        docker compose exec -T postgres psql -U ccframe -d ccframe < "$BACKUP_DIR/$backup_dir/database.sql"
    fi

    # 恢复上传文件（兼容容器模式与源码模式的目录结构）
    print_info "恢复上传文件..."
    # 优先容器模式
    if [ -d "$DATA_DIR" ]; then
        mkdir -p "$DATA_DIR/public_uploads" "$DATA_DIR/private_uploads"
        if [ -d "$backup_dir/uploads/public_uploads" ]; then
            rm -rf "$DATA_DIR/public_uploads"
            cp -r "$backup_dir/uploads/public_uploads" "$DATA_DIR/" 2>/dev/null || true
        elif [ -d "$backup_dir/public_uploads" ]; then
            rm -rf "$DATA_DIR/public_uploads"
            cp -r "$backup_dir/public_uploads" "$DATA_DIR/" 2>/dev/null || true
        fi
        if [ -d "$backup_dir/uploads/private_uploads" ]; then
            rm -rf "$DATA_DIR/private_uploads"
            cp -r "$backup_dir/uploads/private_uploads" "$DATA_DIR/" 2>/dev/null || true
        elif [ -d "$backup_dir/private_uploads" ]; then
            rm -rf "$DATA_DIR/private_uploads"
            cp -r "$backup_dir/private_uploads" "$DATA_DIR/" 2>/dev/null || true
        fi
    fi

    # 源码模式：项目内 public/private/uploads
    if [ -d "$INSTALL_DIR/public" ] || [ -d "$INSTALL_DIR/private" ]; then
        mkdir -p "$INSTALL_DIR/public/uploads" "$INSTALL_DIR/private/uploads"
        if [ -d "$backup_dir/uploads/public/uploads" ]; then
            rm -rf "$INSTALL_DIR/public/uploads"
            cp -r "$backup_dir/uploads/public/uploads" "$INSTALL_DIR/public/" 2>/dev/null || true
        elif [ -d "$backup_dir/public/uploads" ]; then
            rm -rf "$INSTALL_DIR/public/uploads"
            cp -r "$backup_dir/public/uploads" "$INSTALL_DIR/public/" 2>/dev/null || true
        fi
        if [ -d "$backup_dir/uploads/private/uploads" ]; then
            rm -rf "$INSTALL_DIR/private/uploads"
            cp -r "$backup_dir/uploads/private/uploads" "$INSTALL_DIR/private/" 2>/dev/null || true
        elif [ -d "$backup_dir/private/uploads" ]; then
            rm -rf "$INSTALL_DIR/private/uploads"
            cp -r "$backup_dir/private/uploads" "$INSTALL_DIR/private/" 2>/dev/null || true
        fi
    fi

    # 恢复配置
    if [ -f "$backup_dir/.env" ]; then
        print_info "恢复配置文件..."
        cp "$backup_dir/.env" "$INSTALL_DIR/"
    fi

    # 清理
    rm -rf "$BACKUP_DIR/$backup_dir"

    print_success "恢复完成，请重启服务"
}

#==============================================================================
# 卸载
#==============================================================================

do_uninstall() {
    print_header
    print_warning "警告: 这将完全删除 CCFrame 及其所有数据！"
    echo ""
    read -p "是否在卸载前创建备份? [Y/n]: " backup_confirm

    if [[ ! "$backup_confirm" =~ ^[Nn]$ ]]; then
        do_backup
    fi

    echo ""
    read -p "确认卸载? 输入 'YES' 继续: " confirm

    if [ "$confirm" != "YES" ]; then
        print_error "卸载已取消"
        exit 0
    fi

    print_info "开始卸载..."

    # 停止服务
    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        cd "$INSTALL_DIR"
        docker compose down -v
    fi

    if [ -f "/etc/systemd/system/${PROJECT_NAME}.service" ]; then
        systemctl stop ${PROJECT_NAME}
        systemctl disable ${PROJECT_NAME}
        rm -f "/etc/systemd/system/${PROJECT_NAME}.service"
        systemctl daemon-reload
    fi

    # 删除 Nginx 配置（兼容 Debian/Ubuntu 与 RHEL/Fedora）
    rm -f "/etc/nginx/sites-enabled/${PROJECT_NAME}" 2>/dev/null || true
    rm -f "/etc/nginx/sites-available/${PROJECT_NAME}" 2>/dev/null || true
    rm -f "/etc/nginx/conf.d/${PROJECT_NAME}.conf" 2>/dev/null || true
    systemctl reload nginx 2>/dev/null || true

    # 删除文件
    print_warning "是否删除数据目录? (包含上传的照片)"
    read -p "选择 [y/N, 默认N]: " delete_data

    if [[ "$delete_data" =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
        print_info "已删除所有数据"
    else
        rm -rf "$INSTALL_DIR"/{app,docker-compose.yml,.env}
        print_info "已保留数据目录: $DATA_DIR 和 $BACKUP_DIR"
    fi

    print_success "卸载完成"
    # 明确退出，避免在某些运行环境中返回菜单等待输入
    exit 0
}

#==============================================================================
# 更新脚本
#==============================================================================

do_update_script() {
    print_header
    print_info "更新脚本到最新版本..."

    # 下载最新脚本到临时文件
    temp_script="/tmp/ccframe-new.sh"
    if ! curl -fsSL "$SCRIPT_URL" -o "$temp_script"; then
        print_error "下载失败，请检查网络连接"
        exit 1
    fi
    chmod +x "$temp_script"

    # 尝试检测当前脚本真实路径（处理 curl | bash 情况）
    local source_path="${BASH_SOURCE[0]}"
    if [ -z "$source_path" ] || [ "$source_path" = "stdin" ]; then
        source_path=""
    fi

    if [ -n "$source_path" ] && [ -f "$source_path" ] && [ -w "$source_path" ]; then
        # 以文件方式执行，直接就地更新
        cp "$source_path" "${source_path}.bak"
        install -m 0755 "$temp_script" "$source_path"
        print_success "脚本更新完成！"
        print_info "旧版本已备份到: ${source_path}.bak"
        exec "$source_path" "$@"
    else
        # 通过管道或不可写路径执行：安装到稳定位置
        local target="/usr/local/bin/ccframe"
        if ! (touch "$target.tmp" 2>/dev/null && rm -f "$target.tmp"); then
            # /usr/local/bin 不可写，退回安装目录
            mkdir -p "$INSTALL_DIR"
            target="$INSTALL_DIR/ccframe.sh"
        fi
        install -m 0755 "$temp_script" "$target"
        print_success "已安装最新脚本到: $target"
        if [ "$target" = "/usr/local/bin/ccframe" ]; then
            print_info "下次可直接运行: ccframe"
        else
            print_info "下次可运行: bash $target"
        fi
        # 通过管道运行时，更新后立即退出，避免悬挂等待输入
        exit 0
    fi
}

#==============================================================================
# 主菜单
#==============================================================================

show_menu() {
    local choice
    while true; do
        print_header

        echo "请选择操作："
        echo ""
        echo "  安装和更新:"
        echo "    1) 安装 CCFrame"
        echo "    2) 更新 CCFrame"
        echo "    3) 更新脚本"
        echo ""
        echo "  服务管理:"
        echo "    4) 查看状态"
        echo "    5) 启动服务"
        echo "    6) 停止服务"
        echo "    7) 重启服务"
        echo "    8) 查看日志"
        echo ""
        echo "  数据管理:"
        echo "    9) 备份数据"
        echo "   10) 恢复数据"
        echo ""
        echo "  其他:"
        echo "   11) 卸载 CCFrame"
        echo "    0) 退出"
        echo ""
        read -p "请输入选项 [0-11, 默认0]: " choice
        choice=${choice:-0}

        case $choice in
            1) do_install ;;
            2) do_update ;;
            3) do_update_script ;;
            4) do_status ;;
            5) do_start ;;
            6) do_stop ;;
            7) do_restart ;;
            8) do_logs ;;
            9) do_backup ;;
            10) do_restore ;;
            11) do_uninstall ;;
            0)
                print_info "已退出脚本"
                exit 0
                ;;
            *)
                print_error "无效选项"
                sleep 2
                continue
                ;;
        esac

        pause_for_menu
    done
}

#==============================================================================
# 主程序入口
#==============================================================================

main() {
    # 确保交互式输入可用（即便通过管道运行）
    ensure_tty_stdin

    # 如果有参数，直接执行对应功能
    if [ $# -gt 0 ]; then
        case $1 in
            install) do_install ;;
            update) do_update ;;
            status) do_status ;;
            logs) do_logs ;;
            restart) do_restart ;;
            start) do_start ;;
            stop) do_stop ;;
            backup) do_backup ;;
            restore) do_restore ;;
            uninstall) do_uninstall ;;
            update-script) do_update_script ;;
            *)
                echo "用法: $0 {install|update|status|logs|restart|start|stop|backup|restore|uninstall|update-script}"
                exit 1
                ;;
        esac
    else
        # 无参数，显示菜单
        show_menu
    fi
}

# 运行主程序
main "$@"
