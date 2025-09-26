@echo off
echo === CCFrame 快速修复脚本 ===
echo.

cd /d "d:\Projects\CCFrame"

echo 检查当前配置...
echo DATABASE_URL: %DATABASE_URL%
echo.

echo 1. 安装依赖（如果需要）...
if not exist node_modules (
    npm install
)

echo.
echo 2. 生成 Prisma 客户端...
call npx prisma generate

echo.
echo 3. 创建 SQLite 数据库...
call npx prisma db push --accept-data-loss

echo.
echo 4. 创建管理员用户...
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
async function createAdmin() {
  const prisma = new PrismaClient();
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        passwordHash: hashedPassword,
      },
    });
    console.log('管理员用户准备就绪:', user.email);
  } catch (error) {
    console.log('用户设置:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}
createAdmin();
"

echo.
echo 5. 启动开发服务器...
start "CCFrame Dev Server" cmd /k "npm run dev"

echo.
echo === 完成！===
echo.
echo 请等待服务器启动，然后在浏览器中访问: http://localhost:3000
echo.
echo 管理员登录信息:
echo   邮箱: admin@example.com  
echo   密码: admin123
echo.
pause