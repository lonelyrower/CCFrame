@echo off
echo === 生成 Prisma 客户端和数据库 ===
echo.

cd /d "d:\Projects\CCFrame"

echo 1. 生成 Prisma 客户端...
call npx prisma generate

echo.
echo 2. 创建 SQLite 数据库...
call npx prisma db push

echo.
echo 3. 检查数据库状态...
call npx prisma db status

echo.
echo === 完成！===
echo.
echo 现在可以运行：npm run dev
pause