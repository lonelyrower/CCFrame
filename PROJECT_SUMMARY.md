# CCFrame Project Summary

## 🎯 Project Overview

CCFrame is a personal photography showcase platform designed for individual photographers to display their work with an artistic, elegant interface. Built for performance and ease of maintenance.

### Key Objectives

- **Performance**: Handle 10,000+ photos with fast loading
- **Simplicity**: Single admin user, no complex workflows
- **Elegance**: Artistic design with automatic theme colors
- **Privacy**: Granular control over public/private photos
- **Optimization**: Leverage Cloudflare for automatic image format conversion

## 📊 Technical Stack

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  Next.js 14 + React 18 + Tailwind + Framer     │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                   Backend                        │
│     Next.js API Routes + Prisma ORM             │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                  Database                        │
│              PostgreSQL 16                       │
└──────────────────────────────────────────────────┘

External Services:
├── Cloudflare (CDN + Image Optimization)
└── GitHub Container Registry (Docker Images)
```

## 🗂️ Project Structure

```
ccframe/
├── .github/                    # GitHub configurations
│   ├── workflows/             # CI/CD pipelines
│   │   ├── ci.yml            # Lint, type-check, build
│   │   ├── docker-publish.yml # Build & push Docker images
│   │   └── security.yml      # Security scanning
│   ├── ISSUE_TEMPLATE/       # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml        # Dependency updates
│
├── app/                       # Next.js App Router
│   ├── (public)/             # Public routes
│   │   ├── page.tsx          # Homepage
│   │   ├── photos/           # Photo gallery
│   │   ├── tags/             # Tag browsing
│   │   ├── series/           # Series listing
│   │   └── albums/           # Album views
│   ├── admin/                # Admin dashboard (auth required)
│   │   ├── login/
│   │   ├── upload/
│   │   ├── library/
│   │   ├── albums/
│   │   ├── series/
│   │   ├── tags/
│   │   ├── settings/
│   │   └── analytics/
│   ├── api/                  # API endpoints
│   │   ├── auth/             # Authentication
│   │   ├── photos/           # Photo CRUD
│   │   ├── upload/           # File upload
│   │   ├── albums/           # Album management
│   │   ├── series/           # Series management
│   │   ├── tags/             # Tag management
│   │   ├── site-copy/        # Homepage copy
│   │   ├── image/            # Image serving
│   │   └── metrics/          # Analytics
│   ├── globals.css           # Global styles
│   └── layout.tsx            # Root layout
│
├── components/               # React components
│   ├── gallery/             # Photo display components
│   ├── admin/               # Admin UI components
│   └── ui/                  # Reusable UI primitives
│
├── lib/                     # Utilities and helpers
│   ├── db.ts               # Prisma client singleton
│   ├── cf-image.ts         # Cloudflare image URL builder
│   ├── theme-color.ts      # Color extraction from images
│   ├── auth.ts             # Authentication helpers
│   └── constants.ts        # App constants
│
├── prisma/                 # Database
│   └── schema.prisma       # Data model definitions
│
├── scripts/                # Utility scripts
│   ├── seed-admin.js      # Create initial admin user
│   ├── backup.sh          # Automated backup
│   └── restore.sh         # Restore from backup
│
├── public/                # Static assets
│
├── uploads/               # User uploaded images (gitignored)
│   └── original/          # Original images (by date)
│       └── YYYY/MM/
│
├── backups/               # Database & upload backups (gitignored)
│   ├── db/               # Daily database dumps
│   └── uploads/          # Weekly upload archives
│
├── Dockerfile            # Production Docker image
├── docker-compose.yml    # Local/production deployment
├── Makefile             # Development shortcuts
├── package.json         # Dependencies & scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS config
├── next.config.mjs      # Next.js configuration
│
└── Documentation
    ├── README.md           # Main documentation
    ├── QUICKSTART.md      # 5-minute setup guide
    ├── DEPLOYMENT.md      # Production deployment
    ├── CONTRIBUTING.md    # Development guidelines
    └── PROJECT_SUMMARY.md # This file
```

## 🔄 Data Flow

### Public Photo Viewing

```
User Request
    ↓
Next.js Page (SSR/ISR)
    ↓
API Route: GET /api/photos
    ↓
Prisma Query (isPublic=true)
    ↓
PostgreSQL
    ↓
Response with photo metadata
    ↓
Client renders with Cloudflare URLs
    ↓
Image Request → /cdn-cgi/image/... → Cloudflare → Optimized Image
```

### Private Photo Access

```
Admin Login
    ↓
Session Token (JWT)
    ↓
Request Private Photo
    ↓
API Route: GET /api/image/private?id=...
    ↓
Verify Session
    ↓
Prisma Query
    ↓
Stream Original File (NO CACHE)
```

### Photo Upload

```
Admin Upload (Browser)
    ↓
POST /api/upload/local
    ↓
Multipart form data
    ↓
Save to uploads/original/YYYY/MM/
    ↓
Extract EXIF metadata
    ↓
Generate thumbnail (Sharp)
    ↓
Create DB record (Prisma)
    ↓
Return success + photo ID
```

## 🗄️ Database Schema

```sql
User
  - id, email, passwordHash, createdAt

Series
  - id, slug, title, summary, coverId
  - Has many Albums

Album
  - id, title, summary, seriesId, coverId
  - Belongs to Series
  - Has many Photos

Photo
  - id, title, fileKey, ext, width, height
  - takenAt, isPublic, albumId, createdAt
  - Belongs to Album
  - Has many Tags (through PhotoTag)

Tag
  - id, name
  - Has many Photos (through PhotoTag)

PhotoTag (Join table)
  - photoId, tagId

SiteCopy
  - id (always 1), homeCopy, updatedAt

MetricsDaily
  - day, pv, uv, topTags, topAlbums, topSeries
```

## 🔐 Security Model

### Authentication
- Single admin user (email + bcrypt password)
- JWT-based sessions
- HTTP-only cookies
- CSRF protection via same-origin

### Authorization
- Public routes: No auth required
- Admin routes: Session verification
- Private images: Session + ownership check

### Rate Limiting
- Upload: 30 req/min per IP
- Auth: 10 req/min per IP

### Data Protection
- Private photos never cached
- Sensitive env vars in .env (gitignored)
- No password in logs/errors
- Bcrypt with salt rounds: 12

## 🚀 CI/CD Pipeline

```
Code Push → GitHub
    ↓
GitHub Actions Triggered
    ├── Lint & Type Check
    ├── Build Test
    └── Security Scan (CodeQL)
    ↓
All Checks Pass?
    ↓ Yes
Push to main branch?
    ↓ Yes
Docker Build
    ↓
Push to GitHub Container Registry
    ↓
Image: ghcr.io/username/ccframe:latest
    ↓
Ready for Deployment
```

## 📦 Deployment Strategies

### 1. VPS with Docker Compose (Recommended)
- Single VPS (4C/6G/100G)
- Docker Compose manages app + PostgreSQL
- Nginx reverse proxy
- Cloudflare for CDN/SSL
- Automated backups via cron

### 2. Pull from GHCR
- Pull pre-built image from GitHub Container Registry
- Bring your own PostgreSQL
- Volume mount for uploads

### 3. Manual Build
- Clone repository on server
- Build with npm
- Run with PM2
- Nginx reverse proxy

## 🎨 Design System

### Colors
- **Theme**: Auto-extracted from hero image
- **Fallback**: Soft neutrals (HSL based)
- **Dark Mode**: System preference + manual toggle

### Typography
- **Chinese**: 思源宋体/黑体 (Source Han Serif/Sans)
- **English**: Inter (sans) / Playfair Display (serif)

### Spacing
- Generous whitespace
- Consistent 8px grid system
- Mobile-first responsive

### Animations
- Framer Motion for page transitions
- Fade-in on scroll (lazy load)
- Smooth hover states
- Reduced motion support

## 📈 Performance Optimizations

### Image Handling
- Cloudflare automatic format (AVIF/WebP)
- Lazy loading with Intersection Observer
- Responsive srcset
- Blur-up placeholder

### Data Loading
- SWR for client-side caching
- Server-side rendering for SEO
- Infinite scroll pagination (36/page)
- Index optimization in PostgreSQL

### Caching Strategy
- Static pages: ISR (revalidate: 300s)
- API responses: Cache-Control headers
- Public images: CDN cache
- Private images: no-store

## 🔧 Maintenance

### Backups
- **Daily**: PostgreSQL dump (retain 7 days)
- **Weekly**: Uploads tar.gz (retain 8 weeks)
- Automated via cron job
- Restore script provided

### Monitoring
- Docker logs
- PostgreSQL query performance
- Disk usage alerts
- Uptime monitoring (external)

### Updates
- Dependabot for npm packages
- Manual review for major versions
- Database migrations via Prisma
- Zero-downtime deployments

## 🎯 Development Roadmap

### M1: Foundation ✅
- Data models
- Basic page structure
- Authentication system
- File upload system

### M2: Public Features (In Progress)
- Photo gallery (masonry layout)
- Tag/Album/Series pages
- Private image access control
- Cloudflare integration

### M3: Admin & Theming
- Complete admin dashboard
- Analytics implementation
- Theme color extraction
- Homepage copy management

### M4: Polish
- Backup/restore scripts ✅
- Performance optimization
- E2E testing
- Documentation completion ✅

## 📋 Quick Commands

```bash
# Development
make dev              # Start dev server
make setup            # Complete initial setup

# Database
make migrate          # Run migrations
make seed             # Seed admin user
make prisma-studio    # Open Prisma Studio

# Docker
make docker-up        # Start containers
make docker-logs      # View logs

# Testing
make lint             # Run linter
make type-check       # TypeScript check

# Production
make build            # Build for production
make backup           # Run backup
```

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| README.md | Main project documentation |
| QUICKSTART.md | 5-minute setup guide |
| DEPLOYMENT.md | Production deployment guide |
| CONTRIBUTING.md | Development guidelines |
| PROJECT_SUMMARY.md | This document - project overview |

## 🔗 Important URLs

**Development:**
- App: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Prisma Studio: http://localhost:5555

**Production (example):**
- Public Site: https://yourdomain.com
- Admin Panel: https://yourdomain.com/admin/login
- API Docs: https://yourdomain.com/api/docs

## 🎉 Key Features Summary

✅ Single admin authentication
✅ Public/private photo control
✅ Album and series organization
✅ Tag-based browsing
✅ Cloudflare image optimization
✅ Auto theme color extraction
✅ Dark/light mode
✅ Responsive masonry layout
✅ Batch upload with progress
✅ Lightweight analytics
✅ Docker deployment
✅ Automated backups
✅ CI/CD with GitHub Actions

---

**Version**: 1.0.0
**Last Updated**: 2025-10-06
**License**: MIT
