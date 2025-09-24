#!/bin/bash
set -euo pipefail

# CCFrame VPS 安装脚本（Docker 版）
# 使用说明：
#   bash install.sh install     # 初始化或重建（清理旧容器）
#   bash install.sh update      # 更新代码并重建（保留数据）
#   bash install.sh start       # 启动容器
#   bash install.sh stop        # 停止容器
#   bash install.sh restart     # 重启容器
#   bash install.sh status      # 查看容器状态
#   bash install.sh logs [svc]  # 查看日志（可选指定服务名）
#   bash install.sh env         # 生成或修复 .env 文件
#   bash install.sh health      # 健康检查
#   bash install.sh uninstall   # 卸载（--purge 将删除数据卷）

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
  echo "==============================================="
  echo "   CCFrame - 私人相册系统"
  echo "   VPS 安装脚本"
  echo "==============================================="
  echo " 功能亮点："
  echo "   - 智能照片管理      - 照片多规格"
  echo "   - 自适应设计        - 访问控制"
  echo "   - PWA 离线支持       - 深色模式"
  echo
}

print_success() { echo -e "${GREEN}[成功] $1${NC}"; }
print_error()   { echo -e "${RED}[错误] $1${NC}"; }
print_warning() { echo -e "${YELLOW}[警告] $1${NC}"; }
print_info()    { echo -e "${BLUE}[提示] $1${NC}"; }
print_step()    { echo -e "${PURPLE}[步骤] $1${NC}"; }

DOCKER_COMPOSE_CMD=""

check_system() {
  print_step "正在检查系统环境..."

  if [[ "${OSTYPE:-}" != linux* ]]; then
    print_error "此脚本仅支持 Linux 服务器（VPS）"
    exit 1
  fi
  print_success "检测到操作系统：Linux"

  # 如需则安装 git/curl
  if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1; then
    print_info "正在安装 git/curl..."
    apt-get update -y >/dev/null 2>&1 || true
    apt-get install -y git curl >/dev/null 2>&1 || true
  fi
  print_success "git/curl 已就绪"

  # 如需则安装 Docker
  if ! command -v docker >/dev/null 2>&1; then
    print_info "正在安装 Docker..."
    curl -fsSL https://get.docker.com | sh
  fi
  print_success "Docker 版本：$(docker --version | cut -d' ' -f3)"

  # 检查 Docker Compose
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
  else
    print_info "正在安装 Docker Compose 插件..."
    apt-get install -y docker-compose-plugin >/dev/null 2>&1 || true
    if docker compose version >/dev/null 2>&1; then
      DOCKER_COMPOSE_CMD="docker compose"
    else
      print_error "无法找到 Docker Compose 命令"
      exit 1
    fi
  fi
  print_success "Compose 命令：$DOCKER_COMPOSE_CMD"
}

clone_project() {
  print_step "正在获取项目代码..."

  PROJECT_DIR="/opt/ccframe"
  REPO_URL="https://github.com/lonelyrower/CCFrame.git"
  BRANCH="main"

  # 确保项目目录存在
  mkdir -p "$PROJECT_DIR"

  # 若目录存在且为 git 仓库则尝试更新
  if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    print_info "正在更新已有仓库..."

    if git pull --rebase --autostash; then
      print_success "代码更新成功"
      return
    else
      print_warning "git pull 失败，尝试强制重置..."
      git fetch --all --prune || true
      if git reset --hard "origin/$BRANCH" 2>/dev/null; then
        print_success "已强制重置到最新代码"
        return
      else
        print_warning "更新失败，将重新克隆..."
        cd /
        rm -rf "$PROJECT_DIR"
        mkdir -p "$PROJECT_DIR"
      fi
    fi
  fi

  # 克隆仓库
  print_info "正在克隆仓库：$REPO_URL -> $PROJECT_DIR"
  if git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$PROJECT_DIR"; then
    cd "$PROJECT_DIR"
    print_success "仓库克隆成功：$PROJECT_DIR"
    return
  fi

  print_error "克隆仓库失败：$REPO_URL"
  exit 1
}

ensure_env() {
  print_step "正在检查或生成环境变量..."

  if [ ! -f .env ]; then
    if [ -f .env.docker.example ]; then
      cp .env.docker.example .env
      print_success ".env 已基于 .env.docker.example 生成"
    else
      print_warning "未找到 .env.docker.example，正在创建精简版 .env"

      # 生成随机凭据
      local _ts=$(date +%s)
      local NEXTAUTH_SECRET ADMIN_PASSWORD POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY MINIO_ROOT_USER MINIO_ROOT_PASSWORD
      NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-me-${_ts}")
      ADMIN_PASSWORD=$(openssl rand -base64 12 2>/dev/null || echo "admin-${_ts}")
      POSTGRES_USER=ccframe
      POSTGRES_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "db-${_ts}")
      POSTGRES_DB=ccframe
      S3_ACCESS_KEY_ID=$(openssl rand -base64 12 2>/dev/null || echo "s3-${_ts}")
      S3_SECRET_ACCESS_KEY=$(openssl rand -base64 16 2>/dev/null || echo "s3secret-${_ts}")
      MINIO_ROOT_USER=$(openssl rand -base64 12 2>/dev/null || echo "minio-${_ts}")
      MINIO_ROOT_PASSWORD=$(openssl rand -base64 16 2>/dev/null || echo "miniosecret-${_ts}")

      cat > .env <<EOF
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ADMIN_EMAIL=admin@local.dev
ADMIN_PASSWORD=${ADMIN_PASSWORD}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
REDIS_URL=redis://redis:6379
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
S3_BUCKET_NAME=ccframe
S3_REGION=us-east-1
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}
ENABLE_SEMANTIC_SEARCH=true
SEMANTIC_USE_PGVECTOR=off
EMBED_PROVIDER=openai
EMBED_MODEL_NAME=text-embedding-3-small
EMBED_DIM=1536
# 注意：请通过 OPENAI_API_KEY 环境变量配置 OpenAI API 密钥
EOF
    fi
  fi

  # 设置服务器 IP
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "${SERVER_IP:-}" ]; then
    SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
  fi

  if grep -q '^NEXTAUTH_URL=' .env; then
    sed -i "s#^NEXTAUTH_URL=.*#NEXTAUTH_URL=http://$SERVER_IP#" .env
  else
    echo "NEXTAUTH_URL=http://$SERVER_IP" >> .env
  fi
  print_success "已将 NEXTAUTH_URL 设置为 http://$SERVER_IP"
}

show_info() {
  # 计算服务器 IP
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "${SERVER_IP:-}" ]; then
    SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
  fi

  # 从 .env 读取管理员密码
  ADMIN_PASSWORD="请在 .env 文件中确认 ADMIN_PASSWORD"
  if [ -f .env ] && grep -q '^ADMIN_PASSWORD=' .env; then
    ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' .env | cut -d'=' -f2 | tr -d '"')
  fi

  echo ""
  print_info "Docker 容器已启动"
  echo ""
  echo "🌐 应用访问地址："
  echo "   前台入口：http://$SERVER_IP/"
  echo "   管理后台：http://$SERVER_IP/admin/login"
  echo "   MinIO 控制台：http://$SERVER_IP:9001"
  echo ""
  echo "🔑 默认登录信息："
  echo "   邮箱：admin@local.dev"
  echo "   密码：$ADMIN_PASSWORD"
  echo ""
  echo "🛠 常用管理命令："
  echo "   停止：$DOCKER_COMPOSE_CMD down"
  echo "   重启：$DOCKER_COMPOSE_CMD restart"
  echo "   查看日志：$DOCKER_COMPOSE_CMD logs -f"
  echo ""
}

cmd_install() {
  check_system
  clone_project
  ensure_env

  # 清理旧容器及资源
  print_step "正在清理旧容器与缓存..."
  $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  docker system prune -f --volumes >/dev/null 2>&1 || true
  docker network prune -f >/dev/null 2>&1 || true
  docker volume prune -f >/dev/null 2>&1 || true

  # 停止可能冲突的 nginx
  systemctl stop nginx 2>/dev/null || service nginx stop 2>/dev/null || true
  print_success "清理完成"

  print_step "正在构建并启动容器..."
  $DOCKER_COMPOSE_CMD up -d --build --force-recreate
  show_info
}

cmd_update() {
  check_system
  clone_project
  ensure_env

  # 清理构建缓存
  print_step "正在清理构建缓存..."
  docker builder prune -f >/dev/null 2>&1 || true
  print_success "缓存清理完成"

  print_step "正在更新代码并重新构建..."
  $DOCKER_COMPOSE_CMD up -d --build --force-recreate
  show_info
}

cmd_start() {
  check_system
  cd /opt/ccframe || { print_error "未找到项目目录，请先执行 install 操作"; exit 1; }
  $DOCKER_COMPOSE_CMD up -d
  show_info
}

cmd_stop() {
  check_system
  cd /opt/ccframe || { print_error "未找到项目目录，请先执行 install 操作"; exit 1; }
  $DOCKER_COMPOSE_CMD down
  print_success "所有容器已停止"
}

cmd_restart() {
  check_system
  cd /opt/ccframe || { print_error "未找到项目目录，请先执行 install 操作"; exit 1; }
  $DOCKER_COMPOSE_CMD restart
  show_info
}

cmd_status() {
  check_system
  cd /opt/ccframe || { print_error "未找到项目目录，请先执行 install 操作"; exit 1; }
  $DOCKER_COMPOSE_CMD ps
}

cmd_logs() {
  check_system
  cd /opt/ccframe || { print_error "未找到项目目录，请先执行 install 操作"; exit 1; }
  svc=${1:-}
  if [ -n "$svc" ]; then
    $DOCKER_COMPOSE_CMD logs -f --tail=200 "$svc"
  else
    $DOCKER_COMPOSE_CMD logs -f --tail=200
  fi
}

cmd_env() {
  cd /opt/ccframe || { print_error "未找到项目目录，请先执行 install 操作"; exit 1; }
  ensure_env
}

cmd_health() {
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  [ -n "${SERVER_IP:-}" ] || SERVER_IP=127.0.0.1
  curl -fsSL http://$SERVER_IP/api/health || echo '{"ok":false}'
}

cmd_uninstall() {
  check_system
  local PURGE=0 YES=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --purge) PURGE=1 ;;
      -y|--yes) YES=1 ;;
    esac
    shift
  done

  print_warning "即将卸载 CCFrame，将停止并移除容器${PURGE:+，并删除数据卷}。"
  if [ "$YES" -ne 1 ]; then
    read -rp "请输入 'uninstall' 以确认：" confirm || exit 1
    [ "$confirm" = "uninstall" ] || { print_error "已取消"; exit 1; }
  fi

  # 若存在 compose 配置则执行 down
  if [ -d /opt/ccframe ]; then
    cd /opt/ccframe || true
    if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ] || [ -f compose.yml ] || [ -f compose.yaml ]; then
      if [ "$PURGE" -eq 1 ]; then
        print_step "正在停止并移除容器，同时删除数据卷..."
        $DOCKER_COMPOSE_CMD down -v || true
      else
        print_step "正在停止并移除容器..."
        $DOCKER_COMPOSE_CMD down || true
      fi
    fi
  fi

  # 清理残留容器
  for c in ccframe-web ccframe-worker ccframe-nginx ccframe-minio ccframe-postgres ccframe-redis; do
    docker rm -f "$c" >/dev/null 2>&1 || true
  done
  docker network rm ccframe >/dev/null 2>&1 || true

  # 若需要则删除数据卷
  if [ "$PURGE" -eq 1 ]; then
    docker volume rm pgdata >/dev/null 2>&1 || true
    docker volume rm minio >/dev/null 2>&1 || true
  fi

  print_success "卸载完成"
}

interactive_menu() {
  if [ -r /dev/tty ]; then
    exec </dev/tty
  fi
  echo ""
  print_info "请选择要执行的操作："
  echo "  1) 初始化安装或重建（清理旧容器）"
  echo "  2) 更新代码并重建（保留数据卷）"
  echo "  3) 启动"
  echo "  4) 重启"
  echo "  5) 停止"
  echo "  6) 查看状态"
  echo "  7) 查看日志"
  echo "  8) 生成或修复 .env"
  echo "  9) 健康检查"
  echo " 10) 卸载"
  echo "  0) 退出"
  read -rp "请输入数字：" choice || exit 0
  case "$choice" in
    1) cmd_install; exit 0 ;;
    2) cmd_update; exit 0 ;;
    3) cmd_start; exit 0 ;;
    4) cmd_restart; exit 0 ;;
    5) cmd_stop; exit 0 ;;
    6) cmd_status; exit 0 ;;
    7) read -rp "服务名称（可选）：" svc; cmd_logs "$svc"; exit 0 ;;
    8) cmd_env; exit 0 ;;
    9) cmd_health; exit 0 ;;
    10) read -rp "需要删除数据卷吗？输入 'yes' 确认删除：" a; if [ "$a" = "yes" ]; then cmd_uninstall --purge; else cmd_uninstall; fi; exit 0 ;;
    0) exit 0 ;;
    *) echo "请输入有效的数字"; exit 1 ;;
  esac
}

main() {
  print_banner
  case "${1:-}" in
    install)   shift; cmd_install "$@"; exit 0 ;;
    update)    shift; cmd_update "$@"; exit 0 ;;
    start)     shift; cmd_start "$@"; exit 0 ;;
    stop)      shift; cmd_stop "$@"; exit 0 ;;
    restart)   shift; cmd_restart "$@"; exit 0 ;;
    status)    shift; cmd_status "$@"; exit 0 ;;
    logs)      shift; cmd_logs "$@"; exit 0 ;;
    env)       shift; cmd_env "$@"; exit 0 ;;
    health)    shift; cmd_health "$@"; exit 0 ;;
    uninstall) shift; cmd_uninstall "$@"; exit 0 ;;
    *)
      # 无参数：非交互环境输出用法，交互环境显示菜单
      if [ -t 0 ] || [ -r /dev/tty ]; then
        interactive_menu
      else
        echo "用法：bash install.sh [install|update|start|stop|restart|status|logs|env|health|uninstall]"
        echo "示例：curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/install.sh | bash -s -- update"
        exit 0
      fi
      ;;
  esac
}

trap 'print_error "操作已中断"; exit 1' INT TERM

main "$@"





