# Dasol Repository Guide

## Product principles

Dasol is a multi-company Indonesian accounting application. Correctness, tenant isolation, accounting integrity, security, and maintainability take priority over delivery speed. UI text is Indonesian; code, identifiers, commit messages, and technical documentation are English unless a business term is clearer in Indonesian.

## Stack and package management

- Next.js App Router, React, strict TypeScript, and TailAdmin/Tailwind CSS.
- Supabase Auth, PostgreSQL, Storage, Row Level Security, and database RPCs.
- npm is the only package manager. Commit `package-lock.json` and use `npm ci` in CI.
- Pin direct dependencies. Do not perform broad dependency upgrades without a recorded reason.
- Node.js 20.20 or newer is required. The CI runtime is defined in `.nvmrc`.

## Project structure

- `src/app`: routes, layouts, route handlers, loading/error boundaries.
- `src/components`: reusable presentational and layout components.
- `src/features`: feature UI and feature-local orchestration.
- `src/domain`: framework-independent accounting, money, tax, inventory, and approval rules.
- `src/lib`: infrastructure clients, validation, formatting, errors, and shared helpers.
- `src/server`: authenticated queries, actions, services, and permission checks.
- `src/types`: generated database and shared transport types.
- `supabase/migrations`: immutable, ordered schema changes.
- `supabase/tests`: pgTAP/database security and invariant tests.
- `tests`: unit, integration, and Playwright end-to-end tests.
- `docs`: architecture, operational, business-rule, and decision records.

## Required commands

Run the narrowest relevant checks while developing and all application gates before handoff:

```text
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run db:start
npm run db:stop
npm run db:reset
npm run db:test
npm run db:types
npm run seed:demo
npm run verify:accounting
```

Database and E2E commands may require Docker, the Supabase CLI runtime, Playwright browsers, and explicit demo credentials. Never substitute a production Supabase project.

## Coding standards

- Keep TypeScript strict. Do not use `any`, broad ESLint suppression, or `@ts-ignore` to hide defects.
- Server Components are the default. Add `"use client"` only for browser interactivity.
- Keep accounting and authorization rules out of React components.
- Validate all untrusted input with Zod at the server boundary.
- Return safe, user-facing errors; never expose database internals or secrets.
- Use `Decimal` for application-side money calculations and serialize decimal values as strings. PostgreSQL `numeric` is the source of truth.
- Add tests for every domain invariant and regression fix.
- Prefer small functions, explicit names, immutable values, and feature-based modules.

## Database and migration rules

- Every schema change is an ordered migration that can run from an empty database. Never make untracked dashboard-only schema changes.
- Use UUID primary keys, `numeric` for monetary/rate/quantity values, `date` for accounting dates, and `timestamptz` for events.
- Tenant-owned rows include `company_id`, actor/timestamp metadata, and optimistic-lock `version` where mutable.
- Add foreign keys, checks, unique constraints, and indexes explicitly.
- Enable RLS on every exposed table. Policies must prove membership and, for mutation, explicit permission.
- Prefer security-invoker functions. Security-definer functions must set an empty or explicit safe `search_path`, schema-qualify objects, revoke public execution, and grant only intended roles.
- Critical posting, numbering, period, inventory, and reversal operations are atomic database functions with row locks and idempotency controls.
- Never edit a migration already used outside a disposable local environment; add a new migration instead.

## Accounting invariants

- Posted journals are double-entry and balanced; final validation happens inside PostgreSQL.
- Posted journal entries and lines are immutable and are never hard-deleted.
- Corrections use reversal, credit/debit note, or adjusting entry.
- Posting to locked periods is forbidden, including reversals.
- Document numbers are generated atomically; never use `max(number) + 1`.
- Posting is idempotent per company and source document, and duplicate sources are rejected.
- Official reports use posted journal lines only.
- Control accounts reject manual entries by default.
- Inventory defaults to moving weighted-average costing and blocks negative or unsafe backdated stock.
- Account and tax mappings are company configuration; never hard-code account UUIDs or assumed statutory tax rates.

## Security rules

- Never expose the service-role key or import the admin client into browser code.
- Every server mutation verifies identity, active company, membership, permission, object scope, and validated input.
- Treat client-provided company IDs, totals, status, pricing, discounts, and taxes as untrusted.
- Keep financial attachments private and authorize signed URL creation.
- Do not commit credentials, tokens, real passwords, financial data, or secret-bearing logs/fixtures.
- Preserve append-only audit evidence for critical mutations.

## Definition of Done

A slice is complete only when its migration is reproducible, RLS and negative authorization are tested, accounting invariants are tested, loading/empty/error/unauthorized UI states are handled, documentation is current, and relevant lint, typecheck, test, and production-build gates pass. If infrastructure prevents a gate, report it as not run with the exact blocker; do not claim success.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
