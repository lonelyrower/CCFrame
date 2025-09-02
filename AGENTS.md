# Repository Guidelines

## Project Structure & Modules
- `app/`: Next.js App Router pages, API routes under `app/api/`, admin at `app/admin/`.
- `components/`: Reusable UI, gallery, admin components.
- `lib/`: Core utilities (auth, db, storage, image/AI processing).
- `jobs/`: BullMQ queues and worker (`worker.ts`).
- `prisma/`: Schema and client; run Prisma commands from repo root.
- `scripts/`: Setup/ops utilities (e.g., `create-admin.js`, `verify-completeness.js`).
- `public/`, `types/`, `logs/`: Static assets, TS types, runtime logs.

## Build, Test, and Dev Commands
- `npm run dev`: Start Next.js dev server.
- `npm run build`: Production build.
- `npm start`: Start production server.
- `npm run lint` / `npm run type-check`: ESLint and TS checks.
- DB: `npm run db:generate`, `npm run db:migrate`, `npm run db:reset`.
- Worker (queues): `START_WORKERS=true npx tsx jobs/worker.ts`.
- Sanity check: `node scripts/verify-completeness.js`.

## Coding Style & Naming
- TypeScript, 2-space indentation, no semicolon churn; prefer functional React components.
- File names: kebab-case (`photo-card.tsx`); components exported in PascalCase.
- Keep server code server-side (RSC) and opt into `"use client"` only when needed.
- Follow ESLint (`eslint-config-next`) and Tailwind utility-first patterns; run `npm run lint` before PRs.

## Testing Guidelines
- Framework not bundled yet; prefer adding lightweight tests with Vitest + React Testing Library when touching UI/logic.
- Name tests `*.test.ts(x)` alongside the unit or place under `__tests__/`.
- Minimum: include repro cases for bug fixes and cover core utilities in `lib/`.
- Always run `npm run lint` and `npm run type-check`; include output in PR if adding tests.

## Commit & PR Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`) with optional scope (e.g., `feat(ai): ...`).
- PRs must include: summary, linked issues, screenshots/GIFs for UI, and notes for schema/env changes.
- If Prisma schema changes, describe migration impact and run `npm run db:migrate` locally.
- For queue changes, verify locally with `START_WORKERS=true npx tsx jobs/worker.ts` and include logs.

## Security & Config Tips
- Never commit `.env`; copy from `.env.example` or `.env.docker.example`.
- Set `NEXTAUTH_SECRET`, DB/Redis/S3 credentials; rotate in prod.
- Seed admin locally via `node scripts/create-admin.js` and change password immediately.
