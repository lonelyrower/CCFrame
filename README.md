# 🎨 CCFrame - 个人相册网站

<div align="center">

![CCFrame](https://img.shields.io/badge/CCFrame-Photo%20Gallery-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

一个现代化的个人相册网站，专注照片展示与基础管理

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
- **批量操作** - 上传、删除、标签管理
- **EXIF提取** - 自动读取拍摄信息和地理位置

### 🧰 基础管理
- **上传管理** - 直传存储、失败重试
- **标签管理** - 重命名、合并、删除
- **相册管理** - 创建、封面、排序

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

### 🔎 语义搜索 (Semantic Search)
> 可选特性：通过自然语言描述检索相册里的相关照片（当前默认使用确定性占位向量，支持后续接入真实模型）。

能力概览：
- 向量存储：`PhotoEmbedding` Bytes + 可选 pgvector 向量列（加速 ANN 检索）
- 模式切换：`SEMANTIC_USE_PGVECTOR=off|shadow|on`
	- off：仅 brute-force (CPU 计算 cosine)
	- shadow：双跑（收集 recall / overlap / deltaMs 指标），返回 brute-force 结果
	- on：优先 pgvector，如失败自动 fallback brute-force
- 缓存层级：进程内 LRU 热缓存 → Redis 查询缓存 (TTL=120s)
- 速率限制：默认 60 次 / 5 分钟 / IP
- 指标：latency p95、cache hit、shadow recall、fallback 次数

启用步骤：
```env
ENABLE_SEMANTIC_SEARCH=true
SEMANTIC_USE_PGVECTOR=shadow   # 初期建议 shadow 观察指标
EMBED_DIM=768
EMBED_MODEL_NAME=clip-base-1
EMBED_PROVIDER=deterministic   # 未来可切换 openai / local-onnx
```

使用 OpenAI 向量（可选）：
```env
EMBED_PROVIDER=openai
OPENAI_API_KEY=sk-xxx               # 必填
EMBED_MODEL=text-embedding-3-small  # 可选（默认 text-embedding-3-small）
EMBED_BATCH_SIZE=64                 # 可选批量大小（<= 官方限制）
EMBED_OPENAI_STRICT=false           # true: 请求失败直接抛错；false: 回退 hash 向量
EMBED_OPENAI_RPM=60                 # 每分钟令牌（简单桶）
EMBED_OPENAI_MAX_RETRY=3            # 429/5xx 重试次数（指数退避 + 抖动）
EMBED_QUERY_CACHE_TTL_MS=30000      # 查询向量内存缓存 TTL (ms)，0 关闭
# 负缓存（可选）：对连续失败的查询短暂记忆，避免持续打爆外部 API
EMBED_NEG_CACHE=1                   # 开启负缓存
EMBED_NEG_CACHE_TTL_MS=5000         # 负缓存 TTL (ms)
```

回填已有照片向量（示例：OpenAI 模式 + 并发 4）：
```bash
EMBED_PROVIDER=openai OPENAI_API_KEY=sk-xxx \
	npx tsx scripts/backfill-embeddings.ts --batch=80 --concurrency=4 --progress-interval=50
```

成本与注意事项：
- `text-embedding-3-small` 维度 1536（若与 `EMBED_DIM` 不一致将报错，请统一配置）
- 速率：脚本内置简单令牌桶（默认 60 rpm）避免瞬时突发，可通过手动降低 `--batch` 与并发控制成本
- 设置 `EMBED_OPENAI_STRICT=true` 以在失败时终止（CI 严格模式）
- 默认宽松模式下失败自动回退为确定性哈希向量（保证功能不中断，但检索语义质量降低）
- 429/5xx 将按指数退避：500ms, 1s, 2s (+随机 0~200ms 抖动)，超过 `EMBED_OPENAI_MAX_RETRY` 仍失败则整体 fallback / 抛错（严格模式）
- 相同查询在 TTL 内命中进程级缓存，不再调用外部 API（带 `cached: true` 标记内部结果）
 - 缓存命中统计：`metrics.embeddings.queryCache` (hits / misses / hitRate)
 - 关闭缓存：`EMBED_QUERY_CACHE_TTL_MS=0`
	- 可选 Redis 二级缓存：设置 `EMBED_QUERY_REDIS=1` 启用，键格式 `embq:v1:<model>:<dim>:<sha256(query)>`，TTL (`EMBED_QUERY_REDIS_TTL_MS` 默认 = 内存 TTL * 2)
	- Redis 指标：`metrics.embeddings.queryRedis` (hits / misses / hitRate)
		- 层级来源：返回对象包含 `cacheLayer` = `memory | redis | provider`，对应指标：`metrics.embeddings.layers` 统计各层次数

向量列与索引（可选 pgvector 加速）：
```bash
npx tsx scripts/enable-pgvector.ts --dim=768 --backfill --create-index --lists=100 --concurrently
```

基准与评估脚本：
```bash
# 延迟基线
npx tsx scripts/benchmark-semantic.ts --queries=300 --concurrency=6 --limit=30

# 召回对比（影子模式下）
npx tsx scripts/eval-pgvector.ts --queries=200 --k=20 --limit=40 --min-recall=0.95 --max-regression=150
```

快速回滚：
```bash
SEMANTIC_USE_PGVECTOR=off   # 或关闭 ENABLE_SEMANTIC_SEARCH
```

Health 端点字段（摘录）：
```json
{
	"semantic": { "mode": "shadow" },
	"metrics": {
		"semanticApi": {
			"count": 123,
			"avgMs": 82.1,
			"p95Ms": 190.4,
			"cacheHitRate": 0.42,
			"shadow": {
				"samples": 110,
				"avgRecall": 0.972,
				"avgOverlap": 0.955,
				"avgDeltaMs": 310.5,
				"fallbacks": 0
			}
		},
		"embeddingLifecycle": { "orphanCount": 0, "missingCount": 5 }
	}
}
```

新增指标片段（语义嵌入）：
```json
{
	"embeddings": {
		"negativeCache": { "hits": 1, "inserts": 2, "size": 2 },
		"layers": { "memory": 10, "redis": 3, "provider": 7, "negative": 1 }
	}
}
```

自定义热缓存（进程内）：
```env
SEMANTIC_LRU_SIZE=150       # 默认 100
SEMANTIC_LRU_TTL_MS=60000   # 默认 60s
```

CI 阈值（建议）：
- recall@K ≥ 0.97
- p95 延迟改善 ≥ 300ms 或回归 < 150ms
- fallback / total < 0.02

当满足阈值后，从 `shadow` 切换到 `on`。若回归或召回下降，立即切 `off` 并排查索引 / 列是否失效。

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

### 图像处理
- **变体生成**: Sharp + EXIF提取
- **格式优化**: AVIF/WebP/JPEG 多格式输出
- **缓存策略**: CDN + 本地缓存
 - **去重策略**: 基于 perceptual hash + contentHash 精准去重（contentHash 优先）

### 状态常量集中管理
项目的照片状态 / 任务状态 / 可见性等字符串全部集中在 `lib/constants.ts`：
```
VISIBILITY: PUBLIC | PRIVATE
PHOTO_STATUS: UPLOADING | PROCESSING | COMPLETED | FAILED
JOB_STATUS: PENDING | RUNNING | COMPLETED | FAILED
JOB_TYPE: THUMBNAIL_GENERATION | EXIF_EXTRACTION | VARIANT_GENERATION | HASH_COMPUTATION | FACE_DETECTION | AI_ENHANCE
```
请勿再直接硬编码字符串，统一引用常量，避免拼写错误。

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

### 3. Docker/VPS 部署（推荐）

在 VPS 上一键启动完整环境：

```bash
cp .env.docker.example .env    # 按需修改变量
docker-compose up -d --build
```

包含服务：
- Web（Next.js SSR）
- Worker（图片变体处理队列）
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

项目支持两种图片服务模式：

- 流式返回（开发/内网推荐）：`/api/image/:id/:variant` 直接由服务端读取存储并返回二进制，避免暴露内网域名；对 PRIVATE 照片会做权限校验。
- 重定向（生产推荐）：`/api/image/serve/:id/:variant` 302 到存储/CDN，应用服不吃带宽与 CPU，CDN 命中率更高。

通过环境变量切换：

```env
NEXT_PUBLIC_IMAGE_SERVE_MODE=redirect   # 生产推荐：重定向
IMAGE_PUBLIC_VARIANTS=true  # 生产可选：仅公开变体，提升 CDN 命中率（原图仍私有）
```

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
# 存储配置
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket"

# 缓存配置
REDIS_URL="redis://localhost:6379"

# 性能与并发（可选）
# 控制处理并发与生成格式/尺寸，降低CPU/网络压力
IMG_WORKER_CONCURRENCY="3"         # 图片处理Worker并发
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
- 标签管理与相册管理
- 数据统计面板

### 📸 照片详情
- 大图灯箱浏览（缩放/平移/预加载/缩略条导航/快捷键/Blurhash 或缩略图占位渐进显示/多指捏合）
	- 键盘 +/- 触发自定义事件 `lightbox-zoom`（1x~5x，回 1x 归位）
	- 移动端双指捏合：保持两指中点锚定缩放
- 折叠面板：EXIF / Tags / Technical Info 可折叠
- 简易地图预览：有经纬度时显示小型 Canvas 标记点
- 标签内联编辑：乐观新增/移除（失败自动回滚 + toast）
- 主色占位：缺少 Blurhash 时对 thumb 采样平均色生成渐变背景
- 可访问性：`role="dialog"` + `aria-modal`，Filmstrip 使用 roving tabindex (listbox/option) + `aria-posinset`/`aria-setsize`，焦点陷阱确保 Tab 循环
- 相关照片推荐（规划中）

<!-- AI/编辑工作台已移除 -->
> 编辑功能（EditVersion 模型、基础编辑页、AI Enhance）已按产品方向下线；如需重新启用，可参考 `ARCHITECTURE.md` 中记录并回滚相关目录。

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
npm run db:generate
# 首次生成迁移（已在 package.json 配置为 init，如已生成可忽略）
npm run db:migrate
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
│   ├── storage-manager.ts# 文件存储（S3/MinIO）
│   ├── image-processing.ts# 变体生成（sharp）
│   └── exif.ts           # EXIF 提取
├── jobs/                  # 后台任务
├── prisma/               # 数据库模型
├── scripts/              # 工具脚本
└── types/                # TypeScript 类型
```

---

## 🎯 路线图

### 迁移管理（Prisma Migrate）
采用迁移文件而非 `db push`：
```
npm run db:migrate      # 本地开发生成新迁移（默认 init 或追加 -- --name <name>）
npm run db:deploy       # 生产环境应用迁移
npm run db:status       # 查看状态
npm run db:reset        # 重置开发数据库（危险）
```
详见 `prisma/BASELINE.md`。

### v1.0 (当前)
- ✅ 基础相册功能（上传/相册/标签/时间线/展示）
- ✅ 管理后台
- ✅ PWA 支持
 - ✅ 去重逻辑（上传预签 + Worker 双阶段 contentHash 检测 + DB 唯一约束）

### v1.1 (规划中)
- 🔄 人脸识别和分组（可选）
- 🔄 智能相册推荐（可选）
- 🔄 地图视图与地理聚类
 - 🔄 变体复用（重复文件直接复用已有 variants 数据避免冗余写入）

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

---

## 🧪 变体回填脚本 (`scripts/backfill-variants.ts`)

用于检查并补齐/重建照片的派生变体、Blurhash 与 EXIF 元数据。支持并发、干跑计划输出。

常用参数：

```
--limit=NUMBER              只处理前 N 条
--dry=true                  不执行写入（仍会读取文件）
--dry-plan=true             仅输出缺失计划 JSON（不解码图片）
--only-missing=false        处理所有（默认只处理缺失）
--variants=thumb,small      指定需要的变体名称集合
--formats=webp,jpeg         指定需要的输出格式集合
--recompute-blurhash=true   强制重算 blurhash
--recompute-exif=true       重新提取 EXIF
--concurrency=4             并发 worker 数
--since=2025-09-01          仅处理该日期（含）之后创建
--id=PHOTO_ID               仅处理单个照片
--continue-on-error=true    出错继续
--output-json=true          结果使用 JSON 格式输出
--force=true                忽略 only-missing 逻辑强制重建
```

示例：

1. 仅查看缺失计划：
```bash
node scripts/backfill-variants.ts --dry-plan=true
```

2. 并发回填缺失：
```bash
node scripts/backfill-variants.ts --concurrency=4 --output-json=true
```

3. 单张强制重建：
```bash
node scripts/backfill-variants.ts --id=abc123 --force=true --variants=thumb,small --formats=webp
```

4. 重算 blurhash + EXIF：
```bash
node scripts/backfill-variants.ts --since=2025-09-01 --recompute-blurhash=true --recompute-exif=true
```

Dry Plan 输出示例：
```json
{
	"photos": 2,
	"plan": [
		{ "id": "p1", "totalDesired": 4, "missing": ["thumb.webp", "thumb.jpeg"] },
		{ "id": "p2", "totalDesired": 4, "missing": [] }
	]
}
```

总结字段：
```
processed  已处理照片数（尝试）
skipped    跳过（无缺失且非 force）
uploaded   新增写入的变体数量
errors     错误照片条数
errorDetails  [{ id, error }]
```

建议流程：先 `--dry-plan` 预估工作量，再小批量带 `--concurrency` 正式执行。大规模全量刷新使用 `--force` 时务必分段执行并监控磁盘与带宽。

---

## 🩺 健康检查接口 `/api/health`

返回示例：
```json
{
	"ok": true,
	"version": "0.1.0",
	"time": "2025-09-14T09:25:12.123Z",
	"uptimeSeconds": 12345.6,
	"services": {
		"db": { "ok": true, "latencyMs": 8 },
		"storage": { "ok": true },
		"redis": { "ok": true, "latencyMs": 2 }
	},
	"metrics": {
		"process": { "rssMb": 134.2, "heapUsedMb": 72.5 },
		"imageProcessing": { "count": 12, "avgTotal": 180.5, "avgBlurhash": 25.3, "avgVariants": 140.2 }
	},
	"latencyMs": 15
}
```
用途：Liveness / Readiness / 监控采集。失败时返回 503。

`imageProcessing` 字段来源：内存环形缓冲收集最近 N 次（默认 200）图像处理耗时，便于观察平均加工延迟。

---

## 🔍 快速重复检测预检 `/api/upload/check`

上传前可在客户端计算文件内容哈希（推荐 `SHA-256`），调用该接口判断是否已存在，避免重复上传与二次处理。

**请求**
```
GET /api/upload/check?contentHash=<hexHash>
```

**响应**
```jsonc
// 已存在
{ "existing": true, "photo": { "id": "abc123", "width": 4000, "height": 3000, "blurhash": "LFE.." } }
// 不存在
{ "existing": false }
```
注意：后端仍有数据库唯一约束（userId + contentHash）作为最后防线。

---

## 🖼️ 照片列表 API `/api/photos`

支持 cursor 分页 + 精简字段模式：

| 参数 | 说明 | 示例 |
|------|------|------|
| `cursor` | 上一页返回的 `nextCursor` | `?cursor=clx123...` |
| `limit` | 每页数量（默认 30，最大 100） | `?limit=50` |
| `fields` | `min`(默认) / `full` | `?fields=full` |
| `includeVariants` | 是否包含变体结构（仅在 `full` 模式有用） | `?fields=full&includeVariants=1` |

**示例响应 (minimal)**
```json
{
	"items": [ { "id":"p1","width":1200,"height":800,"blurhash":"LFE.." } ],
	"nextCursor": "clx456..."
}
```

**示例响应 (full)**
```jsonc
{
	"items": [
		{
			"id": "p1",
			"width": 1200,
			"height": 800,
			"blurhash": "LFE..",
			"takenAt": "2025-09-12T08:00:00.000Z",
			"location": null,
			"exif": { "Model": "Canon EOS R6" },
			"tags": [{ "id":"t1","name":"travel","color":"#888" }],
			"visibility": "PUBLIC",
			"createdAt": "2025-09-12T09:00:00.000Z"
		}
	],
	"nextCursor": null
}
```

设计原则：默认最小化字段 & 无 variants，降低首屏序列化与网络体积。需要详情时再请求 `full`。

---

## 🔎 搜索接口 `/api/search`

扩展支持：

| 参数 | 说明 | 匹配方式 |
|------|------|----------|
| `q` | 通用关键字（标签名 / EXIF 原始 JSON 子串） | `contains` (case-insensitive) |
| `camera` | 相机型号子串 | EXIF JSON contains + 解析校验常见键 (Model/CameraModelName) |
| `lens` | 镜头型号子串 | EXIF JSON contains + 解析校验 (LensModel/Lens) |
| `limit` | 最大返回数量（默认 30，≤100） | 限制查询规模 |

排名：tag 匹配得分高于仅 EXIF 匹配。返回结构：`{ ok, count, items, query }`。

后续可升级：添加结构化 camera/lens 字段列并建立索引，减少 JSON contains 扫描。

---

## 📊 图像处理性能指标

Worker 在生成 Blurhash + 变体后记录耗时：
```ts
recordImageProcess({ totalMs, blurhashMs, variantsMs })
```
可在 `/api/health` 查看平均值；环形缓冲不持久化，重启后重新采样。

---

## 🧪 性能与 Bundle 分析

运行：
```bash
npm run analyze
```
当 `ANALYZE=true` 构建时启用 bundle analyzer，可分析各依赖体积，辅助拆分与动态加载策略。

---

---

## 📦 孤儿与缺失扫描 (`scripts/orphan-scan.ts`)

目的：检测
1. 数据库记录的变体但文件缺失 (missingFiles)
2. 存储中存在但数据库未引用的“孤儿对象” (orphanObjects)

运行：
```bash
tsx scripts/orphan-scan.ts > orphan-report.json
```
输出字段：
```
missingFiles: [{ photoId, variant, format, expectedKey }]
orphanObjects: [fileKey]
totalDbVariants
totalStorageVariantObjects
scannedPhotos
```
可后续扩展：自动修复模式（删除孤儿 / 重建缺失）。

---

## 🧾 结构化日志

`lib/logger.ts` 基于 pino：
```ts
import { logger, childLogger } from '@/lib/logger'
logger.info({ photoId }, 'variant generation start')
```
环境变量：`LOG_LEVEL=debug|info|warn|error`
建议：生产通过外层收集（如 Loki / Vector / Elastic）进行集中分析。
