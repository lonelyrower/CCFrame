@echo off
REM 开发环境快速设置脚本 - SQLite 模式 (Windows)

echo === CCFrame 开发环境设置 - SQLite 模式 ===
echo.

REM 1. 备份当前配置
if exist .env (
    echo 备份当前 .env 文件到 .env.backup...
    copy /Y .env .env.backup >nul
)

if exist prisma\schema.prisma (
    echo 备份当前 schema.prisma 文件到 prisma\schema.backup.prisma...
    copy /Y prisma\schema.prisma prisma\schema.backup.prisma >nul
)

REM 2. 切换到 SQLite 配置
echo 切换到 SQLite 开发配置...
copy /Y .env.sqlite .env >nul
copy /Y prisma\schema.sqlite.prisma prisma\schema.prisma >nul

REM 3. 安装依赖（如果需要）
echo 检查并安装依赖...
if not exist node_modules (
    npm install
)

REM 4. 生成 Prisma 客户端
echo 生成 Prisma 客户端...
npx prisma generate

REM 5. 创建数据库并运行迁移
echo 创建 SQLite 数据库...
npx prisma db push

REM 6. 创建管理员用户
echo 创建管理员用户...
node -e "const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcryptjs'); async function createAdmin() { const prisma = new PrismaClient(); try { const hashedPassword = await bcrypt.hash('admin123', 12); await prisma.user.upsert({ where: { email: 'admin@example.com' }, update: {}, create: { email: 'admin@example.com', passwordHash: hashedPassword, }, }); console.log('管理员用户创建成功: admin@example.com / admin123'); } catch (error) { console.log('管理员用户可能已存在或创建失败:', error.message); } finally { await prisma.$disconnect(); } } createAdmin();"

echo.
echo === 设置完成！===
echo.
echo 现在你可以运行:
echo   npm run dev      # 启动开发服务器
echo   npm run build    # 构建项目
echo.
echo 管理员登录信息:
echo   邮箱: admin@example.com
echo   密码: admin123
echo.
echo 要恢复到原始配置，运行:
echo   copy .env.backup .env
echo   copy prisma\schema.backup.prisma prisma\schema.prisma
echo.
pause