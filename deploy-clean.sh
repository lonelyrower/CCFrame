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

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose build --no-cache --force-rm

echo "🌐 启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动（60秒）..."
sleep 60

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose ps

# 检查Web服务健康状态
echo "🏥 检查Web服务健康状态..."
for i in {1..10}; do
  if docker exec ccframe-web wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ Web服务运行正常"
    break
  else
    echo "⏳ 等待Web服务启动... (${i}/10)"
    sleep 10
  fi
done

# 显示访问信息
echo ""
echo "🎉 部署完成！"
echo "========================"
echo "Web访问地址: http://localhost"
echo "MinIO控制台: http://localhost:9001"
echo "管理员账号: 请查看 .env 文件中的 ADMIN_EMAIL 和 ADMIN_PASSWORD"
echo ""
echo "📋 服务状态:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📝 如需查看日志:"
echo "  所有服务: docker compose logs -f"
echo "  Web服务: docker compose logs -f web"
echo "  nginx服务: docker compose logs -f nginx"