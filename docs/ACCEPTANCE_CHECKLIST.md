# Acceptance Checklist

## Automated Smoke
- App running locally or in staging.
- `SMOKE_BASE_URL=http://localhost:3000 npm run smoke`
- Provide admin credentials to include auth checks:
  - `SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... npm run smoke`

## Public Site
- `/` hero loads, theme colors match settings.
- `/photos` infinite scroll works and filters apply.
- `/tags` and `/series` pages list content and navigate to detail pages.
- `/albums/[id]` renders gallery and metadata.

## Admin
- `/admin/login` authenticates and redirects to `/admin`.
- Upload flow handles retry and batch upload.
- Library updates (title, tags, public/private) persist.
- Albums/Series CRUD works; cover image updates render correctly.
- Settings update home copy and theme immediately.

## Security
- Unauthenticated `/admin/*` redirects to login.
- Unauthenticated `/api/photos` returns 401 (unless `isPublic=true`).
- `/api/image/private` requires a session.

## PWA
- `manifest.json` loads and app is installable.
- `sw.js` registers and offline fallback works.
