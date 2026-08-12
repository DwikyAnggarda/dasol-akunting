# Architecture

## Component diagram

```text
Browser
  -> Next.js proxy (Supabase token refresh)
  -> App Router Server Components / Server Actions
       -> identity + active-company membership + permission validation
       -> Supabase user client
            -> PostgreSQL RLS
            -> atomic accounting RPCs
            -> private Storage policies
       -> server-only admin client (explicit demo bootstrap only)
```

## Request and auth flow

`proxy.ts` refreshes cookie-backed tokens and redirects unauthenticated protected requests. Server authorization obtains a fresh Supabase user, treats the HTTP-only company cookie as untrusted input, and revalidates active membership. UI permission filtering improves usability; RLS and permission-aware RPCs enforce access independently.

## Data and posting flow

```text
validated draft -> submit_document -> approval request
approval request -> approve_document / reject_document
approved source -> posting RPC (row lock + period + totals + mappings)
                -> journal header (draft)
                -> balanced journal lines
                -> AR/AP or inventory effect
                -> mark journal + document posted
                -> append audit event
```

Any exception rolls the entire PostgreSQL statement back. Unique source and idempotency constraints handle repeated/concurrent posting.

## Module boundaries

- `src/domain`: pure Decimal-based business invariants; no React/Supabase imports.
- `src/server`: authenticated queries and permission/context orchestration.
- `src/features`: schemas, server actions, and feature presentation.
- `src/app`: route composition and state boundaries.
- `src/components`: TailAdmin-derived reusable presentation.
- `supabase`: authoritative relational model, RLS, RPCs, tests, and static seed.

Server Components are the default. Client Components are limited to form/action state, theme, and responsive navigation.
