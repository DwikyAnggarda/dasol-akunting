# Database

## Schema overview

The public schema contains organization/RBAC, accounting configuration, general ledger, contacts/products, effective-dated tax, inventory balances/movements, sales/AR, purchases/AP, approvals, cash/bank settlement, fixed assets, attachments, tax exports, and append-only audit logs. UUIDs are primary keys; tenant relationships use company-aware composite foreign keys where cross-tenant substitution is material.

Money, quantities, rates, unit costs, and exchange rates use PostgreSQL `numeric`. Accounting dates use `date`; events use `timestamptz`.

## RLS strategy

Every exposed table enables RLS. Membership is resolved by `current_user_has_company_access`; mutation policies additionally require a permission code. Financial ledger tables expose reads only—writes occur through RPCs. Audit events, posted journal lines, inventory movements, approval actions, and document tax snapshots are append-only.

pgTAP tests set distinct JWT claims and prove Company A cannot read or mutate Company B. The service role is used only for the explicit guarded bootstrap.

## Function privileges

Critical functions are `security definer`, use `search_path = ''`, fully qualify application objects, revoke `public`/`anon`, and grant only `authenticated` or `service_role`. Pure triggers use security invoker. RPCs re-check `auth.uid()`, membership, permission, source status, period, totals, and mappings.

## Indexing

Company/status/date and common foreign-key filters are indexed. Partial indexes cover posted source uniqueness, unpaid AR/AP, and pending approvals. Sequence rows are uniquely scoped by company/document/branch and locked during allocation.

## Migration process

1. Add a timestamped migration; never change a deployed migration.
2. Run `npm run db:reset` from an empty local stack.
3. Run `npm run db:lint` and `npm run db:test`.
4. Generate types with `npm run db:types`.
5. Review grants, RLS, constraints, indexes, lock order, idempotency, and rollback behavior.
6. Apply to staging with `npx supabase db push --linked`, validate, then promote the same migration to production.
