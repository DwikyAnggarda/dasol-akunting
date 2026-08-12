# Dasol

Dasol is a multi-company web accounting foundation for Indonesian businesses. It combines a TailAdmin-based Indonesian dashboard with Supabase Auth/PostgreSQL/RLS and database-atomic accounting operations. The current implementation demonstrates role-scoped access, exact decimal calculations, approval separation of duties, immutable double-entry journals, sales/AP posting, settlement, reconciliation controls, and repeatable demo data.

> Status: functional development baseline, not yet production-ready. Local database/pgTAP and credentialed end-to-end flows must pass in the target infrastructure before production use. Tax labels and rates in demo data are examples, not tax advice or a claim of regulatory compliance.

## Implemented features

- Email/password login, password recovery/reset, session refresh, logout, protected routes, and verified company selection.
- Multi-company membership, permission-based RBAC, RLS helpers, and negative cross-company database tests.
- Accounting periods, chart of accounts, account mappings, atomic document numbering, manual journal posting, immutable posted lines, reversal, close/reopen, and audit events.
- Effective-dated configurable tax rates and generic versioned CSV/XML demo adapters.
- Contacts, products, warehouses, moving-average inventory domain rules, sales/purchase invoices, approval requests, AR/AP, receipts/payments, and reconciliation RPCs.
- Indonesian dashboard and live screens for accounts, invoices, stock, journals, approvals, reports, audit log, and company context.
- Private Supabase Storage bucket policies for financial attachments.
- Guarded, repeatable demo user/company bootstrap and accounting verification script.
- Vitest unit/integration tests, pgTAP tests, Playwright public-flow tests, and GitHub Actions.

## Architecture

Next.js Server Components query through a cookie-aware Supabase server client. Browser clients are isolated from the service-role client. The active-company cookie is only a selector: server membership checks and PostgreSQL RLS/RPC permission checks establish authorization. Critical multi-write accounting operations execute inside PostgreSQL transactions.

See [Architecture](docs/ARCHITECTURE.md), [Database](docs/DATABASE.md), and [Accounting rules](docs/ACCOUNTING_RULES.md).

## Prerequisites

- Node.js 20.20.2+ and npm 10+
- Docker Desktop or another Docker-compatible runtime for local Supabase
- A Supabase project for hosted preview/production

## Installation

```bash
npm ci
copy .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase Connect dialog. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

## Local development

```bash
npm run db:start
npm run db:reset
npm run db:types
npm run dev
```

Open `http://127.0.0.1:3000/login`. Supabase Studio is normally at `http://127.0.0.1:54323`; local email is captured by Mailpit at `http://127.0.0.1:54324`.

Migrations are the only schema source. Create a new timestamped SQL file under `supabase/migrations`; never edit a migration already applied outside a disposable database.

## Demo seed

Populate every `DEMO_*_EMAIL` and `DEMO_*_PASSWORD` value in `.env.local`, set `DEMO_SEED_ENABLED=true`, then run:

```bash
npm run seed:demo
npm run verify:accounting
```

The seed refuses production unless `DEMO_SEED_ALLOW_PRODUCTION=true` is also deliberately supplied. It never prints passwords. Sign in with any email/password pair you supplied; each pair receives Administrator, Accountant, Operator, Approver, or Viewer permissions documented in [Demo guide](docs/DEMO_GUIDE.md).

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run db:lint
npm run db:test
npm run test:e2e
npm run build
```

Playwright browsers are installed once with `npx playwright install chromium`. Credentialed core E2E requires a running seeded Supabase environment; the committed public auth tests do not require demo credentials.

## Deployment

Connect the GitHub repository to Vercel, configure separate Supabase projects and environment values for Preview and Production, apply migrations before promoting the application, and deploy with:

```bash
npx vercel
npx vercel --prod
```

Do not run migrations or demo seed from a first request or Vercel build. See [Deployment](docs/DEPLOYMENT.md) for the promotion and rollback checklist.

## Troubleshooting

- `Supabase belum dikonfigurasi`: fill both public Supabase variables.
- `npm run db:start` fails: start Docker and verify its daemon is reachable.
- Protected pages return to login: verify the user exists and has an active company membership.
- Posting is rejected: verify permission, approved status, open period, account mapping, and idempotency key.
- Generated database types are stale: start/reset Supabase, then run `npm run db:types`.

## Security and tax notes

Never put the service-role key in `NEXT_PUBLIC_*`, logs, screenshots, fixtures, or client code. Financial files use a private bucket and signed-access flow. Review CSP for any new external origin.

Dasol does not invent or reverse-engineer Coretax APIs or XML schemas. Generic exports are labelled `DEMO / NOT FOR OFFICIAL SUBMISSION`. Onboard a verified official template as a new versioned adapter with its source reference, checksum, effective date, validation fixtures, and regression tests.

## Attribution

The visual foundation is [TailAdmin Next.js](https://github.com/TailAdmin/free-nextjs-admin-dashboard), used under the MIT license retained in [LICENSE](LICENSE).
