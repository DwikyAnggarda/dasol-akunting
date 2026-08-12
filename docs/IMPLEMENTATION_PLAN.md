# Dasol implementation plan

Last updated: 2026-08-12

## Audit baseline

The repository began as an empty Git worktree containing only `super prompt.md`. It had no application, package manager, environment files, Supabase project, migration, tests, README, or repository instructions. Local tools detected: Node.js 20.20.2, npm 10.8.2, and Git 2.52.0. Docker and a global Supabase CLI are not installed.

The UI baseline is the official TailAdmin free Next.js repository, release 2.3.0 at commit `d3526b35fb7e579a4585129fe6eaa47f54ec9a0b`, using the Next.js App Router, React 19, strict TypeScript, and Tailwind CSS 4. Its MIT license and attribution will remain in the repository.

## Delivery strategy

Work proceeds as testable vertical slices. A phase is marked complete only after its relevant checks pass. Database checks that require Docker remain explicitly unverified until that runtime is available.

| Phase | Scope                                                                                                     | Exit evidence                                  | Status                                                          |
| ----- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| 0     | Audit, TailAdmin baseline, repository rules, plan, decisions                                              | Baseline installs and builds                   | Complete                                                        |
| 1     | Environment validation, Supabase SSR clients, auth routes, protected dashboard shell, company context, CI | Auth/unit tests, lint, typecheck, build        | Complete                                                        |
| 2     | Organizations, memberships, RBAC, permission helpers, complete RLS baseline                               | Cross-company and permission pgTAP tests       | Implemented; Docker verification pending                        |
| 3     | Periods, chart of accounts, mappings, sequences, journals, atomic manual posting and reversal             | Balance, immutability, lock, idempotency tests | Implemented; Docker verification pending                        |
| 4     | Contacts, products, units, warehouses, effective-dated tax configuration                                  | Domain and database tests                      | Implemented baseline                                            |
| 5     | Sales invoice lifecycle, approval, atomic posting, AR, receipt, aging                                     | End-to-end sales/AR slice                      | Implemented for service invoice; credentialed E2E pending       |
| 6     | Purchase invoice lifecycle, goods receipt, AP, payment                                                    | End-to-end purchase/AP slice                   | Implemented for service invoice; goods receipt deferred         |
| 7     | Moving-average inventory, stock protection, movement/card/valuation                                       | Inventory property and concurrency tests       | Domain/schema implemented; posting RPC deferred                 |
| 8     | Cash/bank transactions and reconciliation                                                                 | Reconciliation integration tests               | Pending                                                         |
| 9     | Versioned tax engine, reconciled reports, generic export adapters                                         | Tax calculation/version/export tests           | Generic adapters and tests complete; official adapter deferred  |
| 10    | GL, trial balance, P&L, balance sheet, cash flow, operational reports                                     | Accounting property tests                      | Reconciliation controls implemented; full report suite deferred |
| 11    | Straight-line fixed assets and posting                                                                    | Schedule/posting tests                         | Schema implemented; depreciation RPC/UI deferred                |
| 12    | Audit, private storage, security headers, negative authorization, accessibility and E2E                   | Security and core E2E suite                    | Baseline implemented; credentialed E2E pending                  |
| 13    | Repeatable demo seed, full documentation, clean reset, CI and Vercel readiness                            | All available gates green                      | Application gates complete; Docker/credentials pending          |

## Initial vertical slice

The first demonstrable slice will provide:

1. Email/password authentication and password recovery through Supabase SSR.
2. Authenticated company selection and a company-scoped dashboard shell.
3. Organization/RBAC schema with RLS and permission helpers.
4. Chart of accounts, periods, document sequences, journals, atomic manual journal posting, and reversal.
5. Unit tests for money, tax, lifecycle, permissions, numbering, journal balance, and moving-average inventory.
6. A compact Indonesian dashboard using TailAdmin components, with real database queries when configured and a clearly labelled development-only demo presentation mode when local credentials are unavailable.

## Quality gates

- Install: `npm ci`
- Static checks: `npm run lint`, `npm run typecheck`
- Unit/integration: `npm run test:unit`, `npm run test:integration`
- Database: `npm run db:reset`, `npm run db:test`
- Browser: `npm run test:e2e`
- Accounting: `npm run verify:accounting`
- Production: `npm run build`

Results and infrastructure blockers are recorded here after each phase and summarized in the final handoff.

### Final local verification (2026-08-12)

| Gate                                             | Result                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                         | Pass; 604 packages installed, 605 audited                                                                              |
| `npm audit --audit-level=low`                    | Pass; 0 vulnerabilities                                                                                                |
| `npm run lint`                                   | Pass; 0 warnings                                                                                                       |
| `npm run typecheck`                              | Pass                                                                                                                   |
| `npm run test:unit`                              | Pass; 6 files, 23 tests                                                                                                |
| `npm run test:integration`                       | Pass; 1 file, 1 test                                                                                                   |
| `npm run test:coverage`                          | Pass; 24 tests, 87.64% statements and 89.15% lines                                                                     |
| `npm run test:e2e`                               | Pass; 3 tests, 1 intentional desktop skip for a mobile-only assertion                                                  |
| `npm run build`                                  | Pass; 24 static/dynamic pages generated                                                                                |
| `npm run db:reset`                               | Blocked; local Supabase service cannot be inspected because Docker is unavailable                                      |
| `npm run db:lint`, `npm run db:test`             | Blocked; PostgreSQL at `127.0.0.1:54322` is not running                                                                |
| `npm run seed:demo`, `npm run verify:accounting` | Scripts compile and reach environment validation; execution blocked by intentionally absent local Supabase credentials |

The database, seed, and live accounting verification rows are not passes. They must be rerun after Docker is installed and `.env.local` is populated for the local stack.

## Deferred and external dependencies

- Official Coretax schemas/endpoints are not present and will not be invented. Only versioned adapter contracts and clearly marked generic demo artifacts may be implemented until verified official fixtures are supplied.
- Vercel, GitHub, and hosted Supabase deployment require user-owned accounts and credentials. No URL or successful deployment will be claimed without tool evidence.
- Local database and pgTAP verification require Docker. The repository will include commands and tests even when this host cannot execute them.
