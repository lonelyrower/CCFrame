#!/bin/bash

# 🚀 CCFrame 超快速部署脚本 - Vercel版本
# 5分钟完成部署！

set -e

echo "🚀 CCFrame 超快速部署 - 开始！"

# 检查必要工具
echo "📦 检查工具..."
if ! command -v git &> /dev/null; then
    echo "❌ 请先安装 git"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js 18+"
    exit 1
fi

# 一键安装和配置
echo "🔧 安装 Vercel CLI..."
npm install -g vercel@latest

echo "✅ 开始部署到 Vercel..."

# 创建 Vercel 配置
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "outputDirectory": ".next"
      }
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
EOF

# 直接部署
echo "🚀 正在部署..."
vercel --prod

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 在 Vercel 控制台添加以下环境变量："
echo ""
echo "   必需变量:"
echo "   - DATABASE_URL: 你的 PostgreSQL 连接字符串"
echo "   - NEXTAUTH_SECRET: 随机32字符密钥"
echo "   - ADMIN_EMAIL: 管理员邮箱"
echo "   - ADMIN_PASSWORD: 管理员密码"
echo ""
echo "   可选变量:"
echo "   - CDN_BASE_URL: CDN 域名（建议生产配置以提升性能）"
echo ""
echo "2. 重新部署以应用环境变量："
echo "   vercel --prod"
echo ""
echo "3. 访问你的应用并登录管理后台"
echo ""
echo "🔗 免费 PostgreSQL 推荐："
echo "   - Supabase: https://supabase.com"
echo "   - Neon: https://neon.tech"
echo "   - Railway: https://railway.app"
echo ""
echo "📚 完整文档: https://github.com/lonelyrower/CCFrame"
