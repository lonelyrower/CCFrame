# CCFrame

CCFrame is a single-admin photography showcase built for fast loading and easy maintenance. Public
photos are available to visitors; private photos require login.

## Features
- Public site: hero cover with theme color extraction, masonry gallery with infinite scroll, tags,
  albums, and series pages
- Admin dashboard: batch upload with progress and retry, library management, batch actions,
  albums/series CRUD, tag merge, settings (home copy + theme color), analytics
- Image pipeline: Cloudflare `/cdn-cgi/image` for public assets; private images via authenticated
  API with `Cache-Control: no-store`
- Theme system: `SiteCopy.themeColor` override > `Photo.dominantColor` auto extraction > default
- Ops: backup/restore scripts, Docker deployment, CI pipelines
- PWA: manifest + service worker for installable app and offline fallback

## Tech Stack
- Next.js 15 (App Router), React 19, TypeScript
- Prisma ORM + PostgreSQL 16
- Tailwind CSS, Framer Motion
- Sharp for image metadata/thumbnails
- JWT cookie auth (jose)

## Project Structure
- `app/(public)` public pages
- `app/admin` admin pages
- `app/api` route handlers
- `components` UI and gallery/admin components
- `lib` db/auth/image/storage helpers
- `prisma` schema and client
- `scripts` seed/backup/restore
- `public` static assets + public uploads
- `private` private uploads (default)
- `middleware.ts` auth guard

## Quick Start (Local)

Using Make:

```bash
cp .env.example .env
make setup
make dev
```

Using npm:

```bash
npm install
cp .env.example .env
npm run prisma:migrate
npm run prisma:generate
npm run seed
npm run dev
```

Visit http://localhost:3000
Admin login: http://localhost:3000/admin/login

## Environment Variables

Required (local dev):
- `DATABASE_URL`
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `BASE_URL`
- `NEXTAUTH_URL`

Docker Compose:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL` is set by `docker-compose.yml` (leave commented in `.env`)

Optional:
- `STORAGE_PROVIDER` (default: `local`)
- `STORAGE_LOCAL_PUBLIC_ROOT`, `STORAGE_LOCAL_PRIVATE_ROOT`
- `STORAGE_PUBLIC_URL_PREFIX`
- `NEXT_PUBLIC_IMAGE_HOSTS` (comma-separated, default: `imagedelivery.net`)

## Common Commands

```bash
make dev
make build
make start
make test
make migrate
make migrate-deploy
make seed
make prisma-studio
make preflight
make smoke
make docker-up
make docker-down
make docker-logs
```

## Admin Routes
- `/admin/login`
- `/admin/upload`
- `/admin/library`
- `/admin/albums`
- `/admin/series`
- `/admin/tags`
- `/admin/settings`
- `/admin/analytics`

## Data Model (High Level)
- User (single admin)
- Photo (tags, album, `isPublic`, `dominantColor`)
- Album (series, cover)
- Series (brand)
- Tag + PhotoTag
- SiteCopy (home copy + theme color)
- MetricsDaily (PV/UV + top content)

## Image Handling
- Public images use Cloudflare URLs: `/cdn-cgi/image/format=auto,width=.../uploads/...`
- Private images are served by `GET /api/image/private?id=...` with `Cache-Control: no-store`
- Storage defaults to `public/` and `private/` roots; configurable via storage env vars

## Deployment

Docker Compose (recommended):

```bash
cp .env.example .env
# set NEXTAUTH_SECRET, ADMIN credentials, BASE_URL, POSTGRES_*
docker-compose up -d
docker-compose logs -f app
```

Quick deploy scripts:
- `bash deploy.sh` (Docker update after `git pull`)
- `ccframe.sh` (one-click install/update on Linux; run `./ccframe.sh` for options)

Checklists:
- `docs/DEPLOY_CHECKLIST.md`
- `docs/ACCEPTANCE_CHECKLIST.md`

Manual build:

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
npm run seed
npm run start
```

## Backup / Restore
- `bash scripts/backup.sh` (daily DB, weekly uploads)
- `bash scripts/restore.sh <YYYYMMDD> [--with-uploads]`

## API Overview
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`
- Photos: `GET /api/photos`, `GET|PUT|DELETE /api/photos/[id]`
- Upload: `POST /api/upload/local`
- Tags: `GET /api/tags`, `POST /api/tags/merge`
- Albums: `GET|POST /api/albums`, `GET|PUT|DELETE /api/albums/[id]`
- Series: `GET|POST /api/series`, `GET|PUT|DELETE /api/series/[id]`
- Site copy: `GET|PUT /api/site-copy`, `POST /api/site-copy/reset`
- Metrics: `POST /api/metrics/track`, `GET /api/metrics/summary`
- Private image: `GET /api/image/private`

## Development Notes
- TypeScript strict mode; ESLint + Prettier (2-space, single quotes, 100 cols)
- Path aliases: `@/components`, `@/lib`
- CI runs lint, type-check, and build
- Fonts are bundled locally via `@fontsource`
- Branch naming: `feature/*`, `fix/*`, `docs/*`, `refactor/*`
- Conventional commits

## License
MIT
