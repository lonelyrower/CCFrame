#!/bin/bash

echo "🚀 CCFrame 全新部署脚本"
echo "========================"

# 停止所有相关服务
echo "📦 清理旧容器和网络..."
docker compose down --remove-orphans 2>/dev/null || true
docker stop ccframe-web ccframe-worker ccframe-postgres ccframe-redis ccframe-minio ccframe-nginx 2>/dev/null || true
docker rm ccframe-web ccframe-worker ccframe-postgres ccframe-redis ccframe-minio ccframe-nginx 2>/dev/null || true

# 清理Docker缓存和资源
echo "🧹 清理Docker缓存..."
docker system prune -f --volumes
docker network prune -f
docker volume prune -f

# 清理CCFrame相关网络和卷
echo "🗑️ 清理项目相关资源..."
docker network rm ccframe 2>/dev/null || true
docker volume rm ccframe_pgdata ccframe_minio 2>/dev/null || true

# 清理nginx配置缓存
echo "🔧 清理nginx缓存..."
sudo systemctl stop nginx 2>/dev/null || true
sudo rm -rf /var/cache/nginx/* 2>/dev/null || true

# 确保环境文件存在
if [ ! -f .env ]; then
  if [ -f .env.docker.example ]; then
    echo "📝 复制环境配置文件..."
    cp .env.docker.example .env
    echo "⚠️  请检查并修改 .env 文件中的配置"
  else
    echo "❌ 未找到 .env.docker.example 文件"
    exit 1
  fi
fi

# Vercel 部署
deploy_vercel() {
    print_info "开始 Vercel 部署..."
    
    # 检查 Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_info "安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    # 创建 vercel.json 配置
    cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "outputDirectory": ".next"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/\$1"
    },
    {
      "src": "/(.*)",
      "dest": "/\$1"
    }
  ],
  "env": {
    "NEXTAUTH_URL": "https://your-domain.vercel.app"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
EOF
    
    print_success "创建了 vercel.json 配置文件"
    
    # 部署
    print_info "开始部署到 Vercel..."
    vercel --prod
    
    print_success "🎉 Vercel 部署完成！"
    print_warning "请在 Vercel 控制台配置以下环境变量："
    cat << EOF

必需的环境变量:
- DATABASE_URL: PostgreSQL 连接字符串
- NEXTAUTH_SECRET: 随机密钥
- ADMIN_EMAIL: 管理员邮箱
- ADMIN_PASSWORD: 管理员密码

可选的环境变量:
- OPENAI_API_KEY: OpenAI API 密钥
- ANTHROPIC_API_KEY: Claude API 密钥
- GOOGLE_API_KEY: Google API 密钥

EOF
}

# Railway 部署
deploy_railway() {
    print_info "开始 Railway 部署..."
    
    # 检查 Railway CLI
    if ! command -v railway &> /dev/null; then
        print_info "安装 Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # 创建 railway.toml 配置
    cat > railway.toml << EOF
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[environments.production.variables]
NODE_ENV = "production"
PORT = "3000"

[environments.production.services.web]
source = "."
variables = {}

[environments.production.services.database]
source = "postgresql"
variables = {}
EOF
    
    print_success "创建了 railway.toml 配置文件"
    
    # 登录并部署
    print_info "请先登录 Railway..."
    railway login
    
    print_info "创建新项目..."
    railway create
    
    print_info "添加 PostgreSQL 数据库..."
    railway add postgresql
    
    print_info "部署应用..."
    railway up
    
    print_success "🎉 Railway 部署完成！"
}

# Docker 部署
deploy_docker() {
    print_info "开始 Docker 部署..."
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    # 创建 Dockerfile
    cat > Dockerfile << 'EOF'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF
    
    # 创建 docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/photo_gallery
      - NEXTAUTH_SECRET=your-secret-key-change-this
      - NEXTAUTH_URL=http://localhost:3000
      - ADMIN_EMAIL=admin@local.dev
      - ADMIN_PASSWORD=admin123
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: photo_gallery
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
EOF
    
    # 更新 next.config.js 支持 standalone 输出
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'exifr']
  },
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
EOF
    
    print_success "创建了 Docker 配置文件"
    
    # 构建和运行
    print_info "构建 Docker 镜像..."
    docker-compose build
    
    print_info "启动服务..."
    docker-compose up -d
    
    print_success "🎉 Docker 部署完成！"
    print_info "应用运行在: http://localhost:3000"
    print_info "MinIO 控制台: http://localhost:9001"
    print_info "数据库端口: 5432"
}

# 手动配置
manual_setup() {
    print_info "手动配置指南"
    
    cat << EOF

📋 手动部署步骤:

1. 准备环境:
   - Node.js 18+
   - PostgreSQL 数据库
   - Redis (可选)

2. 安装依赖:
   npm install

3. 配置环境变量:
   cp .env.example .env
   # 编辑 .env 文件

4. 数据库设置:
   npx prisma generate
   npx prisma db push

5. 创建管理员:
   node scripts/create-admin.js

6. 启动应用:
   npm run build
   npm start

🔧 必需的环境变量:
- DATABASE_URL: PostgreSQL连接字符串
- NEXTAUTH_SECRET: 随机密钥 (32字符+)
- NEXTAUTH_URL: 应用访问地址
- ADMIN_EMAIL: 管理员邮箱
- ADMIN_PASSWORD: 管理员密码

📚 详细文档: README.md

EOF
}

# 创建健康检查API
create_health_check() {
    mkdir -p app/api/health
    cat > app/api/health/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 检查数据库连接
    await db.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        app: 'running'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 500 }
    )
  }
}
EOF
    print_success "创建了健康检查 API"
}

# 主函数
main() {
    print_header
    
    # 检查依赖
    check_dependencies
    
    # 创建健康检查API
    create_health_check
    
    # 选择部署方式
    choose_deployment_method
    
    case $DEPLOYMENT_METHOD in
        "vercel")
            deploy_vercel
            ;;
        "railway")
            deploy_railway
            ;;
        "docker")
            deploy_docker
            ;;
        "manual")
            manual_setup
            ;;
    esac
    
    echo ""
    print_success "🎉 部署脚本执行完成！"
    
    if [ "$DEPLOYMENT_METHOD" != "manual" ]; then
        print_info "下一步操作:"
        echo "1. 配置环境变量"
        echo "2. 运行数据库迁移"
        echo "3. 创建管理员账户"
        echo "4. 测试应用功能"
    fi
    
    echo ""
    print_info "项目GitHub: https://github.com/lonelyrower/CCFrame"
    print_info "如有问题，请查看 README.md 或提交 Issue"
}

# 运行主函数
main "$@"
EOF