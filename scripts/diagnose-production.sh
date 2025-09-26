#!/bin/bash

# CCFrame 生产环境诊断脚本
# 用于排查 "Something went wrong" 错误

echo "=================================="
echo "CCFrame 生产环境诊断工具"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

echo -e "${BLUE}1. 检查环境变量配置${NC}"
echo "--------------------------------"

# 检查必需的环境变量
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL" "ADMIN_EMAIL")
for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✓${NC} $var 已设置"
        if [ "$var" = "DATABASE_URL" ]; then
            echo "  数据库类型: $(echo ${!var} | cut -d: -f1)"
        fi
    else
        echo -e "${RED}✗${NC} $var 未设置"
    fi
done

echo ""
echo -e "${BLUE}2. 检查数据库连接${NC}"
echo "--------------------------------"

# 检查 PostgreSQL 连接
if command -v psql >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} psql 命令可用"
    
    # 从 DATABASE_URL 提取连接信息
    if [ -n "$DATABASE_URL" ]; then
        # 尝试连接数据库
        if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} 数据库连接成功"
            
            # 检查关键表是否存在
            tables=("users" "photos" "albums" "tags")
            for table in "${tables[@]}"; do
                if psql "$DATABASE_URL" -c "\dt $table" | grep -q "$table"; then
                    echo -e "${GREEN}✓${NC} 表 '$table' 存在"
                else
                    echo -e "${RED}✗${NC} 表 '$table' 不存在"
                fi
            done
        else
            echo -e "${RED}✗${NC} 数据库连接失败"
        fi
    else
        echo -e "${YELLOW}!${NC} DATABASE_URL 未设置，跳过数据库检查"
    fi
else
    echo -e "${YELLOW}!${NC} psql 命令不可用，跳过数据库检查"
fi

echo ""
echo -e "${BLUE}3. 检查 Redis 连接（可选）${NC}"
echo "--------------------------------"

if [ -n "$REDIS_URL" ]; then
    if command -v redis-cli >/dev/null 2>&1; then
        # 从 REDIS_URL 提取连接信息
        redis_host=$(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f1)
        redis_port=$(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f2 | cut -d/ -f1)
        
        if [ -z "$redis_port" ]; then
            redis_port=6379
        fi
        
        if redis-cli -h "$redis_host" -p "$redis_port" ping >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Redis 连接成功"
        else
            echo -e "${RED}✗${NC} Redis 连接失败"
        fi
    else
        echo -e "${YELLOW}!${NC} redis-cli 命令不可用，跳过 Redis 检查"
    fi
else
    echo -e "${YELLOW}!${NC} REDIS_URL 未设置，跳过 Redis 检查"
fi

echo ""
echo -e "${BLUE}4. 检查文件系统和权限${NC}"
echo "--------------------------------"

# 检查项目目录权限
current_dir=$(pwd)
if [ -r "$current_dir" ] && [ -w "$current_dir" ]; then
    echo -e "${GREEN}✓${NC} 项目目录权限正常"
else
    echo -e "${RED}✗${NC} 项目目录权限不足"
fi

# 检查上传目录
if [ -n "$UPLOAD_PATH" ]; then
    if [ -d "$UPLOAD_PATH" ]; then
        echo -e "${GREEN}✓${NC} 上传目录存在: $UPLOAD_PATH"
        if [ -w "$UPLOAD_PATH" ]; then
            echo -e "${GREEN}✓${NC} 上传目录可写"
        else
            echo -e "${RED}✗${NC} 上传目录不可写"
        fi
    else
        echo -e "${RED}✗${NC} 上传目录不存在: $UPLOAD_PATH"
    fi
else
    echo -e "${YELLOW}!${NC} UPLOAD_PATH 未设置"
fi

echo ""
echo -e "${BLUE}5. 检查 Node.js 和依赖${NC}"
echo "--------------------------------"

# 检查 Node.js 版本
node_version=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Node.js 版本: $node_version"
    
    # 检查是否符合最低要求 (v18+)
    major_version=$(echo $node_version | sed 's/v//' | cut -d. -f1)
    if [ "$major_version" -ge 18 ]; then
        echo -e "${GREEN}✓${NC} Node.js 版本符合要求 (>=18)"
    else
        echo -e "${RED}✗${NC} Node.js 版本过低，需要 18 或更高版本"
    fi
else
    echo -e "${RED}✗${NC} Node.js 不可用"
fi

# 检查关键依赖
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json 存在"
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} node_modules 目录存在"
        
        # 检查关键包
        key_packages=("next" "@prisma/client" "prisma")
        for package in "${key_packages[@]}"; do
            if [ -d "node_modules/$package" ]; then
                echo -e "${GREEN}✓${NC} 包 '$package' 已安装"
            else
                echo -e "${RED}✗${NC} 包 '$package' 未找到"
            fi
        done
    else
        echo -e "${RED}✗${NC} node_modules 目录不存在，请运行 npm install"
    fi
else
    echo -e "${RED}✗${NC} package.json 不存在"
fi

echo ""
echo -e "${BLUE}6. 检查 Prisma 配置${NC}"
echo "--------------------------------"

if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓${NC} Prisma schema 文件存在"
    
    # 检查 Prisma 客户端是否生成
    if [ -d "node_modules/.prisma" ]; then
        echo -e "${GREEN}✓${NC} Prisma 客户端已生成"
    else
        echo -e "${RED}✗${NC} Prisma 客户端未生成，请运行: npx prisma generate"
    fi
    
    # 检查数据库提供者
    db_provider=$(grep "provider" prisma/schema.prisma | head -1 | sed 's/.*"\(.*\)".*/\1/')
    echo -e "${GREEN}✓${NC} 数据库提供者: $db_provider"
    
else
    echo -e "${RED}✗${NC} Prisma schema 文件不存在"
fi

echo ""
echo -e "${BLUE}7. 检查进程和端口${NC}"
echo "--------------------------------"

# 检查端口占用
port=${PORT:-3000}
if command -v lsof >/dev/null 2>&1; then
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${YELLOW}!${NC} 端口 $port 已被占用"
        lsof -i :$port
    else
        echo -e "${GREEN}✓${NC} 端口 $port 可用"
    fi
else
    echo -e "${YELLOW}!${NC} lsof 命令不可用，跳过端口检查"
fi

echo ""
echo -e "${BLUE}8. 建议的修复步骤${NC}"
echo "--------------------------------"

echo "如果发现问题，请按以下顺序尝试修复："
echo ""
echo "1. 环境变量问题:"
echo "   - 确保 .env 或环境变量文件正确配置"
echo "   - 检查 DATABASE_URL, NEXTAUTH_SECRET 等必需变量"
echo ""
echo "2. 数据库问题:"
echo "   - 确保 PostgreSQL 服务运行: sudo systemctl status postgresql"
echo "   - 运行数据库迁移: npx prisma migrate deploy"
echo "   - 生成 Prisma 客户端: npx prisma generate"
echo ""
echo "3. 依赖问题:"
echo "   - 重新安装依赖: rm -rf node_modules && npm install"
echo "   - 清理构建缓存: rm -rf .next"
echo ""
echo "4. 权限问题:"
echo "   - 检查文件权限: chmod -R 755 ."
echo "   - 创建上传目录: mkdir -p uploads && chmod 755 uploads"
echo ""
echo "5. 重启服务:"
echo "   - PM2: pm2 restart ccframe"
echo "   - Docker: docker-compose restart"
echo "   - Systemd: sudo systemctl restart ccframe"

echo ""
echo -e "${GREEN}诊断完成！${NC}"
echo "如果问题仍然存在，请将此诊断结果发送给技术支持。"