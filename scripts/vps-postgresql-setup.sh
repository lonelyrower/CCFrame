#!/bin/bash

# VPS PostgreSQL配置脚本
echo "正在为VPS恢复PostgreSQL配置..."

# 1. 恢复schema为PostgreSQL
echo "1. 更新prisma schema为PostgreSQL..."
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 2. 恢复Json字段类型
echo "2. 恢复Json字段类型..."
sed -i 's/location   String?/location   Json?/' prisma/schema.prisma
sed -i 's/exifJson   String?/exifJson   Json?/' prisma/schema.prisma
sed -i 's/payloadJson String/payloadJson Json/' prisma/schema.prisma
sed -i 's/resultJson  String?/resultJson  Json?/' prisma/schema.prisma
sed -i 's/meta       String?/meta       Json?/' prisma/schema.prisma
sed -i 's/ruleJson    String/ruleJson    Json/' prisma/schema.prisma

# 3. 使用生产环境配置
echo "3. 使用生产环境配置..."
if [ -f .env.production ]; then
    cp .env.production .env
    echo "已复制.env.production到.env"
else
    echo "警告: 未找到.env.production文件"
fi

# 4. 重新生成Prisma客户端
echo "4. 重新生成Prisma客户端..."
npx prisma generate

# 5. 运行数据库迁移
echo "5. 运行数据库迁移..."
npx prisma migrate deploy

echo "PostgreSQL配置完成!"
echo "请确保："
echo "1. PostgreSQL服务正在运行"
echo "2. 数据库凭据正确配置在.env文件中"
echo "3. 数据库用户有适当的权限"