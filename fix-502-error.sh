#!/bin/bash

echo "=== CCFrame 502 错误紧急修复脚本 ==="
echo "修复数据库schema不匹配问题"

# 设置环境变量
export COMPOSE_HTTP_TIMEOUT=300
export DOCKER_CLIENT_TIMEOUT=300

echo "1. 停止并移除所有相关容器..."
docker-compose down --remove-orphans --volumes
docker system prune -f

echo "2. 确保.env文件存在并配置正确..."
if [ ! -f .env ]; then
    echo "创建 .env 文件..."
    cat > .env << 'EOF'
DATABASE_URL="postgresql://ccframe:ccframe@db:5432/ccframe"
NEXTAUTH_SECRET="production-secret-key-abcdef123456"
NEXTAUTH_URL="http://142.91.99.128"
ADMIN_EMAIL="admin@local.dev"  
ADMIN_PASSWORD="admin123"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="photo-gallery"
S3_REGION="us-east-1"
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"
PIXABAY_API_KEY="46529562-43aa8e956d8bb567c7e6221ac"
DEV_SEED_TOKEN="dev-seed-123"
NODE_ENV="production"
CDN_BASE_URL="http://142.91.99.128:9000"
EOF
    echo "✅ .env 文件已创建"
else
    echo "✅ .env 文件存在"
fi

echo "3. 构建新的Docker镜像（包含schema更新）..."
docker-compose build --no-cache web

echo "4. 启动数据库服务..."
docker-compose up -d db redis minio

echo "5. 等待数据库启动（30秒）..."
sleep 30

echo "6. 启动web服务..."
docker-compose up -d web worker

echo "7. 等待应用启动（60秒）..."
sleep 60

echo "8. 启动nginx..."
docker-compose up -d nginx

echo "9. 等待nginx启动（10秒）..."
sleep 10

echo "10. 检查所有服务状态..."
docker-compose ps

echo
echo "11. 检查web服务日志（最后20行）..."
docker-compose logs --tail=20 web

echo
echo "12. 检查nginx日志..."
docker-compose logs --tail=10 nginx

echo
echo "13. 测试健康检查..."
echo "内部健康检查："
docker-compose exec -T web wget -qO- --timeout=5 http://localhost:3000/api/health || echo "内部健康检查失败"

echo
echo "外部访问测试："
curl -I http://142.91.99.128/ --connect-timeout 5 --max-time 10 || echo "外部访问失败"

echo
echo "=== 修复脚本执行完成 ==="
echo "请访问 http://142.91.99.128 检查是否恢复正常"
echo "如果仍有问题，请检查日志：docker-compose logs web"