#!/bin/bash

echo "🪣 修复MinIO存储桶配置脚本"
echo "================================"

# 停止minio-init容器（如果在运行）
echo "1. 停止现有的minio-init容器..."
docker compose stop minio-init 2>/dev/null || true
docker compose rm -f minio-init 2>/dev/null || true

# 确保MinIO服务正在运行
echo "2. 启动MinIO服务..."
docker compose up -d minio

# 等待MinIO启动
echo "3. 等待MinIO服务启动（15秒）..."
sleep 15

# 检查MinIO是否可访问
echo "4. 检查MinIO连接..."
until docker compose exec -T minio mc ready local 2>/dev/null; do
  echo "等待MinIO启动..."
  sleep 3
done

# 手动创建存储桶
echo "5. 创建所需的存储桶..."
docker compose exec -T minio sh -c '
  mc alias set local http://localhost:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin}
  echo "创建存储桶: photo-gallery"
  mc mb -p local/photo-gallery || true
  echo "创建存储桶: ccframe" 
  mc mb -p local/ccframe || true
  echo "设置公共访问策略..."
  mc anonymous set public local/photo-gallery || true
  mc anonymous set public local/ccframe || true
  echo "列出所有存储桶："
  mc ls local/
'

# 重新启动minio-init容器以确保一致性
echo "6. 重新启动minio-init容器..."
docker compose up -d minio-init

# 等待初始化完成
sleep 10

# 检查最终状态
echo "7. 验证存储桶创建结果..."
docker compose exec -T minio mc ls local/ | grep -E "(photo-gallery|ccframe)" && echo "✅ 存储桶创建成功" || echo "❌ 存储桶创建失败"

# 测试文件上传
echo "8. 测试存储功能..."
docker compose exec -T minio sh -c 'echo "test" | mc pipe local/ccframe/test.txt && echo "✅ 文件上传测试成功" || echo "❌ 文件上传测试失败"'

echo ""
echo "================================"
echo "MinIO存储桶修复完成！"
echo "现在可以测试图片导入功能了。"