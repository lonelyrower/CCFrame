@echo off
REM CCFrame 生产环境诊断脚本 (Windows 版本)
REM 用于排查 "Something went wrong" 错误

echo ==================================
echo CCFrame 生产环境诊断工具 (Windows)
echo ==================================
echo.

echo 1. 检查环境变量配置
echo --------------------------------
if defined DATABASE_URL (
    echo [√] DATABASE_URL 已设置
) else (
    echo [X] DATABASE_URL 未设置
)

if defined NEXTAUTH_SECRET (
    echo [√] NEXTAUTH_SECRET 已设置
) else (
    echo [X] NEXTAUTH_SECRET 未设置
)

if defined NEXTAUTH_URL (
    echo [√] NEXTAUTH_URL 已设置: %NEXTAUTH_URL%
) else (
    echo [X] NEXTAUTH_URL 未设置
)

if defined ADMIN_EMAIL (
    echo [√] ADMIN_EMAIL 已设置: %ADMIN_EMAIL%
) else (
    echo [X] ADMIN_EMAIL 未设置
)

echo.
echo 2. 检查 Node.js 和依赖
echo --------------------------------

node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [√] Node.js 版本: 
    node --version
) else (
    echo [X] Node.js 不可用
)

if exist package.json (
    echo [√] package.json 存在
) else (
    echo [X] package.json 不存在
)

if exist node_modules (
    echo [√] node_modules 目录存在
) else (
    echo [X] node_modules 目录不存在
)

if exist node_modules\.prisma (
    echo [√] Prisma 客户端已生成
) else (
    echo [X] Prisma 客户端未生成
)

echo.
echo 3. 检查 Prisma 配置
echo --------------------------------

if exist prisma\schema.prisma (
    echo [√] Prisma schema 文件存在
) else (
    echo [X] Prisma schema 文件不存在
)

echo.
echo 4. 检查文件系统
echo --------------------------------

if defined UPLOAD_PATH (
    if exist "%UPLOAD_PATH%" (
        echo [√] 上传目录存在: %UPLOAD_PATH%
    ) else (
        echo [X] 上传目录不存在: %UPLOAD_PATH%
    )
) else (
    echo [!] UPLOAD_PATH 未设置
)

echo.
echo 5. 测试数据库连接
echo --------------------------------

REM 尝试运行 Prisma 命令来测试数据库连接
echo 测试数据库连接...
npx prisma db status >nul 2>&1
if %errorlevel% equ 0 (
    echo [√] 数据库连接成功
) else (
    echo [X] 数据库连接失败
    echo     请检查 DATABASE_URL 和数据库服务状态
)

echo.
echo 6. 建议的修复步骤
echo --------------------------------
echo.
echo 如果发现问题，请按以下顺序尝试修复:
echo.
echo 1. 环境变量问题:
echo    - 检查 .env 文件或系统环境变量
echo    - 确保所有必需变量都已设置
echo.
echo 2. 数据库问题:
echo    - 确保数据库服务运行
echo    - 运行: npx prisma migrate deploy
echo    - 运行: npx prisma generate
echo.
echo 3. 依赖问题:
echo    - 删除 node_modules 文件夹
echo    - 运行: npm install
echo    - 运行: npm run build
echo.
echo 4. 重启服务:
echo    - PM2: pm2 restart ccframe
echo    - IIS: 重启应用程序池
echo    - 手动: 重启 Node.js 进程
echo.
echo 诊断完成！
echo 如果问题仍然存在，请将此诊断结果发送给技术支持。
echo.
pause