#!/bin/bash

# CCFrame 生产环境快速修复脚本
echo "=================================="
echo "CCFrame 生产环境快速修复"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 步骤计数器
step=1

echo_step() {
    echo -e "${BLUE}步骤 $step: $1${NC}"
    echo "--------------------------------"
    ((step++))
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# 1. 检查环境
echo_step "检查运行环境"

if [ ! -f "package.json" ]; then
    echo_error "错误：package.json 文件不存在，请确保在正确的项目目录中运行此脚本"
    exit 1
fi

echo_success "在正确的项目目录中"

# 2. 停止现有服务
echo_step "停止现有服务"

if command -v pm2 >/dev/null 2>&1; then
    pm2 stop ccframe 2>/dev/null || true
    echo_success "已停止 PM2 服务（如果存在）"
fi

# 3. 备份关键文件
echo_step "备份关键配置"

backup_dir="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $backup_dir

if [ -f ".env" ]; then
    cp .env $backup_dir/
    echo_success "已备份 .env 文件"
fi

if [ -f "config/production.env" ]; then
    cp config/production.env $backup_dir/
    echo_success "已备份 production.env 文件"
fi

# 4. 清理和重新安装依赖
echo_step "重新安装依赖"

echo "清理旧的依赖..."
rm -rf node_modules 2>/dev/null || true
rm -rf .next 2>/dev/null || true
rm -f package-lock.json 2>/dev/null || true

echo "安装依赖..."
if npm install; then
    echo_success "依赖安装成功"
else
    echo_error "依赖安装失败"
    exit 1
fi

# 5. 生成 Prisma 客户端
echo_step "生成 Prisma 客户端"

if npx prisma generate; then
    echo_success "Prisma 客户端生成成功"
else
    echo_error "Prisma 客户端生成失败"
    exit 1
fi

# 6. 数据库迁移
echo_step "运行数据库迁移"

echo "检查数据库连接..."
if npx prisma db status >/dev/null 2>&1; then
    echo_success "数据库连接正常"
    
    echo "运行数据库迁移..."
    if npx prisma migrate deploy; then
        echo_success "数据库迁移完成"
    else
        echo_warning "数据库迁移失败，尝试 db push..."
        if npx prisma db push; then
            echo_success "数据库推送完成"
        else
            echo_error "数据库操作失败"
            exit 1
        fi
    fi
else
    echo_error "数据库连接失败，请检查 DATABASE_URL"
    exit 1
fi

# 7. 构建应用
echo_step "构建应用"

if npm run build; then
    echo_success "应用构建成功"
else
    echo_error "应用构建失败"
    exit 1
fi

# 8. 创建或更新管理员用户
echo_step "设置管理员用户"

if [ -f "scripts/create-admin.js" ]; then
    if node scripts/create-admin.js; then
        echo_success "管理员用户设置完成"
    else
        echo_warning "管理员用户设置失败，可能已存在"
    fi
else
    echo_warning "管理员创建脚本不存在，跳过"
fi

# 9. 设置权限
echo_step "设置文件权限"

# 设置适当的权限
chmod -R 755 . 2>/dev/null || true

# 创建上传目录
if [ -n "$UPLOAD_PATH" ]; then
    mkdir -p "$UPLOAD_PATH" 2>/dev/null || true
    chmod 755 "$UPLOAD_PATH" 2>/dev/null || true
    echo_success "上传目录权限已设置"
fi

# 创建日志目录
mkdir -p logs 2>/dev/null || true
chmod 755 logs 2>/dev/null || true

echo_success "文件权限设置完成"

# 10. 启动服务
echo_step "启动服务"

if command -v pm2 >/dev/null 2>&1; then
    # 使用 PM2
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env production
        echo_success "PM2 服务已启动"
    else
        pm2 start npm --name "ccframe" -- start
        echo_success "PM2 服务已启动（使用默认配置）"
    fi
    
    # 保存 PM2 配置
    pm2 save
    pm2 startup
    
elif command -v systemctl >/dev/null 2>&1; then
    # 使用 systemd
    if systemctl is-active --quiet ccframe; then
        systemctl restart ccframe
        echo_success "Systemd 服务已重启"
    else
        echo_warning "Systemd 服务未配置，请手动启动应用"
    fi
else
    echo_warning "未找到进程管理器，请手动启动应用：npm start"
fi

echo ""
echo -e "${GREEN}=================================="
echo "修复完成！"
echo "==================================${NC}"
echo ""
echo "服务状态："
if command -v pm2 >/dev/null 2>&1; then
    pm2 list
fi
echo ""
echo "访问地址："
echo "- 主页: ${NEXTAUTH_URL:-http://localhost:3000}"
echo "- 管理后台: ${NEXTAUTH_URL:-http://localhost:3000}/admin"
echo ""
echo "管理员登录："
echo "- 邮箱: ${ADMIN_EMAIL:-admin@example.com}"
echo "- 密码: 请查看环境变量 ADMIN_PASSWORD"
echo ""
echo "如果问题仍然存在，请检查："
echo "1. 环境变量是否正确设置"
echo "2. 数据库服务是否正常运行"
echo "3. 查看应用日志: pm2 logs ccframe"
echo ""
echo "备份文件保存在: $backup_dir/"