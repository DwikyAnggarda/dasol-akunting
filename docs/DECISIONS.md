# Architecture decision log

Last updated: 2026-08-12

## D-001 — Official TailAdmin free template

Use TailAdmin Next.js 2.3.0, pinned to upstream commit `d3526b35fb7e579a4585129fe6eaa47f54ec9a0b`, as the visual and structural baseline. Preserve its MIT license and reuse its layout/components while replacing example commerce content with Dasol workflows.

## D-002 — npm and Node runtime

Use npm because the selected upstream template includes `package-lock.json`. Pin direct dependencies and use `npm ci`. Support Node 20.20+. Supabase JS is pinned to the latest audited line in this build that supports Node 20; releases requiring Node 22 are intentionally deferred until the runtime baseline is upgraded.

## D-003 — Money representation

Use PostgreSQL `numeric` as the system of record and `decimal.js` in TypeScript. Monetary, quantity, rate, and exchange values cross application boundaries as decimal strings. JavaScript `number` is limited to non-monetary display counts and chart coordinates derived from already rounded values.

## D-004 — Supabase authorization

Use `@supabase/ssr` browser/server clients for normal users and verified `auth.getUser()` identity checks. A `server-only` service-role client is reserved for explicit bootstrap/demo administration. RLS plus permission-aware RPCs remain the final enforcement layer.

## D-005 — Tenant context

The active company is stored as an HTTP-only, same-site cookie and is always revalidated against current membership. The cookie is an untrusted selector, not an authorization claim; RLS and server checks remain authoritative. A browser-provided `company_id` never establishes authorization by itself.

## D-006 — Critical accounting operations

Document numbering, posting, period close/reopen, stock mutation, and reversal live in PostgreSQL functions and transactions. Application services validate intent and call RPCs; they do not reconstruct critical multi-write transactions in JavaScript.

## D-007 — Inventory backdating

The MVP blocks an inventory posting earlier than the latest posted movement for the same product and warehouse. Deterministic historical replay/revaluation is deferred because silently accepting backdated movement would corrupt moving-average cost.

## D-008 — Tax configuration

Tax rates and mappings are effective-dated company configuration. Seeded Indonesian labels are examples, not legal claims. Without verified Coretax fixtures, exports are generic and marked `DEMO / NOT FOR OFFICIAL SUBMISSION`.

## D-009 — Development without credentials

Build and unit tests must not require secrets. Authenticated data routes require valid Supabase public configuration at runtime. Any local presentation fallback is development-only, visibly labelled, contains synthetic data, and cannot invoke production-like posting.

## D-010 — Current infrastructure limitation

This host has no Docker or global Supabase CLI. Database migrations and pgTAP tests will be authored for the pinned CLI script, but their execution remains unverified until Docker is installed. This is a verification limitation, not permission to weaken database guarantees.
