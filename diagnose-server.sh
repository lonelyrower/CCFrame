#!/bin/bash

# 服务器诊断脚本
echo "=== CCFrame 服务器诊断 ==="
echo "时间: $(date)"
echo

echo "1. 检查 Docker 容器状态:"
docker-compose ps
echo

echo "2. 检查 nginx 日志 (最近20行):"
docker-compose logs --tail=20 nginx
echo

echo "3. 检查 web 应用日志 (最近20行):"
docker-compose logs --tail=20 web
echo

echo "4. 检查端口占用:"
netstat -tlnp | grep -E ':3000|:80|:443'
echo

echo "5. 检查容器网络连接:"
docker-compose exec nginx wget -qO- --timeout=5 http://web:3000/ | head -10 2>/dev/null || echo "无法连接到 web:3000"
echo

echo "6. 检查磁盘空间:"
df -h
echo

echo "=== 诊断完成 ==="