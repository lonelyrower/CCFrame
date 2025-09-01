#!/bin/bash
set -euo pipefail

# 🚀 CCFrame VPS 一键运维脚本（Docker 专用）
# 非交互用法：
#   bash install.sh install     # 安装/升级并启动（自动构建）
#   bash install.sh update      # 拉取代码并重建启动
#   bash install.sh start       # 启动容器
#   bash install.sh stop        # 停止容器
#   bash install.sh restart     # 重启容器
#   bash install.sh status      # 查看容器状态
#   bash install.sh logs [svc]  # 查看日志（可选 svc：web/worker/nginx/minio/db/redis）
#   bash install.sh env         # 生成/修复 .env（不会覆盖已有值）
#   bash install.sh health      # 健康检查
# 交互用法：
#   bash install.sh             # 弹出菜单

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
  echo -e "${PURPLE}"
  cat << 'EOF'
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║    ██████╗ ██████╗███████╗██████╗  █████╗ ███╗   ███╗███████╗║
    ║   ██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔════╝║
    ║   ██║     ██║     █████╗  ██████╔╝███████║██╔████╔██║█████╗  ║
    ║   ██║     ██║     ██╔══╝  ██╔══██╗██╔══██║██║╚██╔╝██║██╔══╝  ║
    ║   ╚██████╗╚██████╗██║     ██║  ██║██║  ██║██║ ╚═╝ ██║███████╗║
    ║    ╚═════╝ ╚═════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝║
    ║                                                              ║
    ║           🎨 个人AI相册网站 - VPS 一键运维脚本 🚀           ║
    ║                   by lonelyrower                             ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
  echo -e "${CYAN}✨ 功能特色:${NC}"
  echo "   📸 智能相册管理      🤖 AI图片处理"
  echo "   📱 响应式设计        🔒 权限控制"
  echo "   ⚡ PWA离线支持       🎨 暗黑模式"
  echo
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error()   { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step()    { echo -e "${PURPLE}🚀 $1${NC}"; }

DOCKER_COMPOSE_CMD=${DOCKER_COMPOSE_CMD:-}

check_system() {
  print_step "检查系统环境..."
  if [[ "${OSTYPE:-}" != linux* ]]; then
    print_error "仅支持 Linux 服务器（VPS）"
    exit 1
  fi
  print_success "操作系统: linux"

  # git/curl
  if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1; then
    print_info "安装 git/curl..."
    apt-get update -y >/dev/null 2>&1 || true
    apt-get install -y git curl >/dev/null 2>&1 || true
  fi
  print_success "git/curl 已就绪"

  # Docker
  if ! command -v docker >/dev/null 2>&1; then
    print_info "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
  fi
  print_success "Docker: $(docker --version)"

  # Compose
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
  else
    print_info "安装 docker compose 插件..."
    apt-get install -y docker-compose-plugin >/dev/null 2>&1 || true
    if docker compose version >/dev/null 2>&1; then
      DOCKER_COMPOSE_CMD="docker compose"
    else
      print_error "未找到 docker compose 命令，请手动安装 compose 插件"
      exit 1
    fi
  fi
  print_success "Compose: $DOCKER_COMPOSE_CMD"
}

clone_project() {
  print_step "获取项目代码..."
  # 情况1：当前目录已经是仓库根目录
  if [ -d .git ]; then
    git pull --rebase --autostash || true
    print_success "当前目录为仓库，已更新代码"
    return
  fi

  # 情况2：上级目录存在 CCFrame 仓库
  PROJECT_DIR="CCFrame"
  if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    git pull --rebase --autostash || true
    print_success "进入 $PROJECT_DIR 并更新代码"
    return
  fi

  print_error "未检测到项目目录，请先使用 SSH/Deploy Key 克隆仓库后再运行本脚本。"
  print_info  "例如：git clone git@github.com:lonelyrower/CCFrame.git && cd CCFrame && bash install.sh install"
  exit 1
}

ensure_env() {
  print_step "检查/生成环境变量..."
  if [ ! -f .env ]; then
    if [ -f .env.docker.example ]; then
      cp .env.docker.example .env
      print_success ".env 已从 .env.docker.example 生成"
    else
      print_warning ".env.docker.example 不存在，创建最小化 .env"
      cat > .env << 'EOF'
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-me")
ADMIN_EMAIL=admin@local.dev
ADMIN_PASSWORD=admin123
POSTGRES_USER=ccframe
POSTGRES_PASSWORD=ccframe
POSTGRES_DB=ccframe
DATABASE_URL=postgresql://ccframe:ccframe@db:5432/ccframe
REDIS_URL=redis://redis:6379
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=ccframe
S3_REGION=us-east-1
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
EOF
    fi
  fi

  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "${SERVER_IP:-}" ]; then
    SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
  fi
  if grep -q '^NEXTAUTH_URL=' .env; then
    sed -i "s#^NEXTAUTH_URL=.*#NEXTAUTH_URL=http://$SERVER_IP#" .env
  else
    echo "NEXTAUTH_URL=http://$SERVER_IP" >> .env
  fi
  print_success "NEXTAUTH_URL 已设置为 http://$SERVER_IP"
}

docker_info() {
  # 计算服务器 IP
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "${SERVER_IP:-}" ]; then
    SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
  fi
  echo ""
  print_info "📋 Docker 已启动"
  echo ""
  echo "🌐 应用地址:"
  echo "   主应用: http://$SERVER_IP/"
  echo "   管理后台: http://$SERVER_IP/admin/login"
  echo "   MinIO控制台: http://$SERVER_IP:9001"
  echo ""
  echo "🔑 默认账户:"
  echo "   邮箱: admin@local.dev"
  echo "   密码: admin123"
  echo ""
  echo "🛠️  管理命令:"
  echo "   停止: $DOCKER_COMPOSE_CMD down"
  echo "   重启: $DOCKER_COMPOSE_CMD restart"
  echo "   查看日志: $DOCKER_COMPOSE_CMD logs -f"
  echo ""
}

cmd_install() {
  check_system
  clone_project
  ensure_env
  print_step "构建并启动容器..."
  $DOCKER_COMPOSE_CMD up -d --build
  docker_info
}

cmd_update() {
  check_system
  clone_project
  ensure_env
  print_step "更新代码并重建..."
  $DOCKER_COMPOSE_CMD up -d --build
  docker_info
}

cmd_start() {
  check_system
  $DOCKER_COMPOSE_CMD up -d
  docker_info
}

cmd_stop() {
  check_system
  $DOCKER_COMPOSE_CMD down
  print_success "已停止所有容器"
}

cmd_restart() {
  check_system
  $DOCKER_COMPOSE_CMD restart
  docker_info
}

cmd_status() {
  check_system
  $DOCKER_COMPOSE_CMD ps
}

cmd_logs() {
  check_system
  svc=${1:-}
  if [ -n "$svc" ]; then
    $DOCKER_COMPOSE_CMD logs -f --tail=200 "$svc"
  else
    $DOCKER_COMPOSE_CMD logs -f --tail=200
  fi
}

cmd_env() {
  ensure_env
}

cmd_health() {
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  [ -n "${SERVER_IP:-}" ] || SERVER_IP=127.0.0.1
  curl -fsSL http://$SERVER_IP/api/health || echo '{"ok":false}'
}

interactive_menu() {
  echo ""
  print_info "请选择操作："
  echo "  1) 安装/升级并启动"
  echo "  2) 更新代码并重启"
  echo "  3) 启动"
  echo "  4) 重启"
  echo "  5) 停止"
  echo "  6) 状态"
  echo "  7) 查看日志"
  echo "  8) 修复/生成 .env"
  echo "  9) 健康检查"
  echo "  0) 退出"
  while true; do
    read -rp "输入编号: " choice
    case "$choice" in
      1) cmd_install; break ;;
      2) cmd_update; break ;;
      3) cmd_start; break ;;
      4) cmd_restart; break ;;
      5) cmd_stop; break ;;
      6) cmd_status; break ;;
      7) read -rp "服务名(可留空): " svc; cmd_logs "$svc"; break ;;
      8) cmd_env; break ;;
      9) cmd_health; break ;;
      0) exit 0 ;;
      *) echo "请输入有效编号" ;;
    esac
  done
}

main() {
  print_banner
  case "${1:-}" in
    install)  shift; cmd_install "$@" ;;
    update)   shift; cmd_update  "$@" ;;
    start)    shift; cmd_start   "$@" ;;
    stop)     shift; cmd_stop    "$@" ;;
    restart)  shift; cmd_restart "$@" ;;
    status)   shift; cmd_status  "$@" ;;
    logs)     shift; cmd_logs    "$@" ;;
    env)      shift; cmd_env     "$@" ;;
    health)   shift; cmd_health  "$@" ;;
    *) interactive_menu ;;
  esac
}

trap 'print_error "操作已中断"; exit 1' INT TERM

main "$@"

# 安装依赖
install_dependencies() {
    print_step "安装项目依赖..."
    
    # 安装 npm 包
    npm install --silent
    print_success "项目依赖安装完成"
    
    # 安装全局工具
    print_info "安装部署工具..."
    npm install -g vercel@latest --silent 2>/dev/null || true
    npm install -g @railway/cli@latest --silent 2>/dev/null || true
    
    print_success "部署工具安装完成"
}

# 选择部署方式
choose_deployment() {
    echo ""
    print_info "请选择部署方式："
    echo ""
    echo "🔥 1) Vercel (推荐)"
    echo "   ├─ ✅ 免费部署"
    echo "   ├─ ⚡ 全球CDN"
    echo "   ├─ 🚀 自动SSL"
    echo "   └─ 📈 零配置"
    echo ""
    echo "🚂 2) Railway"
    echo "   ├─ 💾 包含数据库"
    echo "   ├─ 🔄 自动部署"
    echo "   └─ 💰 $5/月免费额度"
    echo ""
    echo "🐳 3) Docker (本地)"
    echo "   ├─ 🏠 本地运行"
    echo "   ├─ 📦 完整环境"
    echo "   └─ 🔒 完全控制"
    echo ""
    
    while true; do
        echo -ne "${CYAN}请选择 [1-3]: ${NC}"
        read -r choice
        case $choice in
            1) DEPLOYMENT="vercel"; break ;;
            2) DEPLOYMENT="railway"; break ;;
            3) DEPLOYMENT="docker"; break ;;
            *) print_error "请输入 1-3" ;;
        esac
    done
    
    print_success "选择: $DEPLOYMENT 部署"
}

# Vercel 部署
deploy_vercel() {
    print_step "开始 Vercel 部署..."
    
    # 创建 vercel.json
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXTAUTH_URL": "https://$VERCEL_URL"
  }
}
EOF
    
    print_info "正在部署到 Vercel..."
    if command -v vercel &> /dev/null; then
        vercel --prod --confirm
    else
        print_error "Vercel CLI 安装失败，请手动部署"
        print_info "1. 访问: https://vercel.com/new"
        print_info "2. 导入 GitHub 仓库: lonelyrower/CCFrame"
        return 1
    fi
    
    print_success "🎉 Vercel 部署完成！"
    show_vercel_next_steps
}

# Railway 部署
deploy_railway() {
    print_step "开始 Railway 部署..."
    
    # 创建 railway.toml
    cat > railway.toml << 'EOF'
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"

[environments.production.variables]
NODE_ENV = "production"
EOF
    
    print_info "正在部署到 Railway..."
    if command -v railway &> /dev/null; then
        railway login
        railway create ccframe-$(date +%s)
        railway add postgresql
        railway up
    else
        print_error "Railway CLI 安装失败，请手动部署"
        print_info "1. 访问: https://railway.app/new"
        print_info "2. 从 GitHub 部署仓库"
        return 1
    fi
    
    print_success "🎉 Railway 部署完成！"
    show_railway_next_steps
}

# Docker 部署
deploy_docker() {
    print_step "开始 Docker 部署..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，正在尝试安装..."
        install_docker
    fi
    
    # 检查 docker compose 命令
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        DOCKER_COMPOSE_CMD="docker compose"
    fi

    # 生成 .env（若不存在）并设置 NEXTAUTH_URL 为服务器 IP
    if [ ! -f .env ]; then
        if [ -f .env.docker.example ]; then
            cp .env.docker.example .env
            print_success ".env 已从 .env.docker.example 生成"
        else
            print_warning ".env.docker.example 不存在，创建最小化 .env"
            cat > .env << 'EOF'
NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-me")
ADMIN_EMAIL=admin@local.dev
ADMIN_PASSWORD=admin123
POSTGRES_USER=ccframe
POSTGRES_PASSWORD=ccframe
POSTGRES_DB=ccframe
DATABASE_URL=postgresql://ccframe:ccframe@db:5432/ccframe
REDIS_URL=redis://redis:6379
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=ccframe
S3_REGION=us-east-1
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
EOF
        fi
    fi

    # 获取服务器 IP, 优先本机 IP
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
    fi

    # 写入 NEXTAUTH_URL
    if grep -q '^NEXTAUTH_URL=' .env; then
        sed -i "s#^NEXTAUTH_URL=.*#NEXTAUTH_URL=http://$SERVER_IP#" .env
    else
        echo "NEXTAUTH_URL=http://$SERVER_IP" >> .env
    fi
    print_info "NEXTAUTH_URL 已设置为: http://$SERVER_IP"
    
    print_info "构建并启动容器..."
    $DOCKER_COMPOSE_CMD up -d --build
    
    print_success "🎉 Docker 部署完成！"
    show_docker_next_steps "$SERVER_IP"
}

# 安装 Docker (Linux)
install_docker() {
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://get.docker.com | sh
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        print_warning "请重新登录以使用 Docker (或运行: newgrp docker)"
    else
        print_error "请手动安装 Docker: https://docker.com/get-started"
        exit 1
    fi
}

# 显示后续步骤
show_vercel_next_steps() {
    echo ""
    print_info "📋 Vercel 部署后续步骤："
    echo ""
    echo "1️⃣  配置数据库 (选择一个):"
    echo "   🟢 Supabase: https://supabase.com (推荐)"
    echo "   🔵 Neon: https://neon.tech"
    echo "   🟠 PlanetScale: https://planetscale.com"
    echo ""
    echo "2️⃣  在 Vercel 控制台添加环境变量:"
    echo "   📱 访问: https://vercel.com/dashboard"
    echo "   ⚙️  进入项目 → Settings → Environment Variables"
    echo ""
    echo "   必需变量:"
    echo "   DATABASE_URL=postgresql://..."
    echo "   NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo 'your-32-char-secret')"
    echo "   ADMIN_EMAIL=admin@yourdomain.com"
    echo "   ADMIN_PASSWORD=your-secure-password"
    echo ""
    echo "3️⃣  重新部署:"
    echo "   vercel --prod"
    echo ""
}

show_railway_next_steps() {
    echo ""
    print_info "📋 Railway 部署后续步骤："
    echo "1. 访问 Railway 控制台配置环境变量"
    echo "2. 数据库已自动配置"
    echo "3. 等待部署完成"
    echo ""
}

show_docker_next_steps() {
    # 计算服务器 IP
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$SERVER_IP" ]; then
      SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
    fi
    echo ""
    print_info "📋 Docker 部署完成！"
    echo ""
    echo "🌐 应用地址:"
    echo "   主应用: http://$SERVER_IP/"
    echo "   管理后台: http://$SERVER_IP/admin/login"
    echo "   MinIO控制台: http://$SERVER_IP:9001"
    echo ""
    echo "🔑 默认账户:"
    echo "   邮箱: admin@local.dev"
    echo "   密码: admin123"
    echo ""
    echo "🛠️  管理命令:"
    echo "   停止: ${DOCKER_COMPOSE_CMD:-docker compose} down"
    echo "   重启: ${DOCKER_COMPOSE_CMD:-docker compose} restart"
    echo "   查看日志: ${DOCKER_COMPOSE_CMD:-docker compose} logs -f"
    echo ""
}

# 生成配置向导
generate_env_guide() {
    print_step "生成配置向导..."
    
    cat > env-setup.sh << 'EOF'
#!/bin/bash
# 环境变量配置向导

echo "🔧 CCFrame 环境变量配置向导"
echo ""

# 生成随机密钥
SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your-32-character-secret-key-here")

echo "📝 请复制以下环境变量到你的部署平台:"
echo ""
echo "DATABASE_URL=postgresql://username:password@host:5432/database"
echo "NEXTAUTH_SECRET=$SECRET"
echo "NEXTAUTH_URL=https://your-domain.vercel.app"
echo "ADMIN_EMAIL=admin@yourdomain.com"
echo "ADMIN_PASSWORD=your-secure-password"
echo ""
echo "🤖 可选 AI 功能变量:"
echo "OPENAI_API_KEY=sk-your-openai-key"
echo "ANTHROPIC_API_KEY=sk-ant-your-claude-key"
echo ""

EOF
    chmod +x env-setup.sh
    
    print_success "配置向导已生成: ./env-setup.sh"
}

# 主安装流程
main() {
    print_banner
    
    print_step "开始 CCFrame 一键安装..."
    sleep 1
    
    # 1. 检查系统
    check_system
    
    # 2. 安装 Node.js
    install_nodejs
    
    # 3. 克隆项目
    clone_project
    
    # 4. 安装依赖
    install_dependencies
    
    # 5. 生成配置向导
    generate_env_guide
    
    # 6. 选择并执行部署
    choose_deployment
    
    case $DEPLOYMENT in
        "vercel") deploy_vercel ;;
        "railway") deploy_railway ;;
        "docker") deploy_docker ;;
    esac
    
    # 最终提示
    echo ""
    print_success "🎉 CCFrame 安装完成！"
    echo ""
    print_info "📚 更多帮助:"
    echo "   📖 文档: https://github.com/lonelyrower/CCFrame"
    echo "   🐛 问题反馈: https://github.com/lonelyrower/CCFrame/issues"
    echo "   💬 讨论: https://github.com/lonelyrower/CCFrame/discussions"
    echo ""
    print_success "享受你的 AI 相册网站吧! 🎨📸"
}

# 错误处理
trap 'print_error "安装过程中断！"; exit 1' INT TERM

# 运行主函数
main "$@"
