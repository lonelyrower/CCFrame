#!/bin/bash
set -euo pipefail

echo "==============================================="
echo "   CCFrame - Personal Photo Gallery"
echo "   Quick Installation Script"
echo "==============================================="

# Color functions
print_step() { echo -e "\033[0;35m-> $1\033[0m"; }
print_success() { echo -e "\033[0;32m✓ $1\033[0m"; }
print_error() { echo -e "\033[0;31m✗ $1\033[0m"; }
print_info() { echo -e "\033[0;34mℹ $1\033[0m"; }

# Check if running on Linux
if [[ "${OSTYPE:-}" != linux* ]]; then
    print_error "This script only supports Linux servers"
    exit 1
fi

print_step "Installing system dependencies..."

# Install git and curl
if ! command -v git >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1; then
    print_info "Installing git and curl..."
    apt-get update -y >/dev/null 2>&1 || true
    apt-get install -y git curl >/dev/null 2>&1 || true
fi

# Install Docker
if ! command -v docker >/dev/null 2>&1; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh >/dev/null 2>&1
    systemctl start docker
    systemctl enable docker
fi

# Install Docker Compose
DOCKER_COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    print_info "Installing Docker Compose..."
    apt-get install -y docker-compose-plugin >/dev/null 2>&1 || true
    if docker compose version >/dev/null 2>&1; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        print_error "Failed to install Docker Compose"
        exit 1
    fi
fi

print_success "Dependencies installed"

print_step "Setting up CCFrame project..."

# Set up project directory
PROJECT_DIR="/opt/ccframe"
mkdir -p "$PROJECT_DIR"

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    print_info "Updating existing repository..."
    cd "$PROJECT_DIR"
    git pull --rebase --autostash || git reset --hard origin/main
else
    print_info "Cloning CCFrame repository..."
    git clone --depth 1 https://github.com/lonelyrower/CCFrame.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

print_success "Project code ready"

print_step "Configuring environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.docker.example ]; then
        cp .env.docker.example .env
    else
        # Create minimal .env
        cat > .env << EOF
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ADMIN_EMAIL=admin@local.dev
ADMIN_PASSWORD=$(openssl rand -base64 12)
POSTGRES_USER=ccframe
POSTGRES_PASSWORD=$(openssl rand -base64 16)
POSTGRES_DB=ccframe
DATABASE_URL=postgresql://ccframe:$(openssl rand -base64 16 | tr -d '\n')@db:5432/ccframe
REDIS_URL=redis://redis:6379
S3_ACCESS_KEY_ID=$(openssl rand -base64 12)
S3_SECRET_ACCESS_KEY=$(openssl rand -base64 16)
S3_BUCKET_NAME=ccframe
S3_REGION=us-east-1
MINIO_ROOT_USER=$(openssl rand -base64 12)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 16)
ENABLE_SEMANTIC_SEARCH=true
SEMANTIC_USE_PGVECTOR=off
EMBED_PROVIDER=deterministic
EMBED_MODEL_NAME=deterministic-v1
EMBED_DIM=768
EOF
    fi
fi

# Set NEXTAUTH_URL
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")
if grep -q "^NEXTAUTH_URL=" .env; then
    sed -i "s#^NEXTAUTH_URL=.*#NEXTAUTH_URL=http://$SERVER_IP#" .env
else
    echo "NEXTAUTH_URL=http://$SERVER_IP" >> .env
fi

print_success "Environment configured"

print_step "Starting CCFrame services..."

# Clean up old containers
$DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# Stop conflicting services
systemctl stop nginx 2>/dev/null || true

# Start services
$DOCKER_COMPOSE_CMD up -d --build --force-recreate

print_success "CCFrame installation completed!"

# Show connection info
ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" .env | cut -d'=' -f2 | tr -d '"' || echo "Check .env file")

echo ""
echo "🌐 Access your photo gallery:"
echo "   Main site: http://$SERVER_IP/"
echo "   Admin panel: http://$SERVER_IP/admin/login"
echo "   MinIO console: http://$SERVER_IP:9001"
echo ""
echo "🔑 Admin credentials:"
echo "   Email: admin@local.dev"
echo "   Password: $ADMIN_PASSWORD"
echo ""
echo "🛠 Useful commands:"
echo "   View logs: cd $PROJECT_DIR && $DOCKER_COMPOSE_CMD logs -f"
echo "   Restart: cd $PROJECT_DIR && $DOCKER_COMPOSE_CMD restart"
echo "   Stop: cd $PROJECT_DIR && $DOCKER_COMPOSE_CMD down"
echo ""