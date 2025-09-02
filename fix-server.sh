#!/bin/bash

echo "=== CCFrame 502 错误修复脚本 ==="

# 1. 检查并添加缺失的环境变量
echo "检查环境变量配置..."
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://ccframe:ccframe@db:5432/ccframe"

# NextAuth
NEXTAUTH_SECRET="production-secret-key-$(openssl rand -hex 32)"
NEXTAUTH_URL="http://142.91.99.128"

# Admin
ADMIN_EMAIL="admin@local.dev"
ADMIN_PASSWORD="admin123"

# S3 Storage
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="photo-gallery"
S3_REGION="us-east-1"

# MinIO
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"

# Pixabay for demo
PIXABAY_API_KEY="46529562-43aa8e956d8bb567c7e6221ac"
DEV_SEED_TOKEN="dev-seed-123"

# Production
NODE_ENV="production"
EOF
    echo "✓ .env 文件已创建"
else
    echo "✓ .env 文件存在"
fi

# 2. 停止所有服务
echo "停止现有服务..."
docker-compose down --remove-orphans
echo "✓ 服务已停止"

# 3. 清理旧容器和网络
echo "清理Docker资源..."
docker system prune -f
echo "✓ 清理完成"

# 4. 重新构建并启动服务
echo "重新构建并启动服务..."
docker-compose up -d --build

# 5. 等待服务启动
echo "等待服务启动..."
sleep 30

# 6. 检查服务状态
echo "检查服务状态:"
docker-compose ps

echo
echo "检查web服务日志:"
docker-compose logs --tail=10 web

echo
echo "测试内部连接:"
docker-compose exec -T nginx wget -qO- --timeout=10 http://web:3000/ | head -5 || echo "内部连接失败"

echo
echo "=== 修复完成，请访问 http://142.91.99.128 测试 ==="