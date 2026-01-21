# Deploy Checklist

## Pre-deploy
- Copy `.env.example` to `.env` and set production values.
- Run `npm run preflight` to validate required env values.
- Confirm `DATABASE_URL` points to the production database.
- Ensure storage directories exist and are writable (`public/uploads`, `private/uploads`).
- Verify `NEXTAUTH_SECRET` and admin credentials are non-default.
- Take a database backup before applying migrations.

## Docker Compose Deploy
1. `docker compose build --no-cache`
2. `docker compose up -d`
3. Check logs: `docker compose logs -f app`
4. Run smoke tests: `SMOKE_BASE_URL=https://your-domain npm run smoke`

## Manual Deploy
1. `npm ci`
2. `npx prisma generate`
3. `npm run build`
4. `npx prisma migrate deploy`
5. First deploy only: `node scripts/seed-admin.js`
6. `npm run start`
7. Run smoke tests: `SMOKE_BASE_URL=https://your-domain npm run smoke`

## Post-deploy
- Verify admin login and public pages load.
- Confirm image uploads and private images are protected.
- Check metrics and backups are running as expected.

## Rollback
- Restore database from the latest backup.
- Redeploy the previous image or git revision.
- Re-run smoke tests and verify public/admin access.
