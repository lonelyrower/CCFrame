#!/bin/bash

echo "🔍 CCFrame 502错误诊断脚本"
echo "================================"

# 1. 检查服务状态
echo "1. 检查Docker容器状态："
docker-compose ps
echo ""

# 2. 检查nginx是否能连接到web服务
echo "2. 测试内部连接："
echo "nginx -> web连接测试："
docker-compose exec -T nginx wget -qO- --timeout=5 http://web:3000/api/health 2>/dev/null | head -3 || echo "❌ nginx无法连接到web服务"
echo ""

# 3. 检查web服务直接访问
echo "3. 测试web服务直接访问："
docker-compose exec -T web wget -qO- --timeout=5 http://localhost:3000/api/health 2>/dev/null | head -3 || echo "❌ web服务内部不可访问"
echo ""

# 4. 检查端口监听
echo "4. 检查端口监听情况："
echo "web容器内部端口："
docker-compose exec -T web ss -tlnp | grep 3000 || echo "❌ web服务未监听3000端口"
echo ""

# 5. 检查最近日志
echo "5. 检查各服务日志："
echo "--- Web服务日志（最后10行）---"
docker-compose logs --tail=10 web | tail -10
echo ""

echo "--- Nginx日志（最后5行）---"
docker-compose logs --tail=5 nginx | tail -5
echo ""

echo "--- 数据库日志（最后5行）---"
docker-compose logs --tail=5 db | tail -5
echo ""

# 6. 检查数据库连接
echo "6. 检查数据库连接："
docker-compose exec -T db pg_isready -U ccframe -d ccframe && echo "✅ 数据库连接正常" || echo "❌ 数据库连接失败"
echo ""

# 7. 检查环境变量
echo "7. 检查关键环境变量："
echo "DATABASE_URL配置："
docker-compose exec -T web printenv DATABASE_URL | head -1 || echo "❌ DATABASE_URL未设置"
echo ""

# 8. 尝试重启服务的建议
echo "8. 建议的修复步骤："
echo "如果web服务没有正常运行，请尝试："
echo "   docker-compose restart web"
echo ""
echo "如果需要完全重新部署："
echo "   docker-compose down"
echo "   docker-compose up -d"
echo ""

echo "================================"
echo "诊断完成。请查看上面的输出来定位问题。"