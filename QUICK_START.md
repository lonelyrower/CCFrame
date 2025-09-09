# 🚀 CCFrame 一键部署指南

## ⚡ 超快速部署 (5分钟)

### 方法一：Vercel 一键部署 (推荐)

```bash
# 1. 克隆项目
git clone https://github.com/lonelyrower/CCFrame.git
cd CCFrame

# 2. 运行一键部署脚本
./scripts/quick-deploy.sh
```

### 方法二：完整部署脚本

```bash
# 运行完整的交互式部署脚本
./deploy.sh
```

选择部署方式：
- `1` - Vercel (最简单)
- `2` - Railway (包含数据库)  
- `3` - Docker (本地/服务器)
- `4` - 手动配置

## 📋 环境变量配置

部署后需要在平台控制台添加以下环境变量：

### 必需变量

```env
DATABASE_URL="postgresql://username:password@host:5432/dbname"
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://your-domain.vercel.app"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-secure-password"
```

### 可选变量 (AI功能)

```env
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-claude-key"  
GOOGLE_API_KEY="your-google-key"
CLIPDROP_API_KEY="your-clipdrop-key"      # 启用真·AI放大 / 去背景
REMOVE_BG_API_KEY="your-removebg-key"     # 备选：去背景
```

## 🗄️ 数据库选择

### 免费 PostgreSQL 服务

1. **Supabase** (推荐)
   - 免费额度: 500MB + 2个项目
   - 网址: https://supabase.com
   - 获取连接字符串: Project Settings → Database

2. **Neon**
   - 免费额度: 0.5GB + 无限项目
   - 网址: https://neon.tech
   - 无冷启动延迟

3. **Railway**
   - 免费额度: $5/月额度
   - 网址: https://railway.app
   - 一键部署 + 数据库

### 连接字符串格式

```
postgresql://用户名:密码@主机:端口/数据库名
```

例如：
```
postgresql://postgres.abc123:password@aws-0-region.pooler.supabase.com:5432/postgres
```

## 🎯 部署后设置

### 1. 数据库初始化

```bash
# 运行数据库迁移脚本
node scripts/migrate.js
```

### 2. 访问应用

- 公开页面: `https://your-domain.vercel.app`
- 管理后台: `https://your-domain.vercel.app/admin/login`

### 3. 首次登录

使用配置的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录

### 4. 上传测试照片

在管理后台上传几张照片测试功能

## 🔧 故障排除

### 部署失败

```bash
# 检查 Node.js 版本 (需要 18+)
node --version

# 清理缓存重新部署
vercel --force --prod
```

### 数据库连接错误

1. 确认 `DATABASE_URL` 格式正确
2. 检查数据库服务是否启动
3. 验证网络连接权限

### 图片上传问题

1. 配置 S3 存储服务
2. 或使用 Vercel Blob Storage

### AI功能不工作

1. 检查 API 密钥是否正确
2. 确认 API 服务可用
3. 查看错误日志

## 📊 功能验证清单

部署完成后验证以下功能：

- [ ] 首页可以正常访问
- [ ] 管理后台可以登录
- [ ] 上传照片功能正常
- [ ] 照片列表显示正确
- [ ] 响应式设计在手机上正常
- [ ] 暗黑模式切换正常
- [ ] AI功能可用 (如果配置了API密钥)

## 🎨 自定义配置

### 修改主题色

编辑 `tailwind.config.js` 中的 `primary` 颜色

### 添加自定义标签

在数据库中添加或通过管理界面创建

### 配置存储服务

支持 AWS S3、MinIO、阿里云OSS 等

## 📚 更多资源

- [完整文档](README.md)
- [GitHub仓库](https://github.com/lonelyrower/CCFrame)
- [问题反馈](https://github.com/lonelyrower/CCFrame/issues)

---

**🎉 享受你的个人相册网站吧！**
