#!/bin/bash
set -euo pipefail

# CCFrame VPS Installation Script (Docker Edition)
# Usage:
#   bash install.sh install     # Initialize/rebuild (clean old containers)
#   bash install.sh update      # Update code and rebuild (preserve data)
#   bash install.sh start       # Start containers
#   bash install.sh stop        # Stop containers
#   bash install.sh restart     # Restart containers
#   bash install.sh status      # Show container status
#   bash install.sh logs [svc]  # Show logs (optional service name)
#   bash install.sh env         # Generate/fix .env file
#   bash install.sh health      # Health check
#   bash install.sh uninstall   # Uninstall (--purge deletes data volumes)

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
  echo "==============================================="
  echo "   CCFrame - Personal Photo Gallery"
  echo "   VPS Installation Script"
  echo "==============================================="
  echo " Features:"
  echo "   - Smart Photo Management  - Photo Variants"
  echo "   - Responsive Design       - Access Control"
  echo "   - PWA Offline Support     - Dark Mode"
  echo
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error()   { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ $1${NC}"; }
print_step()    { echo -e "${PURPLE}→ $1${NC}"; }

DOCKER_COMPOSE_CMD=""

check_system() {
  print_step "Checking system environment..."

  if [[ "${OSTYPE:-}" != linux* ]]; then
    print_error "This script only supports Linux servers (VPS)"
    exit 1
  fi
  print_success "Operating system: linux"

  # Install git/curl if needed
  if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1; then
    print_info "Installing git/curl..."
    apt-get update -y >/dev/null 2>&1 || true
    apt-get install -y git curl >/dev/null 2>&1 || true
  fi
  print_success "git/curl ready"

  # Install Docker if needed
  if ! command -v docker >/dev/null 2>&1; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
  fi
  print_success "Docker: $(docker --version | cut -d' ' -f3)"

  # Check for Docker Compose
  if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
  else
    print_info "Installing docker compose plugin..."
    apt-get install -y docker-compose-plugin >/dev/null 2>&1 || true
    if docker compose version >/dev/null 2>&1; then
      DOCKER_COMPOSE_CMD="docker compose"
    else
      print_error "Could not find docker compose command"
      exit 1
    fi
  fi
  print_success "Compose: $DOCKER_COMPOSE_CMD"
}

clone_project() {
  print_step "Getting project code..."

  PROJECT_DIR="/opt/ccframe"
  REPO_URL="https://github.com/lonelyrower/CCFrame.git"
  BRANCH="main"

  # Ensure project directory exists
  mkdir -p "$PROJECT_DIR"

  # If directory exists and is a git repo, try to update
  if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    print_info "Updating existing repository..."

    if git pull --rebase --autostash; then
      print_success "Code updated successfully"
      return
    else
      print_warning "git pull failed, trying force reset..."
      git fetch --all --prune || true
      if git reset --hard "origin/$BRANCH" 2>/dev/null; then
        print_success "Force reset to latest code"
        return
      else
        print_warning "Update failed, will re-clone..."
        cd /
        rm -rf "$PROJECT_DIR"
        mkdir -p "$PROJECT_DIR"
      fi
    fi
  fi

  # Clone repository
  print_info "Cloning repository: $REPO_URL -> $PROJECT_DIR"
  if git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$PROJECT_DIR"; then
    cd "$PROJECT_DIR"
    print_success "Repository cloned successfully: $PROJECT_DIR"
    return
  fi

  print_error "Failed to clone repository: $REPO_URL"
  exit 1
}

ensure_env() {
  print_step "Checking/generating environment variables..."

  if [ ! -f .env ]; then
    if [ -f .env.docker.example ]; then
      cp .env.docker.example .env
      print_success ".env generated from .env.docker.example"
    else
      print_warning ".env.docker.example not found, creating minimal .env"

      # Generate random values
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
# Note: Add your OpenAI API key by setting OPENAI_API_KEY environment variable
EOF
    fi
  fi

  # Set server IP
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "${SERVER_IP:-}" ]; then
    SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
  fi

  if grep -q '^NEXTAUTH_URL=' .env; then
    sed -i "s#^NEXTAUTH_URL=.*#NEXTAUTH_URL=http://$SERVER_IP#" .env
  else
    echo "NEXTAUTH_URL=http://$SERVER_IP" >> .env
  fi
  print_success "NEXTAUTH_URL set to http://$SERVER_IP"
}

show_info() {
  # Calculate server IP
  SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "${SERVER_IP:-}" ]; then
    SERVER_IP=$(curl -fsSL https://api.ipify.org || echo "127.0.0.1")
  fi

  # Read admin password from .env
  ADMIN_PASSWORD="Check ADMIN_PASSWORD in .env file"
  if [ -f .env ] && grep -q '^ADMIN_PASSWORD=' .env; then
    ADMIN_PASSWORD=$(grep '^ADMIN_PASSWORD=' .env | cut -d'=' -f2 | tr -d '"')
  fi

  echo ""
  print_info "Docker containers started"
  echo ""
  echo "🌐 Application URLs:"
  echo "   Main app: http://$SERVER_IP/"
  echo "   Admin panel: http://$SERVER_IP/admin/login"
  echo "   MinIO console: http://$SERVER_IP:9001"
  echo ""
  echo "🔑 Default credentials:"
  echo "   Email: admin@local.dev"
  echo "   Password: $ADMIN_PASSWORD"
  echo ""
  echo "🛠 Management commands:"
  echo "   Stop: $DOCKER_COMPOSE_CMD down"
  echo "   Restart: $DOCKER_COMPOSE_CMD restart"
  echo "   View logs: $DOCKER_COMPOSE_CMD logs -f"
  echo ""
}

cmd_install() {
  check_system
  clone_project
  ensure_env

  # Clean old containers and resources
  print_step "Cleaning old containers and cache..."
  $DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true
  docker system prune -f --volumes >/dev/null 2>&1 || true
  docker network prune -f >/dev/null 2>&1 || true
  docker volume prune -f >/dev/null 2>&1 || true

  # Stop potentially conflicting nginx
  systemctl stop nginx 2>/dev/null || service nginx stop 2>/dev/null || true
  print_success "Cleanup completed"

  print_step "Building and starting containers..."
  $DOCKER_COMPOSE_CMD up -d --build --force-recreate
  show_info
}

cmd_update() {
  check_system
  clone_project
  ensure_env

  # Clean build cache
  print_step "Cleaning build cache..."
  docker builder prune -f >/dev/null 2>&1 || true
  print_success "Cache cleanup completed"

  print_step "Updating code and rebuilding..."
  $DOCKER_COMPOSE_CMD up -d --build --force-recreate
  show_info
}

cmd_start() {
  check_system
  cd /opt/ccframe || { print_error "Project directory not found, please run install first"; exit 1; }
  $DOCKER_COMPOSE_CMD up -d
  show_info
}

cmd_stop() {
  check_system
  cd /opt/ccframe || { print_error "Project directory not found, please run install first"; exit 1; }
  $DOCKER_COMPOSE_CMD down
  print_success "All containers stopped"
}

cmd_restart() {
  check_system
  cd /opt/ccframe || { print_error "Project directory not found, please run install first"; exit 1; }
  $DOCKER_COMPOSE_CMD restart
  show_info
}

cmd_status() {
  check_system
  cd /opt/ccframe || { print_error "Project directory not found, please run install first"; exit 1; }
  $DOCKER_COMPOSE_CMD ps
}

cmd_logs() {
  check_system
  cd /opt/ccframe || { print_error "Project directory not found, please run install first"; exit 1; }
  svc=${1:-}
  if [ -n "$svc" ]; then
    $DOCKER_COMPOSE_CMD logs -f --tail=200 "$svc"
  else
    $DOCKER_COMPOSE_CMD logs -f --tail=200
  fi
}

cmd_env() {
  cd /opt/ccframe || { print_error "Project directory not found, please run install first"; exit 1; }
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

  print_warning "About to uninstall CCFrame. This will stop and remove containers${PURGE:+ and delete data volumes}."
  if [ "$YES" -ne 1 ]; then
    read -rp "Enter 'uninstall' to confirm: " confirm || exit 1
    [ "$confirm" = "uninstall" ] || { print_error "Cancelled"; exit 1; }
  fi

  # Use compose down if available
  if [ -d /opt/ccframe ]; then
    cd /opt/ccframe || true
    if [ -f docker-compose.yml ] || [ -f docker-compose.yaml ] || [ -f compose.yml ] || [ -f compose.yaml ]; then
      if [ "$PURGE" -eq 1 ]; then
        print_step "Stopping and removing containers with data volumes..."
        $DOCKER_COMPOSE_CMD down -v || true
      else
        print_step "Stopping and removing containers..."
        $DOCKER_COMPOSE_CMD down || true
      fi
    fi
  fi

  # Cleanup remaining containers
  for c in ccframe-web ccframe-worker ccframe-nginx ccframe-minio ccframe-postgres ccframe-redis; do
    docker rm -f "$c" >/dev/null 2>&1 || true
  done
  docker network rm ccframe >/dev/null 2>&1 || true

  # Remove data volumes if requested
  if [ "$PURGE" -eq 1 ]; then
    docker volume rm pgdata >/dev/null 2>&1 || true
    docker volume rm minio >/dev/null 2>&1 || true
  fi

  print_success "Uninstall completed"
}

interactive_menu() {
  if [ -r /dev/tty ]; then
    exec </dev/tty
  fi
  echo ""
  print_info "Please choose an operation:"
  echo "  1) Initialize install/rebuild (clean old containers)"
  echo "  2) Update code and rebuild (preserve data volumes)"
  echo "  3) Start"
  echo "  4) Restart"
  echo "  5) Stop"
  echo "  6) Status"
  echo "  7) View logs"
  echo "  8) Fix/generate .env"
  echo "  9) Health check"
  echo " 10) Uninstall"
  echo "  0) Exit"
  read -rp "Enter number: " choice || exit 0
  case "$choice" in
    1) cmd_install; exit 0 ;;
    2) cmd_update; exit 0 ;;
    3) cmd_start; exit 0 ;;
    4) cmd_restart; exit 0 ;;
    5) cmd_stop; exit 0 ;;
    6) cmd_status; exit 0 ;;
    7) read -rp "Service name (optional): " svc; cmd_logs "$svc"; exit 0 ;;
    8) cmd_env; exit 0 ;;
    9) cmd_health; exit 0 ;;
    10) read -rp "Delete data volumes? Enter 'yes' to delete: " a; if [ "$a" = "yes" ]; then cmd_uninstall --purge; else cmd_uninstall; fi; exit 0 ;;
    0) exit 0 ;;
    *) echo "Please enter a valid number"; exit 1 ;;
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
      # No parameters: if non-interactive environment, show usage; otherwise show menu
      if [ -t 0 ] || [ -r /dev/tty ]; then
        interactive_menu
      else
        echo "Usage: bash install.sh [install|update|start|stop|restart|status|logs|env|health|uninstall]"
        echo "Example: curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/install.sh | bash -s -- update"
        exit 0
      fi
      ;;
  esac
}

trap 'print_error "Operation interrupted"; exit 1' INT TERM

main "$@"