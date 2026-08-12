# Deployment

## Environments

Use separate Supabase projects for local, Vercel Preview, and Production. Configure all values from `.env.example`; service-role and database URLs are server-only. Set Supabase Auth site/redirect URLs to the exact environment URL.

## GitHub and CI

Push to GitHub and require `.github/workflows/ci.yml`. Application checks use `npm ci`; the database job starts local Supabase in Docker, resets migrations, lints PostgreSQL, and runs pgTAP. Never point CI at production.

## Migration promotion

1. Backup the target database and review irreversible operations.
2. Link the intended project: `npx supabase link --project-ref <project-ref>`.
3. Compare migrations: `npx supabase migration list`.
4. Apply to staging: `npx supabase db push --linked`.
5. Run smoke, RLS, posting/idempotency, report reconciliation, and seed-free checks.
6. Apply the same migration set to production in a controlled release window.

Rollback normally means a new forward migration. Application rollback uses the previous Vercel deployment only when schema compatibility is maintained. Restore from backup for destructive database incidents.

## Vercel

Import the GitHub repository, use Node.js 20, run `npm run build`, and add environment variables per Preview/Production. Do not run migrations or demo seed in the build command. Deploy preview with `npx vercel`, validate SSR auth/cookies, then promote with `npx vercel --prod`.

No deployment URL is documented until a real deployment succeeds.
