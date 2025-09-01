#!/bin/bash

# 🚀 CCFrame 一键安装部署脚本
# 使用方法: curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/install.sh | bash

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 输出函数
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
    ║           🎨 个人AI相册网站 - 一键部署安装器 🚀              ║
    ║                   by lonelyrower                             ║
    ╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo -e "${CYAN}✨ 功能特色:${NC}"
    echo "   📸 智能相册管理      🤖 AI图片处理"
    echo "   📱 响应式设计        🔒 权限控制"  
    echo "   ⚡ PWA离线支持       🎨 暗黑模式"
    echo ""
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step() { echo -e "${PURPLE}🚀 $1${NC}"; }

# 检查系统要求
check_system() {
    print_step "检查系统环境..."
    
    # 检查操作系统
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        print_error "不支持的操作系统: $OSTYPE"
        exit 1
    fi
    print_success "操作系统: $OS"
    
    # 检查必需命令
    for cmd in curl git; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd 未安装，请先安装"
            exit 1
        fi
        print_success "$cmd 已安装"
    done
}

# 安装 Node.js
install_nodejs() {
    print_step "检查 Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js $(node -v) 已安装"
            return
        else
            print_warning "Node.js 版本过低 (需要 18+)，正在更新..."
        fi
    else
        print_info "正在安装 Node.js..."
    fi
    
    # 使用 NodeSource 安装最新 Node.js
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        # 检查是否有 Homebrew
        if command -v brew &> /dev/null; then
            brew install node
        else
            print_error "请先安装 Homebrew 或手动安装 Node.js 18+"
            print_info "Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        print_error "请手动安装 Node.js 18+: https://nodejs.org"
        exit 1
    fi
    
    print_success "Node.js 安装完成"
}

# 克隆项目
clone_project() {
    print_step "下载项目代码..."
    
    PROJECT_DIR="CCFrame"
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "项目目录已存在，正在更新..."
        cd "$PROJECT_DIR"
        git pull origin main
    else
        git clone https://github.com/lonelyrower/CCFrame.git
        cd "$PROJECT_DIR"
    fi
    
    print_success "项目代码下载完成"
}

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
    
    print_info "构建 Docker 镜像..."
    docker-compose up -d --build
    
    print_success "🎉 Docker 部署完成！"
    show_docker_next_steps
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
    echo ""
    print_info "📋 Docker 部署完成！"
    echo ""
    echo "🌐 应用地址:"
    echo "   主应用: http://localhost:3000"
    echo "   管理后台: http://localhost:3000/admin/login"
    echo "   MinIO控制台: http://localhost:9001"
    echo ""
    echo "🔑 默认账户:"
    echo "   邮箱: admin@local.dev"
    echo "   密码: admin123"
    echo ""
    echo "🛠️  管理命令:"
    echo "   停止: docker-compose down"
    echo "   重启: docker-compose restart"
    echo "   查看日志: docker-compose logs -f"
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