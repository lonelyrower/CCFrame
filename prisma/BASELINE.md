# Prisma Migration Baseline

The project previously used `prisma db push` (shadow deploy) without retaining migration history. We now transition to proper migration files.

## Baseline Strategy
1. Capture current schema (`schema.prisma`) as the initial migration (named `init`).
2. Run locally:
```
npm run db:generate
npm run db:migrate
```
This creates `prisma/migrations/<timestamp>_init/` with SQL representing current state.
3. Commit the generated migration folder.
4. In production environments use:
```
npm run db:deploy
```

## Adding New Changes
- Modify `schema.prisma`.
- Run `npm run db:migrate -- --name <descriptive_name>` (or manually `prisma migrate dev --name ...`).
- Commit the new migration folder.

## Status Commands
- `npm run db:status` → Show drift & unapplied migrations.
- `npm run db:reset` → Recreate database (dev only). WARNING: destroys data.

## Legacy Note
If an existing production database already matches the current schema but has no migrations table, apply a baseline by:
```
prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > baseline.sql
# Manually apply baseline.sql to production DB
# Then create an empty migration folder marking baseline if needed.
```
(Only required for advanced prod alignment.)

## Next Steps
- Generate the initial migration now.
- Review SQL (especially cascade rules) before deploying to production.
