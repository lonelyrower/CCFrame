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
