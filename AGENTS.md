# Repository Guidelines

## Project Structure & Module Organization
- `app/` (Next.js App Router): `(...)/page.tsx` for pages, `api/*/route.ts` for API endpoints, `admin/*` for dashboard.
- `components/`: Reusable React components (`AdminNav.tsx`, `Masonry.tsx`, `ui/Button.tsx`).
- `lib/`: Utilities (`db.ts`, `cf-image.ts`, `theme-color.ts`, `session.ts`).
- `prisma/`: Database schema (`schema.prisma`) and generated client.
- `public/`: Static assets. `uploads/`: runtime volume for user images.
- `scripts/`: `seed-admin.js`, `backup.sh`, `restore.sh`.
- Root: `middleware.ts`, `next.config.mjs`, Docker/CI configs.

## Build, Test, and Development Commands
- `make dev` — Start local dev server at `http://localhost:3000`.
- `make migrate` / `make prisma-studio` — Run migrations / open Prisma Studio.
- `make seed` — Create initial admin user.
- `make build` / `make start` — Production build and run.
- `make test` — Lint + TypeScript type-check (no unit runner yet).
- Docker: `make docker-up`, `make docker-down`, `make docker-logs`.
- NPM equivalents exist (see `package.json`), e.g., `npm run prisma:migrate`.

## Coding Style & Naming Conventions
- Formatting: Prettier (2-space indent, single quotes, 100 col). Run `npm run lint` and `npm run type-check` before PRs.
- ESLint: extends `next/core-web-vitals` + TS rules; `_`-prefixed unused vars allowed; `no-explicit-any` warned.
- TypeScript: `strict: true`. Avoid `any`; prefer explicit types/interfaces.
- Naming: Components `PascalCase` (`components/AdminNav.tsx`); libs `kebab-case` (`lib/theme-color.ts`); routes use `page.tsx` and `route.ts` under `app/`.
- Imports: use path aliases (`@/components/...`, `@/lib/...`).

## Testing Guidelines
- CI runs lint, type-check, and build. Keep `make test` green and `make build` passing.
- Prefer small, verifiable changes. For features touching data, verify flows locally: admin login, upload, library, and public gallery.
- If adding a test runner later, place specs alongside features or under `__tests__/` following `*.test.ts(x)`.

## Commit & Pull Request Guidelines
- Branches: `feature/<slug>`, `fix/<slug>`, `docs/<slug>`, `refactor/<slug>`.
- Conventional Commits, e.g.: `feat: add bulk upload`, `fix: correct tag filter`.
- PRs include: clear description, linked issues, screenshots for UI, and steps to validate.
- Run `make test` + `make build` before opening PR.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; never commit secrets. Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, admin creds.
- Use `make migrate-deploy` for production migrations; back up with `scripts/backup.sh`.
- Prefer Cloudflare image optimization for public assets as configured in `lib/cf-image.ts`.
