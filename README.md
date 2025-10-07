# CCFrame - Personal Photography Showcase

A fast, elegant personal photography portfolio built with Next.js, PostgreSQL, and Cloudflare optimization.

## 🎨 Features

- **Artistic Design**: Soft neutral colors, generous whitespace, and smooth animations
- **Fast Loading**: Cloudflare image optimization with automatic format negotiation (AVIF/WebP)
- **Smart Theming**: Auto-extract dominant colors from hero images
- **Privacy Control**: Public and private photo management
- **Efficient Organization**: Albums, series, and tag-based browsing
- **Simple Admin**: Batch upload, quick editing, and lightweight analytics
- **Performance**: Built for 10,000+ photos with lazy loading and pagination

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Image Processing**: Sharp (thumbnails), Cloudflare Image Resizing
- **Authentication**: Custom JWT-based auth
- **Deployment**: Docker, GitHub Actions, GitHub Container Registry

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd ccframe
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**

```bash
# Run migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Seed admin user
npm run seed
```

5. **Start development server**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Using Docker Compose**

```bash
# Create .env file with production settings
cp .env.example .env

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app
```

2. **Using GitHub Container Registry Image**

```bash
docker pull ghcr.io/<your-username>/ccframe:latest

docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e ADMIN_EMAIL="..." \
  -e ADMIN_PASSWORD="..." \
  -v ./uploads:/app/uploads \
  ghcr.io/<your-username>/ccframe:latest
```

## 🗂️ Project Structure

```
ccframe/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility functions
│   ├── db.ts             # Prisma client
│   ├── cf-image.ts       # Cloudflare image helpers
│   ├── theme-color.ts    # Color extraction
│   └── auth.ts           # Authentication
├── prisma/               # Database schema
├── scripts/              # Utility scripts
│   ├── seed-admin.js    # Create admin user
│   ├── backup.sh        # Backup script
│   └── restore.sh       # Restore script
├── public/              # Static assets
└── uploads/             # Uploaded images
```

## 🔧 Configuration

### Environment Variables

See [.env.example](.env.example) for all available options:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for JWT signing
- `ADMIN_EMAIL`: Initial admin email
- `ADMIN_PASSWORD`: Initial admin password
- `BASE_URL`: Your domain URL

### Cloudflare Setup

1. Point your domain to Cloudflare
2. Enable "Cloudflare Images" or ensure `/cdn-cgi/image/*` is available
3. Public images will automatically use Cloudflare optimization

## 📸 Usage

### Admin Dashboard

Access at `/admin/login` with your admin credentials.

**Features:**
- Batch photo upload with progress tracking
- Quick edit: title, tags, public/private toggle
- Create albums and series
- Customize homepage copy and theme
- View analytics (PV/UV, top tags/albums)

### API Endpoints

See documentation in [docs/api.md](docs/api.md) for full API reference.

## 🔐 Security

- Single admin authentication with bcrypt password hashing
- Private images served through protected API (no CDN caching)
- Rate limiting on upload and auth endpoints
- CSRF protection on all mutation endpoints
- Environment-based secrets management

## 🛠️ Backup & Restore

### Backup

```bash
# Daily database backup (keeps 7 days)
# Weekly uploads backup (keeps 8 weeks)
bash scripts/backup.sh
```

Setup cron job:
```bash
# Add to crontab
0 2 * * * cd /path/to/ccframe && bash scripts/backup.sh >> logs/backup.log 2>&1
```

### Restore

```bash
# Restore database only
bash scripts/restore.sh 20250610

# Restore database + uploads
bash scripts/restore.sh 20250610 --with-uploads
```

## 🚢 CI/CD

GitHub Actions workflows:

- **CI** ([.github/workflows/ci.yml](.github/workflows/ci.yml)): Lint, type-check, build
- **Docker Publish** ([.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml)): Build and push to GHCR
- **Security Scanning** ([.github/workflows/security.yml](.github/workflows/security.yml)): CodeQL, dependency audit

Images are automatically built and pushed to GitHub Container Registry on push to `main` branch.

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript checks |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run seed` | Seed admin user |

## 🎯 Roadmap

### M1: Foundation ✅ (Complete)
- [x] Data models + basic pages
- [x] Authentication + upload
- [x] Photo CRUD API
- [x] Upload with progress tracking
- [x] Photo library management UI

### M2: Public Features ✅ (Complete)
- [x] Photo gallery (masonry/infinite scroll)
- [x] Tags browsing (tag cloud + detail pages)
- [x] Albums & Series API
- [x] Private image access control
- [x] Cloudflare URL integration
- [x] Homepage with Hero image
- [x] Theme color extraction
- [x] Lightbox viewer

### M3: Admin & Theming ⚠️ (Core Complete)
- [x] Admin dashboard (photo management)
- [x] Batch upload & operations
- [x] Theme color extraction
- [x] Homepage copy management API
- [ ] Albums/Series management UI (optional)
- [ ] Settings page UI (optional)
- [ ] Analytics dashboard (optional)

### M4: Polish ✅ (Complete)
- [x] Backup scripts
- [x] Docker configuration
- [x] CI/CD (GitHub Actions)
- [x] Performance optimization
- [x] Security scanning
- [x] Complete documentation

## 📄 License

[MIT License](LICENSE)

## 🤝 Contributing

This is a personal project, but suggestions and bug reports are welcome via issues.

---

Built with ❤️ using Next.js and modern web technologies.
