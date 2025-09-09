# 🎨 CCFrame - AI驱动的个人相册网站

<div align="center">

![CCFrame](https://img.shields.io/badge/CCFrame-AI%20Gallery-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

一个现代化、智能化的个人相册网站，具有AI图片处理功能

[📸 在线演示](#) | [🚀 一键部署](#-一键部署) | [📖 详细文档](#-详细文档)

</div>

## ⚡ 一键部署

```bash
curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/install.sh | bash
```

**就是这么简单！** 脚本会自动：
- ✅ 检查系统环境
- ✅ 安装必要依赖
- ✅ 下载项目代码
- ✅ 选择部署平台
- ✅ 完成部署配置

支持 **Vercel**、**Railway**、**Docker** 三种部署方式。

---

## ✨ 功能特色

### 📸 智能相册管理
- **多种视图** - 瀑布流、网格、时间线、地图展示
- **智能分类** - 自动按时间、地点、标签整理
- **批量操作** - 上传、编辑、删除多张照片
- **EXIF提取** - 自动读取拍摄信息和地理位置

### 🤖 AI图片处理
- **智能增强** - 一键改善照片亮度、对比度、色彩
- **AI放大** - 无损放大图片分辨率
- **背景移除** - 智能抠图和背景替换
- **多AI支持** - OpenAI、Claude、Gemini可选

### 🎨 现代化设计
- **响应式设计** - 完美适配手机、平板、桌面
- **暗黑模式** - 自动切换，保护夜间视力
- **PWA支持** - 可安装到设备，离线浏览
- **动效优化** - 流畅的过渡和微交互

### 🔐 权限与安全
- **双重权限** - 公开/私密照片分级管理
- **安全认证** - NextAuth.js + 2FA支持
- **审计日志** - 记录所有关键操作
- **数据保护** - EXIF隐私清理，GPS可选显示

---

## 🏗️ 技术架构

### 前端技术栈
- **框架**: Next.js 14 (App Router + Server Components)
- **样式**: Tailwind CSS + Headless UI
- **动效**: Framer Motion
- **状态**: SWR + React Hook Form
- **类型**: TypeScript 全覆盖

### 后端技术栈
- **API**: Next.js Route Handlers + tRPC (可选)
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis + BullMQ 任务队列
- **存储**: S3兼容 (AWS/MinIO/阿里云)
- **认证**: NextAuth.js + bcrypt

### AI与图像处理
- **图像处理**: Sharp + EXIF提取
- **AI集成**: OpenAI/Claude/Gemini APIs
- **格式优化**: AVIF/WebP/JPEG 多格式输出
- **缓存策略**: CDN + 本地缓存

---

## 🚀 部署方案

### 1. Vercel 部署 (推荐)

最简单的部署方式，适合个人用户：

```bash
# 一键部署
curl -fsSL https://raw.githubusercontent.com/lonelyrower/CCFrame/main/install.sh | bash

# 或者手动部署
git clone https://github.com/lonelyrower/CCFrame.git
cd CCFrame
vercel --prod
```

**配置要求**:
- 免费 PostgreSQL (Supabase/Neon)
- Vercel 环境变量配置

### 2. Railway 部署

包含数据库的完整方案：

```bash
# 包含在一键脚本中
railway create && railway add postgresql && railway up
```

**优势**:
- 自动配置数据库
- $5/月免费额度
- 零配置部署

### 3. Docker/VPS 部署（推荐用于带队列与图片处理）

在 VPS 上一键启动完整环境：

```bash
cp .env.docker.example .env    # 按需修改变量
docker-compose up -d --build
```

包含服务：
- Web（Next.js SSR）
- Worker（BullMQ 队列常驻）
- PostgreSQL（本地容器）
- Redis（队列/会话）
- MinIO（S3 兼容存储，内置初始化桶）
- Nginx（80 端口反代至 Web）

启动后：
- 访问站点：http://<你的服务器IP>/
- 管理后台：http://<你的服务器IP>/admin/login
- MinIO 控制台：http://<你的服务器IP>:9001 （默认账号/密码见 .env）

备注：
- 首次启动会自动执行 `prisma db push` 与管理员创建脚本。
- 如需 HEIC 支持，镜像已安装系统 libvips+heif，sharp 将优先使用系统库。

### 🖼️ 图片服务模式（重要）

项目默认使用“流式图片接口”直接由服务端读取存储并返回图片二进制，从而避免暴露存储的内网域名（如 `minio` 容器主机名）导致浏览器无法访问的情况；同时对 PRIVATE 照片会进行会话校验。

- 默认：`/api/image/:id/:variant` 走流式返回（推荐）
- 可选：如需跳转到签名地址，使用 `/api/image/serve/:id/:variant` 路由（需确保签名 URL 的域名对浏览器可达，并已做权限校验）

建议保持默认的流式模式以获得最佳兼容性与安全性。

### 4. 手动部署

完全自定义的部署方案：

```bash
npm install
cp .env.example .env  # 编辑配置
npx prisma db push
npm run build
npm start
```

---

## 🔧 配置说明

### 必需环境变量

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@host:5432/dbname"

# 应用配置  
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# 管理员账户
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your-secure-password"
```

### 可选环境变量

```env
# AI功能 (可选)
OPENAI_API_KEY="sk-your-openai-key"
ANTHROPIC_API_KEY="sk-ant-your-claude-key"
GOOGLE_API_KEY="your-google-key"
CLIPDROP_API_KEY="your-clipdrop-key"       # 真·AI放大 / 去背景
REMOVE_BG_API_KEY="your-removebg-key"      # 可选备用：去背景

# 存储配置
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket"

# 缓存配置
REDIS_URL="redis://localhost:6379"

# 性能与并发（可选）
# 控制处理并发与生成格式/尺寸，降低CPU/网络压力
IMG_WORKER_CONCURRENCY="3"         # 图片处理Worker并发
AI_WORKER_CONCURRENCY="1"          # AI处理Worker并发
UPLOAD_CONCURRENCY="4"             # 变体上传并发
IMAGE_FORMATS="webp,jpeg"          # 启用的变体格式（默认 avif,webp,jpeg）
IMAGE_VARIANT_NAMES="thumb,small,medium,large" # 启用的变体尺寸名
```

### 免费服务推荐

| 服务类型 | 推荐平台 | 免费额度 | 特色 |
|---------|---------|---------|------|
| **部署平台** | Vercel | 无限制 | 全球CDN + 自动SSL |
| **数据库** | Supabase | 500MB | 实时功能 + 管理界面 |
| **数据库** | Neon | 0.5GB | 无冷启动 + 分支管理 |
| **存储** | Cloudflare R2 | 10GB | 零出站费用 |
| **缓存** | Upstash Redis | 10k命令/天 | 无服务器架构 |

---

## 📱 功能预览

### 🏠 主页展示
- 瀑布流照片展示
- 响应式多列布局
- 懒加载 + 无限滚动
- 快速搜索和筛选

### 👨‍💼 管理后台
- 拖拽上传照片
- 批量编辑和标签
- AI处理工作台
- 数据统计面板

### 📸 照片详情
- 大图灯箱浏览
- EXIF信息展示
- 地理位置地图
- 相关照片推荐

### 🤖 AI工作台
- 实时预览效果
- 参数调节控制
- 处理进度显示
- 版本历史管理

---

## 🛠️ 本地开发

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (可选)

### 开发步骤

```bash
# 1. 克隆项目
git clone https://github.com/lonelyrower/CCFrame.git
cd CCFrame

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库（推荐使用 PostgreSQL）
npx prisma generate
npx prisma db push
node scripts/create-admin.js

# 5. 启动开发服务 + 工作队列（生成图片变体必需）
npm run dev & START_WORKERS=true npx tsx jobs/worker.ts
```

### 项目结构

```
CCFrame/
├── app/                    # Next.js App Router
│   ├── (public)/          # 公开页面
│   ├── admin/             # 管理后台
│   └── api/               # API 路由
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件
│   ├── gallery/          # 相册组件
│   └── admin/            # 管理组件
├── lib/                   # 核心库
│   ├── auth.ts           # 认证逻辑
│   ├── db.ts             # 数据库客户端
│   ├── storage.ts        # 文件存储
│   └── ai-services.ts    # AI 服务集成
├── jobs/                  # 后台任务
├── prisma/               # 数据库模型
├── scripts/              # 工具脚本
└── types/                # TypeScript 类型
```

---

## 🎯 路线图

### v1.0 (当前)
- ✅ 基础相册功能
- ✅ AI图片处理
- ✅ 管理后台
- ✅ PWA支持

### v1.1 (规划中)
- 🔄 人脸识别和分组
- 🔄 智能相册推荐
- 🔄 批量AI处理
- 🔄 更多AI模型支持

### v1.2 (未来)
- 📋 移动端原生应用
- 📋 社交分享功能
- 📋 协作和评论
- 📋 更多存储后端

---

## 🤝 贡献指南

欢迎参与 CCFrame 的开发！

### 如何贡献

1. **Fork** 项目
2. 创建 **feature** 分支
3. 提交你的修改
4. 推送到分支
5. 创建 **Pull Request**

### 开发规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 添加必要的测试
- 更新相关文档

### 问题反馈

- 🐛 **Bug报告**: [GitHub Issues](https://github.com/lonelyrower/CCFrame/issues)
- 💡 **功能建议**: [GitHub Discussions](https://github.com/lonelyrower/CCFrame/discussions)
- ❓ **使用问题**: [GitHub Discussions Q&A](https://github.com/lonelyrower/CCFrame/discussions/categories/q-a)

---

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

感谢以下开源项目和服务：

- [Next.js](https://nextjs.org) - React 全栈框架
- [Prisma](https://prisma.io) - 现代化数据库工具
- [Tailwind CSS](https://tailwindcss.com) - 实用优先的CSS框架
- [Vercel](https://vercel.com) - 最佳的部署平台
- [Supabase](https://supabase.com) - 开源Firebase替代品

---

## 📞 联系方式

- **作者**: lonelyrower
- **邮箱**: lonelyrower99@gmail.com
- **GitHub**: [@lonelyrower](https://github.com/lonelyrower)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**

Made with ❤️ by [lonelyrower](https://github.com/lonelyrower)

</div>
