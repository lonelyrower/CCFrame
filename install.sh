#!/bin/bash
set -euo pipefail

# 🚀 CCFrame VPS 一键运维脚本（Docker 专用）
# 非交互用法：
#   bash install.sh install     # 初始化/重建（清理旧容器与无主卷）
#   bash install.sh update      # 更新代码并重建（保留数据卷）
#   bash install.sh start       # 启动容器
#   bash install.sh stop        # 停止容器
#   bash install.sh restart     # 重启容器
#   bash install.sh status      # 查看容器状态
#   bash install.sh logs [svc]  # 查看日志（可选 svc：web/worker/nginx/minio/db/redis）
#   bash install.sh env         # 生成/修复 .env（不会覆盖已有值）
#   bash install.sh health      # 健康检查
#   bash install.sh uninstall   # 卸载（--purge 同时删除数据卷；--all 连同代码目录）
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
  # 检测是否支持 UTF-8，若不支持则降级为 ASCII 文本，避免乱码符号
  local use_utf8=1
  if [ -z "${LANG:-}" ] || ! printf '%s' "$LANG" | grep -qi 'utf-8'; then
    use_utf8=0
  fi
  if [ "$use_utf8" -eq 0 ]; then
    echo "==============================================="
    echo "   CCFrame - 个人相册网站 一键运维脚本"
    echo "==============================================="
    echo " 功能特色:"
    echo "   - 智能相册管理  - 照片变体处理"
    echo "   - 响应式设计    - 权限控制"
    echo "   - PWA离线支持   - 暗黑模式"
    echo
    return
  fi
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
    ║           🎨 个人相册网站 - VPS 一键运维脚本 🚀             ║
    ║                   by lonelyrower                             ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
  echo -e "${NC}"
  echo -e "${CYAN}✨ 功能特色:${NC}"
  echo "   📸 智能相册管理      🖼️ 照片变体处理"
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

# 规范化仓库地址，清理重复的 .git 后缀并统一为 HTTPS
normalize_to_https() {
  local input="$1"
  local path=""
  if [[ "$input" =~ ^git@github.com: ]]; then
    path="${input#git@github.com:}"
  elif [[ "$input" =~ ^https?://github.com/ ]]; then
    path="${input#*github.com/}"
  else
    # 未知/空输入，返回默认仓库
    echo "https://github.com/lonelyrower/CCFrame.git"
    return 0
  fi
  # 去除所有结尾多余的 .git（可能是 .git.git...）并去掉多余斜杠
  path=$(echo "$path" | sed -E 's#^/+##; s/(\.git)+$//')
  # 仅保留 owner/repo 两段
  local owner repo
  owner=$(echo "$path" | cut -d/ -f1)
  repo=$(echo "$path" | cut -d/ -f2)
  if [ -z "$owner" ] || [ -z "$repo" ]; then
    owner="lonelyrower"; repo="CCFrame"
  fi
  echo "https://github.com/$owner/$repo.git"
}

# 读取并必要时修复 origin 地址，返回修复后的地址
ensure_normalized_origin() {
  local current
  current=$(git remote get-url origin 2>/dev/null || echo "")
  if [ -z "$current" ]; then
    echo "https://github.com/lonelyrower/CCFrame.git"
    return 0
  fi
  local normalized
  normalized=$(normalize_to_https "$current")
  if [ "$normalized" != "$current" ]; then
    git remote set-url origin "$normalized" >/dev/null 2>&1 || true
  fi
  echo "$normalized"
}

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
  
  # 统一使用 /opt/ccframe 作为项目目录
  PROJECT_DIR="/opt/ccframe"
  REPO_URL=${REPO_URL:-https://github.com/lonelyrower/CCFrame.git}
  BRANCH=${BRANCH:-main}
  # 如果是 GitHub 地址，规范化为 https；否则尊重用户自定义（例如镜像域名）
  if printf '%s' "$REPO_URL" | grep -Eq '^(git@github.com:|https?://github.com/)'; then
    PRIMARY_URL=$(normalize_to_https "$REPO_URL")
  else
    PRIMARY_URL="$REPO_URL"
  fi
  export GIT_TERMINAL_PROMPT=0
  
  # 确保项目目录存在
  mkdir -p "$PROJECT_DIR"
  
  # 如果目录已存在且是git仓库，尝试更新
  if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    print_info "更新现有仓库..."
    
    # 规范化 origin 地址
    CLEANED_ORIGIN=$(ensure_normalized_origin)
    echo "origin: ${CLEANED_ORIGIN:-'(none)'}"
    
    # 尝试更新代码
    if git pull --rebase --autostash; then
      print_success "代码更新成功"
      return
    else
      print_warning "git pull 失败，尝试强制重置..."
      git fetch --all --prune || true
      if git reset --hard "origin/$BRANCH" 2>/dev/null; then
        print_success "强制重置到最新代码"
        return
      else
        print_warning "更新失败，将重新克隆..."
        cd /
        rm -rf "$PROJECT_DIR"
        mkdir -p "$PROJECT_DIR"
      fi
    fi
  fi
  
  # 克隆仓库到项目目录
  print_info "克隆仓库: $PRIMARY_URL (分支: $BRANCH) -> $PROJECT_DIR"
  if git clone --depth 1 --branch "$BRANCH" "$PRIMARY_URL" "$PROJECT_DIR"; then
    cd "$PROJECT_DIR" && print_success "仓库克隆成功: $PROJECT_DIR"
    return
  fi

  # 若直接克隆失败，尝试镜像源（适用于国内网络）
  print_warning "克隆失败，尝试使用镜像源..."
  cd /
  rm -rf "$PROJECT_DIR" && mkdir -p "$PROJECT_DIR"
  
  # 构建镜像候选地址列表
  MIRRORS=()
  if [ -n "${GITHUB_MIRROR:-}" ]; then
    # 前缀型代理（如 ghproxy）：GITHUB_MIRROR=https://mirror.ghproxy.com
    MIRRORS+=("${GITHUB_MIRROR%/}/$PRIMARY_URL")
  fi
  MIRRORS+=(
    "$(echo "$PRIMARY_URL" | sed 's#://github.com/#://kgithub.com/#')"
    "$(echo "$PRIMARY_URL" | sed 's#://github.com/#://hub.fastgit.org/#')"
    "$(echo "$PRIMARY_URL" | sed 's#://github.com/#://gitclone.com/github.com/#')"
    "https://gh-proxy.com/$PRIMARY_URL"
    "https://mirror.ghproxy.com/$PRIMARY_URL"
  )

  for alt in "${MIRRORS[@]}"; do
    [ -n "$alt" ] || continue
    print_info "尝试镜像: $alt"
    if git clone --depth 1 --branch "$BRANCH" "$alt" "$PROJECT_DIR"; then
      cd "$PROJECT_DIR" || true
      # 将 origin 统一改回官方地址，后续 pull 使用官方源
      git remote set-url origin "$PRIMARY_URL" >/dev/null 2>&1 || true
      print_success "通过镜像源克隆成功"
      return
    fi
    # 清理失败的半成品目录
    cd /
    rm -rf "$PROJECT_DIR" && mkdir -p "$PROJECT_DIR"
  done

  print_error "无法克隆仓库：$PRIMARY_URL"
  print_info "可能原因：网络无法访问 GitHub。可设置 GITHUB_MIRROR，例如:"
  echo "  GITHUB_MIRROR=https://mirror.ghproxy.com bash install.sh update"
  echo "或手动导出环境变量后重试："
  echo "  export GITHUB_MIRROR=https://mirror.ghproxy.com"
  echo "  bash install.sh install"
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
      # 生成随机值（在 shell 中计算，避免写入未展开的占位符）
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
EMBED_PROVIDER=deterministic
EMBED_MODEL_NAME=deterministic-v1
EMBED_DIM=768
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
  if grep -q '^ENABLE_SEMANTIC_SEARCH=' .env; then
    sed -i 's#^ENABLE_SEMANTIC_SEARCH=.*#ENABLE_SEMANTIC_SEARCH=true#' .env
  else
    echo 'ENABLE_SEMANTIC_SEARCH=true' >> .env
  fi
  if ! grep -q '^SEMANTIC_USE_PGVECTOR=' .env; then
    echo 'SEMANTIC_USE_PGVECTOR=off' >> .env
  fi
  if ! grep -q '^EMBED_PROVIDER=' .env; then
    echo 'EMBED_PROVIDER=deterministic' >> .env
  fi
  if ! grep -q '^EMBED_MODEL_NAME=' .env; then
    echo 'EMBED_MODEL_NAME=deterministic-v1' >> .env
  fi
  if ! grep -q '^EMBED_DIM=' .env; then
    echo 'EMBED_DIM=768' >> .env
  fi
  print_success "Semantic search defaults: ENABLE_SEMANTIC_SEARCH=true"
  print_success "NEXTAUTH_URL 已设置为 http://$SERVER_IP"
}

docker_info() {
  # 计算服务器 IP
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "${SERVER_IP:-}" ]; then
    SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
  fi
  
  # 读取.env中的密码
  ADMIN_PASSWORD="请查看 .env 文件中的 ADMIN_PASSWORD"
  if [ -f .env ] && grep -q '^ADMIN_PASSWORD=' .env; then
    ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' .env | cut -d'=' -f2 | tr -d '"')
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
  echo "   密码: $ADMIN_PASSWORD"
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
  
  # 清理旧的容器和资源避免502错误
  print_step "清理旧的容器和缓存..."
  $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  docker stop ccframe-web ccframe-worker ccframe-postgres ccframe-redis ccframe-minio ccframe-nginx 2>/dev/null || true
  docker rm ccframe-web ccframe-worker ccframe-postgres ccframe-redis ccframe-minio ccframe-nginx 2>/dev/null || true
  docker system prune -f --volumes >/dev/null 2>&1 || true
  docker network prune -f >/dev/null 2>&1 || true
  docker volume prune -f >/dev/null 2>&1 || true
  docker network rm ccframe 2>/dev/null || true
  docker volume rm ccframe_pgdata ccframe_minio 2>/dev/null || true
  
  # 停止可能冲突的nginx服务
  systemctl stop nginx 2>/dev/null || service nginx stop 2>/dev/null || true
  rm -rf /var/cache/nginx/* 2>/dev/null || true
  print_success "清理完成"
  
  print_step "构建并启动容器..."
  $DOCKER_COMPOSE_CMD up -d --build --force-recreate
  docker_info
}

cmd_update() {
  check_system
  clone_project
  ensure_env
  
  # 清理构建缓存，确保使用最新代码
  print_step "清理构建缓存..."
  docker builder prune -f >/dev/null 2>&1 || true
  print_success "缓存清理完成"
  
  print_step "更新代码并重建..."
  $DOCKER_COMPOSE_CMD up -d --build --force-recreate
  docker_info
}

cmd_start() {
  check_system
  cd /opt/ccframe || { print_error "项目目录不存在，请先运行安装"; exit 1; }
  $DOCKER_COMPOSE_CMD up -d
  docker_info
}

cmd_stop() {
  check_system
  cd /opt/ccframe || { print_error "项目目录不存在，请先运行安装"; exit 1; }
  $DOCKER_COMPOSE_CMD down
  print_success "已停止所有容器"
}

cmd_restart() {
  check_system
  cd /opt/ccframe || { print_error "项目目录不存在，请先运行安装"; exit 1; }
  $DOCKER_COMPOSE_CMD restart
  docker_info
}

cmd_status() {
  check_system
  cd /opt/ccframe || { print_error "项目目录不存在，请先运行安装"; exit 1; }
  $DOCKER_COMPOSE_CMD ps
}

cmd_logs() {
  check_system
  cd /opt/ccframe || { print_error "项目目录不存在，请先运行安装"; exit 1; }
  svc=${1:-}
  if [ -n "$svc" ]; then
    $DOCKER_COMPOSE_CMD logs -f --tail=200 "$svc"
  else
    $DOCKER_COMPOSE_CMD logs -f --tail=200
  fi
}

cmd_env() {
  cd /opt/ccframe || { print_error "项目目录不存在，请先运行安装"; exit 1; }
  ensure_env
}

cmd_health() {
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  [ -n "${SERVER_IP:-}" ] || SERVER_IP=127.0.0.1
  curl -fsSL http://$SERVER_IP/api/health || echo '{"ok":false}'
}

cmd_uninstall() {
  check_system
  local PURGE=0 REMOVE_ALL=0 YES=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --purge) PURGE=1 ;;
      --all|--remove-all) REMOVE_ALL=1 ;;
      -y|--yes) YES=1 ;;
    esac
    shift
  done

  print_warning "即将卸载 CCFrame。该操作会停止并删除容器${PURGE:+、并删除数据卷}${REMOVE_ALL:+、并删除 /opt/ccframe 目录}。"
  if [ "$YES" -ne 1 ]; then
    read -rp "请输入 uninstall 确认继续: " confirm || exit 1
    [ "$confirm" = "uninstall" ] || { print_error "已取消"; exit 1; }
  fi

  # 优先使用 compose down
  if [ -d /opt/ccframe ]; then
    cd /opt/ccframe || true
    if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ] || [ -f compose.yml ] || [ -f compose.yaml ]; then
      if [ "$PURGE" -eq 1 ]; then
        print_step "停止并删除容器与数据卷..."
        $DOCKER_COMPOSE_CMD down -v || true
      else
        print_step "停止并删除容器..."
        $DOCKER_COMPOSE_CMD down || true
      fi
    fi
  fi

  # 兜底：清理可能残留的容器与网络
  for c in ccframe-web ccframe-worker ccframe-nginx ccframe-minio ccframe-postgres ccframe-redis; do
    docker rm -f "$c" >/dev/null 2>&1 || true
  done
  docker network rm ccframe >/dev/null 2>&1 || true

  # 数据卷清理（仅在 --purge）
  if [ "$PURGE" -eq 1 ]; then
    docker volume rm pgdata >/dev/null 2>&1 || true
    docker volume rm minio >/dev/null 2>&1 || true
  fi

  # 删除代码目录（仅在 --all）
  if [ "$REMOVE_ALL" -eq 1 ]; then
    print_step "删除项目目录 /opt/ccframe ..."
    rm -rf /opt/ccframe || true
  fi

  print_success "卸载完成"
}

interactive_menu() {
  # 若可读 /dev/tty，则绑定到 TTY，避免管道环境下无输入
  if [ -r /dev/tty ]; then
    exec </dev/tty
  fi
  echo ""
  print_info "请选择操作："
  echo "  1) 初始化安装/重建（清理旧容器与无主卷）"
  echo "  2) 更新代码并重建（保留数据卷）"
  echo "  3) 启动"
  echo "  4) 重启"
  echo "  5) 停止"
  echo "  6) 状态"
  echo "  7) 查看日志"
  echo "  8) 修复/生成 .env"
  echo "  9) 健康检查"
  echo " 10) 卸载 (回车后可选择是否删除数据卷)"
  echo "  0) 退出"
  read -rp "输入编号: " choice || exit 0
  case "$choice" in
    1) cmd_install;  exit 0 ;;
    2) cmd_update;   exit 0 ;;
    3) cmd_start;    exit 0 ;;
    4) cmd_restart;  exit 0 ;;
    5) cmd_stop;     exit 0 ;;
    6) cmd_status;   exit 0 ;;
    7) read -rp "服务名(可留空): " svc; cmd_logs "$svc"; exit 0 ;;
    8) cmd_env;      exit 0 ;;
    9) cmd_health;   exit 0 ;;
    10) read -rp "是否删除数据卷? 输入 yes 删除: " a; if [ "$a" = "yes" ]; then cmd_uninstall --purge; else cmd_uninstall; fi; exit 0 ;;
    0) exit 0 ;;
    *) echo "请输入有效编号"; exit 1 ;;
  esac
}

main() {
  print_banner
  case "${1:-}" in
    install)  shift; cmd_install "$@"; exit 0 ;;
    update)   shift; cmd_update  "$@"; exit 0 ;;
    start)    shift; cmd_start   "$@"; exit 0 ;;
    stop)     shift; cmd_stop    "$@"; exit 0 ;;
    restart)  shift; cmd_restart "$@"; exit 0 ;;
    status)   shift; cmd_status  "$@"; exit 0 ;;
    logs)     shift; cmd_logs    "$@"; exit 0 ;;
    env)      shift; cmd_env     "$@"; exit 0 ;;
    health)   shift; cmd_health  "$@"; exit 0 ;;
    uninstall) shift; cmd_uninstall "$@"; exit 0 ;;
    *)
      # 无参数时：若是非交互环境（无 TTY），给出用法并退出；否则进入交互菜单
      if [ -t 0 ] || [ -r /dev/tty ]; then
        interactive_menu
      else
        echo "用法: bash install.sh [install|update|start|stop|restart|status|logs|env|health|uninstall]"
        echo "示例: curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/install.sh | bash -s -- update"
        exit 0
      fi
      ;;
  esac
}

trap 'print_error "操作已中断"; exit 1' INT TERM

main "$@"
